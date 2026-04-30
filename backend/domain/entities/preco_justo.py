"""Entidades de domínio: PrecoJusto, PrecoTeto e ZonaEntrada.

PrecoJusto estima o valor intrínseco de uma ação pelos modelos Graham e Bazin.
PrecoTeto define o preço máximo de compra pelo modelo Bazin dado um DY alvo.
ZonaEntrada combina os dois para delimitar a faixa favorável de aquisição.

Invariante central: nenhum campo de valor usa zero como substituto de dado
ausente — ausência é sempre representada por None.
"""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, model_validator

from .acao import Ticker


class PrecoJusto(BaseModel):
    """Estimativa de valor intrínseco de uma ação.

    Modelos suportados:
    - Graham: √(22,5 × LPA × VPA) — requer LPA > 0 e VPA > 0
    - Bazin:  dividends_per_share / dy_alvo — requer proventos positivos
    - average: média aritmética dos modelos disponíveis

    Quando LPA ou VPA estão ausentes, graham permanece None.
    average é None se nenhum modelo puder ser calculado.
    """

    model_config = ConfigDict(frozen=True)

    ticker: Ticker
    graham: Decimal | None = None   # Preço justo pelo modelo Graham (R$)
    bazin: Decimal | None = None    # Preço justo pelo modelo Bazin (R$)
    average: Decimal | None = None  # Média de Graham e Bazin; None se ambos ausentes

    lpa: Decimal | None = None  # LPA utilizado no cálculo (R$)
    vpa: Decimal | None = None  # VPA utilizado no cálculo (R$)

    calculated_at: datetime

    @model_validator(mode="after")
    def validate_average_consistency(self) -> "PrecoJusto":
        """Garante que average só é definido quando ao menos um modelo tem valor."""
        if self.average is not None and self.graham is None and self.bazin is None:
            raise ValueError(
                "average não pode ser definido quando graham e bazin são ambos None"
            )
        return self


class PrecoTeto(BaseModel):
    """Preço máximo aceitável para compra de uma ação, pelo modelo Bazin.

    Fórmula: price_ceiling = dividends_per_share / target_dy

    target_dy representa o rendimento mínimo exigido pelo investidor
    (ex: Decimal("0.06") para 6% ao ano).

    price_ceiling é None quando dividends_per_share está ausente.
    """

    model_config = ConfigDict(frozen=True)

    ticker: Ticker
    target_dy: Decimal                          # DY alvo do investidor (ex: 0.06)
    dividends_per_share: Decimal | None = None  # Proventos por ação em 12 meses (R$)
    price_ceiling: Decimal | None = None        # Preço teto calculado (R$)

    calculated_at: datetime

    @model_validator(mode="after")
    def validate_price_ceiling_consistency(self) -> "PrecoTeto":
        """Garante que price_ceiling só existe quando dividends_per_share está presente."""
        if self.price_ceiling is not None and self.dividends_per_share is None:
            raise ValueError(
                "price_ceiling não pode ser definido sem dividends_per_share"
            )
        return self


class ZonaEntrada(BaseModel):
    """Faixa de preço favorável para aquisição de uma ação.

    Limites da zona:
    - entry_min: preço justo com desconto mínimo aplicado
      (entry_min = preco_justo.average × (1 − min_discount))
    - entry_max: preço teto do modelo Bazin (preco_teto.price_ceiling)

    is_in_zone indica se current_price está dentro da zona;
    é None quando current_price ou qualquer limite está ausente.

    Invariante: entry_min < entry_max quando ambos estão definidos.
    """

    model_config = ConfigDict(frozen=True)

    ticker: Ticker
    preco_justo: PrecoJusto
    preco_teto: PrecoTeto
    current_price: Decimal | None = None
    min_discount: Decimal                     # Desconto mínimo exigido (ex: 0.15 = 15%)
    entry_min: Decimal | None = None          # Limite inferior da zona de entrada (R$)
    entry_max: Decimal | None = None          # Limite superior — igual a price_ceiling (R$)
    is_in_zone: bool | None = None            # True se current_price ∈ [entry_min, entry_max]

    @model_validator(mode="after")
    def validate_zone_bounds(self) -> "ZonaEntrada":
        """Garante entry_min < entry_max e consistência de is_in_zone."""
        if (
            self.entry_min is not None
            and self.entry_max is not None
            and self.entry_min >= self.entry_max
        ):
            raise ValueError(
                f"entry_min ({self.entry_min}) deve ser menor que entry_max ({self.entry_max})"
            )
        if self.is_in_zone is not None and self.current_price is None:
            raise ValueError("is_in_zone não pode ser definido sem current_price")
        return self
