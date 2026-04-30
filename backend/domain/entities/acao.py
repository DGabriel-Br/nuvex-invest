"""Entidades de domínio: Acao e Ticker.

Ticker é um value object imutável que garante as invariantes do código.
Acao agrega os dados de mercado e fundamentalistas de um ativo da B3.
Nenhum campo assume zero quando o dado está ausente — use None.
"""

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


Perfil = Literal["dividendos", "crescimento"]


class Ticker(BaseModel):
    """Value object que representa o código de negociação de uma ação na B3.

    Invariantes:
    - Sempre uppercase
    - Entre 4 e 6 caracteres alfanuméricos (ex: WEGE3, BBAS3, BOVA11)
    """

    model_config = ConfigDict(frozen=True)

    code: str

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Normaliza para uppercase e valida comprimento e formato."""
        v = v.strip().upper()
        if not (4 <= len(v) <= 6):
            raise ValueError(
                f"Ticker deve ter entre 4 e 6 caracteres, recebido: '{v}'"
            )
        if not v.isalnum():
            raise ValueError(
                f"Ticker deve ser alfanumérico, recebido: '{v}'"
            )
        return v

    def __str__(self) -> str:
        return self.code

    def __repr__(self) -> str:
        return f"Ticker({self.code!r})"


class Acao(BaseModel):
    """Ativo listado na B3, identificado pelo ticker.

    Agrega dados de mercado e fundamentalistas usados no cálculo de scores
    e preço justo. Todos os campos numéricos são opcionais: ausência de dado
    é representada por None, nunca por zero, para preservar a distinção
    entre dado indisponível e dado efetivamente nulo.

    Invariante de frescor (verificada nos services, não aqui):
    - current_price deve ter menos de 24h
    - dados fundamentalistas devem ter menos de 7 dias
    """

    model_config = ConfigDict(frozen=True)

    # Identificação
    ticker: Ticker
    name: str
    segment: str | None = None  # Classificação setorial da B3 (ex: Bancos, Energia Elétrica)

    # Preço de mercado
    current_price: Decimal | None = None
    price_updated_at: datetime | None = None

    # Indicadores fundamentalistas
    lpa: Decimal | None = None             # Lucro Por Ação (R$)
    vpa: Decimal | None = None             # Valor Patrimonial Por Ação (R$)
    pl: Decimal | None = None              # P/L — Preço sobre Lucro
    pvp: Decimal | None = None             # P/VP — Preço sobre Valor Patrimonial
    roe: Decimal | None = None             # Return on Equity (% ao ano)
    dividend_yield: Decimal | None = None  # Dividend Yield (% ao ano)
    net_margin: Decimal | None = None      # Margem Líquida (%)
    dividends_per_share: Decimal | None = None  # Proventos por ação acumulados em 12 meses (R$)

    # Indicadores de momento (calculados pelo adapter a partir do histórico de preços)
    var_30d: float | None = None    # Variação de preço em 30 dias corridos (%)
    var_90d: float | None = None    # Variação de preço em 90 dias corridos (%)
    var_252d: float | None = None   # Variação de preço em 252 dias úteis (%)
    relative_volume: float | None = None  # Volume do último pregão / média de volume em 20d

    fundamentals_updated_at: datetime | None = None
