#!/usr/bin/env bash
# ==============================================================================
# ⚛️ Nexus Ecosystem — Launcher Unificado (Local & Cloud)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "======================================================================"
echo "⚛️  Nexus Ecosystem (Open Source Edition) — Assistente de Execução"
echo "======================================================================"
echo ""
echo "Escolha como deseja executar o ecossistema:"
echo ""
echo "  [1] Modo Local (Workstation / Desktop)"
echo "      -> Executa o binário Go puro localmente em http://localhost:8090"
echo "      -> Sem Docker, sem dependências pesadas, consumo < 20MB de RAM"
echo ""
echo "  [2] Modo Nuvem / VPS (Deploy 24/7)"
echo "      -> Executa via Docker Compose com Traefik v3 e SSL automático (HTTPS)"
echo "      -> Ideal para VPS na nuvem (Google Cloud Always Free, Oracle, AWS, etc.)"
echo ""
read -rp "Digite a opção desejada [1 ou 2] (padrão: 1): " OPCAO
OPCAO="${OPCAO:-1}"

if [ "$OPCAO" = "1" ]; then
    echo ""
    echo "⚡ Iniciando Nexus Web Console no modo Local..."
    cd "${ROOT_DIR}"
    if [ ! -f "bin/nexus-console" ]; then
        echo "📦 Binário não encontrado. Compilando com 'make build'..."
        make build
    fi
    echo "🚀 Acessando painel em: http://localhost:8090"
    ./bin/nexus-console
elif [ "$OPCAO" = "2" ]; then
    echo ""
    echo "☁️  Iniciando modo Nuvem / VPS..."
    cd "${SCRIPT_DIR}"
    if [ ! -f ".env" ]; then
        echo "⚠️  Arquivo .env não encontrado em deploy/. Copiando de .env.example..."
        cp .env.example .env
        echo "❗ Edite o arquivo deploy/.env com seu domínio e e-mail antes de continuar."
        exit 1
    fi
    echo "🐳 Subindo containers via Docker Compose..."
    docker compose up -d
    echo "✅ Containers ativos! Acesse através do domínio configurado no seu deploy/.env."
else
    echo "❌ Opção inválida. Saindo."
    exit 1
fi

