"""Script de sincronização periódica de dados de mercado.

Uso:
    # Sincronizar tickers já cadastrados no banco:
    uv run python -m infra.yfinance.sync

    # Adicionar novos tickers e sincronizar:
    uv run python -m infra.yfinance.sync --add WEGE3 BBAS3 PETR4

Os tickers nunca são hardcodados aqui — vêm do banco (quando já cadastrados)
ou são fornecidos pelo usuário via --add (lidos da linha de comando).
"""

import argparse
import logging
import os
import sys

from domain.entities.acao import Ticker
from infra.db.models import create_all_tables, get_engine
from infra.db.sqlite_repo import SqliteAcoesRepository
from infra.yfinance.adapter import YFinanceAdapter

logging.basicConfig(level=logging.INFO, format="%(levelname)s  %(message)s")
log = logging.getLogger(__name__)


def sync(repo: SqliteAcoesRepository, coleta: YFinanceAdapter, tickers: list[Ticker]) -> None:
    """Busca dados atualizados para os tickers fornecidos e salva no banco."""
    log.info("Sincronizando %d ticker(s)...", len(tickers))
    acoes = coleta.fetch_many(tickers)
    repo.upsert_many(acoes)
    log.info("Sincronização concluída: %d/%d tickers atualizados.", len(acoes), len(tickers))


def main() -> None:
    parser = argparse.ArgumentParser(description="Sincroniza dados de ações da B3.")
    parser.add_argument(
        "--add",
        nargs="*",
        metavar="TICKER",
        help="Tickers a adicionar ao banco e sincronizar (ex: WEGE3 BBAS3)",
    )
    parser.add_argument(
        "--db",
        default=os.getenv("DATABASE_URL", "sqlite:///./nuvex.db"),
        help="URL do banco SQLite (padrão: sqlite:///./nuvex.db)",
    )
    args = parser.parse_args()

    engine = get_engine(args.db)
    create_all_tables(engine)
    repo = SqliteAcoesRepository(engine)
    coleta = YFinanceAdapter()

    if args.add:
        # Tickers fornecidos pelo usuário na linha de comando
        try:
            tickers = [Ticker(code=t) for t in args.add]
        except ValueError as e:
            log.error("Ticker inválido: %s", e)
            sys.exit(1)
    else:
        # Sincronizar tickers já cadastrados no banco
        acoes = repo.get_all()
        if not acoes:
            log.warning(
                "Nenhum ticker cadastrado. Use --add TICKER1 TICKER2 para adicionar."
            )
            sys.exit(0)
        tickers = [a.ticker for a in acoes]

    sync(repo, coleta, tickers)


if __name__ == "__main__":
    main()
