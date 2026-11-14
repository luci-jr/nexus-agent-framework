    // ==========================================
    // SISTEMA DE AUTENTICAÇÃO & CONTROLE DE ACESSO
    // ==========================================
    window.nexusIsAuthenticated = false;
    window.nexusUser = null;

    function getNexusAuthToken() {
      const match = document.cookie.match(/(?:^|;\s*)nexus_token=([^;]+)/);
      if (match) return decodeURIComponent(match[1]);
      try {
        return sessionStorage.getItem('nexus_token') || 
               localStorage.getItem('nexus_token') || 
               localStorage.getItem('nexus_auth_token') || '';
      } catch (e) {
        return '';
      }
    }
    window.getNexusAuthToken = getNexusAuthToken;

    async function checkAuthStatus() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'google_success') {
          window.history.replaceState({}, document.title, window.location.pathname);
          if (typeof window.showToast === 'function') {
            window.showToast('Autenticado com sucesso via Google!', 'success');
          }
        }
        const token = getNexusAuthToken();
        const headers = token ? { 'Authorization': 'Bearer ' + token } : {};
        const res = await fetch('/api/auth/status', { headers });
        if (res.ok) {
          const data = await res.json();
          window.nexusIsAuthenticated = !!data.authenticated;
          window.nexusUser = data.user || null;
          if (data.token && (!token || data.no_auth_mode)) {
            try { localStorage.setItem('nexus_auth_token', data.token); } catch (_) {}
          }
          if (data.no_auth_mode) {
            document.body.classList.add('local-dev-mode');
            applyLocalDevFocus();
          }
        } else {
          window.nexusIsAuthenticated = false;
          window.nexusUser = null;
        }
      } catch (e) {
        console.warn('Erro ao verificar auth status:', e);
        window.nexusIsAuthenticated = false;
      }
      applyAuthUIState();
    }
    window.checkAuthStatus = checkAuthStatus;

    function applyAuthUIState() {
      const isAuth = window.nexusIsAuthenticated;
      const btn = document.getElementById('btn-auth-user');
      const label = document.getElementById('auth-btn-label');
      const sub = document.getElementById('auth-btn-sub');
      const icon = document.getElementById('auth-btn-icon');
      const avatarBox = document.getElementById('auth-avatar-box');
      
      if (btn && label) {
        if (isAuth) {
          label.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span><span>Lucivaldo</span>';
          if (sub) {
            sub.textContent = 'Tech Lead';
            sub.className = 'text-[9px] text-slate-500 dark:text-[#b0b0b0] font-sans mt-0.5 text-right w-full block';
          }
          btn.className = 'group flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-200/90 dark:bg-[#121626bd] border border-slate-300/80 dark:border-[#a0522d]/70 hover:border-[#ff914d] transition-all shadow-xs dark:shadow-[0_0_12px_rgba(160,82,45,0.25)] hover:shadow-[0_0_16px_rgba(160,82,45,0.45)] cursor-pointer';
          btn.title = 'Autenticado como Dono (Lucivaldo Junior) · Clique para ver sessão';
          if (avatarBox) {
            avatarBox.className = 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/15 dark:bg-[#1a2138] border border-emerald-500/30 dark:border-[#a0522d] flex items-center justify-center text-emerald-600 dark:text-[#ff914d] shadow-[0_0_8px_rgba(160,82,45,0.35)] group-hover:scale-105 transition-transform shrink-0';
          }
          if (icon) {
            icon.setAttribute('data-lucide', 'shield-check');
            icon.className = 'w-4 h-4 text-emerald-500 dark:text-[#4da3ff]';
          }
        } else {
          label.innerHTML = '<span>ENTRAR</span>';
          if (sub) sub.textContent = 'Visitante';
          btn.className = 'group flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300/80 dark:border-slate-700 hover:border-brand-500 transition shadow-xs cursor-pointer';
          btn.title = 'Fazer login com senha mestra para desbloquear documentos e terminal';
          if (avatarBox) {
            avatarBox.className = 'w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-300 dark:bg-slate-700 border border-slate-400/40 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0';
          }
          if (icon) {
            icon.setAttribute('data-lucide', 'user');
            icon.className = 'w-4 h-4 text-slate-600 dark:text-slate-300';
          }
        }
        if (window.lucide) lucide.createIcons();
      }

      // 1. Vault Tab
      const vaultGuestLock = document.getElementById('vault-guest-lock');
      const vaultMainWrapper = document.getElementById('vault-main-wrapper');
      if (vaultGuestLock && vaultMainWrapper) {
        if (isAuth) {
          vaultGuestLock.classList.add('hidden');
          vaultMainWrapper.classList.remove('hidden');
        } else {
          vaultGuestLock.classList.remove('hidden');
          vaultMainWrapper.classList.add('hidden');
        }
      }

      // 2. Terminal Tab
      const termGuestLock = document.getElementById('terminal-guest-lock');
      const termMainWrapper = document.getElementById('terminal-main-wrapper');
      if (termGuestLock && termMainWrapper) {
        if (isAuth) {
          termGuestLock.classList.add('hidden');
          termMainWrapper.classList.remove('hidden');
        } else {
          termGuestLock.classList.remove('hidden');
          termMainWrapper.classList.add('hidden');
        }
      }

      // 3. WhatsApp Tab (Máscara e Blindagem de Dados Pessoais)
      const ownerEl = document.getElementById('bridge-owner-number');
      const senderInput = document.getElementById('whatsapp-test-sender');
      if (ownerEl) {
        ownerEl.textContent = isAuth ? 'Dono Autorizado (Autenticado)' : '🔒 Restrito (Requer Senha Mestra)';
      }
      if (senderInput) {
        if (isAuth) {
          if (!senderInput.value) senderInput.value = '5511999990000';
          senderInput.placeholder = '5511999990000 (Dono Autorizado)';
          senderInput.disabled = false;
        } else {
          senderInput.value = '';
          senderInput.placeholder = '🔒 Requer autenticação com Senha Mestra';
          senderInput.disabled = true;
        }
      }

      // Blindagem estrita contra autofill no campo de busca do Grafo Neural
      const graphSearchInput = document.getElementById('graph-search');
      if (graphSearchInput) {
        graphSearchInput.value = '';
        graphSearchInput.setAttribute('autocomplete', 'off');
      }

      // 4. Ações Operacionais em Serviços (Grafo Neural & Drawer)
      const gnpGuestLocked = document.getElementById('gnp-actions-guest-locked');
      const gnpAuthActions = document.getElementById('gnp-actions-authenticated');
      if (gnpGuestLocked && gnpAuthActions) {
        if (isAuth) {
          gnpGuestLocked.classList.add('hidden');
          gnpAuthActions.classList.remove('hidden');
        } else {
          gnpGuestLocked.classList.remove('hidden');
          gnpAuthActions.classList.add('hidden');
        }
      }

      const drawerGuestLocked = document.getElementById('drawer-actions-guest-locked');
      const drawerAuthActions = document.getElementById('drawer-actions-authenticated');
      if (drawerGuestLocked && drawerAuthActions) {
        if (isAuth) {
          drawerGuestLocked.classList.add('hidden');
          drawerAuthActions.classList.remove('hidden');
        } else {
          drawerGuestLocked.classList.remove('hidden');
          drawerAuthActions.classList.add('hidden');
        }
      }

      if (window.lucide) lucide.createIcons();
    }

    function applyLocalDevFocus() {
      // 1. Oculta abas que são ruído no ambiente local (WhatsApp e Infra Swarm)
      const tabWa = document.getElementById('btn-tab-whatsapp');
      if (tabWa) tabWa.classList.add('hidden', 'local-excluded');
      const tabSvc = document.getElementById('btn-tab-services');
      if (tabSvc) tabSvc.classList.add('hidden', 'local-excluded');
      
      // 2. Renomeia categoria 'Operações & Infra' para 'Squad & Ferramentas' (elimina menção a Infra no modo local)
      const btnOps = document.getElementById('btn-cat-ops');
      if (btnOps) {
        btnOps.title = '10 Copilotos Especialistas do Squad e Ferramentas MCP';
        const spanOps = btnOps.querySelector('span:first-child');
        if (spanOps) spanOps.innerHTML = '👥 Squad &amp; Ferramentas';
      }

      // Atualiza contadores visuais das categorias
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

      // 4. Limpeza e calibração do Terminal para o ambiente Local (Ubuntu)
      const btnCloud = document.getElementById('btn-term-node-cloud');
      if (btnCloud) {
        btnCloud.classList.add('hidden');
        btnCloud.style.display = 'none';
      }
      const btnSwarm = document.getElementById('btn-term-swarm');
      if (btnSwarm) {
        btnSwarm.classList.add('hidden');
        btnSwarm.style.display = 'none';
      }

      const termDesc = document.getElementById('term-session-desc');
      if (termDesc) termDesc.textContent = 'Sessão interativa conectada ao terminal local da sua máquina (Ubuntu Desktop)';

      updateTerminalDynamicTitle();

      // 5. Oculta filtro de infraestrutura Swarm no Grafo Neural no modo local
      const filterSvc = document.getElementById('gfilter-service');
      if (filterSvc) filterSvc.classList.add('hidden');

      // Garante que o target do terminal seja local nativo
      currentTerminalTarget = 'local';
      updateTerminalControlsUI();
    }
    window.applyLocalDevFocus = applyLocalDevFocus;

    function handleAuthButtonClick() {
      openAuthModal();
    }
    window.handleAuthButtonClick = handleAuthButtonClick;

    function openAuthModal(promptMsg) {
      const modal = document.getElementById('nexus-auth-modal');
      const formView = document.getElementById('auth-form-view');
      const loggedView = document.getElementById('auth-logged-view');
      const promptText = document.getElementById('auth-modal-prompt-text');
      const passInput = document.getElementById('auth-master-password');
      const errorMsg = document.getElementById('auth-error-msg');

      if (!modal) return;
      if (errorMsg) errorMsg.classList.add('hidden');
      if (passInput) passInput.value = '';

      if (promptMsg && promptText) {
        promptText.textContent = promptMsg;
      } else if (promptText) {
        promptText.innerHTML = 'Informe a <strong>Senha Mestra</strong> para desbloquear o cofre de documentos (Vault), sessões completas do WhatsApp e terminal interativo PTY.';
      }

      if (window.nexusIsAuthenticated) {
        if (formView) formView.classList.add('hidden');
        if (loggedView) loggedView.classList.remove('hidden');
        const userDisp = document.getElementById('auth-user-display');
        if (userDisp && window.nexusUser) {
          userDisp.textContent = window.nexusUser.name || 'Lucivaldo Junior';
        }
      } else {
        if (formView) formView.classList.remove('hidden');
        if (loggedView) loggedView.classList.add('hidden');
        setTimeout(() => passInput && passInput.focus(), 150);
      }

      modal.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
    window.openAuthModal = openAuthModal;

    function closeAuthModal() {
      const modal = document.getElementById('nexus-auth-modal');
      if (modal) modal.classList.add('hidden');
    }
    window.closeAuthModal = closeAuthModal;

    function togglePasswordVisibility(inputId = 'auth-master-password', wrapperId = 'auth-eye-wrapper') {
      const passInput = document.getElementById(inputId);
      const wrapper = document.getElementById(wrapperId);
      if (!passInput) return;
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      if (wrapper) {
        const iconName = isPass ? 'eye-off' : 'eye';
        const iconSize = inputId === 'auth-master-password' ? 'w-4 h-4' : 'w-3.5 h-3.5';
        const colorClass = isPass ? 'text-brand-500' : 'text-slate-400';
        wrapper.innerHTML = `<i data-lucide="${iconName}" class="${iconSize} ${colorClass}"></i>`;
        if (window.lucide) lucide.createIcons();
      }
    }
    window.togglePasswordVisibility = togglePasswordVisibility;

    async function submitLogin() {
      const passInput = document.getElementById('auth-master-password');
      const errorMsg = document.getElementById('auth-error-msg');
      const btn = document.getElementById('btn-submit-login');
      const password = passInput ? passInput.value.trim() : '';

      if (!password) {
        if (errorMsg) {
          errorMsg.textContent = 'Por favor, digite a senha mestra.';
          errorMsg.classList.remove('hidden');
        }
        return;
      }

      if (btn) btn.disabled = true;
      if (errorMsg) errorMsg.classList.add('hidden');

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (btn) btn.disabled = false;

        if (res.ok && data.ok) {
          try {
            if (data.token) {
              localStorage.setItem('nexus_token', data.token);
              sessionStorage.setItem('nexus_token', data.token);
            }
          } catch (e) {}
          closeAuthModal();
          await checkAuthStatus();
          showToast('Autenticado com sucesso! Bem-vindo, Lucivaldo. 🚀');
          
          // Recarregar aba ativa para atualizar dados confidenciais
          const activeBtn = document.querySelector('#nav-tabs-bar .tab-btn.active');
          if (activeBtn) {
            const activeId = activeBtn.id.replace('btn-', '');
            if (activeId === 'tab-vault') loadVaultTab();
            else if (activeId === 'tab-terminal') initOrFocusTerminal();
            else if (activeId === 'tab-whatsapp') loadWhatsAppTab();
            else if (activeId === 'tab-conteudo') loadConteudoTab();
          }
        } else {
          if (errorMsg) {
            errorMsg.textContent = data.error || 'Senha incorreta.';
            errorMsg.classList.remove('hidden');
          }
        }
      } catch (err) {
        if (btn) btn.disabled = false;
        if (errorMsg) {
          errorMsg.textContent = 'Erro ao conectar: ' + err.message;
          errorMsg.classList.remove('hidden');
        }
      }
    }
    window.submitLogin = submitLogin;

    async function submitLogout() {
      try {
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (_) {}
        
        // Limpa cookies no navegador
        document.cookie = 'nexus_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'nexus_token=; Path=/; Domain=lucivaldo.cloud; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = '_forward_auth=; Path=/; Domain=lucivaldo.cloud; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = '_forward_auth_csrf=; Path=/; Domain=lucivaldo.cloud; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

        // Limpa TODAS as referências de token do armazenamento local
        try {
          localStorage.removeItem('nexus_auth_token');
          localStorage.removeItem('nexus_token');
          sessionStorage.removeItem('nexus_token');
        } catch (_) {}

        window.nexusIsAuthenticated = false;
        window.nexusUser = null;
        closeAuthModal();

        // Se estava no terminal, fecha
        if (typeof termSocket !== 'undefined' && termSocket) {
          try { isTermManuallyClosed = true; termSocket.close(); } catch (_) {}
        }

        // Redireciona limpando qualquer query param de autenticação
        window.location.href = '/';
      } catch (err) {
        console.error('Erro no logout:', err);
        window.location.href = '/';
      }
    }
    window.submitLogout = submitLogout;

    function toggleChangePasswordView() {
      const container = document.getElementById('change-pass-container');
      const chevron = document.getElementById('change-pass-chevron');
      if (!container) return;
      const isHidden = container.classList.contains('hidden');
      if (isHidden) {
        container.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');
      } else {
        container.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
      }
    }
    window.toggleChangePasswordView = toggleChangePasswordView;

    async function submitChangePassword() {
      const currInput = document.getElementById('input-curr-pass');
      const newInput = document.getElementById('input-new-pass');
      const msgEl = document.getElementById('change-pass-msg');
      const btn = document.getElementById('btn-submit-change-pass');

      const currPass = currInput ? currInput.value.trim() : '';
      const newPass = newInput ? newInput.value.trim() : '';

      if (!currPass || !newPass) {
        if (msgEl) {
          msgEl.textContent = 'Preencha a senha atual e a nova senha.';
          msgEl.className = 'text-xs text-rose-500 font-mono block';
        }
        return;
      }

      if (newPass.length < 4) {
        if (msgEl) {
          msgEl.textContent = 'A nova senha deve ter no mínimo 4 caracteres.';
          msgEl.className = 'text-xs text-rose-500 font-mono block';
        }
        return;
      }

      if (btn) btn.disabled = true;
      if (msgEl) msgEl.className = 'hidden';

      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_password: currPass, new_password: newPass })
        });
        const data = await res.json();
        if (btn) btn.disabled = false;

        if (res.ok && data.ok) {
          if (msgEl) {
            msgEl.textContent = 'Senha mestra salva no disco (.console_pass) com sucesso! ✅';
            msgEl.className = 'text-xs text-emerald-500 font-mono block';
          }
          if (currInput) currInput.value = '';
          if (newInput) newInput.value = '';
          showToast('Nova senha mestra salva com sucesso no disco!');
        } else {
          if (msgEl) {
            msgEl.textContent = data.error || 'Erro ao alterar senha.';
            msgEl.className = 'text-xs text-rose-500 font-mono block';
          }
        }
      } catch (err) {
        if (btn) btn.disabled = false;
        if (msgEl) {
          msgEl.textContent = 'Erro ao conectar: ' + err.message;
          msgEl.className = 'text-xs text-rose-500 font-mono block';
        }
      }
    }
    window.submitChangePassword = submitChangePassword;

    // Perfis dos Agentes (Dossiê Exaustivo para Páginas Dedicadas)
    const agentProfiles = {
      lucy: {
        title: "Lucy (Agente-Mor & Orquestrador Central)",
        icon: "🌌",
        role: "Tech Lead Sênior, Mentor Técnico & Product Owner (P.O.)",
        model: "Gemini 3.8 Flash (1M+ Tokens)",
        autonomy: "Tech Lead Sênior com Autonomia Total",
        cliCommand: "agy --agent lucy",
        filePath: "agentes/agents/lucy.md",
        mission: "Atuar como o cérebro central, orquestrador e ponto de entrada primário e unificado do desenvolvedor Lucivaldo Junior. O Lucy possui autonomia total de Tech Lead Sênior e Arquiteto para analisar demandas, avaliar impactos sistêmicos e decidir proativamente a melhor abordagem técnica de engenharia, sem travar o desenvolvedor com hesitações, perguntas triviais ou listas burocráticas de opções ('qual tu preferes?'). Aplica Spec-Driven Development de ponta a ponta.",
        stack: ["Gemini 3.8 Flash", "Go 1.22+", "Java 21 LTS", "Spring Boot 3", "Docker Swarm", "Spec-Driven Development", "Dialeto Paraense (Tu)"],
        responsibilities: [
          "Triagem autônoma de demandas: executa de imediato tarefas diretas com excelência.",
          "Alinhamento proativo (Grilling Socrático) em demandas complexas ou ambíguas para fechar brechas conceituais antes de codar.",
          "Delimitação rigorosa de pontos de corte (seams) e critérios de aceite (Definition of Done).",
          "Construção disciplinada (TDD & Implementação) eliminando qualquer scope drift.",
          "Revisão de código (Code Review) auditando conformidade e padrões arquiteturais antes da homologação.",
          "Delegação orquestrada para o squad de 9 copilotos verticais sob demanda."
        ],
        triggers: [
          "Ponto de entrada padrão para iniciar qualquer tarefa no ecossistema Nexus.",
          "Discussões arquiteturais, modelagem de dados e decisões estruturais de alto impacto.",
          "Mentoria técnica socrática (entendimento profundo de JVM, concorrência, estruturas de dados e SO).",
          "Criação e homologação de novos sites, e-commerces, APIs ou automações solopreneur."
        ],
        rules: [
          "Tratamento verbal obrigatório em segunda pessoa com o 'tu' característico do Pará ('tu queres', 'tu vais', 'irmão'), proibido 'você'.",
          "Proibição absoluta de blocos Mermaid (largura limitada do terminal CLI). Substituir por texto puro ou tabelas.",
          "Confirmação explícita obrigatória antes de qualquer exclusão definitiva de arquivos em disco.",
          "Zero hesitação: decida a melhor solução técnica e execute, consultando o desenvolvedor apenas em bifurcações de negócio ou ações destrutivas."
        ]
      },
      backend: {
        title: "Backend Sênior",
        icon: "☕",
        role: "Engenheiro Especialista em Java 21, Spring Boot 3, Go 1.22+ & Bancos Relacionais",
        model: "Java 21 LTS / Go 1.22+",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent backend",
        filePath: "agentes/agents/backend.md",
        mission: "Responsável pela engenharia de microsserviços de alta concorrência, resiliência transacional, APIs RESTful e gRPC limpas, modelagem de dados corporativos e otimização de consultas relacionais em PostgreSQL e MySQL, seguindo o princípio da homogeneidade tecnológica em Go e Java corporativo.",
        stack: ["Java 21 LTS", "Go (Golang 1.22+)", "Spring Boot 3", "PostgreSQL 16", "Redis Cache", "JPA / Hibernate", "Flyway Migrations", "Docker Swarm"],
        responsibilities: [
          "Implementação de microsserviços resilientes com goroutines e Virtual Threads (Project Loom).",
          "Controle estrito de concorrência com locks pessimistas (SELECT FOR UPDATE) e isolamento transacional.",
          "Arquitetura Hexagonal / Clean Architecture com separação rigorosa de domínios e contratos DTOs imutáveis (Records).",
          "Tuning fino de queries SQL e estratégias de indexação em PostgreSQL."
        ],
        triggers: [
          "Criação de novos microsserviços, endpoints RESTful ou bridges de mensageria.",
          "Otimização de queries pesadas e modelagem de entidades relacionais.",
          "Implementação de lógica transacional crítica e concorrência."
        ],
        rules: [
          "Homogeneidade tecnológica: priorizar Go e Java 21 LTS, evitando acúmulo de linguagens avulsas.",
          "Sempre escrever testes automatizados (unitários e de integração com Testcontainers) antes de homologar.",
          "DTOs obrigatoriamente imutáveis (Java Records ou Go structs sem mutabilidade descontrolada)."
        ]
      },
      frontend: {
        title: "Frontend Sênior",
        icon: "🅰️",
        role: "Especialista em Angular 21, Signals, TypeScript & UI de Alta Conversão",
        model: "Angular 21+ / TypeScript Estrito",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent frontend",
        filePath: "agentes/agents/frontend.md",
        mission: "Desenvolvimento de interfaces modernas, Single Page Applications corporativas e landing pages de altíssima conversão, com foco em arquitetura reativa moderna baseada em Signals, Standalone Components e design system sofisticado (Glassmorphism, Tailwind CSS e Lucide Icons).",
        stack: ["Angular 21+", "TypeScript Estrito", "Signals (signal, computed, effect)", "Tailwind CSS 3", "Lucide Icons", "Glassmorphism", "Standalone Components"],
        responsibilities: [
          "Arquitetura frontend 100% Standalone sem NgModules e reatividade pura via Signals sem Zone.js.",
          "Construção de Design Systems modulares de alta conversão para sites e landing pages.",
          "Integração de APIs RESTful e SSE com tratamento elegante de erros e estados de carregamento.",
          "Responsividade impecável para dispositivos móveis e desktops."
        ],
        triggers: [
          "Desenvolvimento de telas e componentes no ecossistema Angular 21.",
          "Criação de protótipos de alta conversão, landing pages e portais de governança.",
          "Refatoração de código frontend legado para Signals e Standalone Components."
        ],
        rules: [
          "Proibido o uso de Zone.js em novos projetos: utilizar reatividade nativa com Signals.",
          "Zero dependências de bibliotecas de UI inchadas: utilizar Tailwind CSS e componentes próprios leves.",
          "Tipagem estrita no TypeScript sem uso de 'any'."
        ]
      },
      sysops: {
        title: "SysOps SRE",
        icon: "🐧",
        role: "Engenheiro SRE, Linux Ubuntu, Docker Swarm & Traefik v3",
        model: "Linux Ubuntu / Docker Swarm / Traefik",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent sysops",
        filePath: "agentes/agents/sysops.md",
        mission: "Sustentação de infraestrutura como código (IaC), redes overlay criptografadas, governança de recursos de hardware e SO no Linux Ubuntu (RAM, swap, zRAM), Traefik v3 com SSL automático e Portainer na nuvem AWS.",
        stack: ["Linux Ubuntu", "Docker Swarm", "Traefik v3", "AWS EC2/RDS", "Redes Overlay", "Portainer CE", "Cloudflare Zero Trust", "zRAM"],
        responsibilities: [
          "Deploy, atualização e escalabilidade de stacks Swarm com Traefik v3 e roteamento dinâmico.",
          "Diagnóstico profundo de SO, governança de RAM/zRAM e prevenção de Out-Of-Memory (OOM).",
          "Blindagem de redes internas com Docker Secrets e isolamento em overlay 'rede-nexus'.",
          "Automação de scripts de backup e sincronização com Google Drive e SSDs."
        ],
        triggers: [
          "Implantação ou migração de novos containers e stacks no Swarm.",
          "Diagnóstico de lentidão no servidor, consumo de memória ou falhas de rede.",
          "Configuração de subdomínios, certificados Let's Encrypt e túneis Cloudflare."
        ],
        rules: [
          "Todos os serviços conectados obrigatoriamente na rede overlay isolada 'rede-nexus'.",
          "Definição obrigatória de limites de recursos (CPU e RAM) nos manifests Docker Compose.",
          "Nunca expor portas desnecessárias diretamente ao host: sempre passar pelo Traefik."
        ]
      },
      frellas: {
        title: "Frellas (Career-Ops)",
        icon: "💼",
        role: "Consultor Sênior em Carreira, Tech Recruiter & Estrategista de Vagas",
        model: "Career-Ops & Negócios Solopreneur",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent frellas",
        filePath: "agentes/agents/frellas.md",
        mission: "Inteligência tática de carreira para vagas PJ/CLT/USD, triagem diária com scoring 1-5 A-H, customização cirúrgica de currículos para passar por ATS sem alucinação, autocandidatura com Playwright e prospecção ativa de contratos de freelance.",
        stack: ["Framework PERF", "Scoring 1-5 A-H", "Playwright", "Otimização ATS", "n8n Cloud", "Detecção de Ghost Jobs", "Story Bank STAR"],
        responsibilities: [
          "Triagem diária de vagas back-end e cloud no LinkedIn, Gupy, TI Pará e plataformas internacionais.",
          "Detecção de 'ghost jobs' (vagas fantasmas) e análise rigorosa de fit técnico e salarial.",
          "Customização cirúrgica de currículos em PDF aderentes aos requisitos do cargo sem alucinar.",
          "Elaboração de propostas comerciais de alto impacto para contratos de freelance e jobs extras."
        ],
        triggers: [
          "Avaliação de Job Descriptions (JDs) de vagas recebidas.",
          "Geração de currículos sob medida para candidaturas estratégicas.",
          "Preparação técnica para entrevistas comportamentais e táticas de negociação salarial."
        ],
        rules: [
          "Zero alucinação: nunca incluir tecnologias que o desenvolvedor não domine ou experiências fictícias.",
          "Seguir rigorosamente o framework PERF e scoring 1-5 para aprovar ou reprovar vagas."
        ]
      },
      qa: {
        title: "QA Confiabilidade",
        icon: "🧪",
        role: "Engenheiro Sênior em Quality Assurance & Testes Automatizados",
        model: "Testcontainers / Playwright / JUnit 5",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent qa",
        filePath: "agentes/agents/qa.md",
        mission: "Garantia de estabilidade e confiabilidade de software através de testes automatizados unitários, de integração real com containers (Testcontainers) e testes de carga sob concorrência.",
        stack: ["JUnit 5", "Mockito", "Testcontainers", "Playwright E2E", "Cypress", "k6 Load Testing"],
        responsibilities: [
          "Automação da pirâmide de testes de ponta a ponta com alta cobertura e confiabilidade.",
          "Testes de integração reais com instâncias de banco PostgreSQL e Redis via Testcontainers.",
          "Execução de testes de carga e estresse com k6 para homologação de vazão e latência p99.",
          "Prevenção rigorosa de regressões antes de qualquer release para produção."
        ],
        triggers: [
          "Criação de suítes de testes unitários ou de integração para APIs e serviços.",
          "Testes de carga e estresse para validar microsserviços concorrentes.",
          "Auditoria de estabilidade e homologação de Definition of Done (DoD)."
        ],
        rules: [
          "Test-first disciplinado: escrever o teste que falha antes da implementação.",
          "Proibido o uso de mocks de banco frágeis: utilizar Testcontainers com instâncias reais de PostgreSQL."
        ]
      },
      secops: {
        title: "SecOps DevSecOps",
        icon: "🛡️",
        role: "Engenheiro Sênior em DevSecOps & Segurança da Informação",
        model: "SAST / SCA / Blindagem de Containers",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent secops",
        filePath: "agentes/agents/secops.md",
        mission: "Auditoria contínua de segurança, varredura estática de vulnerabilidades (SAST com gosec), auditoria de dependências (SCA com Trivy) e proteção de segredos no ecossistema Nexus.",
        stack: ["gosec (SAST Go)", "Trivy (Vulnerabilidades)", "Docker Secrets", "OWASP Top 10", "Mozilla SOPS / Age"],
        responsibilities: [
          "Varredura periódica de código-fonte e imagens Docker em busca de vulnerabilidades e CVEs.",
          "Bloqueio de injeção de credenciais em texto claro e governança via Docker Secrets.",
          "Auditoria de permissões de sistema operacional Linux e conformidade de portas.",
          "Sanitização e blindagem de inputs contra SQL Injection, XSS e CSRF."
        ],
        triggers: [
          "Auditorias pré-deploy de novos microsserviços ou imagens de container.",
          "Varredura de dependências desatualizadas com vulnerabilidades conhecidas.",
          "Revisão de segurança em rotinas de autenticação e manipulação de credenciais."
        ],
        rules: [
          "Tolerância zero a senhas, tokens ou chaves privadas commitadas em repositórios.",
          "Injeção de variáveis confidenciais apenas via runtime seguro ou volumes temporários (tmpfs)."
        ]
      },
      suporte: {
        title: "Suporte N2/N3",
        icon: "🎫",
        role: "Especialista Sênior em Sustentação de Sistemas, Automação Comercial, Fiscal & SQL",
        model: "Atendimento N2/N3 & Sistemas Comerciais",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent suporte",
        filePath: "agentes/agents/suporte.md",
        mission: "Atendimento técnico especializado N2/N3, sustentação e troubleshooting cirúrgico de múltiplos sistemas comerciais e ERPs do varejo (incluindo retaguardas e PDVs frente de caixa como HERA Gestão Fácil, entre outros), consultas analíticas em PostgreSQL e MySQL, decodificação ágil de rejeições fiscais SEFAZ (NFC-e/NF-e) e contingência offline.",
        stack: ["PostgreSQL", "MySQL", "NFC-e / NF-e", "SEFAZ", "Certificados Digitais A1/A3", "TEF / Balanças / Impressoras Térmicas"],
        responsibilities: [
          "Diagnóstico e correção de divergências de dados em bancos relacionais com scripts transacionais seguros.",
          "Decodificação de códigos de rejeição da SEFAZ e desbloqueio de notas em contingência.",
          "Troubleshooting de sincronização entre retaguarda e frente de caixa e fechamento de caixa.",
          "Configuração e resolução de falhas em periféricos de checkout (impressoras térmicas, balanças e TEF)."
        ],
        triggers: [
          "Chamados de erro fiscal ou rejeição de notas NFC-e/NF-e na SEFAZ.",
          "Investigação de divergências de estoque, movimentação financeira ou dados corrompidos.",
          "Travamento de sincronismo de PDVs ou problemas com certificados digitais."
        ],
        rules: [
          "O agente NÃO é exclusivo do Hera; trata-se de um especialista generalizado que atende múltiplos sistemas comerciais.",
          "Toda manipulação de banco de dados deve utilizar transações seguras (BEGIN ... ROLLBACK/COMMIT) com conferência de linhas afetadas."
        ]
      },
      bi: {
        title: "BI Business Intelligence",
        icon: "📊",
        role: "Especialista Sênior em BI, SQL Analítico & Relatórios Executivos",
        model: "SQL Analítico & Relatórios PDF",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent bi",
        filePath: "agentes/agents/bi.md",
        mission: "Análise avançada de dados relacionais em PostgreSQL e MySQL, geração automatizada de relatórios executivos estilizados em PDF via Playwright e inteligência financeira para solopreneurs.",
        stack: ["SQL Analítico Avançado", "Window Functions", "Playwright PDF", "PostgreSQL", "MySQL", "Métricas Solopreneur"],
        responsibilities: [
          "Cálculo de métricas de negócio vitais: Ticket Médio, Curva ABC de produtos, margens brutas/líquidas e giro de estoque.",
          "Geração de relatórios executivos diagramados em PDF prontos para diretoria.",
          "Modelagem de precificação de serviços de engenharia e inteligência financeira para tomada de decisão."
        ],
        triggers: [
          "Necessidade de relatórios analíticos de vendas, faturamento ou estoque.",
          "Cálculo de precificação de projetos e análise financeira de viabilidade.",
          "Construção de queries analíticas com Window Functions e agregações pesadas."
        ],
        rules: [
          "Garantir que consultas analíticas pesadas não causem travamentos em bancos de dados de produção (usar réplicas ou horários de baixo movimento).",
          "Relatórios em PDF devem ter visual executivo limpo, profissional e sem poluição visual."
        ]
      },
      finops: {
        title: "FinOps Multi-Cloud",
        icon: "💰",
        role: "Especialista Sênior em Cloud Financial Operations & Hospedagens Web",
        model: "FinOps & Arbitragem Multi-Cloud",
        autonomy: "Especialista Vertical Sob Demanda",
        cliCommand: "agy --agent finops",
        filePath: "agentes/agents/finops.md",
        mission: "Arbitragem de custos em infraestrutura de nuvem e provedores de hospedagem web (AWS, Oracle Cloud OCI Always Free, Hetzner, Cloudflare R2/Workers, Hostinger, HostGator e Hostinet), estimativa precisa de TCO e corte de gastos desnecessários de computação, storage e taxas de tráfego de saída (data egress).",
        stack: ["AWS Pricing", "Oracle OCI Always Free", "Hetzner Cloud", "Cloudflare R2", "Hostinger (hPanel/KVM)", "HostGator (cPanel)", "Hostinet"],
        responsibilities: [
          "Comparativos objetivos de TCO em BRL e USD com consideração de impostos e IOF.",
          "Eliminação de taxas abusivas de data egress utilizando Cloudflare R2 e Oracle OCI.",
          "Dimensionamento correto (right-sizing) de instâncias e corte de recursos ociosos.",
          "Orientação financeira de onde hospedar novos sites, lojas virtuais ou stacks Swarm."
        ],
        triggers: [
          "Sempre que surgir a dúvida: 'Onde hospedo esse site ou sistema?'",
          "Comparação de preços entre AWS, Hetzner, Oracle OCI, Hostinger, HostGator ou Hostinet.",
          "Auditoria de faturas e identificação de desperdícios em serviços de nuvem."
        ],
        rules: [
          "Explorar ao máximo camadas gratuitas vitalícias confiáveis (Oracle Always Free, Cloudflare R2).",
          "Apresentar custos totais com transparência, incluindo taxas de conversão de moeda e impostos."
        ]
      }
    };

    // Gerenciamento de Navegação e Abas (Separando Mídia Criativa de Operações de Infra)
    const categoryDefaultTabs = {
      core: 'tab-telemetry',
      media: 'tab-conteudo',
      ops: 'tab-squad',
      gov: 'tab-tasks'
    };

