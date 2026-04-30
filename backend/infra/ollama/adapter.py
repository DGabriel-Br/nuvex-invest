"""Implementação de AnalisePort via Ollama (modelo local, async).

Invariantes:
- Nunca propaga exceções — retorna None em qualquer falha
- Timeout configurável (padrão 60s — modelos locais podem ser lentos)
- Usado apenas para análise textual; nunca para calcular scores ou preços
"""

import logging
from decimal import Decimal

import httpx

from domain.entities.acao import Acao, Perfil
from domain.ports.analise_port import AnalisePort

log = logging.getLogger(__name__)

_DEFAULT_BASE_URL = "http://localhost:11434"
_DEFAULT_MODEL = "qwen2.5:14b"
_TIMEOUT_SECONDS = 60.0


def _pct(value: Decimal | None) -> str:
    """Formata um valor decimal como percentual legível."""
    if value is None:
        return "N/D"
    return f"{float(value) * 100:.1f}%"


def _brl(value: Decimal | None) -> str:
    """Formata um valor decimal como R$."""
    if value is None:
        return "N/D"
    return f"R$ {float(value):.2f}"


def _build_prompt(acao: Acao, perfil: Perfil) -> str:
    return f"""Você é um analista financeiro brasileiro especializado em ações da B3.
Analise a ação {acao.ticker} ({acao.name}) para um investidor com perfil '{perfil}'.

Dados disponíveis:
- Preço atual: {_brl(acao.current_price)}
- P/L: {acao.pl if acao.pl is not None else 'N/D'}
- P/VP: {acao.pvp if acao.pvp is not None else 'N/D'}
- ROE: {_pct(acao.roe)}
- Dividend Yield: {_pct(acao.dividend_yield)}
- Margem Líquida: {_pct(acao.net_margin)}
- LPA: {_brl(acao.lpa)}
- VPA: {_brl(acao.vpa)}
- Variação 30d: {f"{acao.var_30d:.1f}%" if acao.var_30d is not None else "N/D"}
- Variação 252d: {f"{acao.var_252d:.1f}%" if acao.var_252d is not None else "N/D"}

Em português, escreva uma análise sucinta (máximo 3 parágrafos) destacando pontos fortes,
pontos de atenção e se a ação se encaixa bem no perfil '{perfil}'. Seja objetivo e didático,
lembrando que o leitor é um investidor iniciante.
"""


class OllamaAdapter(AnalisePort):
    """Adapter assíncrono para o modelo de linguagem local via Ollama."""

    def __init__(
        self,
        base_url: str = _DEFAULT_BASE_URL,
        model: str = _DEFAULT_MODEL,
        timeout: float = _TIMEOUT_SECONDS,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._timeout = timeout

    async def analyze(self, acao: Acao, perfil: Perfil) -> str | None:
        """Envia prompt ao Ollama e retorna o texto gerado.

        Retorna None se:
        - Ollama não estiver rodando (ConnectionError)
        - O modelo não responder no prazo (TimeoutError)
        - A resposta for inválida ou vazia
        - Qualquer outra exceção inesperada
        """
        prompt = _build_prompt(acao, perfil)
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.post(
                    f"{self._base_url}/api/generate",
                    json={
                        "model": self._model,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                response.raise_for_status()
                text = response.json().get("response", "").strip()
                return text if text else None
        except httpx.ConnectError:
            log.warning("Ollama não disponível em %s — análise ignorada.", self._base_url)
            return None
        except httpx.TimeoutException:
            log.warning("Timeout ao aguardar resposta do Ollama para %s.", acao.ticker)
            return None
        except Exception as exc:
            log.warning("Erro inesperado ao chamar Ollama para %s: %s", acao.ticker, exc)
            return None
