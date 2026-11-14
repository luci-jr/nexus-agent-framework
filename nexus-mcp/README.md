# ⚡ Servidor MCP Nexus (v3.1.0) — Servidor Privado de Alta Performance em Go

<div align="center">

![Go Version](https://img.shields.io/badge/Go-1.22%2B-blue?style=for-the-badge&logo=go&logoColor=white)
![Protocol](https://img.shields.io/badge/Protocol-MCP%20v3.0-8A2BE2?style=for-the-badge)
![Architecture](https://img.shields.io/badge/Architecture-Standard%20Go%20Layout-blue?style=for-the-badge)
![Binary](https://img.shields.io/badge/Binary-6.1%20MB%20%7C%20Static%20ELF-brightgreen?style=for-the-badge)
![OS](https://img.shields.io/badge/OS-Linux%20Ubuntu-E95420?style=for-the-badge&logo=ubuntu&logoColor=white)
![Developer](https://img.shields.io/badge/Desenvolvedor-Lucivaldo%20Junior-181717?style=for-the-badge&logo=github&logoColor=white)

</div>

---

## 📌 1. Visão Geral da Versão 3.1.0

O **Servidor MCP Nexus** é o núcleo de integração do ecossistema, implementando o **Model Context Protocol (MCP)** em Go para prover ferramentas, recursos e templates de prompts diretamente ao Antigravity CLI (`agy`), Gemini e IDEs.

A versão **3.1.0** expande a engine com:
1. **18 Ferramentas de Sistema, 3 Recursos e 3 Prompts:** Implementação completa e robusta do protocolo MCP.
2. **Governança de Architecture Decision Records (ADRs):** Ferramentas nativas `nexus_listar_adrs` e `nexus_gerar_adr` no padrão Michael Nygard (`docs/adrs/`).
3. **Router System One (Laya Engine):** Triagem de intenção em milissegundos (<0.2ms nativo em Go / <1ms via Laya HTTP) direcionando ao squad a partir de `agentes/perfis_roteamento.json`.
4. **Auditoria de Impacto em Grafo:** Análise de topologia de arquivos e scripts para detecção de raio de impacto e prevenção de quebras.
5. **Engenharia Reversa Visual de UI:** Decomposição estruturada de interfaces e scaffolding de componentes Angular 21 Standalone.
6. **Gestão de Estado de Tarefas:** Snapshots atômicos de progresso (`os.CreateTemp` + `os.Rename`) com barreira de segredos e métricas de fluxo.
7. **Cache Thread-Safe em RAM:** Leituras ultrarrápidas (<0.1ms) com `sync.RWMutex` e invalidação automática baseada em `ModTime`.
8. **Telemetria de Hardware em Tempo Real:** Monitoramento direto de CPU Load, RAM, SSDs, GPU NVIDIA RTX 4050 e rede.

---

## 🏛️ 2. Arquitetura do Código-Fonte

```text
nexus-mcp/
├── go.mod                     # Módulo Go e dependência do mcp-go v1.1.1
├── go.sum                     # Checksums criptográficos
├── main.go                    # Ponto de entrada: registro de 16 tools, resources e prompts
├── Makefile                   # Build, testes e automações
├── README.md                  # Este manual oficial
├── nexus-mcp                  # Binário executável otimizado (-ldflags="-s -w")
└── internal/
    ├── config/                # Resolução dinâmica de caminhos (agentes, relatórios, CVs)
    │   ├── paths.go
    │   └── paths_test.go
    ├── prompts/               # Templates oficiais de prompts MCP
    │   └── prompts.go         # mentoria_tecnica, analise_vaga_perf, code_review_senior
    ├── resources/             # Recursos nativos do protocolo (nexus://)
    │   └── resources.go       # nexus://memoria, nexus://perfil, nexus://seguranca
    └── tools/                 # 18 Ferramentas executáveis
        ├── adr.go             # nexus_listar_adrs e nexus_gerar_adr (Governança de ADRs)
        ├── cache.go           # FileCache com sync.RWMutex e auto-invalidação
        ├── memoria.go         # nexus_obter_memoria, nexus_buscar_memoria, nexus_registrar_aprendizado
        ├── sistema.go         # nexus_status_sistema (hardware real) e nexus_status_infra
        ├── sistema_unix.go    # Telemetria nativa Linux (Ubuntu)
        ├── sistema_windows.go # Telemetria nativa Windows 11+
        ├── carreira.go        # nexus_listar_cvs e nexus_analisar_fit_vaga (Framework PERF)
        ├── relatorios.go      # nexus_salvar_relatorio (9 tipos de copiloto)
        ├── referencias.go     # nexus_consultar_referencia (anti-path traversal)
        ├── backup.go          # nexus_executar_backup
        ├── estado_tarefa.go   # nexus_obter_estado_tarefa, nexus_salvar_estado_tarefa, nexus_metricas_fluxo
        ├── intencao.go        # nexus_rotear_intencao (System One com Laya e perfis_roteamento.json)
        ├── grafo.go           # nexus_auditar_impacto (grafo topológico e raio de impacto)
        ├── visao_ui.go        # nexus_engenharia_reversa_ui (scaffold de componentes Angular 21)
        └── tools_test.go      # Suíte de testes unitários automatizados
```

---

## 📅 Linha do Tempo das Versões

| Versão | Lançamento | Ferramentas | Arquivo / Snapshot | Destaques Técnicos |
| :--- | :--- | :--- | :--- | :--- |
| **v1.0.0** | 13/09/2026 | 5 Tools | `nexus-mcp-v1.0.zip` | Primeiro servidor stdio em Go; leitura de memória e backup. |
| **v2.0.0** | 26/09/2026 | 10 Tools | `nexus-mcp-v2.0.zip` | Cache em RAM (<0.1ms), telemetria de hardware RTX 4050, Framework PERF. |
| **v3.0.0** | 13/10/2026 | 16 Tools | `nexus-mcp/` (ativo) | Router System One (Jev/Laya), Grafo GNN, Visão UI e Estado de Tarefas. |
| **v3.1.0** | 30/10/2026 | 18 Tools | `nexus-mcp/` (atual) | Governança de ADRs (`adr.go`), conformidade SAST gosec estrita e SSE/HTTP ready. |

## 🛠️ 3. Catálogo de Ferramentas (18 Tools)

| Ferramenta | Descrição |
| :--- | :--- |
| `nexus_obter_memoria` | Lê a memória com filtro opcional de seção (`secao`) ou quantidade de itens recentes (`ultimos_itens`). |
| `nexus_buscar_memoria` | Busca textual cirúrgica em toda a memória persistente retornando apenas trechos com contexto relevante. |
| `nexus_registrar_aprendizado` | Registra novas decisões com barreira anti-poisoning (1.000 caracteres) e sanitização. |
| `nexus_status_sistema` | Telemetria completa em tempo real: RAM livre/usada, CPU Load, SSDs, GPU NVIDIA RTX 4050 e rede. |
| `nexus_status_infra` | Diagnóstico de containers Docker (com dica para `nexus_status_sistema`). |
| `nexus_analisar_fit_vaga` | Cruza descrição de vagas tech com o perfil real via Framework PERF e calcula score de compatibilidade. |
| `nexus_listar_cvs` | Inspeciona `~/Documentos/cv-lucivaldo/` e lista versões em PDF, tamanhos e datas. |
| `nexus_salvar_relatorio` | Salva atas e relatórios padronizados em `~/Documentos/nexus/relatorios/<tipo>/YYYY-MM-DD_<slug>.md`. |
| `nexus_consultar_referencia` | Consulta a base de referências corporativas com proteção estrita contra *path traversal*. |
| `nexus_executar_backup` | Dispara o espelho no Google Drive após confirmação explícita das exclusões de itens obsoletos no destino. |
| `nexus_obter_estado_tarefa` | Recupera o estado compacto de uma tarefa antes da retomada ou delegação. |
| `nexus_salvar_estado_tarefa` | Atualiza uma tarefa, cria snapshot automático da versão anterior e bloqueia segredos. |
| `nexus_metricas_fluxo` | Resume tarefas ativas, snapshots, contexto informado e reaberturas. |
| `nexus_rotear_intencao` | Classificador 'System One' (estilo Jev) para triagem rápida em milissegundos e direcionamento ao squad. |
| `nexus_auditar_impacto` | Grafo de dependências topológicas (estilo GNN) para auditoria anti-regressão de arquivos e scripts. |
| `nexus_engenharia_reversa_ui` | Engenharia reversa visual (estilo Vision Models) para geração de componentes Angular 21 Standalone. |
| `nexus_listar_adrs` | Lista todos os Architecture Decision Records (ADRs) oficiais com status e data. |
| `nexus_gerar_adr` | Gera e registra um novo Architecture Decision Record (ADR) padronizado no diretório `nexus/docs/adrs/`. |

---

## 📦 4. Recursos Nativos (MCP Resources)

Os clientes MCP compatíveis podem assinar e consumir dados estáticos diretamente via URIs:
- `nexus://memoria`: Conteúdo completo da memória contínua do Lucy.
- `nexus://perfil`: Perfil profissional, stacks e senioridade do desenvolvedor.
- `nexus://seguranca`: Políticas mandatórias de sigilo e operações em disco.

---

## 💬 5. Prompts Padronizados (MCP Prompts)

- `mentoria_tecnica`: Dispara mentoria no método socrático (`[CONCEITO]`, `[SNIPPET]`, `[ONDE APLICA]`, `[DESAFIO]`).
- `analise_vaga_perf`: Dispara auditoria de vaga e estratégia de abordagem para o copiloto `frellas`.
- `code_review_senior`: Dispara análise de Clean Code, alocações de memória e concorrência.

---

## 🧪 6. Testes & Compilação

Para rodar a suíte completa de testes unitários:
```bash
make test
```

Para compilar o binário oficial otimizado:
```bash
make build
```
