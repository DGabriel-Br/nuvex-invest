"""Schemas Pydantic de request/response para perfil do usuário."""

from typing import Literal

from pydantic import BaseModel


class PerfilIn(BaseModel):
    perfil: Literal["dividendos", "crescimento"]


class PerfilOut(BaseModel):
    perfil: Literal["dividendos", "crescimento"]
