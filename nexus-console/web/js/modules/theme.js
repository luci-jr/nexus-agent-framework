    const defaultServices = [
      {
        name: "Traefik v3",
        type: "Reverse Proxy & SSL",
        status: "Online",
        replicas: "1/1 Réplicas Ativas",
        latency: "2ms",
        endpoint: "https://traefik.lucivaldo.cloud",
        image: "traefik:v3.7.13",
        network: "rede-nexus",
        details: "SSL Let's Encrypt (*.lucivaldo.cloud) • Terminação TLS",
        description: "Roteador e proxy reverso central com terminação TLS automática Let's Encrypt para todos os subdomínios.",
        checked_at: "Tempo Real"
      },
      {
        name: "Evolution Go",
        type: "Gateway WhatsApp",
        status: "Online",
        replicas: "1/1 Réplicas Ativas",
        latency: "4ms",
        endpoint: "https://evolution.lucivaldo.cloud",
        image: "evoapicloud/evolution-go:0.7.2",
        network: "rede-nexus",
        details: "Go nativo + Postgres RDS + Redis Cache",
        description: "Gateway oficial WhatsApp em Go. Webhook de eventos isolado internamente na rede overlay para n8n_webhook:5678.",
        checked_at: "Tempo Real"
      },
      {
        name: "n8n Cluster",
        type: "Automação & IA",
        status: "Online",
        replicas: "3/3 Workers Ativos",
        latency: "6ms",
        endpoint: "https://n8n.lucivaldo.cloud",
        image: "n8nio/n8n:2.45.3",
        network: "rede-nexus",
        details: "Docker Swarm + Postgres RDS + Redis Queue",
        description: "Orquestrador de fluxos, rotina 5-em-1 de vagas, triggers de WhatsApp e execução de agentes inteligentes.",
        checked_at: "Tempo Real"
      },
      {
        name: "PostgreSQL 16 RDS",
        type: "Banco de Dados Central",
        status: "Online",
        replicas: "AWS RDS Multi-AZ",
        latency: "12ms",
        endpoint: "nexus-db...us-east-2.rds.amazonaws.com:5432",
        image: "AWS Managed PostgreSQL 16.3",
        network: "VPC AWS Privada",
        details: "Bancos: evogo_auth, evogo_users, n8ndb, evolution",
        description: "Banco de dados relacional principal da infraestrutura com backups automatizados e disaster recovery 3-2-1.",
        checked_at: "Tempo Real"
      },
      {
        name: "Redis 7 Alpine",
        type: "Cache & Filas Bull",
        status: "Online",
        replicas: "1/1 Réplicas Ativas",
        latency: "1ms",
        endpoint: "redis:6379",
        image: "redis:7-alpine",
        network: "rede-nexus",
        details: "Sessões WhatsApp & Filas Assíncronas",
        description: "Armazenamento em memória de ultra-baixa latência para sessões da Evolution Go e fila de execução assíncrona do n8n.",
        checked_at: "Tempo Real"
      },
      {
        name: "Nexus MCP Server",
        type: "Servidor de Ferramentas",
        status: "Online",
        replicas: "1/1 Réplicas Ativas",
        latency: "3ms",
        endpoint: "https://mcp.lucivaldo.cloud",
        image: "nexus-mcp:3.0.0 (Go nativo)",
        network: "rede-nexus",
        details: "19 ferramentas ativas de governança e telemetria",
        description: "Servidor MCP de alto desempenho em Go expondo ferramentas de auditoria, memória, ADRs, tarefas e telemetria.",
        checked_at: "Tempo Real"
      },
      {
        name: "Nexus Web Console",
        type: "Painel de Controle",
        status: "Online",
        replicas: "1/1 Réplicas Ativas",
        latency: "0.5ms",
        endpoint: "https://nexus-console.lucivaldo.cloud",
        image: "nexus-console:1.1.0 (Go nativo)",
        network: "rede-nexus",
        details: "Go 1.22+ //go:embed (<15MB RAM)",
        description: "Dashboard gráfico para governança, visualização de tarefas Kanban, leitura de ADRs e monitoramento móvel do ecossistema.",
        checked_at: "Tempo Real"
      },
      {
        name: "Portainer CE",
        type: "Gestão de Containers",
        status: "Online",
        replicas: "1/1 Réplicas Ativas",
        latency: "5ms",
        endpoint: "https://portainer.lucivaldo.cloud",
        image: "portainer/portainer-ce:2.45.2",
        network: "rede-nexus",
        details: "Gestão Docker Swarm AWS",
        description: "Painel web de visualização de nós Swarm, volumes persistentes, logs de containers e monitoramento de stacks.",
        checked_at: "Tempo Real"
      }
    ];

    const defaultTools = [
      { name: "nexus_status_sistema", category: "Telemetria", description: "Retorna status de CPU, RAM, discos e Docker." },
      { name: "nexus_obter_memoria", category: "Memória", description: "Recupera seções específicas da memória do Lucy sob demanda." },
      { name: "nexus_buscar_memoria", category: "Memória", description: "Busca semântica e contextual na base de memória histórica." },
      { name: "nexus_salvar_estado_tarefa", category: "Tarefas", description: "Persiste estado compacto, decisões e DoD por tarefa." },
      { name: "nexus_obter_estado_tarefa", category: "Tarefas", description: "Recupera o estado atual, pendências e seams de uma tarefa." },
      { name: "nexus_listar_adrs", category: "Arquitetura", description: "Lista todas as Architecture Decision Records formalizadas." },
      { name: "nexus_gerar_adr", category: "Arquitetura", description: "Cria uma nova ADR padronizada no formato Michael Nygard." },
      { name: "nexus_validar_dod", category: "Qualidade", description: "Avaliador determinístico de critérios de aceite e readiness." },
      { name: "nexus_auditar_comando", category: "SecOps", description: "Audita comandos do terminal contra operações destrutivas." },
      { name: "nexus_auditar_impacto", category: "Arquitetura", description: "Analisa o grafo de dependências e risco sistêmico de alterações." },
      { name: "nexus_executar_backup", category: "Resiliência", description: "Dispara sincronização incremental para GitHub, Drive e SSDs." },
      { name: "nexus_rotear_intencao", category: "Orquestração", description: "Roteador System One para classificar intenção do desenvolvedor." },
      { name: "nexus_metricas_fluxo", category: "Telemetria", description: "Métricas de throughput, latência e consumo de tokens." },
      { name: "nexus_analisar_fit_vaga", category: "Frellas", description: "Calcula fit score 1-5 de vagas para back-end e cloud." },
      { name: "nexus_listar_cvs", category: "Frellas", description: "Lista variantes de currículos disponíveis em PDF." },
      { name: "nexus_engenharia_reversa_ui", category: "Frontend", description: "Gera especificação de design tokens a partir de prints/telas." },
      { name: "nexus_status_infra", category: "SysOps", description: "Verifica nós Swarm, containers ativos e rotas Traefik." },
      { name: "nexus_salvar_relatorio", category: "Governança", description: "Grava relatórios executivos em relatorios/<copiloto>/." },
      { name: "nexus_registrar_aprendizado", category: "Memória", description: "Grava novo aprendizado técnico ou mitigação em tasks/lessons.md." }
    ];

    let globalStatusData = {
      uptime: "Ativo",
      mem_alloc_mb: 2.36,
      mem_sys_mb: 11.7,
      goroutines: 3,
      services: defaultServices,
      tools: defaultTools
    };
    let currentAgentKey = null;

    function triggerSpin(id) {
      document.querySelectorAll('#' + id).forEach(el => el.classList.add('animate-spin'));
    }
    window.triggerSpin = triggerSpin;

    function clearSpin(id) {
      setTimeout(() => {
        document.querySelectorAll('#' + id).forEach(el => el.classList.remove('animate-spin'));
      }, 500);
    }
    window.clearSpin = clearSpin;

    // Lógica do Tema (Escuro / Sépia Claro com persistência no LocalStorage)
    function initTheme() {
      const saved = localStorage.getItem('nexus-theme') || 'dark';
      setTheme(saved);
    }

    function setTheme(theme) {
      const isDark = theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('nexus-theme', theme);
      
      const iconSun = document.getElementById('theme-icon-sun');
      const iconMoon = document.getElementById('theme-icon-moon');
      if (isDark) {
        if (iconSun) iconSun.classList.add('hidden');
        if (iconMoon) iconMoon.classList.remove('hidden');
      } else {
        if (iconSun) iconSun.classList.remove('hidden');
        if (iconMoon) iconMoon.classList.add('hidden');
      }
      if (window.lucide) lucide.createIcons();
    }

    function applyLocalDevFocus() {
      // 1. Oculta abas que são ruído no ambiente local
      const tabWa = document.getElementById('btn-tab-whatsapp');
      if (tabWa) tabWa.classList.add('hidden', 'local-excluded');
      const tabSvc = document.getElementById('btn-tab-services');
      if (tabSvc) tabSvc.classList.add('hidden', 'local-excluded');
      
      // 2. Atualiza contadores visuais das categorias
      const badgeCore = document.querySelector('#btn-cat-core .nav-cat-badge');
      if (badgeCore) badgeCore.textContent = '3';
      const badgeOps = document.querySelector('#btn-cat-ops .nav-cat-badge');
      if (badgeOps) badgeOps.textContent = '2';

      // 3. Atualiza badge de observabilidade no menu
      const hubBadge = document.getElementById('hub-status-badge');
      if (hubBadge) {
        hubBadge.innerHTML = `
          <span class="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span class="font-bold text-cyan-500 dark:text-cyan-400">DEV LOCAL</span>
          <span class="text-slate-400 dark:text-slate-500">|</span>
          <span class="text-slate-600 dark:text-slate-300">Modo Foco Ativo</span>
        `;
      }
    }
    window.applyLocalDevFocus = applyLocalDevFocus;

    function toggleTheme() {
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    }

    // Retorna para o início do console (Home - Central de Serviços Unificada)
    function goHome() {
      closeAgentPage();
      switchTab('tab-map');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ==========================================
    // ESCALA DE FONTE & ACESSIBILIDADE (A-, A, A+ / Multiescala Progressiva)
    // ==========================================
    const FONT_SCALES = [
      { id: 'xs',  name: 'Muito Pequena (80%)',  size: '12px' },
      { id: 'sm',  name: 'Pequena (90%)',        size: '13.5px' },
      { id: 'md',  name: 'Padrão (100%)',        size: '15px' },
      { id: 'lg',  name: 'Grande (+1x / 115%)',   size: '17px' },
      { id: 'xl',  name: 'Maior (+2x / 130%)',    size: '19.5px' },
      { id: '2xl', name: 'Máxima (+3x / 150%)',   size: '22px' }
    ];
    let currentFontScaleIndex = 2; // Default: 'md' (15px)

    function applyFontScaleByIndex(index, showFeedback = false) {
      if (index < 0) index = 0;
      if (index >= FONT_SCALES.length) index = FONT_SCALES.length - 1;
      currentFontScaleIndex = index;
      const scaleObj = FONT_SCALES[index];

      const html = document.documentElement;
      FONT_SCALES.forEach(s => html.classList.remove(`font-scale-${s.id}`));
      html.classList.add(`font-scale-${scaleObj.id}`);

      localStorage.setItem('nexus_font_scale', scaleObj.id);

      const btnSm = document.getElementById('btn-font-sm');
      const btnMd = document.getElementById('btn-font-md');
      const btnLg = document.getElementById('btn-font-lg');

      if (btnSm) {
        btnSm.classList.toggle('font-scale-active', index < 2);
        btnSm.textContent = index === 0 ? 'A--' : 'A-';
        btnSm.title = index === 0 ? 'Tamanho mínimo atingido (12px)' : 'Diminuir tamanho da fonte (A-)';
      }
      if (btnMd) {
        btnMd.classList.toggle('font-scale-active', index === 2);
      }
      if (btnLg) {
        btnLg.classList.toggle('font-scale-active', index > 2);
        if (index === 3) btnLg.textContent = 'A+';
        else if (index === 4) btnLg.textContent = 'A+²';
        else if (index === 5) btnLg.textContent = 'A+³';
        else btnLg.textContent = 'A+';
        btnLg.title = index === 5 ? 'Tamanho máximo atingido (+3x / 22px)' : `Aumentar tamanho da fonte (${scaleObj.name})`;
      }

      if (showFeedback && typeof showToast === 'function') {
        showToast(`Fonte: ${scaleObj.name}`);
      }
    }

    function setFontScale(scale) {
      const idx = FONT_SCALES.findIndex(s => s.id === scale);
      if (idx !== -1) applyFontScaleByIndex(idx, false);
      else applyFontScaleByIndex(2, false);
    }
    window.setFontScale = setFontScale;

    function increaseFontScale() {
      applyFontScaleByIndex(currentFontScaleIndex + 1, true);
    }
    window.increaseFontScale = increaseFontScale;

    function decreaseFontScale() {
      applyFontScaleByIndex(currentFontScaleIndex - 1, true);
    }
    window.decreaseFontScale = decreaseFontScale;

    function resetFontScale() {
      applyFontScaleByIndex(2, true);
    }
    window.resetFontScale = resetFontScale;

