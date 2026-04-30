"""Serviço de domínio: cálculo e ordenação de scores por perfil.

Toda lógica de pontuação vive aqui — nunca em api/ ou infra/.
Os pesos refletem a filosofia de cada perfil:
- 'dividendos': prioriza DY, solidez patrimonial e consistência de longo prazo
- 'crescimento': prioriza ROE, margem e momento de preço recente
"""

from datetime import datetime, timedelta, timezone
from decimal import Decimal

from ..entities.acao import Acao, Perfil
from ..entities.score import Score, ScoreFundamentalista, ScoreMomento
from ..ports.acoes_repo import AcoesRepository


_PRICE_TTL = timedelta(hours=24)
_FUNDAMENTALS_TTL = timedelta(days=7)

# Pesos dos indicadores fundamentalistas dentro do sub-score fundamentalista
_FUND_WEIGHTS: dict[Perfil, dict[str, float]] = {
    "dividendos": {"dy": 0.40, "pvp": 0.25, "roe": 0.20, "pl": 0.10, "net_margin": 0.05},
    "crescimento": {"roe": 0.40, "net_margin": 0.30, "pl": 0.20, "pvp": 0.10, "dy": 0.00},
}

# Pesos dos componentes de momento
_MOM_WEIGHTS: dict[Perfil, dict[str, float]] = {
    "dividendos": {"var_252d": 0.50, "var_90d": 0.30, "var_30d": 0.10, "rel_vol": 0.10},
    "crescimento": {"var_90d": 0.35, "var_252d": 0.35, "var_30d": 0.20, "rel_vol": 0.10},
}

# Peso do sub-score fundamentalista vs. momento no score composto
_COMPOSITE_WEIGHTS: dict[Perfil, dict[str, float]] = {
    "dividendos": {"fundamental": 0.70, "momentum": 0.30},
    "crescimento": {"fundamental": 0.40, "momentum": 0.60},
}


# ---------------------------------------------------------------------------
# Funções de normalização (0-100). Cada função é pura e sem efeitos colaterais.
# ---------------------------------------------------------------------------

def _score_pl(pl: Decimal | None) -> float | None:
    """Menor P/L (positivo) = melhor. Acima de 35 ou negativo = 0."""
    if pl is None:
        return None
    v = float(pl)
    if v <= 0 or v >= 35:
        return 0.0
    return (35 - v) / 35 * 100


def _score_pvp(pvp: Decimal | None) -> float | None:
    """Menor P/VP (positivo) = melhor. Acima de 4 ou negativo = 0."""
    if pvp is None:
        return None
    v = float(pvp)
    if v <= 0:
        return 0.0
    if v <= 0.5:
        return 100.0
    if v >= 4:
        return 0.0
    return (4 - v) / 3.5 * 100


def _score_roe(roe: Decimal | None) -> float | None:
    """ROE em decimal (ex: 0.18 = 18%). Maior = melhor, cap em 30%."""
    if roe is None:
        return None
    v = float(roe) * 100  # converte para %
    if v <= 0:
        return 0.0
    return min(100.0, v / 30 * 100)


def _score_dy(dy: Decimal | None) -> float | None:
    """DY em decimal (ex: 0.08 = 8%). Maior = melhor, cap em 10%."""
    if dy is None:
        return None
    v = float(dy) * 100
    if v <= 0:
        return 0.0
    return min(100.0, v / 10 * 100)


def _score_net_margin(margin: Decimal | None) -> float | None:
    """Margem em decimal (ex: 0.20 = 20%). Maior = melhor, cap em 30%."""
    if margin is None:
        return None
    v = float(margin) * 100
    if v <= 0:
        return 0.0
    return min(100.0, v / 30 * 100)


def _score_variation(var: float | None) -> float | None:
    """Variação de preço (%). Normaliza de [-30%, +30%] para [0, 100]."""
    if var is None:
        return None
    clamped = max(-30.0, min(30.0, var))
    return (clamped + 30) / 60 * 100


def _score_relative_volume(vol: float | None) -> float | None:
    """Volume relativo (1.0 = média). Cap superior em 3×."""
    if vol is None:
        return None
    if vol <= 0:
        return 0.0
    return min(100.0, vol / 3 * 100)


def _weighted_avg(components: dict[str, tuple[float | None, float]]) -> float:
    """Média ponderada ignorando componentes None e pesos zero."""
    total_v = total_w = 0.0
    for value, weight in components.values():
        if value is not None and weight > 0:
            total_v += value * weight
            total_w += weight
    return total_v / total_w if total_w > 0 else 0.0


# ---------------------------------------------------------------------------

class RankingService:
    """Calcula e ordena scores de ações por perfil de investidor.

    Uso:
        svc = RankingService()
        ranked = svc.rank(acoes, perfil="dividendos")
        # ranked: list[tuple[Acao, Score]], do maior para o menor score
    """

    def _is_stale(self, acao: Acao) -> bool:
        """Retorna True se algum dado obrigatório estiver desatualizado."""
        now = datetime.now(timezone.utc)

        def _stale(ts: datetime | None, ttl: timedelta) -> bool:
            if ts is None:
                return False  # sem timestamp = confia no caller (dados recém-coletados)
            ts_aware = ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
            return (now - ts_aware) > ttl

        return _stale(acao.price_updated_at, _PRICE_TTL) or _stale(
            acao.fundamentals_updated_at, _FUNDAMENTALS_TTL
        )

    def calculate_score(self, acao: Acao, perfil: Perfil) -> Score:
        """Calcula o Score composto de uma Acao para o perfil dado.

        Raises:
            ValueError: se os dados da ação estiverem desatualizados.
        """
        if self._is_stale(acao):
            raise ValueError(
                f"Dados de {acao.ticker} desatualizados — execute sync antes de calcular scores."
            )

        fw = _FUND_WEIGHTS[perfil]
        mw = _MOM_WEIGHTS[perfil]
        cw = _COMPOSITE_WEIGHTS[perfil]

        pl_s = _score_pl(acao.pl)
        pvp_s = _score_pvp(acao.pvp)
        roe_s = _score_roe(acao.roe)
        dy_s = _score_dy(acao.dividend_yield)
        nm_s = _score_net_margin(acao.net_margin)

        fund_total = _weighted_avg({
            "pl": (pl_s, fw["pl"]),
            "pvp": (pvp_s, fw["pvp"]),
            "roe": (roe_s, fw["roe"]),
            "dy": (dy_s, fw["dy"]),
            "net_margin": (nm_s, fw["net_margin"]),
        })

        v30_s = _score_variation(acao.var_30d)
        v90_s = _score_variation(acao.var_90d)
        v252_s = _score_variation(acao.var_252d)
        vol_s = _score_relative_volume(acao.relative_volume)

        mom_total = _weighted_avg({
            "var_30d": (v30_s, mw["var_30d"]),
            "var_90d": (v90_s, mw["var_90d"]),
            "var_252d": (v252_s, mw["var_252d"]),
            "rel_vol": (vol_s, mw["rel_vol"]),
        })

        composite = cw["fundamental"] * fund_total + cw["momentum"] * mom_total

        return Score(
            ticker=acao.ticker,
            perfil=perfil,
            fundamental=ScoreFundamentalista(
                pl_score=pl_s,
                pvp_score=pvp_s,
                roe_score=roe_s,
                dy_score=dy_s,
                net_margin_score=nm_s,
                total=round(fund_total, 2),
            ),
            momentum=ScoreMomento(
                var_30d=acao.var_30d,
                var_90d=acao.var_90d,
                var_252d=acao.var_252d,
                relative_volume=acao.relative_volume,
                total=round(mom_total, 2),
            ),
            composite=round(composite, 2),
            calculated_at=datetime.now(timezone.utc),
        )

    def rank(self, acoes: list[Acao], perfil: Perfil) -> list[tuple[Acao, Score]]:
        """Calcula scores e retorna a lista ordenada do maior para o menor.

        Ações com dados desatualizados são silenciosamente excluídas do ranking.
        """
        results: list[tuple[Acao, Score]] = []
        for acao in acoes:
            try:
                score = self.calculate_score(acao, perfil)
                results.append((acao, score))
            except ValueError:
                continue
        return sorted(results, key=lambda item: item[1].composite, reverse=True)
