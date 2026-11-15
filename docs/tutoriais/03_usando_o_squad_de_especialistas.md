# 👥 Tutorial 03: Orquestrando o Squad de Agentes Especialistas

O **Nexus Ecosystem (Open Source Edition)** não é apenas um chatbot genérico: ele opera com um **Squad de 10 Copilotos Especialistas**, cada um treinado com diretrizes rigorosas de engenharia de software sênior.

Neste guia, você aprenderá como acionar cada especialista e como orquestrar o fluxo de desenvolvimento orientado a especificações (*Spec-Driven Development*).

---

## 🏛️ A Matriz de Especialistas do Squad

```text
+--------------------------------------------------------------------------+
|                       Lucy (Orquestradora & Tech Lead)                   |
+--------------------------------------------------------------------------+
       |             |             |             |             |
       v             v             v             v             v
  [☕ Backend]   [🅰️ Frontend]   [🧪 QA]    [🛡️ SecOps]   [🐧 SysOps]
   Go & Java     Angular Signals  Testes     SCA / SAST    Docker Swarm
       |             |             |             |             |
       v             v             v             v             v
  [📊 BI]       [💰 FinOps]   [🎫 Suporte] [💼 Frellas]  [🌐 Webmaster]
   SQL & Dados   Cloud TCO     N2/N3 ERPs   Carreira/ATS  WordPress/CMS
```

---

## 🎯 Quando acionar cada Copiloto

| Copiloto | Stack Principal | Quando Acionar |
| :--- | :--- | :--- |
| **☕ Backend** | Go 1.22+ • Java 21 • Spring Boot 3 | APIs REST, concorrência, canais, banco de dados e regras de negócio críticas. |
| **🅰️ Frontend** | Angular 21+ • Signals • TypeScript | Interfaces reativas, componentes standalone, tailwind e design systems. |
| **🧪 QA** | Playwright • JUnit 5 • Testcontainers | Criação de testes unitários, testes de integração e matrizes de teste negativo. |
| **🛡️ SecOps** | DevSecOps • SCA/SAST • Trivy | Auditoria de dependências, sanitização de credenciais e proteção contra CVEs. |
| **🐧 SysOps** | Linux Ubuntu • Docker Swarm • Traefik | Deploy contínuo, redes overlay, proxy reverso, systemd e otimização de SO. |
| **📊 BI** | PostgreSQL • SQL Analítico • Metabase | Consultas SQL de alta performance, relatórios executivos e modelagem analítica. |
| **💰 FinOps** | Multi-Cloud • AWS • OCI • Hetzner | Análise de custos de infraestrutura, cálculo de TCO e dimensionamento de instâncias. |
| **🎫 Suporte** | N2/N3 • Automação Comercial • SQL | Sustentação de incidentes, conciliação de dados fiscais e troubleshooting. |
| **🌐 Webmaster** | WordPress • WooCommerce • Landing Pages | Criação de páginas de alta conversão, e-commerce e integrações web. |
| **💼 Frellas** | Career-Ops • Análise de Vagas • Pitch | Avaliação de propostas comerciais, otimização de currículo ATS e contratos PJ. |

---

## 🔄 O Fluxo de Engenharia: Spec-Driven Development

Para evitar desperdício de tempo e código mal planejado (*scope drift*), o Nexus adota o ciclo formal de engenharia em 5 etapas:

```text
[1. Alinhamento Socrático] ──> [2. Especificação & DoD] ──> [3. TDD (Testes Primeiro)]
                                                                    │
[5. Homologação & Entrega] <── [4. Implementação Estrita] <─────────┘
```

### 1. Alinhamento Socrático (Grilling)
Antes de escrever código em tarefas complexas, o Tech Lead faz as perguntas difíceis para fechar brechas de regras de negócio, limites de concorrência e tipos de dados.

### 2. Definição de Critérios de Aceite (DoD)
São delimitados exatamente os critérios que definem o que é uma entrega pronta, evitando excesso de escopo.

### 3. TDD Estrito (Modo Uncle Bob / Clean Code)
Os testes unitários ou de integração são escritos antes do código de produção. O teste deve falhar inicialmente comprovando o comportamento esperado (*Red*).

### 4. Implementação Mínima Necessária
O código de produção é implementado de forma limpa, modular e com responsabilidade única até os testes passarem (*Green*).

### 5. Revisão de Código (Code Review)
Auditoria final de segurança (SecOps) e qualidade (QA) antes do commit.

---

## 💬 Exemplos de Prompts para Usar no Dia a Dia

### Acionando o Especialista Backend:
> *"Atue como o copiloto Backend: implemente um worker concorrente em Go 1.22 que processe uma fila de pagamentos com limite de 10 goroutines e cancelamento gracioso via context.Context."*

### Acionando o Especialista Frontend:
> *"Atue como o copiloto Frontend: crie um componente standalone em Angular 21 utilizando Signals e computeds para filtrar uma lista de produtos em tempo real sem recarregar a página."*

### Acionando o Especialista QA:
> *"Atue como o copiloto QA: escreva uma suíte de testes unitários e de mutação para a função de cálculo de desconto, cobrindo valores negativos e limites de borda."*

