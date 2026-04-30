"""Port: repositório de ações e configuração do usuário.

Define a interface que qualquer implementação de persistência deve cumprir.
O domínio depende apenas desta abstração — nunca de SQLite, Postgres ou similar.
"""

from abc import ABC, abstractmethod

from ..entities.acao import Acao, Perfil, Ticker


class AcoesRepository(ABC):
    """Interface de persistência para ações e perfil do usuário."""

    @abstractmethod
    def get_all(self) -> list[Acao]:
        """Retorna todas as ações cadastradas no banco."""

    @abstractmethod
    def get_by_ticker(self, ticker: Ticker) -> Acao | None:
        """Retorna a ação correspondente ao ticker, ou None se não encontrada."""

    @abstractmethod
    def upsert(self, acao: Acao) -> None:
        """Insere ou atualiza uma ação (idempotente pelo ticker)."""

    @abstractmethod
    def upsert_many(self, acoes: list[Acao]) -> None:
        """Insere ou atualiza um lote de ações em uma única transação."""

    @abstractmethod
    def get_perfil(self) -> Perfil | None:
        """Retorna o perfil de investimento do usuário, ou None se não configurado."""

    @abstractmethod
    def save_perfil(self, perfil: Perfil) -> None:
        """Persiste o perfil de investimento do usuário."""
