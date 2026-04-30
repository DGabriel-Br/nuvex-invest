# Nuvex Invest — CLAUDE.md

## Project Overview

Plataforma de análise de ações da B3 voltada para investidores iniciantes.
Ajuda o usuário a descobrir ações adequadas ao seu perfil (dividendos ou crescimento),
entender indicadores fundamentalistas e de momento, e encontrar zonas de entrada com base em preço justo.

Tudo roda **100% local**. Nenhuma dependência de API externa paga. Nenhum dado do usuário sai da máquina.

---

## Stack

| Camada       | Tecnologia                              |
|--------------|-----------------------------------------|
| Data         | yfinance, SQLite                        |
| Backend      | Python 3.11+, FastAPI                   |
| AI local     | Ollama (qwen2.5:14b ou phi4)            |
| Frontend     | React + TypeScript, Tailwind, Recharts  |
| Gerenciador  | uv (não usar pip diretamente)           |

---

## Architecture: Clean Architecture

```
nuvex-invest/
├── backend/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── acao.py          # Acao, Ticker (value object)
│   │   │   ├── score.py         # Score, ScoreFundamentalista, ScoreMomento
│   │   │   └── preco_justo.py   # PrecoJusto, PrecoTeto, ZonaEntrada
│   │   ├── ports/
│   │   │   ├── acoes_repo.py    # AcoesRepository (interface)
│   │   │   └── coleta_port.py   # ColetaService (interface)
│   │   └── services/
│   │       ├── ranking_service.py    # Calcula e ordena scores por perfil
│   │       ├── onboarding_service.py # Valida e persiste perfil do usuário
│   │       └── analise_service.py    # Orquestra análise textual via IA
│   ├── infra/
│   │   ├── db/
│   │   │   ├── models.py        # Modelos SQLite (SQLAlchemy ou raw)
│   │   │   ├── sqlite_repo.py   # Implementa AcoesRepository
│   │   │   └── migrations/
│   │   ├── yfinance/
│   │   │   ├── adapter.py       # Implementa ColetaService via yfinance
│   │   │   └── sync.py          # Script de sincronização periódica
│   │   └── ollama/
│   │       └── adapter.py       # Chamadas ao modelo local (async)
│   ├── api/
│   │   ├── routers/
│   │   │   ├── acoes.py         # GET /acoes, GET /acoes/{ticker}
│   │   │   ├── ranking.py       # GET /ranking?perfil=dividendos
│   │   │   └── onboarding.py    # POST /perfil
│   │   ├── schemas/             # Pydantic request/response models
│   │   └── dependencies.py      # Injeção de dependências (repos, services)
│   ├── main.py
│   └── pyproject.toml
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── RankingTable.tsx
│       │   ├── StockCard.tsx
│       │   ├── ScoreBar.tsx
│       │   └── Tooltip.tsx      # Tooltips educativos (conteúdo estático)
│       ├── pages/
│       │   ├── Onboarding.tsx
│       │   ├── Ranking.tsx
│       │   ├── StockDetail.tsx
│       │   └── Compare.tsx
│       ├── hooks/
│       │   ├── useRanking.ts    # Busca e filtra ranking
│       │   └── useStock.ts      # Detalhe de uma ação
│       └── services/
│           └── api.ts           # Todas as chamadas ao backend
├── CLAUDE.md
├── Makefile                     # make dev, make sync, make test
└── .env.example
```

**Regra de ouro:** `domain/` nunca importa nada de `infra/` ou `api/`.
Se precisar de I/O dentro de domain, crie uma interface em `domain/ports/` e implemente em `infra/`.

---

## Domain Language (Linguagem Ubíqua)

| Termo              | Significado no sistema                                                    |
|--------------------|---------------------------------------------------------------------------|
| Ação               | Ativo listado na B3, identificado pelo ticker (ex: PETR4)                 |
| Ticker             | Código de 4-6 caracteres que identifica uma ação (ex: WEGE3, BBAS3)      |
| Perfil             | Preferência do investidor: `dividendos` ou `crescimento`                  |
| Score              | Nota composta (0-100) calculada com pesos distintos por perfil            |
| Score Fundamentalista | Derivado de P/L, P/VP, ROE, Dividend Yield, Margem Líquida            |
| Score de Momento   | Derivado de variação de preço (30d, 90d, 252d) e volume relativo          |
| Preço Justo        | Estimativa de valor intrínseco (Graham, Bazin ou média dos dois)          |
| Preço Teto         | Preço máximo aceitável para compra dado o DY alvo (modelo Bazin)         |
| Zona de Entrada    | Faixa entre desconto mínimo aceitável e preço teto                        |
| Segmento           | Classificação setorial da B3 (ex: Bancos, Energia Elétrica, Varejo)      |
| Tooltip Educativo  | Explicação inline de um indicador, escrita em linguagem para iniciantes   |

---

## Domain Invariants (nunca violar)

- Um ticker é sempre uppercase e tem entre 4 e 6 caracteres.
- Score nunca é calculado com dados desatualizados (> 24h para preços, > 7d para fundamentos).
- Preço Justo requer ao menos LPA e VPA válidos; se ausentes, retornar `null`, nunca 0.
- Perfil do usuário só pode ser `dividendos` ou `crescimento`.
- A IA local (Ollama) é usada apenas para análise textual — nunca para calcular scores ou preços.
- Tooltips educativos são estáticos e revisados manualmente; nunca gerados dinamicamente pela IA.

---

## Code Style

- **Python:** type hints em tudo, Pydantic para schemas de API e value objects, docstrings em funções públicas.
- **Nomes em inglês** no código (variáveis, funções, classes). Comentários e docs podem ser em PT-BR.
- **React:** componentes funcionais com hooks. Sem class components.
- **Tailwind:** sem CSS customizado avulso. Usar variáveis do tema quando precisar de cor específica.
- **Commits:** mensagens em inglês, formato `type(scope): description` (feat, fix, refactor, docs, chore).

---

## What Claude Gets Wrong Here (corrigir sempre)

- **Não criar lógica de cálculo de score na camada `api/` ou `infra/`.** Scores vivem em `domain/services/`.
- **Não usar `requests` direto no domínio.** Dados externos passam por adapters em `infra/yfinance/`.
- **Não retornar 0 quando dado está ausente.** Retornar `null`/`None` e tratar no frontend.
- **Não hardcodar tickers.** A lista de ações vem do banco, não do código.
- **Não chamar Ollama sincronamente em endpoints críticos.** Análise de IA é assíncrona, com fallback gracioso se o modelo não responder.

---

## Common Commands

```bash
# Backend
cd backend
uv run uvicorn main:app --reload

# Coletar/atualizar dados
uv run python -m infra.yfinance.sync

# Frontend
cd frontend
npm run dev

# Rodar testes
uv run pytest
```

---

## Roadmap

### v2 — Gestão de Carteira
Entidades novas no domínio (não implementar antes de finalizar v1):
- `Carteira` — posições do usuário (ticker, quantidade, preço médio, data de entrada)
- `Transacao` — histórico de compras e vendas (necessário para calcular preço médio em aportes parciais)
- `Provento` — dividendos e JCP recebidos por ticker e data

Funcionalidades esperadas: rentabilidade por posição, peso por ativo, diversificação por segmento, DY realizado.

---

## Current Focus

> Atualizar esta seção a cada sessão de trabalho.

### Concluído — Backend

- [x] Entidades do domínio: `Acao` (+ campos de momento), `Ticker`, `Score`, `ScoreFundamentalista`, `ScoreMomento`, `PrecoJusto`, `PrecoTeto`, `ZonaEntrada`
- [x] Ports: `AcoesRepository`, `ColetaService`, `AnalisePort`
- [x] Services: `RankingService` (pesos por perfil, freshness check), `OnboardingService`, `AnaliseService`
- [x] Infra/DB: modelos SQLite via SQLAlchemy Core, `SqliteAcoesRepository` com upsert atômico em lote
- [x] Infra/YFinance: `YFinanceAdapter` (var 30/90/252d, volume relativo), `sync.py` com CLI `--add`
- [x] Infra/Ollama: `OllamaAdapter` async com fallback gracioso (ConnectError, Timeout, exceção genérica)
- [x] API: routers `/acoes`, `/ranking`, `/perfil`; schemas Pydantic; injeção de dependências; `main.py` com lifespan

### Concluído — Frontend

- [x] Setup: Vite 5 + React 18 + TypeScript strict + Tailwind 3 (paleta customizada) + Recharts; chunking manual
- [x] `services/api.ts`: todos os endpoints tipados (`getAcoes`, `getAcao`, `getRanking`, `getPerfil`, `savePerfil`)
- [x] `hooks/useRanking.ts`: busca por perfil, filtros search/segment, refetch
- [x] `hooks/useStock.ts`: busca de ação por ticker com loading/error
- [x] `components/ScoreBar`: barra animada, cor por threshold (≥70 verde, ≥40 âmbar, <40 vermelho)
- [x] `components/Tooltip`: 13 indicadores com conteúdo educativo estático
- [x] `components/StockCard`: card com score, métricas, winner highlight para Compare
- [x] `components/RankingTable`: tabela densa, sticky header, null → "-"
- [x] `pages/Onboarding`: split screen, seleção de perfil, POST /perfil, redirect se já configurado
- [x] `pages/Ranking`: toggle dividendos/crescimento, busca + filtro segmento
- [x] `pages/StockDetail`: Recharts LineChart com preço reconstruído dos deltas, grid de fundamentos com tooltips
- [x] `pages/Compare`: datalist autocomplete, Recharts RadarChart bi-série, tabela de métricas com winner
- [x] Roteamento: `/` Onboarding · `/ranking` · `/acoes/:ticker` · `/comparar`

### Próximos Passos — v1 Final

- [ ] **Testes de integração (backend):** pytest com banco SQLite in-memory; cobrir `RankingService`, `SqliteAcoesRepository` e os três routers com `httpx.AsyncClient`
- [ ] **Validação do fluxo completo:** rodar `sync.py --add` com tickers reais da B3, subir backend e frontend juntos, percorrer Onboarding → Ranking → StockDetail → Compare
- [ ] **Ajustes de UI pós-validação:** calibrar pesos do `RankingService` com dados reais; revisar tooltips educativos com exemplos de valores típicos da B3; responsividade mobile da `RankingTable`
- [ ] **Endpoint de análise textual:** ligar `AnaliseService` ao Ollama num endpoint `GET /acoes/{ticker}/analise` (async, com fallback 204 se modelo offline)
- [ ] **Endpoint `PrecoJusto`:** implementar `GET /acoes/{ticker}/preco-justo` usando `PrecoJusto`, `PrecoTeto` e `ZonaEntrada` calculados no service