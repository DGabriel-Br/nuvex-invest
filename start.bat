@echo off
chcp 65001 >nul
title Nuvex Invest

echo.
echo  NUVEX INVEST
echo  ============
echo.

REM Verifica se o banco existe (primeira execucao)
if not exist "%~dp0backend\nuvex.db" (
    echo  [AVISO] Banco de dados nao encontrado.
    echo  Execute a sincronizacao inicial antes de usar o ranking:
    echo.
    echo    cd backend
    echo    uv run python -m infra.yfinance.sync --add WEGE3 BBAS3 ITUB4 PETR4 VALE3
    echo.
    pause
)

echo  Iniciando backend...
start "Nuvex — Backend" cmd /k "cd /d "%~dp0backend" && uv run uvicorn main:app --reload"

echo  Aguardando backend subir...
timeout /t 4 /nobreak >nul

echo  Iniciando frontend...
start "Nuvex — Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo  Aguardando frontend subir...
timeout /t 5 /nobreak >nul

echo  Abrindo navegador...
start "" "http://localhost:5173"

echo.
echo  Backend:  http://localhost:8000
echo  Frontend: http://localhost:5173
echo  API docs: http://localhost:8000/docs
echo.
echo  Feche as janelas de backend e frontend para encerrar.
echo.
pause >nul
