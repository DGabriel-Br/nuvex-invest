# Nuvex Invest

Plataforma local de análise de ações da B3 para investidores iniciantes. Calcula scores fundamentalistas e de momento por perfil (dividendos ou crescimento), estima preço justo e gera análises textuais via modelo de linguagem local.

Roda 100% na sua máquina. Nenhum dado sai daqui.

---

## Pré-requisitos

- **Python 3.11+** e **[uv](https://docs.astral.sh/uv/getting-started/installation/)**
- **Node.js 18+** e **npm**
- **[Ollama](https://ollama.com)** instalado e rodando, com um dos modelos abaixo:

```bash
ollama pull qwen2.5:14b
# ou
ollama pull phi4
```

---

## Backend

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
```

API disponível em `http://localhost:8000`. Documentação em `http://localhost:8000/docs`.

---

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Interface disponível em `http://localhost:5173`.

---

## Primeira sincronização de dados

Com o backend rodando, adicione os tickers que quer acompanhar:

```bash
cd backend
uv run python -m infra.yfinance.sync --add WEGE3 BBAS3 ITUB4 PETR4 VALE3
```

Os dados são buscados no Yahoo Finance e salvos localmente em `nuvex.db`. Para sincronizar novamente (atualizar preços e fundamentos):

```bash
uv run python -m infra.yfinance.sync
```

Rode o sync periodicamente para manter os scores atualizados — dados com mais de 24h (preços) ou 7 dias (fundamentos) são descartados do ranking automaticamente.

---

## Variáveis de ambiente

Copie os exemplos e ajuste se necessário:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./nuvex.db` | Caminho do banco SQLite |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Endereço do Ollama |
| `OLLAMA_MODEL` | `qwen2.5:14b` | Modelo usado para análise textual |
| `VITE_API_URL` | `http://localhost:8000` | URL do backend (frontend) |
