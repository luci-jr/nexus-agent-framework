# 🌌 Nexus Console

Console imersivo de observabilidade tridimensional e telemetria neural de microsserviços. O **Nexus Console** combina computação gráfica em WebGL (Three.js e 3D Force-Graph) com streaming de eventos em tempo real para transformar a infraestrutura de containers Docker e nós distribuídos em uma **galáxia viva e bioelétrica**.

---

## 🧭 O Que É o Projeto?

O **Nexus Console** é uma interface de engenharia de software e observabilidade distribuída concebida para substituir painéis estáticos e tabelas monótonas por uma **metáfora cósmica-neural**:

* Cada **container ou microsserviço** é representado como uma **estrela** orbitando no espaço cósmico. O brilho, tamanho e cor da estrela refletem imediatamente a saúde operacional do serviço (*Running*, *Degraded* ou *Error*).
* Cada **comunicação entre serviços** (HTTP/2, gRPC, AMQP, SQL, Redis) é renderizada como uma **sinapse bioelétrica** com descargas dinâmicas de raios, faíscas e partículas cujo fluxo e velocidade são proporcionais à taxa de requisições por segundo (RPS).
* O cenário de fundo é uma **galáxia espiral procedural completa** (com bojo central denso, 6.500 estrelas em braços espirais logarítmicos, nebulosas de gás ionizado H-II/O-III e um halo esférico de espaço profundo com 2.800 estrelas).

O projeto é construído em uma arquitetura modularizada em pastas (`css/`, `js/`), facilitando a manutenção, escalabilidade e integração contínua.

---

## 📁 Estrutura de Pastas e Arquivos

```
nexus-console/
├── index.html              # Ponto de entrada HTML e montagem do DOM
├── css/
│   └── style.css           # Design System Cyberpunk, HUD, Drawer e animações
├── js/
│   ├── config.js           # Constantes, endpoints de telemetria, nós e conexões padrão
│   ├── audio.js            # Motor de áudio espacial procedural (Web Audio API)
│   ├── textures.js         # Gerador procedural Three.js (sprites estelares, halos, raios)
│   ├── galaxy.js           # Cenário cósmico 3D (braços de Bernoulli, nebulosas, iluminação)
│   ├── telemetry.js        # Engine WebSockets, streaming de logs e comandos REST do Docker
│   ├── graph.js            # Instância 3D Force-Graph, física D3, nós estelares e sinapses
│   └── app.js              # Controlador principal da UI, busca rápida e event listeners
└── README.md               # Documentação técnica de arquitetura e operação
```

---

## 🎯 Pra Que Serve? (Casos de Uso)

### 1. Centro de Comando de Operações (NOC / War Room)
Monitore a integridade de clusters (Docker Swarm, Kubernetes ou Docker Standalone) em telas grandes de operações. Em caso de falha ou degradação em qualquer container, a estrela correspondente transiciona visualmente para âmbar ou vermelho pulsante, disparando ondas de choque visuais perceptíveis instantaneamente pelo time de engenharia.

### 2. Inspeção Dinâmica e Diagnóstico Rápido de Falhas
Ao clicar em qualquer estrela da galáxia, uma gaveta lateral (*Drawer*) de alta fidelidade é acionada:
* **Telemetria de Sistema:** Uso de CPU, Memória RAM, imagem de origem e quantidade de sinapses ativas.
* **Live Container Stream (`docker logs -f`):** Streaming de logs em tempo real via WebSocket com remoção e parsing de cores ANSI e detecção visual de erros críticos (`ERROR`, `FATAL`, `panic:`).
* **Ações Operacionais:** Botões rápidos de gestão de ciclo de vida (`Reiniciar` e `Parar` container) que enviam comandos REST ao backend orquestrador.

### 3. Mapeamento Topológico de Comunicação entre Microsserviços
Entenda visualmente os caminhos críticos e gargalos de tráfego. Ao posicionar o cursor sobre uma conexão sináptica, uma *tooltip* holográfica detalha a origem, o destino, o protocolo em trânsito e o throughput em requisições por segundo (RPS). Ao selecionar um nó, os serviços não correlacionados são atenuados (*dimming*), destacando exclusivamente a vizinhança direta.

### 4. Rastreamento de Spawning Dinâmico de Serviços
Quando novos containers sobem ou réplicas são criadas pelo orquestrador, a interface executa a rotina de *Stellar Spawning*: uma nova estrela nasce no grafo com uma animação cinematográfica de onda de choque (*shockwave*) esférica e auto-enquadramento de câmera.

### 5. Demonstrações Arquiteturais e Dashboards Executivos
Apresente arquiteturas de sistemas complexos para clientes, investidores ou liderança técnica com estética cyberpunk/scifi de ponta, elevando o nível de visualização técnica do ecossistema.

---

## ⚙️ Modos de Operação

O console opera de forma híbrida e resiliente:

| Modo | Descrição | Status no HUD |
| :--- | :--- | :--- |
| **Standalone (Offline/Simulação)** | Executa mock em memória com a topologia padrão do ecossistema Nexus (Traefik, API Core, Vault, Lucy Agent, Workers, RabbitMQ, PostgreSQL e Redis). Ideal para desenvolvimento visual, testes de UI e demonstrações. | `Modo Standalone (Go Backend Standby)` |
| **Live Telemetry (Conectado ao Go)** | Conecta via WebSockets ao backend oficial em Go (`:8088`). Recebe métricas reais do Docker daemon, streams de logs ao vivo e reflete o ciclo de vida real dos containers na máquina ou servidor. | `● Conectado ao Go Backend (Docker Live)` |

---

## 🏛️ Topologia Padrão Representada (Ecossistema Nexus)

Na simulação inicial, os nós modelados representam a espinha dorsal de microsserviços do ecossistema:

+-- traefik-proxy (Reverse Proxy & mTLS Edge)
    |-- nexus-core-api (Backend Primário)
    |   |-- auth-vault (Gestão de Identidade / OAuth2)
    |   |-- postgres-primary (Banco de Dados Relacional / pgpool)
    |   |-- redis-cache (Cache L1 em Memória / RESP)
    |   +-- rabbitmq-bus (Barramento de Mensageria AMQP)
    |       |-- lucy-ai-orchestrator (Cérebro do Agente IA & Vetores)
    |       +-- doc-parser-worker (Processamento Batch Assíncrono)

---

## 🔌 Protocolo de Integração (Go Backend)

Caso queiras plugar o console a um backend real em Go, o frontend escuta e emite nos seguintes endpoints:

### WebSockets
* `ws://localhost:8088/ws/docker`: Canal de telemetria bidirecional.
  * **Payload de Inicialização / Spawn:**
    ```json
    {
      "action": "spawn",
      "id": "container_abc123",
      "name": "payment-service",
      "status": "running",
      "image": "payment:v1.2",
      "protocol": "gRPC Stream",
      "rps": 40
    }
    ```
  * **Payload de Métricas (Stats):**
    ```json
    {
      "action": "stats",
      "id": "container_abc123",
      "cpu": "14.2%",
      "mem": "180.5 MB",
      "status": "running"
    }
    ```
* `ws://localhost:8088/ws/logs?id=<container_id>`: Canal de streaming contínuo de logs (`stdout`/`stderr`).

### Endpoints REST
* `POST http://localhost:8088/api/containers/<id>/restart`: Solicita o reinício do container.
* `POST http://localhost:8088/api/containers/<id>/stop`: Solicita a parada do container.

---

## 🚀 Como Executar

Por ser uma aplicação baseada em navegador:

1. **Via Navegador Direto:**
   Basta abrir o arquivo [index.html](file:///home/lucivaldo-junior/Downloads/sinapitic-versions/nexus-console/index.html) em qualquer navegador moderno compatível com WebGL (Google Chrome, Brave, Firefox, Edge).

2. **Via Servidor HTTP Local (Recomendado para evitar restrições de CORS/WebSockets):**
   Tu podes servir a pasta com Python, Node ou Go:
   ```bash
   cd nexus-console

   # Opção com Python 3
   python3 -m http.server 8080

   # Ou com Node (npx)
   npx serve .
   ```
   Acesse no navegador: `http://localhost:8080/index.html`.

---

## 🎮 Controles e Interatividade

* **Rotação da Câmera:** Clique com o botão esquerdo e arraste pelo espaço cósmico.
* **Zoom:** Scroll do mouse ou gesto de pinça no trackpad.
* **Pan (Deslocamento lateral):** Clique com o botão direito e arraste.
* **Foco em um Nó:** Clique diretamente na estrela desejada. A câmera realiza uma transição suave e foca no serviço, abrindo a telemetria lateral.
* **Busca Rápida:** Digite o nome do serviço no campo de busca do HUD superior esquerdo para focar e abrir os dados automaticamente.
* **Fechar Painel:** Clique no `✕` da gaveta ou clique no espaço vazio do vácuo cósmico.
* **Reposicionamento de Nós:** Clique e arraste um nó; ao soltar, ele retornará suavemente à sua órbita com interpolação elástica.

---

## 🛠️ Tecnologias Utilizadas

* **Three.js (r128) & Pós-Processamento HDR:**
  * `EffectComposer` & `UnrealBloomPass`: Radiação incandescente realista de neons, núcleos estelares e arcos bioelétricos.
  * `ACESFilmicToneMapping`: Mapeamento de tons de alta dinâmica para evitar queima de brancos e preservar fidelidade de cor estelar.
* **3D Force-Graph (v1.73.3):** Simulação física com forças de atração/repulsão D3 e posicionamento dinâmico tridimensional.
* **Núcleos Solares 3D Emissivos:** Esferas tridimensionais concêntricas em cada nó com rotação térmica contínua e boost de emissão HDR.
* **Web Audio API Procedural:** Síntese sonora em tempo real sem arquivos de áudio externos (drone binaural cósmico a 42Hz, estalos de condução sináptica, pulsos de spawn e feedback holográfico de seleção).
* **HTML5 Canvas 2D:** Geração procedural em tempo de execução de texturas de estrelas, halos de plasma, ondas de choque (*shockwaves*) e nuvens cósmicas.
* **Glassmorphism & Cyberpunk CSS:** Interface futurista com filtros `backdrop-filter: blur`, paleta de alto contraste (#010206, néon ciano, âmbar e rosa H-alpha) e design responsivo.
