# ⚛️ Nexus Agent Framework

> **Framework Open Source de Orquestração de Agentes Autônomos, MCP e Squad de Engenharia em Go Nativo.**

O **Nexus Agent Framework** é uma arquitetura moderna e de altíssima performance para desenvolvedores solopreneurs, tech leads e times que utilizam LLMs (Claude Code, Antigravity CLI, Cursor, Gemini, Ollama) com ferramentas estritas (*Model Context Protocol*), orquestração de squad de especialistas e governança orientada a especificações (*Spec-Driven Development*).

---

## 🏛️ Arquitetura do Sistema

```text
+---------------------------------------------------------------+
|                      Nexus Agent Framework                    |
+---------------------------------------------------------------+
|                                                               |
|  [Squad de Especialistas]       [Agent Skills de Engenharia]  |
|  - Lucy (Tech Lead & Orquestra) - TDD & Clean Code (Uncle Bob)|
|  - Backend (Go / Java)          - Go Concurrency Patterns     |
|  - Frontend (Angular Signals)   - PostgreSQL Data Engineering |
|  - QA (Confiabilidade & Testes) - Docker Swarm & Traefik      |
|  - SecOps (SCA & SAST)          - Spring Boot Enterprise      |
|                                                               |
|  [Nexus MCP Server (Go)]        [Nexus Web Console (Go)]      |
|  - Auditoria de Comandos        - Dashboard de Governança     |
|  - Verificação de DOD           - Rastreamento de Tarefas     |
|  - Memória Local & Cache        - Monitoramento de Runtime    |
|                                                               |
+---------------------------------------------------------------+
```

---

## 🚀 Principais Recursos

* **Homogeneidade Tecnológica em Go:** Servidor MCP e Console Web construídos em Go 1.22+ puro, com consumo de memória inferior a 20 MB de RAM.
* **Binário Único & Auto-Contido:** Frontend em Vanilla JS + Tailwind CSS embutido diretamente no executável via `//go:embed`.
* **Squad de Agentes Especialistas:** 10 copilotos prontos para uso com papéis bem delimitados (Backend, Frontend, SysOps, QA, SecOps, BI, FinOps, Suporte, Webmaster e Orquestrador).
* **Biblioteca de Skills Técnicas:** Instruções padronizadas e determinísticas para elevar a precisão dos agentes.
* **Model Context Protocol (MCP) Nativo:** Compatível com Anthropic Claude Code, Antigravity CLI, Cursor e VS Code.

---

## 🛠️ Começando (Quickstart)

### Pré-requisitos
* **Go 1.22+** instalado.
* Sistema operacional Linux ou macOS (suporte a Windows via WSL2).

### 1. Clonar e Compilar
```bash
git clone https://github.com/seu-usuario/nexus-agent-framework.git
cd nexus-agent-framework

# Compilar todos os binários (Console e MCP)
make build
```

### 2. Executar o Nexus Web Console
```bash
make run-console
# Acesse o dashboard em http://localhost:8090
```

### 3. Conectar o Nexus MCP ao seu Agente
Adicione o servidor MCP ao seu arquivo de configuração (`claude_desktop_config.json`, `.mcp.json` ou Antigravity):

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

---

## 👥 O Squad de Agentes

| Agente | Especialidade | Foco de Atuação |
| :--- | :--- | :--- |
| **☕ Backend** | Go 1.22+ • Java 21 • Spring Boot | Microsserviços, APIs REST e Persistência |
| **🅰️ Frontend** | Angular 21+ • Signals • TypeScript | Interfaces Reativas e Design Systems |
| **🐧 SysOps** | Linux • Docker Swarm • Traefik | Infraestrutura, Redes e Containers |
| **🧪 QA** | Playwright • JUnit 5 • Testcontainers | Pirâmide de Testes e Qualidade |
| **🛡️ SecOps** | DevSecOps • SCA/SAST • CVEs | Hardening e Auditoria de Segurança |
| **📊 BI** | PostgreSQL • SQL Analítico | Dashboards e Métricas Operacionais |
| **💰 FinOps** | Multi-Cloud • Otimização de Custos | Gestão de TCO e Dimensionamento de Nuvem |

---

## 📜 Licença
Distribuído sob a licença [MIT](LICENSE). Consulte `LICENSE` para mais detalhes.
