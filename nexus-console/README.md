# 🌌 Nexus Web Console (Go Nativo)

> **Dashboard Web de Governança, Rastreamento Contínuo e Monitoramento do Squad Nexus.**
> Desenvolvido em Go 1.22+ puro com assets estáticos embutidos via `//go:embed`.

---

## 🏛️ 1. Princípios Arquiteturais (ADR 0006)

* **Homogeneidade em Go:** Zero dependências de Node.js, npm, Python ou C++.
* **Consumo Mínimo de Recursos:** Alocação de memória inferior a 15 MB de RAM (<1MB de heap ativa).
* **Binário Único & Auto-Contido:** O frontend (Tailwind CSS via CDN, Lucide Icons e Single Page App em Vanilla JS) é compilado diretamente dentro do binário ELF de ~6MB.
* **Governança Direta de Markdown:** Lê e renderiza nativamente `tasks/todo.md`, `tasks/lessons.md` e `docs/adrs/`.

---

## 🚀 2. Como Executar

### Localmente
```bash
cd nexus-console
make run
# Acesse http://localhost:8090
```

### Via Docker / Swarm
```bash
make docker-build
# Deploy via stack Swarm: iac/stacks/09_nexus-console.yaml
```

---

## 📡 3. Endpoints da API

* `GET /health`: Healthcheck do serviço.
* `GET /api/status`: Métricas de runtime Go, memória e status dos serviços e copilotos.
* `GET /api/tasks`: Lista estruturada das tarefas de `tasks/todo.md` (Em Andamento, Backlog, Concluídas).
* `GET /api/lessons`: Lições aprendidas e padrões fixados de `tasks/lessons.md`.
* `GET /api/adrs`: Índice de Architecture Decision Records de `docs/adrs/`.
* `GET /api/adrs/{filename}`: Conteúdo integral em Markdown de uma ADR.
