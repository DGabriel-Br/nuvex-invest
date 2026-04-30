"""Router: /ranking — ranking de ações por perfil."""

from typing import Literal

from fastapi import APIRouter, Depends, Query

from api.dependencies import get_ranking_service, get_repo
from api.schemas.acao_schema import AcaoOut
from api.schemas.ranking_schema import (
    RankingItemOut,
    ScoreFundamentalistaOut,
    ScoreMomentoOut,
    ScoreOut,
)
from domain.entities.acao import Acao
from domain.entities.score import Score
from domain.ports.acoes_repo import AcoesRepository
from domain.services.ranking_service import RankingService

router = APIRouter(prefix="/ranking", tags=["ranking"])


def _acao_to_schema(acao: Acao) -> AcaoOut:
    return AcaoOut(
        ticker=acao.ticker.code,
        name=acao.name,
        segment=acao.segment,
        current_price=acao.current_price,
        lpa=acao.lpa,
        vpa=acao.vpa,
        pl=acao.pl,
        pvp=acao.pvp,
        roe=acao.roe,
        dividend_yield=acao.dividend_yield,
        net_margin=acao.net_margin,
        dividends_per_share=acao.dividends_per_share,
        var_30d=acao.var_30d,
        var_90d=acao.var_90d,
        var_252d=acao.var_252d,
        relative_volume=acao.relative_volume,
    )


def _score_to_schema(score: Score) -> ScoreOut:
    return ScoreOut(
        fundamental=ScoreFundamentalistaOut(
            pl_score=score.fundamental.pl_score,
            pvp_score=score.fundamental.pvp_score,
            roe_score=score.fundamental.roe_score,
            dy_score=score.fundamental.dy_score,
            net_margin_score=score.fundamental.net_margin_score,
            total=score.fundamental.total,
        ),
        momentum=ScoreMomentoOut(
            var_30d=score.momentum.var_30d,
            var_90d=score.momentum.var_90d,
            var_252d=score.momentum.var_252d,
            relative_volume=score.momentum.relative_volume,
            total=score.momentum.total,
        ),
        composite=score.composite,
    )


@router.get("", response_model=list[RankingItemOut])
def get_ranking(
    perfil: Literal["dividendos", "crescimento"] = Query(..., description="Perfil do investidor"),
    repo: AcoesRepository = Depends(get_repo),
    svc: RankingService = Depends(get_ranking_service),
) -> list[RankingItemOut]:
    """Retorna ações rankeadas por score composto para o perfil dado.

    Ações com dados desatualizados são automaticamente excluídas.
    """
    acoes = repo.get_all()
    ranked = svc.rank(acoes, perfil)
    return [
        RankingItemOut(
            rank=i + 1,
            acao=_acao_to_schema(acao),
            score=_score_to_schema(score),
        )
        for i, (acao, score) in enumerate(ranked)
    ]
