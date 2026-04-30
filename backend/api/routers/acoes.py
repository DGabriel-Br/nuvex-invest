"""Router: /acoes — listagem e detalhe de ações."""

from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_repo
from api.schemas.acao_schema import AcaoOut
from domain.entities.acao import Acao, Ticker
from domain.ports.acoes_repo import AcoesRepository

router = APIRouter(prefix="/acoes", tags=["acoes"])


def _to_schema(acao: Acao) -> AcaoOut:
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


@router.get("", response_model=list[AcaoOut])
def list_acoes(repo: AcoesRepository = Depends(get_repo)) -> list[AcaoOut]:
    """Retorna todas as ações cadastradas no banco."""
    return [_to_schema(a) for a in repo.get_all()]


@router.get("/{ticker}", response_model=AcaoOut)
def get_acao(ticker: str, repo: AcoesRepository = Depends(get_repo)) -> AcaoOut:
    """Retorna dados de uma ação específica pelo ticker."""
    try:
        t = Ticker(code=ticker)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    acao = repo.get_by_ticker(t)
    if acao is None:
        raise HTTPException(status_code=404, detail=f"Ação '{ticker}' não encontrada.")
    return _to_schema(acao)
