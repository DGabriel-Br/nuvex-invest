"""Serviço de domínio: orquestração de análise textual via IA local.

Delega ao AnalisePort para manter domain/ livre de dependências de infra/.
A lógica de prompt e de fallback fica no adapter (infra/ollama/adapter.py).
"""

from ..entities.acao import Acao, Perfil
from ..ports.analise_port import AnalisePort


class AnaliseService:
    """Orquestra a geração de análise textual de uma ação via modelo local.

    Invariante: nunca propaga exceções do modelo — retorna None em caso de falha.
    A IA é usada exclusivamente para análise textual; scores e preços justos
    são calculados pelo RankingService, nunca aqui.
    """

    def __init__(self, ai_port: AnalisePort) -> None:
        self._ai = ai_port

    async def analyze(self, acao: Acao, perfil: Perfil) -> str | None:
        """Retorna análise textual da ação para o perfil dado.

        Retorna None se o modelo não estiver disponível ou não responder
        dentro do prazo. O chamador deve tratar None como ausência de análise,
        não como erro.
        """
        return await self._ai.analyze(acao, perfil)
