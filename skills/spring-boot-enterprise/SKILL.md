---
name: spring-boot-enterprise
description: >-
  Enterprise architectural patterns for Java 21 LTS and Spring Boot 3, including Virtual Threads (Project Loom), Spring Data JPA, immutable Records as DTOs, Bean Validation, Spring Security, structured logging, and automated testing with JUnit 5 and Mockito. Use when designing, creating, or testing Spring Boot applications.
---

# Java 21 LTS & Spring Boot 3 Enterprise Guide

Padrões de desenvolvimento para APIs RESTful escaláveis, seguras e corporativas utilizando o ecossistema moderno Java 21 + Spring Boot 3.

## 1. Padrões Modernos do Java 21 LTS
- **Virtual Threads (Project Loom)**:
  - Habilite Virtual Threads para servidores web com alta taxa de I/O concorrente no `application.yml`:
    ```yaml
    spring:
      threads:
        virtual:
          enabled: true
    ```
- **Records para DTOs**: Use `record` imutável para todos os objetos de transferência de dados (Request/Response DTOs), integrando com `@Valid` e anotações do Jakarta Validation (`@NotBlank`, `@NotNull`, `@Positive`).
- **Pattern Matching & Switch Expressions**: Utilize pattern matching para desestruturação clara e tipada de erros e payloads de domínio.

## 2. Camada de Persistência (Spring Data JPA & PostgreSQL)
- **Lazy Loading Estrito**: Todas as relações `@OneToMany`, `@ManyToOne` e `@ManyToMany` devem declarar explicitamente `fetch = FetchType.LAZY`.
- **Prevenção do Problema N+1**: Utilize `@EntityGraph` ou consultas `JOIN FETCH` customizadas em `@Query` para carregar relacionamentos essenciais em uma única query.
- **DTO Projections**: Para consultas de leitura ou listagens analíticas, use Projections de Records para selecionar apenas as colunas necessárias direto no SQL.

## 3. Arquitetura e Injeção de Dependências
- **Injeção por Construtor**: NUNCA utilize `@Autowired` em campos privados (*field injection*). Declare dependências como `private final` e inicialize via construtor (ou `@RequiredArgsConstructor` do Lombok).
- **Tratamento Global de Erros**: Utilize `@RestControllerAdvice` padronizando respostas de erro com a especificação RFC 7807 (*Problem Details*).

## 4. Testes Automatizados (JUnit 5 + Mockito)
- **Testes Unitários de Serviço**: Isole regras de negócio usando `@ExtendWith(MockitoExtension.class)`, mockando repositórios e clientes HTTP externos.
- **Testes de Integração de Controller**: Use `@WebMvcTest` para validar endpoints, status HTTP e validação de schema de entrada.
- **Asserções Fluentes**: Utilize `AssertJ` (`assertThat(...)`) para mensagens de erro limpas e legíveis.
