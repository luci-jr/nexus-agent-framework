# 🔌 Tutorial 02: Conectando o Nexus MCP aos seus Agentes de IA

O **Nexus MCP Server** implementa o protocolo oficial **Model Context Protocol (MCP)**, permitindo que LLMs e assistentes de código utilizem as ferramentas de governança, auditoria de DoD, status de infraestrutura e memória do Nexus de forma nativa e determinística.

Neste guia, você aprenderá a plugar o Nexus no **Claude Code**, **Antigravity CLI (AGY)**, **Cursor** e **Claude Desktop**.

---

## 🛠️ 1. Onde está o binário do MCP?

Após executar `make build` na raiz do projeto, o executável do MCP estará disponível em:
```text
./bin/nexus-mcp
```

O servidor se comunica via **`stdio`** (Standard Input/Output) de acordo com o padrão aberto MCP.

---

## 🤖 2. Configurando no Claude Code (Terminal CLI)

Para conectar o Nexus ao **Anthropic Claude Code**:

Execute o comando de registro direto no terminal:
```bash
claude mcp add nexus -- ./bin/nexus-mcp
```

Ou edite manualmente o arquivo de configuração `~/.claude/config.json`:
```json
{
  "mcpServers": {
    "nexus": {
      "command": "/caminho/absoluto/nexus-ecosystem-open/bin/nexus-mcp",
      "args": []
    }
  }
}
```

---

## ⚛️ 3. Configurando no Antigravity CLI (AGY) / Gemini

No Antigravity CLI ou IDE, o Nexus já vem pré-configurado no arquivo `.mcp.json` na raiz do repositório:

```json
{
  "mcpServers": {
    "nexus": {
      "type": "stdio",
      "command": "./bin/nexus-mcp",
      "args": []
    }
  }
}
```

Basta abrir o projeto no Antigravity que o servidor será inicializado automaticamente.

---

## 💻 4. Configurando no Cursor IDE

1. Abra as configurações do Cursor: `Settings` -> `Features` -> `MCP`.
2. Clique em **+ Add New MCP Server**.
3. Preencha os campos:
   * **Name:** `nexus`
   * **Type:** `command`
   * **Command:** `/caminho/absoluto/nexus-ecosystem-open/bin/nexus-mcp`
4. Clique em **Save**. O indicador ficará verde indicando que as ferramentas foram carregadas.

---

## 🖥️ 5. Configurando no Claude Desktop

No arquivo `claude_desktop_config.json`:
* **Linux:** `~/.config/Claude/claude_desktop_config.json`
* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Adicione a seção:
```json
{
  "mcpServers": {
    "nexus": {
      "command": "/caminho/absoluto/nexus-ecosystem-open/bin/nexus-mcp",
      "args": []
    }
  }
}
```

Reinicie o Claude Desktop. Você verá o ícone de martelo (Tools) com as ferramentas do Nexus ativas.

---

## 🧰 6. Quais ferramentas o Nexus MCP disponibiliza?

Ao plugar o Nexus, seu agente ganha superpoderes de engenharia:

| Ferramenta | Descrição |
| :--- | :--- |
| `nexus_status_sistema` | Inspeciona CPU, RAM, uptime e integridade do runtime Go. |
| `nexus_validar_dod` | Audita se uma entrega de código atende 100% aos critérios de aceite (*Definition of Done*). |
| `nexus_auditar_comando`| Analisa comandos de terminal antes de executá-los para evitar riscos de segurança. |
| `nexus_listar_adrs` | Consulta o índice de Architecture Decision Records do projeto. |
| `nexus_obter_estado_tarefa` | Lê as tarefas em andamento e concluídas diretamente do Markdown. |

---

## 🧪 7. Testando a Conexão

Abra seu agente (Claude Code, Cursor ou Antigravity) e envie o seguinte prompt de teste:

> *"Use a ferramenta nexus_status_sistema para checar a saúde do runtime e me mostre o resultado."*

O agente acionará a ferramenta do Nexus e responderá com o consumo de memória e integridade do sistema em tempo real!

*(Insira aqui o print do teste no chat: `docs/assets/screenshot_mcp_claude.png`)*

