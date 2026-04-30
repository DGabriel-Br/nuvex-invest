"""Entidades de domínio: ScoreFundamentalista, ScoreMomento e Score.

Score é a nota composta (0-100) de uma ação calculada por perfil de investidor.
Os pesos aplicados a cada sub-score são responsabilidade do RankingService;
estas entidades apenas armazenam e validam os valores resultantes.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from .acao import Perfil, Ticker


class ScoreFundamentalista(BaseModel):
    """Score derivado de indicadores fundamentalistas (0-100 por componente).

    Componentes avaliados: P/L, P/VP, ROE, Dividend Yield e Margem Líquida.
    Um componente é None quando o dado subjacente está indisponível — o total
    é calculado apenas com os componentes presentes.
    """

    model_config = ConfigDict(frozen=True)

    pl_score: float | None = None          # Nota para o indicador P/L
    pvp_score: float | None = None         # Nota para o indicador P/VP
    roe_score: float | None = None         # Nota para o indicador ROE
    dy_score: float | None = None          # Nota para o Dividend Yield
    net_margin_score: float | None = None  # Nota para a Margem Líquida
    total: float                           # Score total ponderado, 0-100

    @field_validator("pl_score", "pvp_score", "roe_score", "dy_score", "net_margin_score")
    @classmethod
    def validate_component(cls, v: float | None) -> float | None:
        """Garante que componentes individuais estejam no intervalo [0, 100]."""
        if v is not None and not (0.0 <= v <= 100.0):
            raise ValueError(f"Componente de score deve estar entre 0 e 100, recebido: {v}")
        return v

    @field_validator("total")
    @classmethod
    def validate_total(cls, v: float) -> float:
        """Garante que o total esteja no intervalo [0, 100]."""
        if not (0.0 <= v <= 100.0):
            raise ValueError(f"Score total deve estar entre 0 e 100, recebido: {v}")
        return v


class ScoreMomento(BaseModel):
    """Score derivado de variação de preço e volume relativo (0-100).

    Componentes avaliados: variação de preço em 30d, 90d e 252d úteis,
    e volume relativo em relação à média dos últimos 20 pregões.
    Componentes são None quando o histórico é insuficiente.
    """

    model_config = ConfigDict(frozen=True)

    var_30d: float | None = None          # Variação de preço em 30 dias (%)
    var_90d: float | None = None          # Variação de preço em 90 dias (%)
    var_252d: float | None = None         # Variação de preço em 252 dias úteis (%)
    relative_volume: float | None = None  # Volume do dia / média de volume em 20d
    total: float                          # Score total ponderado, 0-100

    @field_validator("total")
    @classmethod
    def validate_total(cls, v: float) -> float:
        """Garante que o total esteja no intervalo [0, 100]."""
        if not (0.0 <= v <= 100.0):
            raise ValueError(f"Score total deve estar entre 0 e 100, recebido: {v}")
        return v


class Score(BaseModel):
    """Score composto de uma ação, calculado conforme o perfil de investidor.

    Combina ScoreFundamentalista e ScoreMomento com pesos distintos:
    - 'dividendos': peso maior para fundamentalista (especialmente DY e P/VP)
    - 'crescimento': peso maior para momento e ROE

    Invariante: Score só é criado com dados dentro do prazo de frescor
    (preços < 24h, fundamentos < 7d). A verificação ocorre no RankingService.
    """

    model_config = ConfigDict(frozen=True)

    ticker: Ticker
    perfil: Perfil
    fundamental: ScoreFundamentalista
    momentum: ScoreMomento
    composite: float  # Score final 0-100 ponderado pelo perfil
    calculated_at: datetime

    @field_validator("composite")
    @classmethod
    def validate_composite(cls, v: float) -> float:
        """Garante que o score composto esteja no intervalo [0, 100]."""
        if not (0.0 <= v <= 100.0):
            raise ValueError(f"Score composto deve estar entre 0 e 100, recebido: {v}")
        return v
