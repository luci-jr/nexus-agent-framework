    // Terminal Web PTY Management (Lucy Shell Interativo & Persistente 24/7)
    let termInstance = null;
    let fitAddonInstance = null;
    let termSocket = null;
    let termHeartbeatInterval = null;
    let termReconnectTimer = null;
    let termReconnectAttempts = 0;
    let currentTerminalTarget = 'cloud'; // 'cloud' | 'local' | 'none'
    let isLucyActive = false;
    let isClaudeActive = false;
    let isAgentPcOnline = false;
    let serverTerminalTitle = 'Terminal Web - Terminal Linux (Ubuntu)';

    function detectClientTerminalTitle() {
      if (serverTerminalTitle && serverTerminalTitle.includes('Terminal Web -')) {
        return serverTerminalTitle;
      }
      const ua = (navigator.userAgent || '').toLowerCase();
      const platform = ((navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || '').toLowerCase();

      if (platform.includes('win') || ua.includes('windows')) {
        return 'Terminal Web - PowerShell (Windows)';
      }
      if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('darwin')) {
        return 'Terminal Web - Terminal macOS';
      }
      if (platform.includes('linux') || ua.includes('linux')) {
        if (ua.includes('ubuntu')) return 'Terminal Web - Terminal Linux (Ubuntu)';
        if (ua.includes('debian')) return 'Terminal Web - Terminal Linux (Debian)';
        if (ua.includes('fedora')) return 'Terminal Web - Terminal Linux (Fedora)';
        if (ua.includes('arch')) return 'Terminal Web - Terminal Linux (Arch)';
        if (ua.includes('alpine')) return 'Terminal Web - Terminal Linux (Alpine)';
        return 'Terminal Web - Terminal Linux (Ubuntu)';
      }
      return 'Terminal Web - Terminal Linux (Ubuntu)';
    }

    function updateTerminalDynamicTitle() {
      const termTitle = document.getElementById('term-main-title');
      if (!termTitle) return;
      termTitle.textContent = serverTerminalTitle || detectClientTerminalTitle();
    }
    window.updateTerminalDynamicTitle = updateTerminalDynamicTitle;

    function updateTerminalControlsUI() {
      updateTerminalDynamicTitle();
      const btnCloud = document.getElementById('btn-term-node-cloud');
      const dotCloud = document.getElementById('term-cloud-dot');
      const btnLocal = document.getElementById('btn-term-node-local');
      const dotLocal = document.getElementById('term-local-dot');
      const btnLucy = document.getElementById('btn-term-lucy');
      const dotLucy = document.getElementById('term-lucy-dot');
      const btnClaude = document.getElementById('btn-term-claude');
      const dotClaude = document.getElementById('term-claude-dot');
      const desc = document.getElementById('term-session-desc');
      const badge = document.getElementById('terminal-badge');

      // Classes estritas: Cinza quando desligado, Outline Verde quando em uso (com ponto verde pulsante)
      const CLASS_OFF_NODE = 'px-2.5 sm:px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer';
      const CLASS_ON_NODE = 'px-2.5 sm:px-3 py-1 rounded-lg font-medium transition flex items-center gap-1.5 border border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-xs cursor-pointer';

      const CLASS_OFF_SVC = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1.5 cursor-pointer';
      const CLASS_ON_SVC = 'px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-500/60 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 shadow-xs transition flex items-center gap-1.5 cursor-pointer';

      const DOT_OFF = 'w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600';
      const DOT_ON = 'w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)] animate-pulse';

      const isLocalDev = document.body.classList.contains('local-dev-mode');

      // ☁️ Botão Nó Cloud (Nuvem AWS)
      if (btnCloud && dotCloud) {
        btnCloud.style.display = '';
        btnCloud.classList.remove('hidden');
        if (currentTerminalTarget === 'cloud') {
          btnCloud.className = CLASS_ON_NODE;
          dotCloud.className = DOT_ON;
          dotCloud.title = 'Shell Cloud Ligado e Ativo';
        } else {
          btnCloud.className = CLASS_OFF_NODE;
          dotCloud.className = DOT_OFF;
          dotCloud.title = 'Shell Cloud Desligado (Clique para Ligar)';
        }
      }

      // 💻 Botão Nó Local
      if (btnLocal && dotLocal) {
        if (currentTerminalTarget === 'local') {
          btnLocal.className = CLASS_ON_NODE;
          dotLocal.className = DOT_ON;
          dotLocal.title = 'Shell PC Local Ligado e Ativo';
        } else {
          btnLocal.className = CLASS_OFF_NODE;
          dotLocal.className = DOT_OFF;
          dotLocal.title = 'Terminal Local Desligado (Clique para Ligar)';
        }
      }

      // ☸️ Botão Swarm
      const btnSwarm = document.getElementById('btn-term-swarm');
      if (btnSwarm) {
        btnSwarm.style.display = '';
        btnSwarm.classList.remove('hidden');
      }

      // 🧠 Botão Agente Lucy
      if (btnLucy && dotLucy) {
        if (isLucyActive) {
          btnLucy.className = CLASS_ON_SVC;
          dotLucy.className = DOT_ON;
          dotLucy.title = 'Lucy Ativo no Terminal (Clique para Desligar)';
        } else {
          btnLucy.className = CLASS_OFF_SVC;
          dotLucy.className = DOT_OFF;
          dotLucy.title = 'Lucy Desligado (Clique para Iniciar)';
        }
      }

      // >_ Botão Claude Code
      if (btnClaude && dotClaude) {
        if (isClaudeActive) {
          btnClaude.className = CLASS_ON_SVC;
          dotClaude.className = DOT_ON;
          dotClaude.title = 'Claude Code Ativo no Terminal (Clique para Desligar)';
        } else {
          btnClaude.className = CLASS_OFF_SVC;
          dotClaude.className = DOT_OFF;
          dotClaude.title = 'Claude Code Desligado (Clique para Iniciar)';
        }
      }

      // Descrição & Badge
      if (desc) {
        if (isLocalDev) {
          desc.textContent = 'Sessão interativa conectada ao terminal local da sua máquina (Ubuntu Desktop)';
        } else if (currentTerminalTarget === 'cloud') {
          desc.textContent = 'Sessão interativa conectada ao ambiente Linux na Nuvem AWS';
        } else if (currentTerminalTarget === 'local') {
          desc.textContent = 'Sessão interativa conectada ao seu PC Local (Ubuntu) via túnel seguro';
        } else {
          desc.textContent = 'Terminal em Standby · Nenhum nó ativo (clique em Terminal Local para iniciar)';
        }
      }

      if (badge) {
        if (currentTerminalTarget === 'none') {
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shadow-xs" title="Terminal em Espera"></span>';
          badge.className = 'flex items-center shrink-0';
        } else {
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600/75 dark:bg-emerald-500/75 shadow-xs" title="Terminal Ativo"></span>';
          badge.className = 'flex items-center shrink-0';
        }
      }
    }

    function renderTerminalStandby() {
      if (!termInstance) return;
      termInstance.clear();
      const isLocalDev = document.body.classList.contains('local-dev-mode');
      termInstance.writeln('\r\n\x1b[38;2;14;165;233m  ╭────────────────────────────────────────────────────────────────────────╮\x1b[0m');
      termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m  \x1b[1;37m🌌 NEXUS TERMINAL · SHELL EM ESPERA (STANDBY)\x1b[0m                         \x1b[38;2;14;165;233m│\x1b[0m');
      termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m                                                                        \x1b[38;2;14;165;233m│\x1b[0m');
      if (isLocalDev) {
        termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m  \x1b[90mTerminal desligado. Clique no botão verde para iniciar a sessão:\x1b[0m       \x1b[38;2;14;165;233m│\x1b[0m');
        termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m                                                                        \x1b[38;2;14;165;233m│\x1b[0m');
        termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m  • \x1b[32m[ 💻 Terminal Local ● ]\x1b[0m  Shell nativo da sua máquina (Ubuntu Desktop)\x1b[38;2;14;165;233m│\x1b[0m');
      } else {
        termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m  \x1b[90mNenhum shell conectado no momento. Ative um dos nós para iniciar:\x1b[0m     \x1b[38;2;14;165;233m│\x1b[0m');
        termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m                                                                        \x1b[38;2;14;165;233m│\x1b[0m');
        termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m  • \x1b[32m[ ☁️ Nuvem AWS ● ]\x1b[0m     Shell Linux interativo 24/7 na Nuvem AWS    \x1b[38;2;14;165;233m│\x1b[0m');
        termInstance.writeln('\x1b[38;2;14;165;233m  │\x1b[0m  • \x1b[36m[ 💻 Terminal Local ● ]\x1b[0m  Túnel reverso seguro com seu PC Local (Ubuntu)\x1b[38;2;14;165;233m│\x1b[0m');
      }
      termInstance.writeln('\x1b[38;2;14;165;233m  ╰────────────────────────────────────────────────────────────────────────╯\x1b[0m\r\n');
    }

    function toggleTerminalNode(target) {
      if (currentTerminalTarget === target) {
        // Desliga o nó ativo -> entra em Standby
        currentTerminalTarget = 'none';
        isLucyActive = false;
        isClaudeActive = false;
        disconnectTerminalSocket();
        updateTerminalControlsUI();
        renderTerminalStandby();
        showToast(`Terminal ${target === 'cloud' ? 'Nuvem AWS' : 'Local'} desligado.`);
        return;
      }

      // Ligar o nó selecionado
      currentTerminalTarget = target;
      isLucyActive = false;
      isClaudeActive = false;
      updateTerminalControlsUI();
      if (termInstance) termInstance.clear();
      termReconnectAttempts = 0;
      connectTerminalSocket();
      showToast(`Terminal ${target === 'cloud' ? 'Nuvem AWS' : 'do PC Local'} ativado! 🟢`);
    }
    window.toggleTerminalNode = toggleTerminalNode;
    window.switchTerminalTarget = toggleTerminalNode; // Compatibilidade retroativa

    function toggleLucyService() {
      if (!isLucyActive) {
        if (currentTerminalTarget === 'none') {
          const target = isAgentPcOnline ? 'local' : 'cloud';
          toggleTerminalNode(target);
          setTimeout(() => {
            sendTerminalCommand('lucy\n');
          }, 600);
        } else {
          sendTerminalCommand('lucy\n');
        }
        isLucyActive = true;
        isClaudeActive = false;
        updateTerminalControlsUI();
        showToast('Iniciando Agente Lucy no terminal... 🧠 🟢');
      } else {
        // Envia Ctrl+C para finalizar sem encerrar o shell bash
        sendTerminalCommand('\x03');
        isLucyActive = false;
        updateTerminalControlsUI();
        showToast('Lucy finalizado no terminal.');
      }
    }
    window.toggleLucyService = toggleLucyService;

    function toggleClaudeService() {
      if (!isClaudeActive) {
        if (currentTerminalTarget === 'none') {
          const target = isAgentPcOnline ? 'local' : 'cloud';
          toggleTerminalNode(target);
          setTimeout(() => {
            sendTerminalCommand('claude\n');
          }, 600);
        } else {
          sendTerminalCommand('claude\n');
        }
        isClaudeActive = true;
        isLucyActive = false;
        updateTerminalControlsUI();
        showToast('Iniciando Claude Code no terminal... >_ 🟢');
      } else {
        // Envia Ctrl+C para finalizar sem encerrar o shell bash
        sendTerminalCommand('\x03');
        isClaudeActive = false;
        updateTerminalControlsUI();
        showToast('Claude Code finalizado no terminal.');
      }
    }
    window.toggleClaudeService = toggleClaudeService;

    async function checkTerminalAgentStatus() {
      try {
        const res = await fetch('/api/terminal/status');
        if (res.ok) {
          const data = await res.json();
          isAgentPcOnline = !!data.local;
          updateTerminalControlsUI();
        }
      } catch (e) {}
    }
    window.checkTerminalAgentStatus = checkTerminalAgentStatus;

    function disconnectTerminalSocket() {
      if (termHeartbeatInterval) {
        clearInterval(termHeartbeatInterval);
        termHeartbeatInterval = null;
      }
      if (termReconnectTimer) {
        clearTimeout(termReconnectTimer);
        termReconnectTimer = null;
      }
      if (termSocket) {
        // Remove todos os handlers antes de fechar para blindar contra onclose fantasma
        termSocket.onopen = null;
        termSocket.onmessage = null;
        termSocket.onerror = null;
        termSocket.onclose = null;
        try {
          termSocket.close();
        } catch (e) {}
        termSocket = null;
      }
    }

    function getNexusAuthToken() {
      const match = document.cookie.match(/(?:^|;\s*)nexus_token=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
      try {
        return sessionStorage.getItem('nexus_token') || localStorage.getItem('nexus_token') || '';
      } catch (e) {
        return '';
      }
    }

    function initOrFocusTerminal() {
      applyAuthUIState();
      const container = document.getElementById('terminal-container');
      if (!container) return;

      if (!window.nexusIsAuthenticated) {
        const savedToken = getNexusAuthToken();
        if (savedToken) {
          checkAuthStatus().then(() => {
            if (window.nexusIsAuthenticated) {
              initOrFocusTerminal();
            } else {
              renderTerminalAuthRequired(container);
            }
          });
          return;
        }
        renderTerminalAuthRequired(container);
        return;
      }

      checkTerminalAgentStatus();

      if (!termInstance) {
        if (typeof Terminal === 'undefined' || typeof FitAddon === 'undefined') {
          container.innerHTML = '<div class="p-6 text-amber-500 font-mono text-sm">Aguardando carregamento da biblioteca xterm.js...</div>';
          setTimeout(initOrFocusTerminal, 300);
          return;
        }

        container.innerHTML = '';
        termInstance = new Terminal({
          cursorBlink: true,
          fontSize: 13,
          lineHeight: 1.25,
          fontFamily: '"JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
          theme: {
            background: '#080c14',
            foreground: '#e2e8f0',
            cursor: '#00f2fe',
            cursorAccent: '#080c14',
            selectionBackground: 'rgba(0, 242, 254, 0.35)',
            black: '#1e293b',
            red: '#f43f5e',
            green: '#10b981',
            yellow: '#f59e0b',
            blue: '#3b82f6',
            magenta: '#a855f7',
            cyan: '#06b6d4',
            white: '#f8fafc',
            brightBlack: '#64748b',
            brightRed: '#fb7185',
            brightGreen: '#34d399',
            brightYellow: '#fbbf24',
            brightBlue: '#60a5fa',
            brightMagenta: '#c084fc',
            brightCyan: '#22d3ee',
            brightWhite: '#ffffff'
          }
        });

        fitAddonInstance = new FitAddon.FitAddon();
        termInstance.loadAddon(fitAddonInstance);
        termInstance.open(container);

        // Registra o listener de digitação estritamente UMA ÚNICA VEZ na criação do terminal
        // Previne duplicação/triplicação de caracteres ao reconectar ou trocar de abas
        termInstance.onData((data) => {
          if (termSocket && termSocket.readyState === WebSocket.OPEN) {
            termSocket.send(data);
          }
        });
        
        setTimeout(() => {
          fitAddonInstance.fit();
          sendTerminalResize();
          termInstance.focus();
        }, 100);

        if (currentTerminalTarget !== 'none') {
          connectTerminalSocket();
        } else {
          renderTerminalStandby();
        }

        window.addEventListener('resize', () => {
          if (termInstance && fitAddonInstance && !document.getElementById('tab-terminal').classList.contains('hidden')) {
            fitAddonInstance.fit();
            sendTerminalResize();
          }
        });

        // Polling de saúde do agente do PC a cada 10s
        setInterval(checkTerminalAgentStatus, 10000);
      } else {
        if (currentTerminalTarget !== 'none' && (!termSocket || termSocket.readyState !== WebSocket.OPEN)) {
          connectTerminalSocket();
        }
        setTimeout(() => {
          fitAddonInstance.fit();
          sendTerminalResize();
          termInstance.focus();
        }, 50);
      }
    }

    function renderTerminalAuthRequired(container) {
      if (!container) return;
      container.innerHTML = `
        <div class="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 font-sans">
          <div class="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-2 shadow-inner">
            <i data-lucide="lock" class="w-7 h-7"></i>
          </div>
          <h3 class="text-base font-bold text-slate-200">Terminal Restrito: Autenticação Obrigatória</h3>
          <p class="text-xs text-slate-400 max-w-md">Para acessar a sessão Linux interativa ou o túnel com o seu PC Local, informe a Senha Mestra do Nexus.</p>
          <button onclick="openAuthModal('Informe a Senha Mestra para desbloquear o terminal interativo.')" class="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg transition flex items-center gap-2 cursor-pointer">
            <i data-lucide="key" class="w-4 h-4"></i> Desbloquear Terminal
          </button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }

    function sendTerminalResize() {
      if (termSocket && termSocket.readyState === WebSocket.OPEN && termInstance) {
        termSocket.send(JSON.stringify({
          type: 'resize',
          cols: termInstance.cols,
          rows: termInstance.rows
        }));
      }
    }

    function connectTerminalSocket() {
      if (!window.nexusIsAuthenticated || currentTerminalTarget === 'none') {
        return;
      }
      disconnectTerminalSocket();

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const token = getNexusAuthToken();
      const tokenParam = token ? '&token=' + encodeURIComponent(token) : '';
      const url = `${protocol}//${window.location.host}/ws/terminal?target=${currentTerminalTarget}${tokenParam}`;

      termSocket = new WebSocket(url);
      termSocket.binaryType = 'arraybuffer';

      termSocket.onopen = () => {
        termReconnectAttempts = 0;
        const badge = document.getElementById('terminal-badge');
        if (badge) {
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600/75 dark:bg-emerald-500/75 shadow-xs" title="Terminal Ativo"></span>';
          badge.className = 'flex items-center shrink-0';
        }
        sendTerminalResize();
        updateTerminalControlsUI();

        // Heartbeat Keep-Alive a cada 15s para NUNCA cair por inatividade
        termHeartbeatInterval = setInterval(() => {
          if (termSocket && termSocket.readyState === WebSocket.OPEN) {
            termSocket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      termSocket.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          termInstance.write(new Uint8Array(event.data));
        } else {
          if (typeof event.data === 'string' && event.data.includes('"type":"pong"')) {
            return;
          }
          termInstance.write(event.data);
        }
      };

      termSocket.onclose = () => {
        if (termHeartbeatInterval) {
          clearInterval(termHeartbeatInterval);
          termHeartbeatInterval = null;
        }

        if (currentTerminalTarget === 'none') {
          return;
        }

        const badge = document.getElementById('terminal-badge');
        termReconnectAttempts++;
        if (termReconnectAttempts > 3) {
          if (badge) {
            badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500/75 shadow-xs" title="Terminal Desconectado"></span>';
            badge.className = 'flex items-center shrink-0';
          }
          if (termInstance) {
            termInstance.writeln('\r\n\x1b[31m✕ Sessão do shell não autorizada ou desconectada. Clique no nó desejado ou em "Reconectar".\x1b[0m\r\n');
          }
          return;
        }

        if (badge) {
          badge.textContent = `Reconectando (${termReconnectAttempts}/3)...`;
          badge.className = 'tab-badge text-amber-500 font-semibold animate-pulse';
        }

        if (termInstance) {
          termInstance.writeln(`\r\n\x1b[33m! Conexão com o shell oscilou. Reconectando sessão (${termReconnectAttempts}/3)...\x1b[0m\r\n`);
        }
        termReconnectTimer = setTimeout(() => {
          const terminalTab = document.getElementById('tab-terminal');
          if (terminalTab && !terminalTab.classList.contains('hidden') && currentTerminalTarget !== 'none') {
            connectTerminalSocket();
          }
        }, 2500);
      };

      termSocket.onerror = (err) => {
        console.warn('Terminal WS oscilou:', err);
      };
    }

    function reconnectTerminal() {
      termReconnectAttempts = 0;
      if (termInstance) {
        termInstance.clear();
      }
      if (currentTerminalTarget === 'none') {
        currentTerminalTarget = 'cloud';
      }
      updateTerminalControlsUI();
      connectTerminalSocket();
      setTimeout(() => {
        if (fitAddonInstance) fitAddonInstance.fit();
        sendTerminalResize();
        if (termInstance) termInstance.focus();
      }, 100);
    }

    function clearTerminalScreen() {
      if (termInstance) {
        termInstance.clear();
        termInstance.focus();
      }
    }

    function sendTerminalCommand(cmd) {
      if (termSocket && termSocket.readyState === WebSocket.OPEN) {
        termSocket.send(cmd);
        if (termInstance) termInstance.focus();
      } else {
        reconnectTerminal();
        setTimeout(() => {
          if (termSocket && termSocket.readyState === WebSocket.OPEN) {
            termSocket.send(cmd);
          }
        }, 500);
      }
    }

    // Abre a Página Dedicada do Agente
    function openAgentPage(agentKey, pushHistory = true) {
      const a = agentProfiles[agentKey];
      if (!a) return;
      currentAgentKey = agentKey;

      // Ocultar contêiner de abas e barra de navegação
      document.getElementById('tabs-container').classList.add('hidden');
      const navTabs = document.getElementById('nav-tabs-wrapper');
      if (navTabs) navTabs.classList.add('hidden');

      // Exibir página limpa dedicada do agente
      document.getElementById('agent-detail-page').classList.remove('hidden');

      if (pushHistory && window.location.hash !== '#agente-' + agentKey) {
        history.pushState({ agent: agentKey, type: 'agent' }, '', '#agente-' + agentKey);
      }

      // Preencher dados na página
      document.getElementById('page-agent-breadcrumb').innerText = a.title;
      document.getElementById('page-agent-title').innerText = a.title;
      document.getElementById('page-agent-role').innerText = a.role;
      document.getElementById('page-agent-model').innerText = 'Modelo: ' + a.model;
      document.getElementById('page-agent-autonomy').innerText = a.autonomy;
      document.getElementById('page-agent-mission').innerText = a.mission;
      document.getElementById('page-agent-filepath').innerText = a.filePath;
      document.getElementById('page-agent-icon-box').innerText = a.icon;

      // Stack
      document.getElementById('page-agent-stack').innerHTML = a.stack.map(s => `
        <span class="px-2.5 py-1 rounded-lg bg-slate-200/90 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">${s}</span>
      `).join('');

      // Responsibilities
      document.getElementById('page-agent-responsibilities').innerHTML = a.responsibilities.map(r => `
        <li class="flex items-start gap-2">
          <i data-lucide="check" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"></i>
          <span>${r}</span>
        </li>
      `).join('');

      // Triggers
      document.getElementById('page-agent-triggers').innerHTML = a.triggers.map(t => `
        <li class="flex items-start gap-2">
          <i data-lucide="play-circle" class="w-4 h-4 text-amber-500 shrink-0 mt-0.5"></i>
          <span>${t}</span>
        </li>
      `).join('');

      // Rules
      document.getElementById('page-agent-rules').innerHTML = a.rules.map(rl => `
        <li class="flex items-start gap-2">
          <i data-lucide="shield-alert" class="w-4 h-4 text-rose-500 shrink-0 mt-0.5"></i>
          <span>${rl}</span>
        </li>
      `).join('');

      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.lucide) lucide.createIcons();
    }
    window.openAgentPage = openAgentPage;

    function closeAgentPage() {
      document.getElementById('agent-detail-page').classList.add('hidden');
      const navTabs = document.getElementById('nav-tabs-wrapper');
      if (navTabs) navTabs.classList.remove('hidden');
      document.getElementById('tabs-container').classList.remove('hidden');
      switchTab('tab-squad', true);
    }
    window.closeAgentPage = closeAgentPage;

    function copyCliCommand() {
      if (!currentAgentKey || !agentProfiles[currentAgentKey]) return;
      const cmd = agentProfiles[currentAgentKey].cliCommand;
      navigator.clipboard.writeText(cmd).then(() => {
        const btn = document.getElementById('btn-copy-cli');
        btn.innerHTML = '<i data-lucide="check" class="w-4 h-4"></i> Comando Copiado!';
        if (window.lucide) lucide.createIcons();
        setTimeout(() => {
          btn.innerHTML = '<i data-lucide="terminal" class="w-4 h-4"></i> Copiar Comando CLI';
          if (window.lucide) lucide.createIcons();
        }, 2000);
      });
    }

    // Modal Helpers
    function closeModal(modalId) {
      const el = document.getElementById(modalId);
      if (el) el.classList.add('hidden');
    }

    function openArtModal() {
      document.getElementById('art-modal').classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }

