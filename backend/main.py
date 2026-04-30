"""Ponto de entrada da aplicação FastAPI — Nuvex Invest."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.dependencies import _engine
from api.routers import acoes, onboarding, ranking
from infra.db.models import create_all_tables


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Inicializa o banco na subida e libera recursos no desligamento."""
    create_all_tables(_engine)
    yield


app = FastAPI(
    title="Nuvex Invest",
    description="Plataforma de análise de ações da B3 para investidores iniciantes.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(acoes.router)
app.include_router(ranking.router)
app.include_router(onboarding.router)
