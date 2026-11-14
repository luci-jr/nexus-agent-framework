---
name: angular-signals-architect
description: >-
  Architecture and best practices for modern Angular 21/22+ applications, strictly using Standalone Components, reactive state management with Signals (signal, computed, effect), RxJS interoperability (toSignal, toObservable), inject() dependency injection, and clean UI design systems. Use when developing, refactoring, or reviewing Angular front-end code.
---

# Angular 21+ Signals & Modern Architecture

Guia arquitetural para desenvolvimento de aplicações web modernas com Angular 21/22+ no padrão Standalone e reatividade baseada em Signals.

## 1. Filosofia 100% Standalone (Sem NgModules)
- Todos os componentes, diretivas e pipes DEVEM declarar `standalone: true` (padrão no Angular moderno).
- Elimine módulos legados (`@NgModule`). Importe apenas o que o componente realmente consome em seu array `imports: [...]`.
- Carregamento sob demanda (*Lazy Loading*) via rotas configuradas com `loadComponent`:
  ```typescript
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
  }
  ```

## 2. Reatividade Nativa com Signals
- **Estado Primário**: Declare propriedades de estado reativo com `signal()`:
  ```typescript
  readonly itens = signal<Item[]>([]);
  readonly carregando = signal<boolean>(false);
  ```
- **Valores Derivados**: Utilize `computed()` para transformações síncronas puras e automáticas:
  ```typescript
  readonly total = computed(() => this.itens().reduce((acc, i) => acc + i.valor, 0));
  ```
- **Efeitos Colaterais Controlados**: Use `effect()` apenas para logs, sincronização com APIs do navegador (LocalStorage) ou integrações externas que não produzem estado reativo direto.

## 3. Injeção de Dependências com `inject()`
- Substitua injeções no construtor pela função tipada `inject()`:
  ```typescript
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  ```

## 4. Interoperabilidade Signals & RxJS
- Use `toSignal()` para converter Observables do `HttpClient` em Signals reativos consumíveis diretamente no template com controle de valor inicial:
  ```typescript
  readonly dados = toSignal(this.servico.buscarDados(), { initialValue: [] });
  ```
- Utilize `toObservable()` quando precisar aplicar operadores de tempo ou debounce do RxJS (`debounceTime`, `distinctUntilChanged`).
