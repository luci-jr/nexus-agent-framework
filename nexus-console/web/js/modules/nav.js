    // Metadados Hierárquicos de Navegação (Conexão Hub -> Módulo -> Painel Ativo)
    const tabMetaMap = {
      'tab-map':       { hub: 'home', hubName: 'Nexus Console', hubIcon: '🌌', tabName: 'Central de Serviços', tabIcon: 'layout-grid', pos: 'Cockpit Geral', desc: '12 Módulos Operacionais • Toque para acessar qualquer serviço' },
      'tab-telemetry': { hub: 'core',  hubName: 'Núcleo Lucy',       hubIcon: '🧠', tabName: 'Telemetria & Grafo', tabIcon: 'activity',        pos: 'Módulo 1 de 4', desc: 'Grafo Neural 3D & Métricas do Lucy Core' },
      'tab-vault':     { hub: 'core',  hubName: 'Núcleo Lucy',       hubIcon: '🧠', tabName: 'Memória Contínua',   tabIcon: 'brain',           pos: 'Módulo 2 de 4', desc: 'Contexto do Lucy & Base Viva Markdown' },
      'tab-terminal':  { hub: 'core',  hubName: 'Núcleo Lucy',       hubIcon: '🧠', tabName: 'Terminal Web',      tabIcon: 'terminal-square', pos: 'Módulo 3 de 4', desc: 'Shell Linux & Wrapper Lucy 24/7' },
      'tab-whatsapp':  { hub: 'core',  hubName: 'Núcleo Lucy',       hubIcon: '🧠', tabName: 'WhatsApp 24/7',      tabIcon: 'message-square',  pos: 'Módulo 4 de 4', desc: 'Ponte Headless & Sessões WhatsApp' },
      'tab-conteudo':  { hub: 'media', hubName: 'Estúdio de Mídia',  hubIcon: '🎬', tabName: 'Estúdio de Mídia',  tabIcon: 'film',            pos: 'Módulo 1 de 2', desc: 'Vídeos Retro, Carrosséis & Thumbnails' },
      'tab-sites':     { hub: 'media', hubName: 'Estúdio de Mídia',  hubIcon: '🎬', tabName: 'Sites & Projetos Web', tabIcon: 'globe',        pos: 'Módulo 2 de 2', desc: 'Galeria de Prints, Landing Pages & Revisitação' },
      'tab-squad':     { hub: 'ops',   hubName: 'Operações & Infra', hubIcon: '⚙️', tabName: 'Squad Especialistas',tabIcon: 'users',           pos: 'Módulo 1 de 3', desc: '10 Copilotos de Domínio Especializados' },
      'tab-services':  { hub: 'ops',   hubName: 'Operações & Infra', hubIcon: '⚙️', tabName: 'Infra & Swarm',     tabIcon: 'server',          pos: 'Módulo 2 de 3', desc: 'Docker Swarm & Traefik v3' },
      'tab-tools':     { hub: 'ops',   hubName: 'Operações & Infra', hubIcon: '⚙️', tabName: 'Ferramentas MCP',   tabIcon: 'terminal',        pos: 'Módulo 3 de 3', desc: 'Protocolo de Ferramentas MCP (19 Ferramentas)' },
      'tab-tasks':     { hub: 'gov',   hubName: 'Governança',        hubIcon: '📋', tabName: 'Tarefas Kanban',    tabIcon: 'kanban',          pos: 'Módulo 1 de 3', desc: 'Sprints & Backlog todo.md' },
      'tab-adrs':      { hub: 'gov',   hubName: 'Governança',        hubIcon: '📋', tabName: 'Decisões ADR',      tabIcon: 'file-text',       pos: 'Módulo 2 de 3', desc: 'Decisões de Arquitetura (ADRs)' },
      'tab-lessons':   { hub: 'gov',   hubName: 'Governança',        hubIcon: '📋', tabName: 'Lições Aprendidas',  tabIcon: 'lightbulb',       pos: 'Módulo 3 de 3', desc: 'Padrões Fixados & Regras' }
    };

    function filterNavCategory(cat, autoSwitch = true) {
      if (!cat || !['core', 'media', 'ops', 'gov'].includes(cat)) cat = 'core';
      
      const navTabsBar = document.getElementById('nav-tabs-bar');
      if (navTabsBar) navTabsBar.classList.remove('hidden');

      ['core', 'media', 'ops', 'gov'].forEach(c => {
        const b = document.getElementById('btn-cat-' + c);
        if (b) {
          if (c === cat) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        }
      });

      document.querySelectorAll('#nav-tabs-bar .tab-btn').forEach(btn => {
        const isLocalDev = document.body.classList.contains('local-dev-mode');
        const isExcluded = btn.id === 'btn-tab-whatsapp' || btn.id === 'btn-tab-services';
        if (btn.getAttribute('data-category') === cat) {
          if (isLocalDev && isExcluded) {
            btn.classList.add('hidden');
          } else {
            btn.classList.remove('hidden');
          }
        } else {
          btn.classList.add('hidden');
        }
      });
      if (window.lucide) lucide.createIcons();

      // Troca imediatamente para a primeira aba da categoria selecionada para manter coerência total
      if (autoSwitch) {
        const activeBtn = document.querySelector('#nav-tabs-bar .tab-btn.active');
        if (!activeBtn || activeBtn.getAttribute('data-category') !== cat) {
          const targetTab = categoryDefaultTabs[cat];
          if (targetTab) switchTab(targetTab);
        }
      }
    }
    window.filterNavCategory = filterNavCategory;

    // Mapeamento Hash <-> Tab ID para Histórico do Navegador e Deep Linking
    const tabHashToId = {
      '#home': 'tab-map',
      '#inicio': 'tab-map',
      '#mapa': 'tab-map',
      '#servicos': 'tab-map',
      '#telemetria': 'tab-telemetry',
      '#memoria': 'tab-vault',
      '#vault': 'tab-vault',
      '#terminal': 'tab-terminal',
      '#whatsapp': 'tab-whatsapp',
      '#estudio': 'tab-conteudo',
      '#conteudo': 'tab-conteudo',
      '#sites': 'tab-sites',
      '#projetos': 'tab-sites',
      '#web': 'tab-sites',
      '#squad': 'tab-squad',
      '#especialistas': 'tab-squad',
      '#infra': 'tab-services',
      '#swarm': 'tab-services',
      '#ferramentas': 'tab-tools',
      '#mcp': 'tab-tools',
      '#tarefas': 'tab-tasks',
      '#tasks': 'tab-tasks',
      '#kanban': 'tab-tasks',
      '#todo': 'tab-tasks',
      '#adrs': 'tab-adrs',
      '#licoes': 'tab-lessons',
    };

    const tabIdToHash = {
      'tab-map': '#home',
      'tab-telemetry': '#telemetria',
      'tab-vault': '#memoria',
      'tab-terminal': '#terminal',
      'tab-whatsapp': '#whatsapp',
      'tab-conteudo': '#estudio',
      'tab-sites': '#sites',
      'tab-squad': '#squad',
      'tab-services': '#infra',
      'tab-tools': '#ferramentas',
      'tab-tasks': '#tarefas',
      'tab-adrs': '#adrs',
      'tab-lessons': '#licoes',
    };

    function switchTab(tabId, pushHistory = true) {
      // Se estava na página do agente, restaura os wrappers superiores
      document.getElementById('agent-detail-page').classList.add('hidden');
      const navTabs = document.getElementById('nav-tabs-wrapper');
      if (navTabs) navTabs.classList.remove('hidden');
      document.getElementById('tabs-container').classList.remove('hidden');

      // Ocultar todas as seções de abas
      document.querySelectorAll('#tabs-container > section').forEach(el => el.classList.add('hidden'));
      
      const target = document.getElementById(tabId);
      const btn = document.getElementById('btn-' + tabId);

      if (tabId === 'tab-map') {
        // Cockpit Central / Início: Oculta barra de abas secundária para evitar redundância com a Central de Serviços
        document.querySelectorAll('.nav-cat-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const navTabsBar = document.getElementById('nav-tabs-bar');
        if (navTabsBar) {
          navTabsBar.classList.add('hidden');
        }
      } else {
        
        // Módulos operacionais: exibe a barra secundária de abas e sincroniza o botão de categoria
        const navTabsBar = document.getElementById('nav-tabs-bar');
        if (navTabsBar) navTabsBar.classList.remove('hidden');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

        if (btn) {
          const btnCat = btn.getAttribute('data-category');
          if (btnCat) {
            ['core', 'media', 'ops', 'gov'].forEach(c => {
              const catBtn = document.getElementById('btn-cat-' + c);
              if (catBtn) {
                if (c === btnCat) catBtn.classList.add('active');
                else catBtn.classList.remove('active');
              }
            });
            document.querySelectorAll('#nav-tabs-bar .tab-btn').forEach(b => {
              const isLocalDev = document.body.classList.contains('local-dev-mode');
              const isExcluded = b.id === 'btn-tab-whatsapp' || b.id === 'btn-tab-services';
              if (b.getAttribute('data-category') === btnCat) {
                if (isLocalDev && isExcluded) b.classList.add('hidden');
                else b.classList.remove('hidden');
              } else {
                b.classList.add('hidden');
              }
            });
          }
          btn.classList.add('active');
        }
      }

      if (target) target.classList.remove('hidden');

      // Atualizar Histórico do Navegador (pushState) para interceptar o botão Voltar do mouse/navegador
      const hash = tabIdToHash[tabId] || ('#' + tabId.replace('tab-', ''));
      if (pushHistory && window.location.hash !== hash) {
        history.pushState({ tab: tabId, type: 'tab' }, '', hash);
      }

      // Atualizar Rastro de Navegação (Breadcrumb)
      const meta = tabMetaMap[tabId];
      if (meta) {
        const elHubIcon = document.getElementById('crumb-hub-icon');
        const elHubLabel = document.getElementById('crumb-hub-label');
        const elTabIcon = document.getElementById('crumb-tab-icon');
        const elTabLabel = document.getElementById('crumb-tab-label');
        const elTabPos = document.getElementById('crumb-tab-pos');
        const elTabDesc = document.getElementById('crumb-tab-desc');

        const isLocalDev = document.body.classList.contains('local-dev-mode');
        if (elHubIcon) elHubIcon.textContent = (isLocalDev && meta.hub === 'ops') ? '👥' : meta.hubIcon;
        if (elHubLabel) elHubLabel.textContent = (isLocalDev && meta.hub === 'ops') ? 'Squad & Ferramentas' : meta.hubName;
        if (elTabLabel) elTabLabel.textContent = meta.tabName;
        if (elTabPos) elTabPos.textContent = meta.pos;
        if (elTabDesc) elTabDesc.textContent = meta.desc;
        if (elTabIcon) elTabIcon.innerHTML = `<i data-lucide="${meta.tabIcon}" class="w-3.5 h-3.5"></i>`;
      }

      if (tabId === 'tab-map') {
        if (globalStatusData) renderMapHUD(globalStatusData);
        else fetchStatus();
      }
      if (tabId === 'tab-telemetry') {
        renderTelemetryTab();
        const searchInput = document.getElementById('graph-search');
        if (searchInput && (!graphSearchTerm || searchInput.value.includes('•') || searchInput.value.includes('55'))) {
          searchInput.value = '';
          graphSearchTerm = '';
        }
        setTimeout(() => {
          initOrResumeGraph();
        }, 50);
      }
      if (tabId === 'tab-squad' || tabId === 'tab-services') renderFullServices();
      if (tabId === 'tab-vault') loadVaultTab();
      if (tabId === 'tab-terminal') initOrFocusTerminal();
      if (tabId === 'tab-whatsapp') loadWhatsAppTab();
      if (tabId === 'tab-conteudo') loadConteudoTab();
      if (tabId === 'tab-sites') loadSitesTab();
      if (tabId === 'tab-tools') renderMCPTools();
      if (tabId === 'tab-tasks') {
        if (typeof sanitizeSearchInput === 'function') sanitizeSearchInput();
        fetchTasks();
      }
      if (tabId === 'tab-adrs') fetchADRs();
      if (tabId === 'tab-lessons') fetchLessons();
      
      if (window.lucide) lucide.createIcons();
    }
    window.switchTab = switchTab;

    // Interceptador do Botão Voltar do Mouse & Navegador (Navegação SPA sem sair do site)
    window.addEventListener('popstate', (event) => {
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith('#agente-')) {
        const key = hash.replace('#agente-', '');
        if (agentProfiles && agentProfiles[key]) {
          openAgentPage(key, false);
          return;
        }
      }

      // Se havia detalhe de agente aberto, fecha
      const agentPage = document.getElementById('agent-detail-page');
      if (agentPage && !agentPage.classList.contains('hidden')) {
        agentPage.classList.add('hidden');
        const navTabs = document.getElementById('nav-tabs-wrapper');
        if (navTabs) navTabs.classList.remove('hidden');
        const tabsContainer = document.getElementById('tabs-container');
        if (tabsContainer) tabsContainer.classList.remove('hidden');
      }

      const targetTab = tabHashToId[hash] || (event.state && event.state.tab) || 'tab-map';
      switchTab(targetTab, false);
    });

