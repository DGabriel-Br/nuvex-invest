"""Implementação de AcoesRepository via SQLite (SQLAlchemy Core)."""

from datetime import datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import delete, select, text
from sqlalchemy.engine import Engine

from domain.entities.acao import Acao, Perfil, Ticker
from domain.ports.acoes_repo import AcoesRepository
from infra.db.models import acoes_table, user_settings_table

_PERFIL_KEY = "perfil"


def _dec(value: Any) -> Decimal | None:
    """Converte valor do banco para Decimal, retornando None se ausente."""
    if value is None:
        return None
    return Decimal(str(value))


def _float_or_none(value: Any) -> float | None:
    return None if value is None else float(value)


def _row_to_acao(row: Any) -> Acao:
    return Acao(
        ticker=Ticker(code=row.ticker),
        name=row.name,
        segment=row.segment,
        current_price=_dec(row.current_price),
        price_updated_at=row.price_updated_at,
        lpa=_dec(row.lpa),
        vpa=_dec(row.vpa),
        pl=_dec(row.pl),
        pvp=_dec(row.pvp),
        roe=_dec(row.roe),
        dividend_yield=_dec(row.dividend_yield),
        net_margin=_dec(row.net_margin),
        dividends_per_share=_dec(row.dividends_per_share),
        var_30d=_float_or_none(row.var_30d),
        var_90d=_float_or_none(row.var_90d),
        var_252d=_float_or_none(row.var_252d),
        relative_volume=_float_or_none(row.relative_volume),
        fundamentals_updated_at=row.fundamentals_updated_at,
    )


def _acao_to_values(acao: Acao) -> dict[str, Any]:
    def _f(v: Decimal | None) -> float | None:
        return float(v) if v is not None else None

    return {
        "ticker": acao.ticker.code,
        "name": acao.name,
        "segment": acao.segment,
        "current_price": _f(acao.current_price),
        "price_updated_at": acao.price_updated_at,
        "lpa": _f(acao.lpa),
        "vpa": _f(acao.vpa),
        "pl": _f(acao.pl),
        "pvp": _f(acao.pvp),
        "roe": _f(acao.roe),
        "dividend_yield": _f(acao.dividend_yield),
        "net_margin": _f(acao.net_margin),
        "dividends_per_share": _f(acao.dividends_per_share),
        "var_30d": acao.var_30d,
        "var_90d": acao.var_90d,
        "var_252d": acao.var_252d,
        "relative_volume": acao.relative_volume,
        "fundamentals_updated_at": acao.fundamentals_updated_at,
    }


class SqliteAcoesRepository(AcoesRepository):
    """Repositório de ações persistido em SQLite via SQLAlchemy Core."""

    def __init__(self, engine: Engine) -> None:
        self._engine = engine

    def get_all(self) -> list[Acao]:
        with self._engine.connect() as conn:
            rows = conn.execute(select(acoes_table)).fetchall()
            return [_row_to_acao(row) for row in rows]

    def get_by_ticker(self, ticker: Ticker) -> Acao | None:
        with self._engine.connect() as conn:
            row = conn.execute(
                select(acoes_table).where(acoes_table.c.ticker == ticker.code)
            ).fetchone()
            return _row_to_acao(row) if row else None

    def upsert(self, acao: Acao) -> None:
        self.upsert_many([acao])

    def upsert_many(self, acoes: list[Acao]) -> None:
        if not acoes:
            return
        values = [_acao_to_values(a) for a in acoes]
        with self._engine.begin() as conn:
            # SQLite suporta INSERT OR REPLACE via texto; usamos upsert do Core quando possível
            for v in values:
                conn.execute(
                    text(
                        """
                        INSERT INTO acoes (
                            ticker, name, segment, current_price, price_updated_at,
                            lpa, vpa, pl, pvp, roe, dividend_yield, net_margin,
                            dividends_per_share, var_30d, var_90d, var_252d,
                            relative_volume, fundamentals_updated_at
                        ) VALUES (
                            :ticker, :name, :segment, :current_price, :price_updated_at,
                            :lpa, :vpa, :pl, :pvp, :roe, :dividend_yield, :net_margin,
                            :dividends_per_share, :var_30d, :var_90d, :var_252d,
                            :relative_volume, :fundamentals_updated_at
                        )
                        ON CONFLICT(ticker) DO UPDATE SET
                            name = excluded.name,
                            segment = excluded.segment,
                            current_price = excluded.current_price,
                            price_updated_at = excluded.price_updated_at,
                            lpa = excluded.lpa,
                            vpa = excluded.vpa,
                            pl = excluded.pl,
                            pvp = excluded.pvp,
                            roe = excluded.roe,
                            dividend_yield = excluded.dividend_yield,
                            net_margin = excluded.net_margin,
                            dividends_per_share = excluded.dividends_per_share,
                            var_30d = excluded.var_30d,
                            var_90d = excluded.var_90d,
                            var_252d = excluded.var_252d,
                            relative_volume = excluded.relative_volume,
                            fundamentals_updated_at = excluded.fundamentals_updated_at
                        """
                    ),
                    v,
                )

    def get_perfil(self) -> Perfil | None:
        with self._engine.connect() as conn:
            row = conn.execute(
                select(user_settings_table.c.value).where(
                    user_settings_table.c.key == _PERFIL_KEY
                )
            ).fetchone()
            if row is None:
                return None
            value = row[0]
            if value in ("dividendos", "crescimento"):
                return value  # type: ignore[return-value]
            return None

    def save_perfil(self, perfil: Perfil) -> None:
        with self._engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO user_settings (key, value) VALUES (:key, :value)
                    ON CONFLICT(key) DO UPDATE SET value = excluded.value
                    """
                ),
                {"key": _PERFIL_KEY, "value": perfil},
            )
