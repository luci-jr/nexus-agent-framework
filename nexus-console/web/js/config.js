/**
 * 🌌 NEXUS CONSOLE — CONFIGURAÇÃO E DADOS DE TOPOLOGIA
 * Topologia Oficial: 22 Nós (14 Agentes + 8 Serviços Swarm)
 */

const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
const wsProto = isHttps ? 'wss:' : 'ws:';
const host = typeof window !== 'undefined' ? (window.location.host || 'localhost:8090') : 'localhost:8090';
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8090';

window.NexusConfig = {
  GO_BACKEND_URL: `${wsProto}//${host}/ws/docker`,
  GO_LOGS_URL: `${wsProto}//${host}/ws/logs`,
  GO_API_URL: `${origin}/api`,
  AUTO_RECONNECT_INTERVAL: 4000
};

window.NexusTheme = {
  STATUS_COLORS: {
    running: '#00f5d4',  // Ciano cósmico O-III ionizado
    degraded: '#ffb703', // Âmbar solar / poeira galáctica
    error: '#f72585'     // Magenta cósmico / Supernova H-Alpha
  }
};

window.NexusTopology = {
  GLOBE_RADIUS: 146,
  NODE_ORBIT_RADIUS: 158,

  // 🎨 Cores Espectrais Astronômicas Individuais dos 22 Nós
  NODE_COLORS: {
    // Lucy Core
    'lucy-core':        '#ffe66d', // Ouro Cósmico Estelar

    // Squad Corporativo de Especialistas (9 Tonalidades Distintas)
    'backend':          '#00f5d4', // Ciano O-III Quântico (Go & JVM)
    'frontend':         '#06d6a0', // Esmeralda Neo-Bioluminescente (Angular Signals)
    'sysops':           '#118ab2', // Azul Oceânico Profundo SRE (Docker Swarm)
    'qa':               '#70d6ff', // Azul Cristal Glacial (Playwright)
    'secops':           '#ef476f', // Laser Rubí Escarlate (SecOps/SAST)
    'bi':               '#ff9f1c', // Âmbar Solar Analítico (BI & Analytics)
    'finops':           '#2ec4b6', // Turquesa Menta (FinOps)
    'frellas':          '#a7c957', // Verde Neon Oliva (Career-Ops)
    'suporte':          '#48cae4', // Azul Celeste Elétrico (Suporte N2/N3)

    // Enxame EGM & Apoio (4 Tonalidades Púrpuras/Violetas)
    'egm-bootstrap':    '#b5179e', // Púrpura Imperial Cósmico
    'egm-codebase':     '#7209b7', // Índigo Profundo Estelar
    'egm-synthesizer':  '#e0aaff', // Lavanda Bioluminescente
    'agent-secretario': '#c77dff', // Orquídea Estelar Vibrante (Secretário Sênior)

    // Serviços Swarm AWS (8 Tonalidades Industriais Únicas)
    'traefik':          '#00b4d8', // Azul Safira Ingress (Traefik)
    'postgres':         '#3a86ff', // Azul Royal Cobalto (PostgreSQL 16)
    'redis':            '#ff0054', // Vermelho Rubí In-Memory (Redis)
    'evolution':        '#25d366', // Verde Esmeralda WhatsApp Oficial (Evolution Go)
    'n8n':              '#ff6b6b', // Coral Elétrico (n8n Workflow)
    'nexus-mcp':        '#f77f00', // Laranja Plasma Go (Nexus MCP Server)
    'nexus-console':    '#4cc9f0', // Ciano Celeste Holográfico (Nexus Console)
    'portainer':        '#1389fd'  // Azul Baleia Docker (Portainer Swarm)
  },

  GEO_LOCATIONS: {
    // 🌟 Centro Cósmico Absoluto da Galáxia (Origem 0, 0, 0)
    'lucy-core':        { lat: 0,   lng: 0,    city: 'Núcleo Cósmico Central (Lucy Core / Ecossistema Nexus)', isCenter: true },

    // Anel 1: Latitude Norte (lat: 25) - 9 Especialistas do Squad
    'backend':          { lat: 25,  lng: -140, city: 'Frankfurt (Backend JVM/Go)' },
    'frontend':         { lat: 25,  lng: -100, city: 'Tóquio (Frontend Angular 21)' },
    'sysops':           { lat: 25,  lng: -60,  city: 'US-East (SysOps SRE Swarm)' },
    'qa':               { lat: 25,  lng: -20,  city: 'Dublin (QA Confiabilidade)' },
    'secops':           { lat: 25,  lng: 20,   city: 'Estocolmo (SecOps Gate)' },
    'bi':               { lat: 25,  lng: 60,   city: 'Chicago (BI & Analytics)' },
    'finops':           { lat: 25,  lng: 100,  city: 'Londres (FinOps Cloud)' },
    'frellas':          { lat: 25,  lng: 140,  city: 'Nova York (Career-Ops)' },
    'suporte':          { lat: 25,  lng: 180,  city: 'São Paulo (Suporte N2/N3)' },

    // Anel 2: Latitude Sul Média (lat: -18) - 4 Enxame EGM e Apoio
    'egm-bootstrap':    { lat: -18, lng: -135, city: 'Mountain View (EGM Bootstrap)' },
    'egm-codebase':     { lat: -18, lng: -45,  city: 'Zurique (EGM Codebase)' },
    'egm-synthesizer':  { lat: -18, lng: 45,   city: 'Singapura (EGM Synthesizer)' },
    'agent-secretario': { lat: -18, lng: 135,  city: 'Lisboa (Secretário Sênior)' },

    // Anel 3: Alta Latitude Sul (lat: -48) - 8 Serviços Swarm
    'traefik':          { lat: -48, lng: -155, city: 'US-East (Traefik Ingress)' },
    'postgres':         { lat: -48, lng: -110, city: 'US-East (PostgreSQL RDS)' },
    'redis':            { lat: -48, lng: -65,  city: 'US-East (Redis L1 Cache)' },
    'evolution':        { lat: -48, lng: -20,  city: 'São Paulo (Evolution Go Gateway)' },
    'n8n':              { lat: -48, lng: 25,   city: 'Amsterdã (n8n Workflow)' },
    'nexus-mcp':        { lat: -48, lng: 70,   city: 'Belém (Nexus MCP Go)' },
    'nexus-console':    { lat: -48, lng: 115,  city: 'US-East (Nexus Web Console)' },
    'portainer':        { lat: -48, lng: 160,  city: 'US-East (Portainer Swarm)' }
  },

  INITIAL_NODES: [
    // --- 1. Lucy Core & Orquestrador ---
    { id: 'lucy-core', name: '🧠 Lucy Core (Ecossistema Nexus)', status: 'running', image: 'Gemini 3.8 Flash (Google DeepMind)', cpu: '0.8%', mem: '11.1 MB', val: 32, color: '#ffe66d', isAgent: true, activity: 'Orquestrando decisões técnicas autônomas, governando a arquitetura viva e mediando o fluxo de engenharia do squad.' },

    // --- 2. Squad Corporativo de Agentes Especialistas ---
    { id: 'backend', name: '☕ Backend Sênior', status: 'running', image: 'Go 1.22+ / Java 21 LTS', cpu: '2.4%', mem: '48.2 MB', val: 18, color: '#00f5d4', isAgent: true, activity: 'Desenvolvendo microsserviços Go nativos, APIs REST de alto throughput e transações com lock pessimista em PostgreSQL.' },
    { id: 'frontend', name: '🅰️ Frontend Sênior', status: 'running', image: 'Angular 21+ / Three.js WebGL', cpu: '1.1%', mem: '32.0 MB', val: 18, color: '#06d6a0', isAgent: true, activity: 'Engenharia de interfaces reativas baseadas em Signals, renderização 3D WebGL no Nexus Console e design system premium.' },
    { id: 'sysops', name: '🐧 SysOps SRE', status: 'running', image: 'Linux Ubuntu / Docker Swarm', cpu: '0.5%', mem: '28.5 MB', val: 18, color: '#118ab2', isAgent: true, activity: 'Monitorando as 8 stacks no Docker Swarm AWS, tráfego de ingress no Traefik com SSL dinâmico e blindagem de SO.' },
    { id: 'qa', name: '🧪 QA Confiabilidade', status: 'running', image: 'Playwright / Cypress / k6', cpu: '1.8%', mem: '64.0 MB', val: 16, color: '#70d6ff', isAgent: true, activity: 'Executando testes automatizados E2E, auditoria visual com Playwright e garantindo compliance do Definition of Done.' },
    { id: 'secops', name: '🛡️ SecOps DevSecOps', status: 'running', image: 'gosec / Trivy / SCA-SAST', cpu: '0.6%', mem: '22.0 MB', val: 16, color: '#ef476f', isAgent: true, activity: 'Auditando o monorepo contra vazamento de segredos, varrendo vulnerabilidades com gosec e guardrails rígidos de Git.' },
    { id: 'bi', name: '📊 BI & Analytics', status: 'running', image: 'PostgreSQL / DuckDB Analytics', cpu: '1.5%', mem: '55.0 MB', val: 16, color: '#ff9f1c', isAgent: true, activity: 'Extraindo métricas agregadas de faturamento e estoque, processando pipelines analíticos e relatórios executivos em PDF.' },
    { id: 'finops', name: '💰 FinOps Cloud', status: 'running', image: 'Multi-Cloud Cost Engine', cpu: '0.4%', mem: '19.0 MB', val: 16, color: '#2ec4b6', isAgent: true, activity: 'Analisando métricas de consumo de instâncias AWS EC2, provisionando nós Oracle Cloud Always Free e minimizando egress.' },
    { id: 'frellas', name: '💼 Frellas Career-Ops', status: 'running', image: 'Career-Ops / ATS Engine', cpu: '0.7%', mem: '24.0 MB', val: 16, color: '#a7c957', isAgent: true, activity: 'Triando oportunidades internacionais em USD/EUR, adequando perfis para ATS e estruturando propostas comerciais.' },
    { id: 'suporte', name: '🎫 Suporte N2/N3', status: 'running', image: 'N2/N3 Incident Resolver', cpu: '0.9%', mem: '31.0 MB', val: 16, color: '#48cae4', isAgent: true, activity: 'Troubleshooting preventivo de incidentes operacionais em produção, análise de dumps de logs e suporte preventivo.' },

    // --- 3. Enxame EGM (Google) & Apoio ---
    { id: 'egm-bootstrap', name: '🐘 EGM Bootstrap', status: 'running', image: 'Elephant-Goldfish Model', cpu: '0.5%', mem: '20.0 MB', val: 15, color: '#b5179e', isAgent: true, activity: 'Particionando subárvores e orquestrando agentes revisores especializados para documentação canônica exaustiva.' },
    { id: 'egm-codebase', name: '🔍 EGM Codebase', status: 'running', image: 'EGM Codebase Details', cpu: '0.8%', mem: '25.0 MB', val: 15, color: '#7209b7', isAgent: true, activity: 'Inspecionando implementação e identificando oportunidades de reúso de bibliotecas existentes para evitar duplicidade.' },
    { id: 'egm-synthesizer', name: '🐝 EGM Synthesizer', status: 'running', image: 'EGM Swarm Aggregator', cpu: '0.6%', mem: '21.0 MB', val: 15, color: '#e0aaff', isAgent: true, activity: 'Consolidando feedbacks dos agentes especialistas em uma matriz única de prioridades para homologação final.' },
    { id: 'agent-secretario', name: '📝 Secretário Sênior', status: 'running', image: 'Executive Scribe Engine', cpu: '0.3%', mem: '16.0 MB', val: 15, color: '#c77dff', isAgent: true, activity: 'Transcrevendo e estruturando decisões tomadas em alinhamentos técnicos para transformar discussões em tarefas.' },

    // --- 4. Serviços de Produção Swarm AWS ---
    { id: 'traefik', name: '🌐 Traefik Proxy Ingress', status: 'running', image: 'traefik:v2.11.16', cpu: '1.2%', mem: '42.1 MB', val: 18, color: '#00b4d8', isAgent: false, activity: 'Roteando tráfego HTTP/2 público com terminação SSL automática Let\'s Encrypt e distribuindo para a rede overlay.' },
    { id: 'postgres', name: '🐘 PostgreSQL 16 DB', status: 'running', image: 'postgres:16-alpine (RDS AWS)', cpu: '4.5%', mem: '215.0 MB', val: 18, color: '#3a86ff', isAgent: false, activity: 'Processando transações relacionais de microsserviços, queries analíticas e sustentando o armazenamento persistente.' },
    { id: 'redis', name: '⚡ Redis 7 Cache', status: 'running', image: 'redis:7-alpine', cpu: '0.4%', mem: '26.8 MB', val: 15, color: '#ff0054', isAgent: false, activity: 'Armazenando cache L1 de alta velocidade e gerenciando filas assíncronas para automações e mensageria.' },
    { id: 'evolution', name: '💬 Evolution Go Gateway', status: 'running', image: 'evoapicloud/evolution-go:0.7.2', cpu: '0.8%', mem: '34.5 MB', val: 17, color: '#25d366', isAgent: false, activity: 'Sustentando a conexão oficial bidirecional com o WhatsApp em Go nativo com menos de 50MB de RAM.' },
    { id: 'n8n', name: '🔄 n8n Workflow Engine', status: 'running', image: 'n8nio/n8n:latest', cpu: '2.1%', mem: '145.0 MB', val: 16, color: '#ff6b6b', isAgent: false, activity: 'Executando fluxos de automação de eventos, webhooks do WhatsApp e orquestração de disparos operacionais.' },
    { id: 'nexus-mcp', name: '🛠️ Nexus MCP Server', status: 'running', image: 'nexus-mcp:latest (Go Nativo)', cpu: '0.2%', mem: '9.4 MB', val: 15, color: '#f77f00', isAgent: false, activity: 'Fornecendo ferramentas de alta performance em Go nativo (<0.1ms) para auditoria, backup, memória e ADRs.' },
    { id: 'nexus-console', name: '💻 Nexus Web Console', status: 'running', image: 'nexus-console:1.5.4 (Go Nativo)', cpu: '0.3%', mem: '11.1 MB', val: 16, color: '#4cc9f0', isAgent: false, activity: 'Servindo a interface 3D de observabilidade cósmica, APIs de telemetria e governança em Go puro.' },
    { id: 'portainer', name: '🐳 Portainer CE Swarm', status: 'running', image: 'portainer/portainer-ce:latest', cpu: '0.5%', mem: '38.0 MB', val: 15, color: '#1389fd', isAgent: false, activity: 'Monitorando os nós do cluster Docker Swarm AWS, volumes persistentes e integridade dos containers.' }
  ],

  INITIAL_LINKS: [
    // Conexões do Lucy Core com o Squad
    { source: 'lucy-core', target: 'backend', name: 'Orquestra Backend', rps: 65 },
    { source: 'lucy-core', target: 'frontend', name: 'Orquestra UI', rps: 45 },
    { source: 'lucy-core', target: 'sysops', name: 'Comando Infra', rps: 30 },
    { source: 'lucy-core', target: 'qa', name: 'Audita Qualidade', rps: 20 },
    { source: 'lucy-core', target: 'secops', name: 'Guardrails Seg', rps: 15 },
    { source: 'lucy-core', target: 'bi', name: 'Demanda Analytics', rps: 25 },
    { source: 'lucy-core', target: 'finops', name: 'Alinha Custos', rps: 12 },
    { source: 'lucy-core', target: 'frellas', name: 'Triagem Vagas', rps: 15 },
    { source: 'lucy-core', target: 'suporte', name: 'Escala Incidentes', rps: 18 },

    // EGM Reviewers
    { source: 'lucy-core', target: 'egm-bootstrap', name: 'Coordena EGM', rps: 16 },
    { source: 'egm-bootstrap', target: 'egm-codebase', name: 'Delega Auditoria', rps: 16 },
    { source: 'egm-codebase', target: 'egm-synthesizer', name: 'Sintetiza Achados', rps: 18 },
    { source: 'egm-synthesizer', target: 'qa', name: 'Homologa DoD', rps: 15 },
    { source: 'agent-secretario', target: 'frellas', name: 'Apoio Comercial', rps: 10 },
    { source: 'lucy-core', target: 'agent-secretario', name: 'Gera Atas', rps: 10 },

    // Conexões com Serviços de Produção
    { source: 'traefik', target: 'nexus-console', name: 'HTTP/2 Routing', rps: 55 },
    { source: 'traefik', target: 'evolution', name: 'SSL Proxy', rps: 35 },
    { source: 'traefik', target: 'n8n', name: 'Webhooks Ingress', rps: 25 },
    { source: 'traefik', target: 'portainer', name: 'Admin Route', rps: 10 },
    { source: 'evolution', target: 'n8n', name: 'Events Webhook', rps: 32 },
    { source: 'n8n', target: 'postgres', name: 'Persistência DB', rps: 28 },
    { source: 'n8n', target: 'redis', name: 'Cache de Eventos', rps: 40 },
    { source: 'nexus-mcp', target: 'lucy-core', name: 'RPC Tool Bridge', rps: 50 },
    { source: 'nexus-console', target: 'postgres', name: 'Telemetry Dumps', rps: 30 },
    { source: 'backend', target: 'postgres', name: 'TCP/SQL Pool', rps: 70 },
    { source: 'backend', target: 'redis', name: 'RESP Cache L1', rps: 85 },
    { source: 'sysops', target: 'traefik', name: 'Config Reload', rps: 15 },
    { source: 'sysops', target: 'portainer', name: 'Swarm Monitor', rps: 20 },
    { source: 'qa', target: 'backend', name: 'Test Execution', rps: 22 },
    { source: 'secops', target: 'backend', name: 'SAST Scan', rps: 18 },
    { source: 'bi', target: 'postgres', name: 'Analytical Queries', rps: 45 },
    { source: 'finops', target: 'sysops', name: 'Cloud Audit', rps: 12 },
    { source: 'suporte', target: 'postgres', name: 'Query Diagnostics', rps: 20 },
    { source: 'suporte', target: 'traefik', name: 'Error Traces', rps: 25 }
  ],

  latLngToVector3: function(lat, lng, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return {
      x: -(radius * Math.sin(phi) * Math.cos(theta)),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta)
    };
  }
};
