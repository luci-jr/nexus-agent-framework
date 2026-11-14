---
name: postgres-data-engineering
description: >-
  Advanced PostgreSQL (16/18) data engineering runbook covering transactional concurrency, pessimistic locks (SELECT FOR UPDATE), immutable audit triggers, query optimization (EXPLAIN ANALYZE), index tuning, Prisma ORM introspection, and schema migration governance. Use when designing databases, writing complex SQL, or tuning database performance.
---

# PostgreSQL Advanced Data Engineering & Concurrency (16/18)

Runbook para modelagem relacional de alta confiabilidade, consistência ACID e otimização de banco de dados no PostgreSQL.

## 1. Concorrência & Proteção Anti-Race Condition
- **Locks Pessimistas a Nível de Linha**:
  - Para saldos, inventários ou liquidação financeira concorrente:
    ```sql
    SELECT id, saldo FROM contas WHERE id = $1 FOR UPDATE;
    ```
  - Evite contenção usando `FOR UPDATE SKIP LOCKED` para filas de tarefas ou workers concorrentes.
- **Isolamento Transacional**:
  - Use `READ COMMITTED` como padrão; eleve para `REPEATABLE READ` ou `SERIALIZABLE` apenas quando inconsistências de leitura fantasma (*phantom reads*) forem inaceitáveis.

## 2. Auditoria Imutável via Triggers
- Registre eventos críticos de negócio (transações financeiras, alterações contratuais) em tabelas de log imutáveis:
  ```sql
  CREATE OR REPLACE FUNCTION bloquear_modificacao_auditoria()
  RETURNS TRIGGER AS $$
  BEGIN
    RAISE EXCEPTION 'Registros de auditoria são imutáveis e não podem ser alterados ou deletados!';
  END;
  $$ LANGUAGE plpgsql;
  ```

## 3. Otimização de Consultas & Indexação
- **Diagnóstico com EXPLAIN ANALYZE**:
  - Sempre execute `EXPLAIN (ANALYZE, BUFFERS)` antes de colocar uma query analítica em produção.
  - Verifique `Seq Scan` em tabelas grandes e converta para `Index Scan` ou `Bitmap Index Scan`.
- **Estratégias de Índices**:
  - **Índices Compostos**: Respeite a regra do prefixo mais à esquerda (*leftmost prefix*). Coloque colunas de igualdade antes de colunas de intervalo/faixa.
  - **Índices Parciais**: Utilize `WHERE ativo = true` ou `WHERE status != 'concluido'` para economizar espaço e buffer pool na RAM.

## 4. Governança com Prisma ORM e Ferramentas Nativas
- Ao trabalhar com Prisma ORM (`schema.prisma`):
  - Priorize migrations declarativas via `prisma migrate dev` em desenvolvimento e `prisma migrate deploy` em pipelines CI/CD.
  - Utilize `prisma db pull` para introspecção segura de bancos legados ou criados via SQL nativo.
