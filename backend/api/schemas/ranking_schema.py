"""Schemas Pydantic de resposta para ranking e scores."""

from pydantic import BaseModel

from .acao_schema import AcaoOut


class ScoreFundamentalistaOut(BaseModel):
    pl_score: float | None
    pvp_score: float | None
    roe_score: float | None
    dy_score: float | None
    net_margin_score: float | None
    total: float


class ScoreMomentoOut(BaseModel):
    var_30d: float | None
    var_90d: float | None
    var_252d: float | None
    relative_volume: float | None
    total: float


class ScoreOut(BaseModel):
    fundamental: ScoreFundamentalistaOut
    momentum: ScoreMomentoOut
    composite: float


class RankingItemOut(BaseModel):
    rank: int
    acao: AcaoOut
    score: ScoreOut
