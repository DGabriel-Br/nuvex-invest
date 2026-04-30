"""Definição das tabelas SQLite via SQLAlchemy Core.

Sem ORM — usamos Table + Column diretamente para manter o layer de infra
simples e sem mapeamento implícito de objetos.
"""

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    MetaData,
    Numeric,
    String,
    Table,
    Text,
    create_engine,
)
from sqlalchemy.engine import Engine

metadata = MetaData()

acoes_table = Table(
    "acoes",
    metadata,
    # Identificação
    Column("ticker", String(6), primary_key=True, nullable=False),
    Column("name", Text, nullable=False),
    Column("segment", Text, nullable=True),
    # Preço (NUMERIC preserva precisão decimal; SQLite o armazena como TEXT internamente)
    Column("current_price", Numeric(14, 4), nullable=True),
    Column("price_updated_at", DateTime, nullable=True),
    # Indicadores fundamentalistas
    Column("lpa", Numeric(14, 4), nullable=True),
    Column("vpa", Numeric(14, 4), nullable=True),
    Column("pl", Numeric(10, 4), nullable=True),
    Column("pvp", Numeric(10, 4), nullable=True),
    Column("roe", Numeric(8, 6), nullable=True),          # ex: 0.185000 = 18,5%
    Column("dividend_yield", Numeric(8, 6), nullable=True),
    Column("net_margin", Numeric(8, 6), nullable=True),
    Column("dividends_per_share", Numeric(14, 4), nullable=True),
    # Indicadores de momento
    Column("var_30d", Float, nullable=True),
    Column("var_90d", Float, nullable=True),
    Column("var_252d", Float, nullable=True),
    Column("relative_volume", Float, nullable=True),
    Column("fundamentals_updated_at", DateTime, nullable=True),
)

user_settings_table = Table(
    "user_settings",
    metadata,
    Column("key", String(64), primary_key=True, nullable=False),
    Column("value", Text, nullable=False),
)


def create_all_tables(engine: Engine) -> None:
    """Cria todas as tabelas no banco se ainda não existirem."""
    metadata.create_all(engine)


def get_engine(database_url: str = "sqlite:///./nuvex.db") -> Engine:
    """Retorna engine SQLite configurado para uso com FastAPI (multi-thread)."""
    return create_engine(
        database_url,
        connect_args={"check_same_thread": False},
    )
