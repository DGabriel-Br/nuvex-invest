"""Port: serviço de coleta de dados de mercado.

Define a interface que qualquer fonte de dados externa (yfinance, B3, etc.)
deve implementar. O domínio nunca importa yfinance diretamente.
"""

from abc import ABC, abstractmethod

from ..entities.acao import Acao, Ticker


class ColetaService(ABC):
    """Interface para busca de dados de mercado de ações da B3."""

    @abstractmethod
    def fetch_acao(self, ticker: Ticker) -> Acao | None:
        """Busca dados atualizados de uma única ação.

        Retorna None se o ticker não for encontrado ou se a fonte
        de dados não responder. Nunca lança exceção não tratada.
        """

    @abstractmethod
    def fetch_many(self, tickers: list[Ticker]) -> list[Acao]:
        """Busca dados de múltiplos tickers em lote.

        Tickers não encontrados são silenciosamente ignorados;
        o retorno pode ter menos itens que a entrada.
        """
