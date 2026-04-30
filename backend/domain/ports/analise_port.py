"""Port: serviço de análise textual via IA local.

Interface que o OllamaAdapter implementa. Mantida em domain/ports/
para que AnaliseService (domain/services/) nunca importe infra/ollama/.
"""

from abc import ABC, abstractmethod

from ..entities.acao import Acao, Perfil


class AnalisePort(ABC):
    """Interface para geração de análise textual de uma ação via modelo de linguagem."""

    @abstractmethod
    async def analyze(self, acao: Acao, perfil: Perfil) -> str | None:
        """Retorna análise textual da ação para o perfil dado.

        Retorna None se o modelo não responder ou retornar conteúdo vazio.
        Nunca propaga exceções — falhas são silenciosas e registradas em log.
        """
