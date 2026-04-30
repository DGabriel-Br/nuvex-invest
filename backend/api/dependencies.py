"""Injeção de dependências para os routers FastAPI.

O engine SQLite é criado uma única vez (singleton via módulo).
Cada request recebe uma instância nova de repo/service — leve e sem estado.
"""

import os

from sqlalchemy.engine import Engine

from domain.ports.acoes_repo import AcoesRepository
from domain.services.analise_service import AnaliseService
from domain.services.onboarding_service import OnboardingService
from domain.services.ranking_service import RankingService
from infra.db.models import get_engine
from infra.db.sqlite_repo import SqliteAcoesRepository
from infra.ollama.adapter import OllamaAdapter

_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./nuvex.db")
_OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
_OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:14b")

# Engine é singleton — criado uma vez na importação do módulo
_engine: Engine = get_engine(_DATABASE_URL)


def get_repo() -> AcoesRepository:
    return SqliteAcoesRepository(_engine)


def get_ranking_service() -> RankingService:
    return RankingService()


def get_onboarding_service() -> OnboardingService:
    return OnboardingService(get_repo())


def get_analise_service() -> AnaliseService:
    ai = OllamaAdapter(base_url=_OLLAMA_URL, model=_OLLAMA_MODEL)
    return AnaliseService(ai)
