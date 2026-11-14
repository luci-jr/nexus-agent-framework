---
name: go-concurrency-patterns
description: >-
  Best practices and engineering patterns for Go 1.22+, high-concurrency microservices, Standard Go Project Layout (cmd/ and internal/), goroutines and channels management, context lifecycle, pessimistic locking, Uber Fx dependency injection, and zero-allocation memory optimization. Use when writing, debugging, or reviewing Go code.
---

# Go Concurrency & Performance Engineering (Go 1.22+)

Guia de engenharia e runbook para construção de microsserviços e sistemas de alta performance em Go no ecossistema Nexus.

## 1. Estrutura Padrão de Projeto (Standard Go Layout)
- **`cmd/<app>/main.go`**: Ponto de entrada mínimo. Responsável exclusivamente por bootstrap, injeção de dependências e captura de sinais do SO (`os.Interrupt`, `syscall.SIGTERM`).
- **`internal/`**: Código de aplicação privado, desacoplado em pacotes de responsabilidade única:
  - `internal/config/`: Leitura estrita de variáveis de ambiente com validação de inicialização.
  - `internal/domain/`: Entidades de negócio e contratos de interfaces (sem dependências externas).
  - `internal/service/` ou `usecase/`: Orquestração de regras de negócio.
  - `internal/repository/`: Acesso a banco de dados (PostgreSQL, Redis).
  - `internal/handler/` ou `transport/`: Controladores HTTP, gRPC ou consumers SQS/AMQP.
- **`pkg/`**: Bibliotecas utilitárias reutilizáveis por aplicações externas (usar com parcimônia).

## 2. Padrões de Concorrência & Lifecycle
- **Context Obrigatório**: Toda função com I/O de rede ou banco DEVE receber `ctx context.Context` como primeiro parâmetro.
  ```go
  ctx, cancel := context.WithTimeout(parentCtx, 5*time.Second)
  defer cancel()
  ```
- **Goroutines com Lifecycle Controlado**:
  - NUNCA lance goroutines de forma "fire-and-forget" sem mecanismo de agregação de erro ou encerramento (`sync.WaitGroup` ou `golang.org/x/sync/errgroup`).
  - Garanta encerramento gracioso (*graceful shutdown*) monitorando canais `ctx.Done()`.
- **Canais (Channels)**:
  - Use canais com buffer dimensionado para desacoplamento de produtores/consumidores sem vazamento de memória.
  - O proprietário do canal (*producer*) é o único responsável por fechar o canal (`close(ch)`).

## 3. Otimização de Memória & Zero-Allocation
- **Reutilização de Slices**: Em loops intensivos de I/O, utilize `slice = slice[:0]` para reaproveitar a capacidade alocada sem gerar lixo para o Garbage Collector.
- **Evitar Escape para o Heap**: Evite boxing em interfaces (`interface{}` / `any`) dentro de *hot paths*. Mantenha structs por valor quando pequenos (<= 64 bytes) e ponteiros quando mutáveis ou pesados.
- **Sync.Pool**: Utilize `sync.Pool` para buffers de bytes (`bytes.Buffer`) reutilizáveis em serialização JSON/Protobuf.

## 4. Transações Concorrentes & Locks Pessimistas
- Ao operar com saldos ou recursos concorrentes com PostgreSQL:
  - Use blocos transacionais explícitos `BEGIN ... COMMIT/ROLLBACK`.
  - Aplique locks a nível de linha: `SELECT ... FROM carteira WHERE id = $1 FOR UPDATE`.
  - Mantenha transações curtas (< 50ms) para evitar contenção de pool de conexões.
