# 🚀 Tutorial 01: Instalação e Setup Local do Zero

Bem-vindo ao **Nexus Agent Framework**! Este guia vai te ensinar a configurar todo o ecossistema na sua máquina local do zero em menos de **3 minutos**.

---

## 📋 1. Pré-Requisitos

O Nexus foi projetado sob o princípio da **homogeneidade e leveza em Go**. Você não precisa instalar Node.js, npm, Python ou dependências C++ pesadas.

* **Sistema Operacional:** Linux (Ubuntu 22.04+, Debian, Fedora, Arch), macOS ou Windows via WSL2.
* **Go (Golang):** Versão `1.22` ou superior ([download oficial](https://go.dev/dl/)).
* **Git:** Para clonar o repositório.
* **Make:** Utilitário de automação padrão Unix (`build-essential` no Ubuntu).

Para checar se suas ferramentas estão prontas, execute no terminal:
```bash
go version
# Deve retornar: go version go1.22.x ou superior

git --version
make --version
```

---

## 📥 2. Clonando o Repositório

Abra o terminal na pasta onde você guarda seus projetos e clone o repositório:

```bash
git clone https://github.com/luci-jr/nexus-agent-framework.git
cd nexus-agent-framework
```

---

## ⚡ 3. Compilando o Projeto em 1 Comando

O framework possui um `Makefile` na raiz que orquestra a compilação otimizada dos dois motores centrais:
* **`nexus-console`:** O Dashboard Web executivo com UI embutida.
* **`nexus-mcp`:** O servidor Model Context Protocol para conectar aos seus agentes.

Execute:
```bash
make build
```

Saída esperada no terminal:
```text
==> Compilando Nexus Web Console...
==> Compilando Nexus MCP Server...
```

Após o término, verifique a pasta `bin/`:
```bash
ls -lh bin/
```
Você verá dois binários compactos e auto-contidos (~8 MB cada), prontos para execução direta sem necessidade de instalar pacotes adicionais.

---

## 🖥️ 4. Iniciando o Nexus Web Console

Com os binários compilados, inicie o dashboard web:

```bash
make run-console
```
Ou diretamente pelo binário:
```bash
./bin/nexus-console
```

Você verá a inicialização imediata:
```text
🌌 [NEXUS CONSOLE] Inicializando servidor web em Go...
📂 [NEXUS DIR] Diretório de governança: /seu/caminho/nexus-agent-framework
🚀 [NEXUS CONSOLE] Ouvindo em http://0.0.0.0:8090
```

Abra seu navegador e acesse:
👉 **[http://localhost:8090](http://localhost:8090)**

---

## 📸 5. O que você verá no Dashboard

Ao abrir o console, você terá acesso imediato:
1. **Status do Runtime Go:** Consumo real de memória RAM (geralmente < 15 MB) e tempo de atividade (*uptime*).
2. **Governança de Tarefas:** Renderização nativa do backlog, tarefas em andamento e entregas concluídas (`tasks/todo.md`).
3. **Catálogo de ADRs:** Visualização das decisões arquiteturais em Markdown (`docs/adrs/`).
4. **Squad de Agentes:** Visão dos 10 copilotos especialistas integrados.

*(Insira aqui o print do console: `docs/assets/screenshot_console_dashboard.png`)*

---

## ⚙️ 6. Variáveis de Ambiente (Opcional)

Se você quiser customizar a porta ou ativar autenticação, copie o modelo de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```ini
PORT=8090
NEXUS_ENV=production
CONSOLE_USER=admin
CONSOLE_PASSWORD=sua_senha_super_segura
```

---

## 🧪 7. Validando a Instalação com Testes

Para garantir que tudo está funcionando 100% no seu sistema operacional:

```bash
make test
```

Se todos os testes passarem com status `ok`, sua máquina está perfeitamente calibrada!

---

## 🛠️ Solução de Problemas Comuns

### 1. Erro: `bind: address already in use (:8090)`
A porta 8090 já está sendo usada por outro processo. Você pode alterar a porta definindo a variável `PORT`:
```bash
PORT=9090 ./bin/nexus-console
```

### 2. Erro de permissão ao rodar o binário
Garanta permissão de execução:
```bash
chmod +x bin/nexus-console bin/nexus-mcp
```

---

## 🎯 Próximo Passo
Agora que seu ambiente está rodando, vá para o:
👉 **[Tutorial 02: Conectando o Nexus MCP ao Claude Code, Cursor e Antigravity](02_conectando_ao_seu_agente.md)**

