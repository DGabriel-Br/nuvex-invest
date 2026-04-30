"""Implementação de ColetaService via yfinance.

Todos os tickers da B3 têm sufixo ".SA" no Yahoo Finance (ex: WEGE3.SA).
Dados ausentes retornam None — nunca 0. O adapter nunca lança exceção
não tratada; falhas por ticker são silenciosas e logadas.
"""

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import yfinance as yf

from domain.entities.acao import Acao, Ticker
from domain.ports.coleta_port import ColetaService

log = logging.getLogger(__name__)


def _dec(value: Any) -> Decimal | None:
    """Converte valor float/int para Decimal; retorna None se ausente ou inválido."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except Exception:
        return None


def _calc_variation(hist: Any, days: int) -> float | None:
    """Variação percentual entre o preço de 'days' pregões atrás e o mais recente."""
    if hist is None or len(hist) < 2:
        return None
    closes = hist["Close"].dropna()
    if len(closes) < days + 1:
        return None
    price_now = float(closes.iloc[-1])
    price_then = float(closes.iloc[-(days + 1)])
    if price_then == 0:
        return None
    return (price_now - price_then) / price_then * 100


def _calc_relative_volume(hist: Any, window: int = 20) -> float | None:
    """Volume do último pregão dividido pela média dos últimos 'window' pregões."""
    if hist is None or len(hist) < window + 1:
        return None
    volumes = hist["Volume"].dropna()
    if len(volumes) < window + 1:
        return None
    avg = float(volumes.iloc[-(window + 1) : -1].mean())
    last = float(volumes.iloc[-1])
    if avg == 0:
        return None
    return last / avg


def _fetch_single(ticker: Ticker) -> Acao | None:
    symbol = f"{ticker.code}.SA"
    try:
        stock = yf.Ticker(symbol)
        info = stock.info or {}

        if not info.get("symbol") and not info.get("longName"):
            log.warning("yfinance: sem dados para %s", symbol)
            return None

        # Histórico de 1 ano para calcular variações e volume relativo
        hist = stock.history(period="1y")

        current_price: Decimal | None = None
        if not hist.empty:
            current_price = _dec(hist["Close"].dropna().iloc[-1])

        name = info.get("longName") or info.get("shortName") or ticker.code
        now = datetime.now(timezone.utc)

        return Acao(
            ticker=ticker,
            name=name,
            segment=info.get("sector") or info.get("industryDisp"),
            current_price=current_price,
            price_updated_at=now,
            lpa=_dec(info.get("trailingEps")),
            vpa=_dec(info.get("bookValue")),
            pl=_dec(info.get("trailingPE")),
            pvp=_dec(info.get("priceToBook")),
            roe=_dec(info.get("returnOnEquity")),
            dividend_yield=_dec(info.get("dividendYield")),
            net_margin=_dec(info.get("profitMargins")),
            dividends_per_share=_dec(info.get("lastDividendValue")),
            var_30d=_calc_variation(hist, 30),
            var_90d=_calc_variation(hist, 90),
            var_252d=_calc_variation(hist, 252),
            relative_volume=_calc_relative_volume(hist),
            fundamentals_updated_at=now,
        )
    except Exception as exc:
        log.warning("yfinance: erro ao buscar %s — %s", symbol, exc)
        return None


class YFinanceAdapter(ColetaService):
    """Coleta dados de mercado da B3 via Yahoo Finance."""

    def fetch_acao(self, ticker: Ticker) -> Acao | None:
        return _fetch_single(ticker)

    def fetch_many(self, tickers: list[Ticker]) -> list[Acao]:
        results: list[Acao] = []
        for ticker in tickers:
            acao = _fetch_single(ticker)
            if acao is not None:
                results.append(acao)
        return results
