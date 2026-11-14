    document.addEventListener('DOMContentLoaded', () => {
      // Impede rolagem automática para o fundo da tela no refresh
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

      // Inicializar escala de fonte persistida (A-, A, A+)
      const savedFontScale = localStorage.getItem('nexus_font_scale') || 'md';
      setFontScale(savedFontScale);

      // Limpeza estrita contra restauração indevida de formulários/autofill pelo navegador
      const gs = document.getElementById('graph-search');
      if (gs) gs.value = '';
      const ks = document.getElementById('kanban-search');
      if (ks) ks.value = '';
      setTimeout(() => {
        const gsLater = document.getElementById('graph-search');
        if (gsLater && (!graphSearchTerm || gsLater.value.includes('•') || gsLater.value.includes('+') || /\d{5,}/.test(gsLater.value))) {
          gsLater.value = '';
          graphSearchTerm = '';
        }
        if (typeof sanitizeSearchInput === 'function') sanitizeSearchInput();
      }, 200);
      setTimeout(() => {
        if (typeof sanitizeSearchInput === 'function') sanitizeSearchInput();
      }, 700);

      // Checar status de autenticação (Modo Visitante vs Dono)
      checkAuthStatus();

      initTheme();
      renderFullServices();
      renderMCPTools();

      // Navegação Inicial Inteligente por Hash da URL
      const initialHash = window.location.hash.toLowerCase();
      if (initialHash.startsWith('#agente-')) {
        const key = initialHash.replace('#agente-', '');
        if (agentProfiles && agentProfiles[key]) {
          openAgentPage(key, false);
        } else {
          switchTab('tab-map', false);
        }
      } else if (tabHashToId[initialHash]) {
        switchTab(tabHashToId[initialHash], false);
      } else {
        if (!window.location.hash) {
          history.replaceState({ tab: 'tab-map', type: 'tab' }, '', '#home');
        }
        switchTab('tab-map', false);
      }
      
      // Carregar todas as contagens das abas em paralelo imediatamente (zero delay / zero zeros)
      Promise.all([
        fetchStatus(),
        fetchTasks(),
        fetchADRs(),
        fetchLessons(),
        fetchGraphStats()
      ]).then(() => {
        if (window.lucide) lucide.createIcons();
      });

      setInterval(fetchStatus, 2500); // Polling em tempo real a cada 2.5s
    });
