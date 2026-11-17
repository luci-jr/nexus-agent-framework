<a id="readme-top"></a>

<div align="center">

<img src="docs/assets/nexus_logo.png" alt="Nexus Logo" width="100" />

# Nexus Ecosystem (Open Source Edition)

### *A Versão Aberta da Plataforma de Engenharia, MCP Server e Squad de Especialistas em Go Nativo*

[![Linux Ubuntu](https://img.shields.io/badge/OS-Linux%20Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)](https://ubuntu.com/)
[![macOS & Windows](https://img.shields.io/badge/OS-macOS%20%7C%20Windows%20WSL2-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/luci-jr/nexus-ecosystem-open)
[![Go Version](https://img.shields.io/badge/Go-1.22%2B-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev/)
[![License MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![MCP Spec](https://img.shields.io/badge/Protocol-MCP%20v3.1-8A2BE2?style=for-the-badge)](https://modelcontextprotocol.io/)
[![Memory](https://img.shields.io/badge/RAM-%3C%2020MB-success?style=for-the-badge)](https://github.com/luci-jr/nexus-ecosystem-open)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=for-the-badge)](https://github.com/luci-jr/nexus-ecosystem-open/pulls)
[![CI](https://github.com/luci-jr/nexus-ecosystem-open/actions/workflows/ci.yml/badge.svg)](https://github.com/luci-jr/nexus-ecosystem-open/actions/workflows/ci.yml)
[![Security Policy](https://img.shields.io/badge/Security-Policy-blue.svg?style=for-the-badge)](SECURITY.md)

</div>

---

## 🧭 Índice Rápido de Navegação

| Seção | Conteúdo & Foco |
| :--- | :--- |
| [🎯 Para Quem É Esta Plataforma](#publico-alvo) | Perfil do desenvolvedor, solopreneur e autodidata |
| [🌱 1. A Dor, a Origem & o Propósito](#origem) | Da transição solo à criação do squad de agentes |
| [🧭 2. O Que É o Nexus Ecosystem Open Source](#o-que-e) | Visão geral da plataforma aberta em Go puro |
| [🏛️ 3. Arquitetura do Sistema](#arquitetura) | Diagrama conceitual do terminal, MCP e consoles |
| [📂 4. Estrutura de Diretórios](#estrutura) | Árvore modular e componentes portáteis |
| [👥 5. O Squad de Especialistas](#squad) | 10 personas especializadas com domínios estritos |
| [⚡ 6. Catálogo do Servidor MCP Nativo](#mcp) | Ferramentas seguras de DoD, auditoria e telemetria |
| [📚 7. Trilha de Tutoriais Oficiais](#tutoriais) | Guia passo a passo do setup local ao deploy |
| [📱 8. Acesso Remoto no Celular](#mobile) | PWA e controle no smartphone com custo zero |
| [🚀 9. Quickstart em 3 Minutos](#quickstart) | Como clonar, compilar e rodar local ou na nuvem |
| [📜 10. Licença Oficial](#licenca) | Termos de uso livre sob a Licença MIT |
| [👨‍💻 Desenvolvedor & Arquiteto](#autor) | Perfil do autor, portfólio e redes de contato |

---

<a id="publico-alvo"></a>
## 🎯 Para Quem É Esta Plataforma?

O **Nexus Ecosystem (Open Source Edition)** foi forjado sob o princípio da **leveza e disciplina de engenharia em Go nativo**, atendendo especialmente:

- 🚀 **Profissionais em Transição de Carreira & Autodidatas:** Desenvolvedores que encaram a solidão da bancada e sentem a falta de um dev sênior ou arquiteto experiente ao lado para revisar código, apontar causas-raiz e acelerar o aprendizado prático.
- ☕ **Engenheiros de Software Solo & Solopreneurs:** Quem precisa gerenciar todas as pontas do produto sozinho — do backend concorrente e banco de dados até esteiras de testes, infraestrutura e segurança — sem sobrecarga de ferramentas pesadas.
- ⚡ **Usuários de IA no Terminal (Claude Code, Antigravity CLI, Cursor):** Desenvolvedores que já utilizam agentes de inteligência artificial, mas buscam sair de prompts superficiais no navegador para operar com um **squad delimitado com papéis estritos, TDD e ferramentas reais via MCP**.
- ☁️ **Quem Busca Custo Zero de Operação:** Profissionais que não querem queimar dinheiro com servidores pesados: o ecossistema roda com **menos de 20MB de RAM** no PC local ou em instâncias Always Free (Google Cloud / Oracle).

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="origem"></a>
## 🌱 1. A Dor, a Origem & o Propósito Open Source

Esta plataforma não nasceu em uma sala de reuniões corporativa. Ela nasceu de uma dor visceral sentida na pele por um desenvolvedor em plena **transição de carreira** — migrando de mais de 15 anos na alta gastronomia profissional para a engenharia de software de alta performance.

### A Jornada Solitária na Transição de Carreira

Quem trilha a migração de área de forma autônoma e independente conhece a dor da bancada técnica:

- **A Ausência de um Sênior ao Lado:** Você estuda stacks densas e corporativas (Go 1.22+, concorrência pura, Java 21 LTS com Spring Boot, bancos relacionais, Docker Swarm, nuvem AWS), mas **não tem um desenvolvedor sênior ou arquiteto experiente sentado ao seu lado** para revisar seu código, tirar dúvidas de causa-raiz, apontar gargalos de memória ou guiar decisões estruturais complexas.
- **O Risco do Código Amador:** Sem mentoria sênior diária, é fácil cair no ciclo vicioso de copiar soluções superficiais da internet ou produzir código desestruturado que nunca passaria em uma auditoria de produção.
- **A Sobrecarga Solopreneur:** Como desenvolvedor solo, além de escrever o backend e arquitetar o banco, é preciso gerenciar infraestrutura, esteiras de testes, segurança e tarefas diárias de negócio.

---

### A Faísca que Começou na Escola da Nuvem

O ponto de virada começou a se desenhar na reta final da formação do autor no programa intensivo **AWS re/Start pela Escola da Nuvem**:

Durante uma conversa em grupo entre os alunos quase no encerramento do curso, um colega comentou que utilizava o **Google Gemini diretamente via terminal no Windows (Gemini CLI)**.

Inicialmente, o autor não deu tanta atenção, apesar de ter achado o conceito interessante. Porém, aquela semente ficou maturando na cabeça: diante da dor de encarar a transição de carreira e estudar stacks densas sozinho sem um desenvolvedor sênior ao lado, a ficha caiu. _Em vez de se limitar a prompts soltos no navegador, por que não trazer a inteligência para o fluxo do terminal Linux e forjar seu próprio squad autônomo de especialistas?_

A ferramenta evoluiu do **Gemini CLI** para o avançado **Google Antigravity CLI (AGY)**, transformando o terminal em um centro autônomo de engenharia de software de alta performance.

---

### Do Ecossistema Pessoal Privado para o Mundo

Dentro do seu ecossistema pessoal privado (**Nexus Ecosystem**), o autor construiu a **Lucy** (Tech Lead e Mentora Sênior) e um squad de copilotos com papéis estritamente delimitados sob regras de _Clean Architecture_, TDD estrito e _Spec-Driven Development_, além de reescrever todo o servidor MCP nativo e o console web em **Go 1.22+ puro (< 20 MB de RAM)**.

**Por que abrir esse projeto para a comunidade?**  
Porque ninguém deveria ter que travar nos estudos ou desistir de construir software de nível corporativo por falta de um desenvolvedor sênior experiente por perto.

Esta versão open source sob licença MIT (**Nexus Ecosystem Open Source Edition**) foi forjada com o propósito explícito de compartilhar essa mesma infraestrutura de agentes e servidor MCP com a comunidade técnica — para que qualquer estudante, profissional em transição ou desenvolvedor solo possa ter, no seu próprio terminal, um squad sênior acelerando sua evolução diária.

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="o-que-e"></a>
## 🧭 2. O Que É o Nexus Ecosystem (Open Source Edition)?

O **Nexus Ecosystem (Open Source Edition)** é a distribuição aberta e comunitária da plataforma de engenharia de software desenvolvida por **Lucivaldo Junior**. Ele foi projetado para desenvolvedores, tech leads e solopreneurs que utilizam Modelos de Linguagem (LLMs) como **Anthropic Claude Code**, **Google Antigravity CLI**, **Cursor IDE**, **VS Code** e **Gemini**.

Diferente de frameworks tradicionais que dependem de centenas de megabytes de dependências Python ou Node.js, o Nexus foi concebido sob o princípio da **homogeneidade e leveza em Go**:

- ⚡ **Ultra Leve & Baixo Consumo (< 20 MB de RAM):** Construído 100% em Go 1.22+ puro, com tempo de inicialização de milissegundos e sem necessidade de máquinas pesadas.
- 📦 **Binário Único & Auto-Contido:** O frontend do Dashboard Web (Single Page App em Vanilla JS + Tailwind CSS) é compilado diretamente dentro do binário executável via `//go:embed`.
- 🔌 **Model Context Protocol (MCP) Nativo:** Expõe ferramentas seguras de auditoria de código, verificação de critérios de aceite (_DoD_), status de infraestrutura e memória local via canal `stdio`.
- 👥 **Squad Especialista Integrado:** 10 copilotos com instruções de engenharia disciplinadas (TDD estrito, Clean Architecture, Uncle Bob e Spec-Driven Development).
- 📱 **PWA & Acesso Remoto Gratuito:** Acesse o console pelo celular no 4G/5G com **Tailscale** ou **Cloudflare Tunnel** com custo zero e sem abrir portas no roteador.

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="arquitetura"></a>
## 🏛️ 3. Arquitetura do Sistema

```text
                           ┌────────────────────────────────────────┐
                           │       DESENVOLVEDOR NO TERMINAL        │
                           │     (Linux Ubuntu • macOS • WSL2)      │
                           └──────────────────┬─────────────────────┘
                                              │
                                              ▼
                           ┌────────────────────────────────────────┐
                           │   CLIENTE DE IA (Claude • AGY • Cursor)│
                           │     Model Context Protocol (MCP) v3.1  │
                           └──────────────────┬─────────────────────┘
                                              │ Canal stdio (JSON-RPC 2.0)
                                              ▼
                           ┌────────────────────────────────────────┐
                           │      NEXUS MCP SERVER (GO PURO)        │
                           │         < 0.1ms • < 20MB RAM           │
                           │   • Auditoria de DoD (Acceptance)      │
                           │   • Inspeção de Infraestrutura         │
                           │   • Consulta de Memória e Grafo        │
                           └──────────────────┬─────────────────────┘
                                              │
                                              ▼
 ┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
 │                           │                           │                           │
 ▼                           ▼                           ▼                           ▼
👥 SQUAD DE AGENTES         🖥️ NEXUS WEB CONSOLE         🎯 REPOSITÓRIO DE SKILLS   📱 ACESSO MÓVEL 4G/5G
10 Personas Especialistas   Dashboard Executivo :8090    Engenharia de Prompt        PWA via Tailscale
• Lucy (Tech Lead / Arq)    • Single Page App em Go      • Angular Signals           • Custo Zero
• Backend (Go / Java / SQL) • UI embutida (//go:embed)   • Go Concurrency            • Zero Port Forward
• Frontend (Angular / UI)   • Métricas de Tarefas        • Docker Swarm & Traefik    • Controle Remoto
• QA (Testes / Automação)   • Sem Node.js / Sem Python   • Postgres Tuning           • Telemetria no Bolso
```

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="estrutura"></a>
## 📂 4. Estrutura de Diretórios Consolidada

A árvore abaixo reflete a organização modular do repositório:

```text
nexus-ecosystem-open/
├── 👥 agents/                       # Catálogo de Personas do Squad Especialista
│   ├── lucy.md                    # Lucy: Tech Lead Sênior, Mentora Socrática & Arquiteta
│   ├── backend.md                 # Go 1.22+, Java 21, Spring Boot 3, Redis & PostgreSQL
│   ├── frontend.md                # Angular 21+, Signals, TypeScript, CSS3 e Design Systems
│   ├── sysops.md                  # Linux Ubuntu, Docker Swarm, Traefik v3, Redes e Nuvem
│   ├── qa.md                      # Engenheiro de Qualidade, JUnit 5, Playwright e k6
│   ├── secops.md                  # DevSecOps, Segurança da Informação, SCA/SAST e CVEs
│   ├── suporte.md                 # Suporte Técnico N2/N3, Automação Comercial e SQL
│   ├── bi.md                      # Business Intelligence, SQL Analítico e Métricas
│   ├── finops.md                  # Cloud FinOps, Arbitragem Multi-Cloud e Gestão de TCO
│   ├── frellas.md                 # Consultor de Carreira, ATS Score e Propostas PJ
│   └── webmaster.md               # CMS, WordPress, WooCommerce e Landing Pages
│
├── ⚡ nexus-mcp/                     # Servidor MCP v3.1 em Go Nativo
│   ├── internal/                  # Ferramentas nativas, telemetria e governança
│   │   ├── config/                # Resolução dinâmica de caminhos e ambiente
│   │   ├── prompts/               # Templates padronizados de prompts MCP
│   │   ├── resources/             # Recursos nativos do protocolo (nexus://)
│   │   └── tools/                 # Ferramentas de auditoria de DoD, status e grafo
│   ├── main.go                    # Ponto de entrada do protocolo via canal stdio
│   ├── go.mod & go.sum            # Gerenciamento de dependências Go puras
│   └── Makefile                   # Automações de compilação e testes unitários
│
├── 🖥️ nexus-console/                 # Dashboard Web de Governança em Go Nativo (Porta 8090)
│   ├── internal/                  # Parsers de markdown, bridge de telemetria e SSE
│   ├── web/                       # Single Page App (Tailwind CSS, Lucide Icons, Vanilla JS)
│   │   ├── assets/                # Imagens e favicons oficiais do reator ⚛️
│   │   ├── css/ & js/             # Estilos e módulos reativos da UI
│   │   └── index.html             # Interface web embutida via //go:embed
│   ├── main.go                    # Ponto de entrada do serviço HTTP local
│   ├── Dockerfile                 # Empacotamento em container minimalista (<15MB RAM)
│   └── Makefile                   # Compilação e execução rápida
│
├── 🎯 skills/                       # Biblioteca de Habilidades Especializadas de Engenharia
│   ├── angular-signals-architect  # Reatividade moderna em Angular 21+ com Signals e Standalone
│   ├── docker-swarm-traefik-ops   # Operação de Swarm, Traefik, redes overlay e isolamento
│   ├── go-concurrency-patterns    # Concorrência em Go 1.22+, goroutines, context e mutexes
│   ├── postgres-data-engineering  # Concorrência transacional, query tuning e locks pessimistas
│   ├── spring-boot-enterprise     # Padrões corporativos Java 21 LTS e Spring Boot 3
│   ├── ub-mode                    # Disciplina estrita de Clean Code e TDD (Uncle Bob)
│   ├── skill-builder              # Forjador de Agent Skills sob a Regra dos 3X
│   └── premium-ui-landing-page    # Design System e landing pages de alta conversão
│
├── 📁 docs/                         # Documentação e Tutoriais Oficiais
│   └── tutoriais/                 # Trilha de onboarding passo a passo
│       ├── 01_instalacao_e_setup_local.md # Setup do zero em 3 minutos
│       ├── 02_conectando_ao_seu_agente.md # Conexão MCP com Claude, Antigravity e Cursor
│       ├── 03_usando_o_squad_de_especialistas.md # Orquestração do squad e prompts
│       └── 04_acesso_remoto_celular_gratuito.md # Acesso 4G/5G com Tailscale
│
├── ☁️ deploy/                       # Templates de Deploy em Produção (Docker Compose + Traefik v3)
│   ├── docker-compose.yml         # Stack completa com Traefik v3 e SSL Let's Encrypt automático
│   ├── .env.example               # Configuração de domínio, portas e senhas seguras
│   └── setup.sh                   # Assistente interativo (Modo Local vs. Modo Nuvem)
│
├── ⚙️ .mcp.json                     # Manifesto de registro MCP portátil (caminho relativo)
├── 📄 .env.example                  # Modelo de variáveis de ambiente configuráveis
├── 📜 Makefile                      # Orquestrador mestre (make build, make run-console, make test)
├── 🔒 LICENSE                       # Licença MIT Oficial
└── 📄 README.md                     # Este documento mestre unificado
```

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="squad"></a>
## 👥 5. O Squad de Copilotos Especialistas

O framework fornece **10 agentes especialistas prontos para uso**. Cada copiloto possui diretrizes rigorosas para atuar dentro do seu domínio técnico, eliminando alucinações e dispersão de escopo:

|    Copiloto     | Stack Principal                       | Foco de Atuação                                                      |
| :-------------: | :------------------------------------ | :------------------------------------------------------------------- |
|   🧠 **Lucy**   | Tech Lead & Orquestradora             | Governança arquitetural, mentoria socrática, P.O. e validação de DoD |
| ☕ **Backend**  | Go 1.22+ • Java 21 • Spring Boot 3    | Microsserviços concorrentes, APIs corporativas, Redis e PostgreSQL   |
| 🅰️ **Frontend** | Angular 21+ • Signals • Standalone    | Interfaces reativas sem zone.js, componentes standalone e UX         |
|    🧪 **QA**    | Playwright • JUnit 5 • Testcontainers | Pirâmide de testes automatizados, testes de carga e confiabilidade   |
|  🛡️ **SecOps**  | DevSecOps • SCA/SAST • CVEs           | Auditoria de dependências, sanitização e blindagem de segurança      |
|  🐧 **SysOps**  | Linux Ubuntu • Docker Swarm • Traefik | Redes overlay, proxy reverso, systemd e infraestrutura               |
|    📊 **BI**    | PostgreSQL • SQL Analítico            | Dashboards operacionais, relatórios executivos e métricas            |
|  💰 **FinOps**  | Cloud FinOps • Multi-Cloud • TCO      | Gestão de custos, auditoria de instâncias e finanças cloud           |
| 🎫 **Suporte**  | N2/N3 • Automação Comercial • SQL     | Sustentação de incidentes, conciliação e dados fiscais               |
| 💼 **Frellas**  | Tech Recruiter • Career-Ops           | Auditoria de currículo ATS, propostas comerciais e contratos PJ      |

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="mcp"></a>
## ⚡ 6. Catálogo do Servidor MCP Nativo (`nexus-mcp`)

O **Nexus MCP Server** implementa o protocolo oficial da Anthropic (_Model Context Protocol_) fornecendo ferramentas seguras diretamente para os agentes:

- 🛡️ `nexus_validar_dod`: Valida os critérios de aceite (_Definition of Done_) de tarefas antes de homologar código.
- 🔍 `nexus_auditar_impacto`: Realiza análise de impacto e dependências cruzadas antes de refatorações críticas.
- 🖥️ `nexus_status_infra`: Audita a saúde dos containers Docker, processos em execução, uso de RAM e portas ativas.
- 🧠 `nexus_consultar_vault`: Consulta o cofre de conhecimento, padrões arquiteturais e lições aprendidas.
- 📊 `nexus_metricas_fluxo`: Coleta métricas de vazão, taxa de conclusão de tarefas e gargalos de desenvolvimento.

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="tutoriais"></a>
## 📚 7. Trilha de Tutoriais Oficiais (Onboarding)

Preparamos uma trilha mastigada passo a passo para você dominar a plataforma em minutos:

- 📖 **[Tutorial 01: Instalação e Setup Local do Zero](docs/tutoriais/01_instalacao_e_setup_local.md)**  
  _Pré-requisitos mínimos, compilação com 1 comando e inicialização do console._
- 🔌 **[Tutorial 02: Conectando o Nexus MCP aos seus Agentes](docs/tutoriais/02_conectando_ao_seu_agente.md)**  
  _Configuração no Claude Code, Antigravity CLI, Cursor IDE e Claude Desktop._
- 👥 **[Tutorial 03: Orquestrando o Squad de Agentes Especialistas](docs/tutoriais/03_usando_o_squad_de_especialistas.md)**  
  _Fluxo de Spec-Driven Development (TDD + Clean Code) e prompts reais prontos._
- 📱 **[Tutorial 04: Acesso Remoto no Celular Fora de Casa (100% Gratuito)](docs/tutoriais/04_acesso_remoto_celular_gratuito.md)**  
  _Como conectar seu celular via 4G/5G com Tailscale ou Cloudflare Tunnel sem abrir portas._
- ☁️ **[Tutorial 05: Deploy na Nuvem & VPS Gratuita (24/7 com SSL Automático)](docs/tutoriais/05_deploy_nuvem_vps_gratuita.md)**  
  _Como hospedar seu console em instâncias Always Free (GCP e2-micro ou OCI) com HTTPS automático._

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="mobile"></a>
## 📱 8. Acesso Remoto pelo Celular (Custo Zero)

Acesse o **Nexus Web Console** no smartphone quando estiver na rua ou viajando:

1. **Instale o Tailscale no PC:** `curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`
2. **Abra no Celular:** Baixe o app Tailscale, ative a conexão e acesse `http://100.x.y.z:8090`.
3. **PWA Instalável:** Toque em _"Adicionar à tela de início"_ no navegador do celular — ele passa a abrir em tela cheia com ícone dedicado como um app nativo de smartphone!

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="quickstart"></a>
## 🚀 9. Quickstart em 3 Minutos

```bash
# 1. Clonar o repositório:
git clone https://github.com/luci-jr/nexus-ecosystem-open.git
cd nexus-ecosystem-open

# 2. Configurar o ambiente (opcional - gera senha forte automática se omitida):
cp .env.example .env
# Defina CONSOLE_PASSWORD=sua-senha (mínimo 12 caracteres) ou deixe vazio para gerar na inicialização.

# Opção A — Executar Localmente (Nativo em Go, < 20MB de RAM, sem Docker):
make build && make run-console

# Opção B — Executar via Docker Compose:
docker compose up --build

# Opção B — Executar com Assistente Dual-Mode (Local ou Nuvem VPS):
./deploy/setup.sh

# Executar os testes automatizados para validar sua máquina:
make test
```

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="licenca"></a>
## 📜 10. Licença Oficial

Distribuído sob a licença **MIT**. Consulte [`LICENSE`](LICENSE) para mais detalhes.

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>

---

<a id="autor"></a>
## 👨‍💻 Desenvolvedor & Arquiteto

<div align="center">

### Lucivaldo Junior

**Engenheiro de Software Back-end & Arquiteto de Sistemas**  
_Belém do Pará — Amazônia, Brasil_

<table border="1">
  <tr>
    <td align="center" width="820">
      <br/>
      <em>“Da disciplina operacional de mais de 15 anos nas cozinhas profissionais para a engenharia de software de alta performance: calma sob pressão, resiliência técnica e foco intransigente em entregar arquiteturas limpas, concorrentes e escaláveis.”</em>
      <br/><br/>
    </td>
  </tr>
</table>

<br>

[![LinkedIn](https://img.shields.io/badge/LINKEDIN-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/lucivaldojr)
&nbsp;&nbsp;
[![GitHub](https://img.shields.io/badge/GITHUB-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/luci-jr)
&nbsp;&nbsp;
[![Portfólio](https://img.shields.io/badge/PORTFÓLIO-D97706?style=for-the-badge&logo=safari&logoColor=white)](https://portifolio.lucivaldo.cloud)

</div>

<p align="right"><a href="#readme-top">▲ Voltar ao topo</a></p>
