"""Schemas Pydantic de resposta para ações."""

from decimal import Decimal

from pydantic import BaseModel


class AcaoOut(BaseModel):
    """Representação pública de uma ação — usada em todos os endpoints que retornam ações."""

    ticker: str
    name: str
    segment: str | None

    current_price: Decimal | None
    lpa: Decimal | None
    vpa: Decimal | None
    pl: Decimal | None
    pvp: Decimal | None
    roe: Decimal | None
    dividend_yield: Decimal | None
    net_margin: Decimal | None
    dividends_per_share: Decimal | None

    var_30d: float | None
    var_90d: float | None
    var_252d: float | None
    relative_volume: float | None
