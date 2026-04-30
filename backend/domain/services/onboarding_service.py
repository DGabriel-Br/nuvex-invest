"""Serviço de domínio: onboarding e gestão do perfil do usuário."""

from ..entities.acao import Perfil
from ..ports.acoes_repo import AcoesRepository


class OnboardingService:
    """Valida e persiste o perfil de investimento do usuário.

    A validação de domínio (apenas 'dividendos' ou 'crescimento') é garantida
    pelo tipo Perfil (Literal) em tempo de parsing do Pydantic. Este serviço
    orquestra a persistência e a recuperação do perfil.
    """

    def __init__(self, repo: AcoesRepository) -> None:
        self._repo = repo

    def save_perfil(self, perfil: Perfil) -> None:
        """Persiste o perfil de investimento do usuário."""
        self._repo.save_perfil(perfil)

    def get_perfil(self) -> Perfil | None:
        """Retorna o perfil atual do usuário, ou None se ainda não configurado."""
        return self._repo.get_perfil()
