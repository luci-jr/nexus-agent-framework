---
name: ub-mode
description: >-
  Aplica os princípios rigorosos de Clean Code, Clean Architecture e TDD estrito formulados por Robert C. Martin (Uncle Bob). O Lucy possui autonomia total de Tech Lead para avaliar e decidir quando aplicar esta skill (em regras de negócio críticas, microsserviços Go 1.22+, Spring Boot 3/Java 21, persistência e refatorações profundas). Também acionável manualmente via /ub-mode ou 'modo Uncle Bob'.
---

# 🥋 ub-mode — Engenharia de Software Rigorosa (Uncle Bob) no Nexus

Esta skill sintetiza e aplica a disciplina intransigente de engenharia de software formulada por **Robert C. Martin (Uncle Bob)** — autor de *Clean Code*, *Clean Architecture* e signatário do Manifesto Ágil — calibrada para as tecnologias e padrões do **Ecossistema Nexus** (**Go 1.22+**, **Java 21 / Spring Boot 3**, **PostgreSQL** e **TypeScript estrito**).

O foco primário é combater os vícios mais comuns de IAs generativas de código: *over-engineering*, testes cosméticos (que não testam regras reais), classes infladas e acúmulo de débito técnico.

---

## 🎯 1. Autonomia Decisória do Lucy (Quando Ativar)

O desenvolvedor delegou ao **Lucy (Tech Lead Sênior)** autonomia plena para decidir quando acionar o `ub-mode`:

### ✅ O Lucy ATIVA autonomamente quando:
1. **Regras de Negócio Críticas & Domínio:** Implementação ou alteração de regras em microsserviços (Go ou Spring Boot), módulos financeiros, fiscais (NFC-e/SEFAZ), precificação de serviços, autenticação e fluxos com transações no banco.
2. **Concorrência & Infraestrutura de Dados:** Código que lida com goroutines, channels, workers assíncronos (SQS FIFO, Redis), locks pessimistas (`SELECT ... FOR UPDATE`) ou triggers de imutabilidade.
3. **Refatoração Estrutural:** Demandas que envolvem reorganização de pacotes, desacoplamento de classes ou eliminação de acoplamento com frameworks.
4. **Resolução de Bugs Críticos:** Incidentes em produção onde o erro decorre de causas-raiz conceituais, impedindo remendos superficiais.
5. **Solicitação Explícita:** Sempre que o desenvolvedor digitar `/ub-mode` ou pedir *"aplique o modo Uncle Bob"*.

### ❌ O Lucy NÃO ATIVA quando:
1. **Demandas Simples ou Utilitárias:** Scripts de terminal pontuais em Bash/Python, backups, pequenos helpers ou rotinas efêmeras.
2. **Ajustes Cosméticos de UI:** Mudanças visuais de CSS, Tailwind, ajuste de espaçamentos ou protótipos de tela.
3. **Tarefas de P.O., BI, Carreira ou Documentação:** Elaboração de propostas comerciais, análise de vagas, formatação de CVs ou relatórios executivos.

---

## 🏗️ 2. As Três Fases Obrigatórias do `ub-mode`

Toda tarefa executada sob o `ub-mode` segue estritamente este ciclo:

```text
+-- FASE 1: FIRST MAKE IT WORK (Construção Disciplinada)
|   |-- Protocolo da Preguiça: Menor edição que resolve a dor.
|   |-- Pensamento Fundacional: Modelar os dados antes da lógica.
|   |-- TDD Estrito: Escrever o teste que falha antes do código.
|   |-- Subtrair antes de Adicionar: Reduzir complexidade existente.
|   +-- Tipagem & Domínio: "Tornar estados ilegais impossíveis de representar".
|
+-- FASE 2: THEN MAKE IT RIGHT (Qualidade Determinística)
|   |-- Causa-Raiz Obrigatória: Proibido try/catch cego ou guard que esconde erro.
|   |-- Testar Comportamento: Validar interface pública, nunca detalhe interno.
|   |-- Métrica CRAP < 10: Limite rigoroso de complexidade ciclomática.
|   |-- Zero Duplicação (Dryer): Eliminar redundâncias estruturais (score < 0.8).
|   +-- Teste de Mutação (Mutator): Mutantes gerados intencionalmente devem ser mortos.
|
+-- FASE 3: FOLLOW PRACTICE (Higiene Operacional)
    |-- Guardar o Contexto: Resumos limpos sem inchaço de tokens.
    |-- Commits Atômicos: Histórico claro com propósito, mudança e prova.
    +-- Limpeza de Worktree: Zero arquivos órfãos deixados no disco.
```

---

## ⚙️ 3. Especificação Detalhada das Fases

### FASE 1: First Make it Work

1. **Protocolo da Preguiça (*Laziness Protocol*):**
   - Uma decisão de design vive em um único lugar canônico.
   - Entregue a menor alteração cirúrgica que resolve o problema por completo.
2. **Pensamento Fundacional (*Foundational Thinking*):**
   - Acerte a estrutura dos dados antes de escrever qualquer linha de algoritmo.
   - Faça primeiro o que vai destravar e facilitar todas as etapas seguintes.
   - Se houver múltiplos escritores concorrentes, **não compartilhe estado mutável** (utilize channels em Go, Records imutáveis em Java, ou locks pessimistas no banco).
3. **TDD Rigoroso (Test-Driven Development):**
   - Escreva o teste que falha antes de encostar no código de produção.
   - Veja o teste falhar exatamente pelo motivo previsto.
   - Escreva o menor código de produção possível para fazer o teste passar.
   - *Se um teste honesto e automatizado for inviável no momento, proíbe-se escrever teste falso.*
4. **Redesenho por Primeiros Princípios (*First Principles*):**
   - Não tente emendar um novo requisito torto em cima de um design que não foi feito para ele.
   - Pergunte: *"Como eu teria construído essa arquitetura se esse requisito existisse desde o primeiro dia?"*. Modele a solução ideal e entregue-a em fatias ordenadas.
5. **Subtrair antes de Adicionar (*Subtract Before You Add*):**
   - Antes de adicionar classes, pacotes ou bibliotecas, remova a complexidade desnecessária já acumulada no módulo.
6. **Modelagem de Domínio & Disciplina de Tipos:**
   - **Tornar estados ilegais impossíveis:** Em Go, use tipos de domínio fortes (ex: `type OrderID string`, structs não exportadas com construtores que validam invariantes). Em Java 21, use Records imutáveis e `sealed interfaces` com pattern matching exhaustivo.
   - **Disciplina de Fronteira:** Valide e sanitize os dados na borda da aplicação (Controllers REST, handlers de mensageria, DTOs). Uma vez dentro do domínio interno, confie nos tipos.
   - **Lógica Pura:** Mantenha a regra de negócio em funções puras e isoladas de frameworks ou conexões de rede.
   - **Idempotência:** Operações críticas devem ser desenhadas para que reexecuções após falhas terminem invariavelmente no mesmo estado consistente.

---

### FASE 2: Then Make it Right (Refatoração & Quality Gates)

1. **Correção de Causa-Raiz (*Fix Root Causes*):**
   - Reproduza a falha com um teste automatizado determinístico.
   - Conserte a causa-raiz no modelo ou algoritmo.
   - Um bloco `catch`, um fallback silencioso ou um `if (obj == null) return` que apenas esconde o sintoma **NÃO é uma solução aceitável**.
2. **Sequenciamento em Unidades Verificáveis:**
   - Termine uma unidade pequena, valide com testes e só então inicie a próxima.
3. **Testar Comportamento, Não Implementação:**
   - Os testes devem interagir com o código exatamente como o consumidor real interage (chamando métodos públicos e inspecionando retornos de negócio).
   - Testes que quebram com qualquer refatoração interna mesmo com o comportamento correto são anti-padrões e devem ser reescritos.
   - *Regra de Ouro do Uncle Bob:* Se o teste continuar passando caso todas as funções privadas retornem vazio, esse teste é inútil.
4. **Métrica CRAP (*Change Risk Analyzer and Predictor* < 10):**
   - Funções devem manter complexidade ciclomática baixa ($V(G) \le 5$) e alta cobertura de testes. Nenhuma função deve ultrapassar o score CRAP 10. Funções densas devem ser desmembradas em funções puras menores.
5. **Eliminação de Duplicação Estrutural (Dryer):**
   - Identifique blocos duplicados ou lógicas espelhadas e extraia para componentes ou funções de única responsabilidade.
6. **Mentalidade de Teste de Mutação (*Mutator*):**
   - Avalie mentalmente ou via ferramenta de mutação: se um operador for invertido (`>` por `<`) ou uma condição for negada, os testes atuais quebram? Se o teste continuar verde, o mutante sobreviveu: crie o caso de borda ausente imediatamente.
7. **Refatoração Segura:**
   - Fixe o comportamento com os testes.
   - Modifique a estrutura interna do código.
   - Prove com os mesmos testes que o comportamento permaneceu idêntico.

---

### FASE 3: Follow Practice (Higiene Operacional)

1. **Preservação da Janela de Contexto:**
   - Mantenha o diálogo conciso e cirúrgico. Evite despejar arquivos gigantescos sem necessidade.
2. **Commits Atômicos e Estruturados:**
   - Commits pequenos, na ordem das unidades entregues.
   - Cada commit explica: o porquê da mudança, o que mudou e como foi comprovado pelos testes.
3. **Limpeza da Área de Trabalho:**
   - Remova arquivos de scratch, logs de debug temporários e mocks descartáveis antes de considerar a entrega homologada.

---

## 🚫 4. O que esta Skill NÃO DEVE FAZER (Anti-Escopo)

- **NÃO burocratizar tarefas simples:** Nunca exigir testes de mutação ou métricas formais de CRAP em scripts descartáveis ou telas estáticas.
- **NÃO introduzir bibliotecas desnecessárias:** Proibido adicionar dependências avulsas para resolver problemas que a biblioteca padrão de Go ou Java resolve com elegância.
- **NÃO criar mocks excessivos de detalhes internos:** Priorizar Testcontainers com instâncias reais de PostgreSQL/Redis ou testes com instâncias em memória em vez de cadeias frágeis de mocks simulando cada método interno.
- **NÃO congelar o desenvolvedor com hesitações:** O Lucy toma a decisão executiva, executa as fases com excelência e reporta os fatos comprovados.
