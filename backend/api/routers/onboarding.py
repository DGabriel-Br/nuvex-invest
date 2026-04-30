"""Router: /perfil — configuração do perfil do investidor."""

from fastapi import APIRouter, Depends

from api.dependencies import get_onboarding_service
from api.schemas.perfil_schema import PerfilIn, PerfilOut
from domain.services.onboarding_service import OnboardingService

router = APIRouter(prefix="/perfil", tags=["onboarding"])


@router.get("", response_model=PerfilOut | None)
def get_perfil(svc: OnboardingService = Depends(get_onboarding_service)) -> PerfilOut | None:
    """Retorna o perfil de investimento configurado, ou null se não configurado ainda."""
    perfil = svc.get_perfil()
    return PerfilOut(perfil=perfil) if perfil else None


@router.post("", response_model=PerfilOut, status_code=201)
def save_perfil(
    body: PerfilIn,
    svc: OnboardingService = Depends(get_onboarding_service),
) -> PerfilOut:
    """Persiste o perfil de investimento do usuário ('dividendos' ou 'crescimento')."""
    svc.save_perfil(body.perfil)
    return PerfilOut(perfil=body.perfil)
