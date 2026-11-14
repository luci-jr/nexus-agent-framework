    // Data Fetching
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();
        globalStatusData = data;

        if (data.console_version) {
          const verBadge = document.getElementById('nexus-console-version-badge');
          if (verBadge) verBadge.textContent = `v${data.console_version} Go`;
        }

        if (data.terminal_title) {
          serverTerminalTitle = data.terminal_title;
          updateTerminalDynamicTitle();
        }

        if (document.getElementById('val-uptime')) {
          document.getElementById('val-uptime').innerText = data.uptime;
        }
        if (document.getElementById('val-mem')) {
          if (data.ram_total_gb > 0) {
            document.getElementById('val-mem').innerText = `${data.ram_used_gb.toFixed(1)} / ${data.ram_total_gb.toFixed(1)} GB (${data.ram_percent}%)`;
          } else {
            document.getElementById('val-mem').innerText = data.mem_alloc_mb.toFixed(2) + ' MB';
          }
        }
        const statMem = document.getElementById('stat-mem');
        if (statMem) statMem.innerText = data.mem_alloc_mb.toFixed(2) + ' MB';
        
        if (data.services) {
          updateBadge('services-count', data.services.length); updateBadge('tools-count', (data.tools || []).length); updateBadge('squad-count', data.squad_count || 10); updateBadge('telemetry-count', data.mem_alloc_mb ? data.mem_alloc_mb.toFixed(1) + 'MB' : '<15MB');
          const statServices = document.getElementById('stat-services-count');
          if (statServices) statServices.innerText = data.services.length;
          const hcServices = document.getElementById('home-card-services');
          if (hcServices) hcServices.innerText = `${data.services.length} Ativos`;
          const hcTools = document.getElementById('home-card-tools');
          if (hcTools) hcTools.innerText = `${(data.tools || []).length} Tools`;
          const hcSquad = document.getElementById('home-card-squad');
          if (hcSquad) hcSquad.innerText = `${data.squad_count || 10} Copilotos`;
          renderFullServices();
        }

        renderTelemetryTab();
        renderMapHUD(data);
        renderMCPTools();
      } catch (e) {
        console.error('Status fetch error:', e);
      }
    }

    function renderFullServices() {
      const container = document.getElementById('full-services-grid');
      if (!container) return;
      const services = (globalStatusData && globalStatusData.services && globalStatusData.services.length > 0)
        ? globalStatusData.services
        : defaultServices;

      container.innerHTML = services.map(s => `
        <div onclick="showServiceModalByName('${s.name}')" class="glass-card p-4 rounded-2xl clickable-card flex flex-col justify-between space-y-3 border-t-2 border-t-emerald-500/50 hover:border-t-emerald-500 transition shadow-sm hover:shadow-md">
          <div>
            <div class="flex items-start justify-between gap-2">
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-brand-600 dark:text-brand-300 font-semibold border border-slate-300/80 dark:border-slate-700">${s.type}</span>
              <span class="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ${s.status || 'Online'}
              </span>
            </div>
            <div class="mt-2 flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">${s.name}</h3>
              <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">${s.replicas || '1/1 Ativo'}</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">${s.description || s.details}</p>
          </div>
          <div class="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
            <div class="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <i data-lucide="zap" class="w-3 h-3 text-amber-500"></i>
                ${s.latency || '2ms'}
              </span>
              <span class="text-[10px] text-slate-400 font-mono">${s.checked_at ? 'Verificado ' + s.checked_at : 'Tempo Real'}</span>
            </div>
            <div class="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span class="truncate max-w-[130px]">${s.network || 'rede-nexus'}</span>
              <span class="text-brand-600 dark:text-brand-400 hover:underline font-medium flex items-center gap-1">Topologia <i data-lucide="chevron-right" class="w-3 h-3"></i></span>
            </div>
          </div>
        </div>
      `).join('');
      if (window.lucide) lucide.createIcons();
    }

    async function refreshServicesRealtime(manual = false) {
      triggerSpin('icon-refresh-services');
      try {
        await fetchStatus();
        if (manual) showToast('Serviços e contêineres atualizados! 🐳');
      } finally {
        clearSpin('icon-refresh-services');
      }
    }
    window.refreshServicesRealtime = refreshServicesRealtime;

    async function refreshTelemetry(manual = false) {
      triggerSpin('icon-refresh-telemetry');
      try {
        await fetchStatus();
        if (typeof reloadGraph === 'function') await reloadGraph();
        if (manual) showToast('Telemetria e Grafo 3D atualizados! ⚡');
      } finally {
        clearSpin('icon-refresh-telemetry');
      }
    }
    window.refreshTelemetry = refreshTelemetry;

    async function refreshTasks(manual = false) {
      if (manual && pendingTaskMovesMap && pendingTaskMovesMap.size > 0) {
        if (window.NexusModal && typeof window.NexusModal.confirm === 'function') {
          const confirmDiscard = await NexusModal.confirm(
            'Descartar alterações?',
            'Você possui movimentações de tarefas que ainda não foram salvas. Deseja descartar essas alterações e recarregar o quadro?',
            { confirmText: 'Descartar e Atualizar', cancelText: 'Manter Alterações', type: 'warning' }
          );
          if (!confirmDiscard) return;
        }
      }
      triggerSpin('icon-refresh-tasks');
      try {
        await fetchTasks();
        if (manual) showToast('Tarefas Kanban atualizadas! 📋');
      } finally {
        clearSpin('icon-refresh-tasks');
      }
    }
    window.refreshTasks = refreshTasks;

    async function refreshADRs(manual = false) {
      triggerSpin('icon-refresh-adrs');
      try {
        await fetchADRs();
        if (manual) showToast('Decisões arquiteturais atualizadas! 📜');
      } finally {
        clearSpin('icon-refresh-adrs');
      }
    }
    window.refreshADRs = refreshADRs;

    async function refreshLessons(manual = false) {
      triggerSpin('icon-refresh-lessons');
      try {
        await fetchLessons();
        if (manual) showToast('Lições aprendidas atualizadas! 💡');
      } finally {
        clearSpin('icon-refresh-lessons');
      }
    }
    window.refreshLessons = refreshLessons;

    async function refreshVaultTree(manual = false) {
      triggerSpin('icon-refresh-vault');
      try {
        if (typeof loadVaultTree === 'function') await loadVaultTree();
        if (manual) showToast('Árvore do Segundo Cérebro atualizada! 🧠');
      } finally {
        clearSpin('icon-refresh-vault');
      }
    }
    window.refreshVaultTree = refreshVaultTree;

    async function refreshWhatsAppTab(manual = false) {
      triggerSpin('icon-refresh-whatsapp');
      try {
        await loadWhatsAppTab();
        if (manual) showToast('Status da Ponte WhatsApp atualizado! 💬');
      } finally {
        clearSpin('icon-refresh-whatsapp');
      }
    }
    window.refreshWhatsAppTab = refreshWhatsAppTab;

    async function refreshConteudos(manual = false) {
      const icon = document.getElementById('icon-refresh-conteudo');
      if (icon) icon.classList.add('animate-spin');
      try {
        if (typeof loadConteudoTab === 'function') await loadConteudoTab();
        if (manual) showToast('Catálogo de mídias atualizado! 🎬');
      } finally {
        setTimeout(() => {
          if (icon) icon.classList.remove('animate-spin');
        }, 600);
      }
    }
    window.refreshConteudos = refreshConteudos;

    function showServiceModalByName(serviceName) {
      if (!globalStatusData || !globalStatusData.services) return;
      const s = globalStatusData.services.find(item => item.name.toLowerCase().includes(serviceName.toLowerCase()));
      if (!s) return;

      document.getElementById('modal-service-title').innerText = s.name;
      document.getElementById('modal-service-body').innerHTML = `
        <div class="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="text-slate-600 dark:text-slate-400 font-medium">Status Operacional:</span>
            <span class="font-bold font-mono ${s.status === 'Online' ? 'text-emerald-600 dark:text-emerald-400' : 'text-cyan-600 dark:text-cyan-400'}">${s.status}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-600 dark:text-slate-400 font-medium">Tipo:</span>
            <span class="text-slate-800 dark:text-slate-200 font-mono">${s.type}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-slate-600 dark:text-slate-400 font-medium">Rede Docker:</span>
            <span class="text-slate-800 dark:text-slate-200 font-mono">${s.network || 'rede-nexus'}</span>
          </div>
          ${s.image ? `
          <div class="flex items-center justify-between">
            <span class="text-slate-600 dark:text-slate-400 font-medium">Imagem:</span>
            <span class="text-slate-800 dark:text-slate-200 font-mono">${s.image}</span>
          </div>` : ''}
          ${s.endpoint ? `
          <div class="flex items-center justify-between">
            <span class="text-slate-600 dark:text-slate-400 font-medium">Endpoint:</span>
            <span class="text-brand-600 dark:text-brand-400 font-mono font-semibold">${s.endpoint}</span>
          </div>` : ''}
        </div>
        <div>
          <h4 class="font-semibold text-slate-800 dark:text-slate-300 mb-1">Descrição Arquitetural:</h4>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed">${s.description || s.details}</p>
        </div>
        <div>
          <h4 class="font-semibold text-slate-800 dark:text-slate-300 mb-1">Configuração &amp; Topologia:</h4>
          <p class="text-slate-600 dark:text-slate-400 font-mono text-[11px] bg-slate-100 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">${s.details}</p>
        </div>
      `;
      document.getElementById('service-modal').classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }

    function renderMCPTools() {
      const container = document.getElementById('mcp-tools-container');
      if (!container) return;
      const list = (globalStatusData && globalStatusData.tools && globalStatusData.tools.length > 0)
        ? globalStatusData.tools
        : defaultTools;
      const query = (document.getElementById('tools-search-input')?.value || '').toLowerCase();

      const filtered = list.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.description.toLowerCase().includes(query) || 
        t.category.toLowerCase().includes(query)
      );

      container.innerHTML = filtered.map((t, idx) => `
        <div class="glass-card p-4 rounded-2xl border-l-4 border-l-cyan-500 hover:border-[#ff914d]/70 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(160,82,45,0.25)] transition-all shadow-sm flex flex-col justify-between group">
          <div>
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-cyan-400">
                <i data-lucide="wrench" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-1">
                  <h4 class="font-mono text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-400 transition truncate" title="${t.name}">
                    ${t.name}
                  </h4>
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Ativo"></span>
                </div>
                <p class="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 mt-0.5 truncate">${t.category}</p>
              </div>
            </div>
            <p class="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2" title="${t.description}">
              ${t.description}
            </p>
          </div>
          <div class="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
            <div class="w-full py-1.5 px-3 rounded-xl bg-slate-200/80 dark:bg-[#151a2d] border border-slate-300/80 dark:border-slate-700/80 text-[11px] font-bold font-mono text-slate-700 dark:text-slate-200 flex items-center justify-between group-hover:border-[#ff914d] group-hover:text-[#ff914d] group-hover:shadow-[0_0_12px_rgba(160,82,45,0.35)] transition-all">
              <span class="flex items-center gap-1.5">
                <i data-lucide="terminal" class="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ff914d]"></i>
                <span>TOOL #${idx + 1}</span>
              </span>
              <span class="text-emerald-500 text-[10px] font-semibold flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> SSE/Stdio
              </span>
            </div>
          </div>
        </div>
      `).join('') || '<p class="text-xs text-slate-400 italic col-span-full">Nenhuma ferramenta encontrada com essa busca.</p>';
      
      if (window.lucide) lucide.createIcons();
    }

    function filterTools() {
      renderMCPTools();
    }

    function renderMapHUD(d) {
      if (!d) return;
      const elRam = document.getElementById('map-hud-ram');
      const elRamBar = document.getElementById('map-hud-ram-bar');
      const elSwap = document.getElementById('map-hud-swap');
      const elHeap = document.getElementById('map-hud-heap');
      const elUptime = document.getElementById('map-hud-uptime');

      if (elRam) {
        if (d.ram_total_gb > 0) {
          elRam.innerText = `${d.ram_used_gb.toFixed(1)} / ${d.ram_total_gb.toFixed(1)} GB (${d.ram_percent}%)`;
        } else if (d.mem_sys_mb) {
          elRam.innerText = d.mem_sys_mb.toFixed(1) + ' MB';
        }
      }

      if (elRamBar) {
        const pct = d.ram_percent || Math.round(((d.ram_used_gb || 0) / (d.ram_total_gb || 1)) * 100) || 50;
        const filled = Math.min(10, Math.max(1, Math.round((pct / 100) * 10)));
        let html = '';
        for (let i = 0; i < 10; i++) {
          const isFilled = i < filled;
          const color = (i >= 8) ? 'bg-rose-500' : ((i >= 6) ? 'bg-amber-500' : 'bg-emerald-500');
          html += `<span class="inline-block w-2.5 h-3 rounded-[2px] transition-all duration-300 ${isFilled ? color : 'bg-slate-300 dark:bg-slate-700/40 opacity-40'}"></span>`;
        }
        elRamBar.innerHTML = html;
      }

      if (elSwap) {
        if (d.swap_total_gb > 0) {
          elSwap.innerText = `${d.swap_used_gb.toFixed(1)} / ${d.swap_total_gb.toFixed(1)} GB`;
        } else {
          elSwap.innerText = '0.0 GB';
        }
      }

      if (elHeap) {
        elHeap.innerText = (d.mem_alloc_mb || 0).toFixed(2) + ' MB';
      }

      if (elUptime) {
        elUptime.innerText = `${d.goroutines || 0} threads • ${d.uptime || '--'}`;
      }
    }

    function renderTelemetryTab() {
      if (!globalStatusData) return;
      const d = globalStatusData;

      const ramHost = document.getElementById('telemetry-ram-host');
      const swapHost = document.getElementById('telemetry-swap-host');
      const heap = document.getElementById('telemetry-heap');
      const goroutines = document.getElementById('telemetry-goroutines');
      const uptimeSub = document.getElementById('telemetry-uptime-sub');

      if (ramHost) {
        ramHost.innerText = (d.ram_total_gb > 0)
          ? `${d.ram_used_gb.toFixed(1)} / ${d.ram_total_gb.toFixed(1)} GB (${d.ram_percent}%)`
          : (d.mem_sys_mb ? d.mem_sys_mb.toFixed(1) + ' MB' : '--');
      }
      if (swapHost) {
        swapHost.innerText = (d.swap_total_gb > 0)
          ? `${d.swap_used_gb.toFixed(1)} / ${d.swap_total_gb.toFixed(1)} GB`
          : '0.0 GB';
      }
      if (heap) heap.innerText = d.mem_alloc_mb.toFixed(2) + ' MB';
      if (goroutines) goroutines.innerText = d.goroutines + ' threads';
      if (uptimeSub) uptimeSub.innerText = 'Atividade: ' + d.uptime;
    }

    const taskLimitState = { backlog: 4, todo: 4, 'in-progress': 4, homologacao: 4, done: 4, archived: 4 };
    let lastTasksData = { backlog: [], todo: [], in_progress: [], homologacao: [], done: [], archived: [] };
    let currentDraggedTask = null;
    let savedTasksSnapshot = null;
    let pendingTaskMovesMap = new Map();

    function getTaskOriginalSection(taskId) {
      if (!savedTasksSnapshot) return null;
      const keys = ['backlog', 'todo', 'in_progress', 'homologacao', 'done', 'archived'];
      for (const k of keys) {
        if ((savedTasksSnapshot[k] || []).some(t => t.id === taskId)) {
          return k;
        }
      }
      return null;
    }

    function updateKanbanActionsState() {
      const btnUndo = document.getElementById('btn-undo-tasks');
      const btnSave = document.getElementById('btn-save-tasks');
      const lblSave = document.getElementById('label-save-tasks');
      const iconSave = document.getElementById('icon-save-tasks');
      const count = pendingTaskMovesMap ? pendingTaskMovesMap.size : 0;

      if (iconSave) {
        iconSave.setAttribute('data-lucide', 'save');
        iconSave.classList.remove('animate-spin');
      }

      if (count === 0) {
        if (btnUndo) {
          btnUndo.disabled = true;
          btnUndo.className = 'btn-action text-xs opacity-40 cursor-not-allowed flex items-center gap-1.5 transition-all text-slate-400 border-slate-300/40 dark:border-slate-700/40';
          btnUndo.title = 'Nenhuma alteração para desfazer';
        }
        if (btnSave) {
          btnSave.disabled = true;
          btnSave.className = 'btn-action text-xs opacity-40 cursor-not-allowed flex items-center gap-1.5 transition-all font-semibold text-slate-400 border-slate-300/40 dark:border-slate-700/40';
          btnSave.title = 'Nenhuma alteração pendente';
          if (lblSave) lblSave.innerText = 'Salvar Alterações';
        }
      } else {
        if (btnUndo) {
          btnUndo.disabled = false;
          btnUndo.className = 'btn-action text-xs cursor-pointer flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/50 hover:bg-amber-500/15 hover:border-amber-500 transition-all font-semibold shadow-xs';
          btnUndo.title = `Desfazer ${count} alteraç${count > 1 ? 'ões' : 'ão'} não salva${count > 1 ? 's' : ''}`;
        }
        if (btnSave) {
          btnSave.disabled = false;
          btnSave.className = 'btn-action text-xs cursor-pointer flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/60 bg-emerald-500/15 hover:bg-emerald-500/25 hover:border-emerald-500 transition-all font-bold shadow-xs ring-1 ring-emerald-500/30 animate-pulse';
          btnSave.title = `Salvar ${count} alteraç${count > 1 ? 'ões' : 'ão'} no repositório`;
          if (lblSave) lblSave.innerText = `Salvar Alterações (${count})`;
        }
      }
      if (window.lucide) lucide.createIcons();
    }
    window.updateKanbanActionsState = updateKanbanActionsState;

    function getTaskAuthHeaders() {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('nexus_auth_token') || (typeof getNexusAuthToken === 'function' ? getNexusAuthToken() : '');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = 'Bearer ' + token;
      return headers;
    }

    function updateKanbanBadges() {
      const backlogCount = (lastTasksData.backlog || []).length;
      const todoCount = (lastTasksData.todo || []).length;
      const inProgCount = (lastTasksData.in_progress || []).length;
      const homoCount = (lastTasksData.homologacao || []).length;
      const doneCount = (lastTasksData.done || []).length;
      const archivedCount = (lastTasksData.archived || []).length;
      const total = backlogCount + todoCount + inProgCount + homoCount + doneCount + archivedCount;

      const bBacklog = document.getElementById('badge-backlog');
      if (bBacklog) bBacklog.innerText = backlogCount;
      const bTodo = document.getElementById('badge-todo');
      if (bTodo) bTodo.innerText = todoCount;
      const bHomo = document.getElementById('badge-homologacao');
      if (bHomo) bHomo.innerText = homoCount;
      const bInProg = document.getElementById('badge-in-progress');
      if (bInProg) bInProg.innerText = inProgCount;
      const bDone = document.getElementById('badge-done');
      if (bDone) bDone.innerText = doneCount;
      const bArchived = document.getElementById('badge-archived');
      if (bArchived) bArchived.innerText = archivedCount;
      const tCount = document.getElementById('task-count');
      if (tCount) tCount.innerText = total;
      const hcTasks = document.getElementById('home-card-tasks');
      if (hcTasks) hcTasks.innerText = total + ' Tarefas';
    }

    const renderTaskCard = (t, accent, colKey) => {
      const safeTitle = (t.title || '').replace(/"/g, '&quot;');
      const safeId = (t.id || 'TASK').replace(/"/g, '&quot;');
      const searchData = `${safeTitle} ${safeId} ${t.context || ''}`.toLowerCase();
      return `
        <div class="glass-card p-3 rounded-xl space-y-1.5 transition hover:border-[#ff914d]/70 dark:hover:border-[#ff914d]/70 kanban-task-card cursor-grab active:cursor-grabbing group relative select-none"
             draggable="true"
             data-task-id="${safeId}"
             data-column="${colKey}"
             ondragstart="onTaskDragStart(event, '${safeId}', '${colKey}')"
             ondragend="onTaskDragEnd(event)"
             data-search="${searchData}">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <input type="checkbox" onchange="toggleTaskStatus('${safeId}', this)" ${t.completed ? 'checked' : ''} class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500" title="Alternar conclusão da tarefa" onclick="event.stopPropagation()" />
              <span class="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">${safeId}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-slate-500 font-mono">${t.responsible || ''}</span>
              <button onclick="event.stopPropagation(); openEditTaskModal('${safeId}')" class="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-[#ff914d] transition cursor-pointer" title="Editar Tarefa">
                <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              </button>
              <button onclick="event.stopPropagation(); deleteTaskPrompt('${safeId}')" class="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Excluir Tarefa">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
          <p class="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-snug cursor-pointer hover:text-[#ff914d] transition flex items-center justify-between" onclick="openTaskDetailModal('${safeId}')">
            <span>${t.title}</span>
            <span class="text-[10px] text-slate-400 group-hover:text-[#ff914d] transition shrink-0 ml-1">Abrir ↗</span>
          </p>
          ${t.context ? `<p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 cursor-pointer hover:text-slate-300 transition" onclick="openTaskDetailModal('${safeId}')">${t.context}</p>` : ''}
        </div>
      `;
    };

    const renderDoneCard = (t) => {
      const safeTitle = (t.title || '').replace(/"/g, '&quot;');
      const safeId = (t.id || 'TASK').replace(/"/g, '&quot;');
      const searchData = `${safeTitle} ${safeId} ${t.context || ''}`.toLowerCase();
      return `
        <div class="glass-card p-2.5 rounded-xl space-y-1 hover:border-emerald-500/40 transition kanban-task-card cursor-grab active:cursor-grabbing group relative select-none"
             draggable="true"
             data-task-id="${safeId}"
             data-column="done"
             ondragstart="onTaskDragStart(event, '${safeId}', 'done')"
             ondragend="onTaskDragEnd(event)"
             data-search="${searchData}">
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <input type="checkbox" onchange="toggleTaskStatus('${safeId}', this)" ${t.completed ? 'checked' : ''} class="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-500 shrink-0" title="Reabrir tarefa no backlog" onclick="event.stopPropagation()" />
              <span class="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate">${safeId}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono font-bold">Feita ✅</span>
              <button onclick="event.stopPropagation(); openEditTaskModal('${safeId}')" class="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition cursor-pointer" title="Editar Tarefa">
                <i data-lucide="edit-3" class="w-3 h-3"></i>
              </button>
              <button onclick="event.stopPropagation(); deleteTaskPrompt('${safeId}')" class="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/15 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Excluir Tarefa">
                <i data-lucide="trash-2" class="w-3 h-3"></i>
              </button>
            </div>
          </div>
          <p class="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug line-clamp-2 cursor-pointer hover:text-emerald-400 transition" onclick="openTaskDetailModal('${safeId}')">${t.title}</p>
          ${t.context ? `
            <details class="group mt-1 cursor-pointer">
              <summary class="text-[10px] text-slate-500 dark:text-slate-400 font-mono hover:text-slate-700 dark:hover:text-slate-200 list-none flex items-center gap-1">
                <span class="group-open:rotate-90 transition-transform inline-block text-[9px]">▶</span> Detalhes
              </summary>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-2 border-l-2 border-emerald-500/40 leading-relaxed">${t.context}</p>
            </details>
          ` : ''}
        </div>
      `;
    };

    // ==========================================
    // DRAG AND DROP DO QUADRO DE ENGENHARIA
    // ==========================================
    function onTaskDragStart(event, taskId, colKey) {
      currentDraggedTask = { id: taskId, fromCol: colKey };
      event.dataTransfer.setData('text/plain', taskId);
      event.dataTransfer.effectAllowed = 'move';
      setTimeout(() => {
        if (event.target) event.target.classList.add('opacity-40', 'scale-95');
      }, 0);
    }
    window.onTaskDragStart = onTaskDragStart;

    function onTaskDragEnd(event) {
      if (event && event.target) {
        event.target.classList.remove('opacity-40', 'scale-95');
      }
      document.querySelectorAll('#col-backlog, #col-todo, #col-in-progress, #col-homologacao, #col-done, #col-archived').forEach(el => {
        el.classList.remove('ring-2', 'ring-[#ff914d]', 'bg-[#ff914d]/10');
      });
      currentDraggedTask = null;
    }
    window.onTaskDragEnd = onTaskDragEnd;

    function onTaskDragOver(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const colEl = event.currentTarget;
      if (!colEl.classList.contains('ring-2')) {
        colEl.classList.add('ring-2', 'ring-[#ff914d]', 'bg-[#ff914d]/10');
      }
    }
    window.onTaskDragOver = onTaskDragOver;

    function onTaskDragLeave(event) {
      const colEl = event.currentTarget;
      if (!colEl.contains(event.relatedTarget)) {
        colEl.classList.remove('ring-2', 'ring-[#ff914d]', 'bg-[#ff914d]/10');
      }
    }
    window.onTaskDragLeave = onTaskDragLeave;

    async function onTaskDrop(event, targetColKey) {
      event.preventDefault();
      const colEl = event.currentTarget;
      colEl.classList.remove('ring-2', 'ring-[#ff914d]', 'bg-[#ff914d]/10');

      const taskId = event.dataTransfer.getData('text/plain') || (currentDraggedTask ? currentDraggedTask.id : null);
      if (!taskId) return;

      const fromCol = currentDraggedTask ? currentDraggedTask.fromCol : null;
      const normTarget = targetColKey === 'in-progress' ? 'in_progress' : targetColKey;
      const normFrom = fromCol === 'in-progress' ? 'in_progress' : fromCol;

      if (normFrom && normFrom === normTarget) {
        return;
      }

      if (!window.nexusIsAuthenticated) {
        if (typeof openAuthModal === 'function') {
          openAuthModal('Faça login com a senha mestra para mover tarefas no Kanban.');
        } else {
          alert('Faça login para mover tarefas.');
        }
        return;
      }

      // Optimistic UI Update (Resposta Imediata 0ms)
      let movedTask = null;
      const keys = ['backlog', 'todo', 'in_progress', 'homologacao', 'done', 'archived'];
      for (const k of keys) {
        const idx = (lastTasksData[k] || []).findIndex(t => t.id === taskId);
        if (idx !== -1) {
          movedTask = lastTasksData[k].splice(idx, 1)[0];
          break;
        }
      }

      if (movedTask) {
        movedTask.completed = (normTarget === 'done');
        if (!lastTasksData[normTarget]) lastTasksData[normTarget] = [];
        lastTasksData[normTarget].unshift(movedTask);
        updateKanbanBadges();
        renderAllColumns();
      }

      // Rastreia alteração pendente em relação ao snapshot salvo
      const origSec = getTaskOriginalSection(taskId);
      if (origSec && origSec === normTarget) {
        pendingTaskMovesMap.delete(taskId);
      } else {
        pendingTaskMovesMap.set(taskId, normTarget);
      }

      updateKanbanActionsState();

      const colNames = {
        backlog: 'Backlog 📌',
        todo: 'A Fazer 📋',
        in_progress: 'Em Andamento 🚀',
        homologacao: 'Homologação & QA 🔬',
        done: 'Concluídas ✅',
        archived: 'Arquivado & Descontinuado 🗄️'
      };
      showToast(`Tarefa [${taskId}] movida para ${colNames[normTarget] || normTarget}. Clique em "Salvar Alterações" para confirmar. 📋`);
    }
    window.onTaskDrop = onTaskDrop;

    function undoKanbanChanges() {
      if (!pendingTaskMovesMap || pendingTaskMovesMap.size === 0) return;
      if (!savedTasksSnapshot) return;

      lastTasksData = JSON.parse(JSON.stringify(savedTasksSnapshot));
      pendingTaskMovesMap.clear();
      updateKanbanBadges();
      renderAllColumns();
      updateKanbanActionsState();
      showToast('Movimentações desfeitas! O quadro voltou ao estado original. ↩️');
    }
    window.undoKanbanChanges = undoKanbanChanges;

    async function saveKanbanChanges() {
      const count = pendingTaskMovesMap ? pendingTaskMovesMap.size : 0;
      if (count === 0) {
        showToast('Nenhuma alteração pendente para salvar.');
        return;
      }

      if (!window.nexusIsAuthenticated) {
        if (typeof openAuthModal === 'function') {
          openAuthModal('Faça login com a senha mestra para salvar as alterações do Kanban.');
        } else {
          alert('Faça login para salvar as alterações.');
        }
        return;
      }

      const btnSave = document.getElementById('btn-save-tasks');
      const btnUndo = document.getElementById('btn-undo-tasks');
      const lblSave = document.getElementById('label-save-tasks');
      const iconSave = document.getElementById('icon-save-tasks');

      if (btnSave) btnSave.disabled = true;
      if (btnUndo) btnUndo.disabled = true;
      if (lblSave) lblSave.innerText = 'Salvando...';
      if (iconSave) {
        iconSave.setAttribute('data-lucide', 'loader-2');
        iconSave.classList.add('animate-spin');
        if (window.lucide) lucide.createIcons();
      }

      const moves = [];
      for (const [id, section] of pendingTaskMovesMap.entries()) {
        moves.push({ id, section });
      }

      try {
        let success = false;
        try {
          const resBatch = await fetch('/api/tasks/move-batch', {
            method: 'POST',
            headers: getTaskAuthHeaders(),
            body: JSON.stringify({ moves })
          });
          if (resBatch.ok) {
            success = true;
          }
        } catch (e) {
          console.warn('Batch move fallback para chamadas individuais:', e);
        }

        if (!success) {
          for (const m of moves) {
            const res = await fetch('/api/tasks/move', {
              method: 'POST',
              headers: getTaskAuthHeaders(),
              body: JSON.stringify(m)
            });
            if (!res.ok) {
              const err = await res.json();
              throw new Error(err.error || `Falha ao mover tarefa ${m.id}`);
            }
          }
        }

        savedTasksSnapshot = JSON.parse(JSON.stringify(lastTasksData));
        pendingTaskMovesMap.clear();
        updateKanbanActionsState();

        if (window.NexusModal && typeof window.NexusModal.alert === 'function') {
          await NexusModal.alert(
            'Alterações Salvas!',
            `As alterações no Kanban (${count} tarefa${count > 1 ? 's movimentadas' : ' movimentada'}) foram salvas e sincronizadas com sucesso com o repositório.`,
            'success'
          );
        } else {
          alert('Alterações salvas com sucesso!');
        }

        showToast('Quadro Kanban salvo e sincronizado com sucesso! ✅');
      } catch (err) {
        console.error('Erro ao salvar alterações do Kanban:', err);
        showToast('Erro ao salvar alterações: ' + err.message);
        updateKanbanActionsState();
      }
    }
    window.saveKanbanChanges = saveKanbanChanges;

    // ==========================================
    // MODAL DE CRIAÇÃO, EDIÇÃO E EXCLUSÃO DE TAREFAS
    // ==========================================
    function findTaskById(taskId) {
      const keys = ['backlog', 'todo', 'in_progress', 'homologacao', 'done', 'archived'];
      for (const k of keys) {
        const t = (lastTasksData[k] || []).find(item => item.id === taskId);
        if (t) return { task: t, section: k };
      }
      return null;
    }

    function openNewTaskModal(defaultSection = 'backlog') {
      if (!window.nexusIsAuthenticated) {
        if (typeof openAuthModal === 'function') {
          openAuthModal('Faça login com a senha mestra para criar tarefas.');
        }
        return;
      }
      document.getElementById('task-form-mode').value = 'create';
      document.getElementById('task-form-original-id').value = '';
      document.getElementById('task-modal-title').innerText = 'Nova Tarefa Kanban';
      document.getElementById('label-submit-task').innerText = 'Criar Tarefa';
      document.getElementById('task-form-title').value = '';
      document.getElementById('task-form-id').value = '';
      document.getElementById('task-form-id').disabled = false;
      document.getElementById('task-form-section').value = defaultSection;
      document.getElementById('task-form-responsible').value = '@lucy';
      document.getElementById('task-form-context').value = '';
      document.getElementById('btn-delete-task-modal').classList.add('hidden');

      const modal = document.getElementById('modal-task-form');
      if (modal) modal.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
    window.openNewTaskModal = openNewTaskModal;

    function openEditTaskModal(taskId) {
      if (!window.nexusIsAuthenticated) {
        if (typeof openAuthModal === 'function') {
          openAuthModal('Faça login com a senha mestra para editar tarefas.');
        }
        return;
      }
      const found = findTaskById(taskId);
      if (!found) return;

      const { task, section } = found;
      document.getElementById('task-form-mode').value = 'edit';
      document.getElementById('task-form-original-id').value = task.id;
      document.getElementById('task-modal-title').innerText = `Editar Tarefa [${task.id}]`;
      document.getElementById('label-submit-task').innerText = 'Salvar Alterações';
      document.getElementById('task-form-title').value = task.title || '';
      document.getElementById('task-form-id').value = task.id || '';
      document.getElementById('task-form-id').disabled = true;
      document.getElementById('task-form-section').value = section;
      document.getElementById('task-form-responsible').value = task.responsible || '';
      document.getElementById('task-form-context').value = task.context || '';
      document.getElementById('btn-delete-task-modal').classList.remove('hidden');

      const modal = document.getElementById('modal-task-form');
      if (modal) modal.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
    window.openEditTaskModal = openEditTaskModal;

    function closeTaskModal() {
      const modal = document.getElementById('modal-task-form');
      if (modal) modal.classList.add('hidden');
    }
    window.closeTaskModal = closeTaskModal;

    async function submitSaveTask(event) {
      event.preventDefault();
      const mode = document.getElementById('task-form-mode').value;
      const originalId = document.getElementById('task-form-original-id').value;
      const title = document.getElementById('task-form-title').value.trim();
      const id = document.getElementById('task-form-id').value.trim();
      const section = document.getElementById('task-form-section').value;
      const responsible = document.getElementById('task-form-responsible').value.trim();
      const context = document.getElementById('task-form-context').value.trim();

      const btn = document.getElementById('btn-submit-task');
      if (btn) btn.disabled = true;

      try {
        if (mode === 'create') {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: getTaskAuthHeaders(),
            body: JSON.stringify({ id, title, section, responsible, context })
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erro ao criar tarefa');
          }
          showToast('Tarefa criada com sucesso! 🚀');
        } else {
          const res = await fetch('/api/tasks', {
            method: 'PUT',
            headers: getTaskAuthHeaders(),
            body: JSON.stringify({ id: originalId, title, section, responsible, context })
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erro ao atualizar tarefa');
          }
          showToast(`Tarefa [${originalId}] atualizada! ✅`);
        }
        closeTaskModal();
        await fetchTasks();
      } catch (err) {
        alert('Erro: ' + err.message);
      } finally {
        if (btn) btn.disabled = false;
      }
    }
    window.submitSaveTask = submitSaveTask;

    async function deleteTaskPrompt(taskId) {
      if (!window.nexusIsAuthenticated) {
        if (typeof openAuthModal === 'function') {
          openAuthModal('Faça login com a senha mestra para excluir tarefas.');
        }
        return;
      }
      if (window.NexusModal && typeof NexusModal.confirm === 'function') {
        const ok = await NexusModal.confirm(
          'Excluir Tarefa',
          `Tens certeza que queres excluir definitivamente a tarefa [${taskId}] de tasks/todo.md?`,
          'danger'
        );
        if (!ok) return;
      } else {
        if (!confirm(`Tens certeza que queres excluir a tarefa [${taskId}]?`)) return;
      }
      await executeDeleteTask(taskId);
    }
    window.deleteTaskPrompt = deleteTaskPrompt;

    async function deleteCurrentTaskFromModal() {
      const taskId = document.getElementById('task-form-original-id').value;
      if (!taskId) return;
      closeTaskModal();
      await deleteTaskPrompt(taskId);
    }
    window.deleteCurrentTaskFromModal = deleteCurrentTaskFromModal;

    async function executeDeleteTask(taskId) {
      try {
        const res = await fetch('/api/tasks?id=' + encodeURIComponent(taskId), {
          method: 'DELETE',
          headers: getTaskAuthHeaders()
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Erro ao excluir tarefa');
        }
        showToast(`Tarefa [${taskId}] excluída com sucesso! 🗑️`);
        await fetchTasks();
      } catch (err) {
        showToast('Erro ao excluir: ' + err.message);
      }
    }
    window.executeDeleteTask = executeDeleteTask;

    function renderColumnList(colKey, items, renderFn, emptyMsg, isSearching = false) {
      const container = document.getElementById('col-' + colKey);
      if (!container) return;
      if (!items || items.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 italic p-3 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl my-2">${emptyMsg}</p>`;
        return;
      }
      const limit = isSearching ? Infinity : (taskLimitState[colKey] || 4);
      const visible = items.slice(0, limit);
      let html = visible.map(item => renderFn(item, colKey)).join('');
      if (!isSearching && items.length > 4) {
        if (limit <= 4) {
          const diff = items.length - 4;
          html += `
            <button onclick="toggleTaskLimit('${colKey}')" class="w-full py-1.5 px-2 rounded-xl border border-slate-300/80 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-100/70 dark:bg-slate-800/70 text-[11px] font-mono text-slate-600 dark:text-slate-300 transition flex items-center justify-center gap-1 cursor-pointer shadow-xs">
              <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i> Mostrar mais (${diff}) tarefas
            </button>
          `;
        } else {
          html += `
            <button onclick="toggleTaskLimit('${colKey}')" class="w-full py-1.5 px-2 rounded-xl border border-slate-300/80 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-100/70 dark:bg-slate-800/70 text-[11px] font-mono text-slate-600 dark:text-slate-300 transition flex items-center justify-center gap-1 cursor-pointer shadow-xs">
              <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i> Minimizar para 4 tarefas
            </button>
          `;
        }
      }
      container.innerHTML = html;
    }

    function renderAllColumns(isSearching = false) {
      renderColumnList('backlog', lastTasksData.backlog, (t) => renderTaskCard(t, 'blue', 'backlog'), 'Backlog priorizado limpo.', isSearching);
      renderColumnList('todo', lastTasksData.todo, (t) => renderTaskCard(t, 'cyan', 'todo'), 'Nenhuma tarefa a fazer.', isSearching);
      renderColumnList('in-progress', lastTasksData.in_progress, (t) => renderTaskCard(t, 'amber', 'in_progress'), 'Nenhuma tarefa em andamento.', isSearching);
      renderColumnList('homologacao', lastTasksData.homologacao, (t) => renderTaskCard(t, 'purple', 'homologacao'), 'Nenhuma tarefa em homologação.', isSearching);
      renderColumnList('done', lastTasksData.done, (t) => renderDoneCard(t), 'Nenhuma tarefa concluída.', isSearching);
      renderColumnList('archived', lastTasksData.archived, (t) => renderTaskCard(t, 'slate', 'archived'), 'Nenhuma ideia ou projeto descontinuado.', isSearching);
      if (window.lucide) lucide.createIcons();
    }

    function toggleTaskLimit(colKey) {
      const dataKey = colKey === 'in-progress' ? 'in_progress' : colKey;
      const items = lastTasksData[dataKey] || [];
      const current = taskLimitState[colKey] || 4;
      if (current >= items.length) {
        taskLimitState[colKey] = 4;
      } else {
        taskLimitState[colKey] = items.length;
      }
      renderAllColumns();
    }
    window.toggleTaskLimit = toggleTaskLimit;

    function toggleColumnCollapse(colKey) {
      const colEl = document.getElementById('col-' + colKey);
      const chevron = document.getElementById('chevron-' + colKey);
      if (colEl) {
        const isHidden = colEl.classList.toggle('hidden');
        if (chevron) {
          chevron.style.transform = isHidden ? 'rotate(-90deg)' : '';
        }
      }
    }
    window.toggleColumnCollapse = toggleColumnCollapse;

    function toggleAllTasksCollapse() {
      const cols = ['backlog', 'todo', 'in-progress', 'homologacao', 'done', 'archived'];
      const firstCol = document.getElementById('col-backlog');
      const shouldCollapse = firstCol ? !firstCol.classList.contains('hidden') : true;
      cols.forEach(id => {
        const el = document.getElementById('col-' + id);
        const chev = document.getElementById('chevron-' + id);
        if (el) {
          if (shouldCollapse) el.classList.add('hidden');
          else el.classList.remove('hidden');
        }
        if (chev) {
          chev.style.transform = shouldCollapse ? 'rotate(-90deg)' : '';
        }
      });
      const label = document.getElementById('label-toggle-all-tasks');
      if (label) label.innerText = shouldCollapse ? 'Expandir Tudo' : 'Minimizar Tudo';
    }
    window.toggleAllTasksCollapse = toggleAllTasksCollapse;

    async function fetchTasks() {
      try {
        const res = await fetch('/api/tasks');
        const data = await res.json();
        
        lastTasksData = {
          backlog: data.backlog || [],
          todo: data.todo || [],
          in_progress: data.in_progress || [],
          homologacao: data.homologacao || [],
          done: data.done || [],
          archived: data.archived || []
        };

        const backlogCount = lastTasksData.backlog.length;
        const todoCount = lastTasksData.todo.length;
        const inProgCount = lastTasksData.in_progress.length;
        const homoCount = lastTasksData.homologacao.length;
        const doneCount = lastTasksData.done.length;
        const archivedCount = lastTasksData.archived.length;
        const total = backlogCount + todoCount + inProgCount + homoCount + doneCount + archivedCount;

        const bBacklog = document.getElementById('badge-backlog');
        if (bBacklog) bBacklog.innerText = backlogCount;
        const bTodo = document.getElementById('badge-todo');
        if (bTodo) bTodo.innerText = todoCount;
        const bHomo = document.getElementById('badge-homologacao');
        if (bHomo) bHomo.innerText = homoCount;
        const bInProg = document.getElementById('badge-in-progress');
        if (bInProg) bInProg.innerText = inProgCount;
        const bDone = document.getElementById('badge-done');
        if (bDone) bDone.innerText = doneCount;
        const bArchived = document.getElementById('badge-archived');
        if (bArchived) bArchived.innerText = archivedCount;
        const tCount = document.getElementById('task-count');
        if (tCount) tCount.innerText = total;
        const hcTasks = document.getElementById('home-card-tasks');
        if (hcTasks) hcTasks.innerText = total + ' Tarefas';

        renderAllColumns();
        savedTasksSnapshot = JSON.parse(JSON.stringify(lastTasksData));
        pendingTaskMovesMap.clear();
        updateKanbanActionsState();
      } catch (e) {
        console.error(e);
      }
    }

    function clearKanbanSearch() {
      const input = document.getElementById('kanban-search');
      if (input) {
        input.value = '';
        filterKanbanTasks();
        input.focus();
      }
    }
    window.clearKanbanSearch = clearKanbanSearch;

    function filterKanbanTasks() {
      const searchInput = document.getElementById('kanban-search');
      const clearBtn = document.getElementById('btn-clear-kanban-search');
      if (!searchInput) return;

      // Blindagem estrita contra autofill de telefone/credenciais pelo navegador
      if (searchInput.value.includes('•') || searchInput.value.includes('+55') || searchInput.value.includes('(91)') || searchInput.value.includes('82687350')) {
        searchInput.value = '';
      }

      const rawQuery = searchInput.value.trim();
      const query = rawQuery.toLowerCase();

      if (clearBtn) {
        if (rawQuery) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
      }

      // Se há busca ativa, re-renderiza as colunas em modo busca (mostra todos os cards correspondentes)
      const isSearching = !!query;
      renderAllColumns(isSearching);

      const cards = document.querySelectorAll('.kanban-task-card');
      let visibleCount = 0;

      cards.forEach(card => {
        const data = card.getAttribute('data-search') || '';
        if (!query || data.includes(query)) {
          card.classList.remove('hidden');
          visibleCount++;
        } else {
          card.classList.add('hidden');
        }
      });

      const totalTasks = (lastTasksData.backlog?.length || 0) +
                         (lastTasksData.todo?.length || 0) +
                         (lastTasksData.in_progress?.length || 0) +
                         (lastTasksData.homologacao?.length || 0) +
                         (lastTasksData.done?.length || 0) +
                         (lastTasksData.archived?.length || 0);

      const statusEl = document.getElementById('kanban-filter-status');
      if (statusEl) {
        if (query) {
          statusEl.textContent = `${visibleCount} de ${totalTasks} tarefas`;
        } else {
          statusEl.textContent = `${totalTasks} tarefas totais`;
        }
      }
    }
    window.filterKanbanTasks = filterKanbanTasks;

    async function fetchADRs() {
      try {
        const res = await fetch('/api/adrs');
        const list = await res.json();
        updateBadge('adr-count', list.length);
        const hcAdrs = document.getElementById('home-card-adrs');
        if (hcAdrs) hcAdrs.innerText = `${list.length} ADRs`;
        
        const html = list.map(adr => `
          <div class="glass-card p-4 rounded-2xl border-l-4 border-l-amber-500 hover:border-[#ff914d]/70 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(160,82,45,0.25)] transition-all cursor-pointer group shadow-sm flex flex-col justify-between" onclick="viewADR('${adr.filename}', '${escape(adr.title)}')">
            <div>
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                  <i data-lucide="file-text" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">ADR ${adr.id || 'N/A'}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">${adr.status}</span>
                  </div>
                  <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition line-clamp-2 mt-1 leading-snug" title="${adr.title}">${adr.title}</h4>
                </div>
              </div>
              <div class="mt-3 text-[11px] font-mono flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span class="truncate max-w-[180px]">${adr.filename}</span>
                <span class="text-[10px] shrink-0">${adr.date || ''}</span>
              </div>
            </div>
            <div class="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
              <div class="w-full py-1.5 px-3 rounded-xl bg-slate-200/80 dark:bg-[#151a2d] border border-slate-300/80 dark:border-slate-700/80 text-xs font-bold font-mono text-slate-700 dark:text-slate-200 flex items-center justify-between group-hover:border-[#ff914d] group-hover:text-[#ff914d] group-hover:shadow-[0_0_12px_rgba(160,82,45,0.35)] transition-all">
                <span class="flex items-center gap-1.5">
                  <i data-lucide="eye" class="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ff914d]"></i>
                  <span>LER DECISÃO</span>
                </span>
                <i data-lucide="arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"></i>
              </div>
            </div>
          </div>
        `).join('');

        document.getElementById('adrs-list').innerHTML = html;
        if (window.lucide) lucide.createIcons();
      } catch (e) {
        console.error(e);
      }
    }

    async function viewADR(filename, title) {
      try {
        const res = await fetch('/api/adrs/' + filename);
        const data = await res.json();
        document.getElementById('modal-adr-title').innerText = unescape(title);
        document.getElementById('modal-adr-content').innerHTML = typeof marked !== 'undefined' ? marked.parse(data.content) : data.content;
        document.getElementById('adr-modal').classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
      } catch (e) {
        NexusModal.alert('Erro ao Carregar', 'Falha ao carregar o arquivo da ADR.', 'danger');
      }
    }

    async function fetchLessons() {
      try {
        const res = await fetch('/api/lessons');
        const list = await res.json();
        const html = list.map((lesson, idx) => `
          <div class="glass-card p-4 rounded-2xl border-l-4 border-l-purple-500 hover:border-[#ff914d]/70 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(160,82,45,0.25)] transition-all shadow-sm flex flex-col justify-between group">
            <div>
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]">
                  <i data-lucide="bookmark" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">${lesson.id}</span>
                    <span class="text-[10px] text-slate-500 font-mono">${lesson.date || ''}</span>
                  </div>
                  <h4 class="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-400 transition line-clamp-2 mt-1 leading-snug" title="${lesson.rule}">${lesson.rule}</h4>
                </div>
              </div>
              ${lesson.context ? `
                <div id="lesson-preview-${idx}" class="mt-2.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  ${lesson.context}
                </div>
              ` : ''}
              <div id="lesson-details-${idx}" class="hidden mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-2.5 text-xs">
                ${lesson.context ? `
                  <div class="text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong class="text-slate-800 dark:text-slate-200 font-mono">Contexto:</strong> ${lesson.context}
                  </div>
                ` : ''}
                ${lesson.mitigation ? `
                  <div class="text-emerald-700 dark:text-emerald-400/95 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 leading-relaxed">
                    <strong class="font-mono">Mitigação:</strong> ${lesson.mitigation}
                  </div>
                ` : ''}
              </div>
            </div>
            <div class="mt-3.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800/80">
              <button onclick="toggleLessonExpand(${idx})" id="btn-lesson-toggle-${idx}" class="w-full py-1.5 px-3 rounded-xl bg-slate-200/80 dark:bg-[#151a2d] border border-slate-300/80 dark:border-slate-700/80 text-xs font-bold font-mono text-slate-700 dark:text-slate-200 flex items-center justify-between group-hover:border-[#ff914d] group-hover:text-[#ff914d] group-hover:shadow-[0_0_12px_rgba(160,82,45,0.35)] transition-all cursor-pointer">
                <span id="lbl-lesson-${idx}" class="flex items-center gap-1.5">
                  <i data-lucide="book-open" class="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ff914d]"></i>
                  <span>EXPANDIR LIÇÃO</span>
                </span>
                <i id="ico-lesson-${idx}" data-lucide="chevron-down" class="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform"></i>
              </button>
            </div>
          </div>
        `).join('');
        updateBadge('lessons-count', list.length);
        const hcLessons = document.getElementById('home-card-lessons');
        if (hcLessons) hcLessons.innerText = `${list.length} Padrões`;
        document.getElementById('lessons-list').innerHTML = html || '<p class="text-xs text-slate-400 italic col-span-full">Nenhuma lição registrada ainda.</p>';
        if (window.lucide) lucide.createIcons();
      } catch (e) {
        console.error(e);
      }
    }

    function toggleLessonExpand(idx) {
      const details = document.getElementById(`lesson-details-${idx}`);
      const preview = document.getElementById(`lesson-preview-${idx}`);
      const lbl = document.getElementById(`lbl-lesson-${idx}`);
      const ico = document.getElementById(`ico-lesson-${idx}`);
      if (!details) return;
      const isHidden = details.classList.contains('hidden');
      if (isHidden) {
        details.classList.remove('hidden');
        if (preview) preview.classList.add('hidden');
        if (lbl) lbl.innerHTML = '<i data-lucide="book-marked" class="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ff914d]"></i><span>RECOLHER LIÇÃO</span>';
        if (ico) ico.setAttribute('data-lucide', 'chevron-up');
      } else {
        details.classList.add('hidden');
        if (preview) preview.classList.remove('hidden');
        if (lbl) lbl.innerHTML = '<i data-lucide="book-open" class="w-3.5 h-3.5 text-slate-500 group-hover:text-[#ff914d]"></i><span>EXPANDIR LIÇÃO</span>';
        if (ico) ico.setAttribute('data-lucide', 'chevron-down');
      }
      if (window.lucide) lucide.createIcons();
    }
    window.toggleLessonExpand = toggleLessonExpand;

    function updateBadge(id, val) {
      const el = document.getElementById(id);
      if (el) el.innerText = val;
    }

    // ==========================================
    // SISTEMA DE DETALHES DO CARD DO QUADRO DE ENGENHARIA
    // ==========================================
    let currentDetailTaskId = null;
    let currentDetailData = null;

    async function openTaskDetailModal(taskId) {
      currentDetailTaskId = taskId;
      const modal = document.getElementById('modal-task-detail');
      if (!modal) return;

      document.getElementById('detail-task-id').innerText = taskId;
      document.getElementById('detail-task-title').innerText = 'Carregando...';
      document.getElementById('detail-desc-view').innerText = 'Carregando detalhes do card...';
      toggleEditTaskDescription(false);
      modal.classList.remove('hidden');

      try {
        const res = await fetch('/api/tasks/details?id=' + encodeURIComponent(taskId));
        if (!res.ok) {
          throw new Error('Falha ao carregar detalhes do card');
        }
        const data = await res.json();
        currentDetailData = data;
        renderCardDetailModal(data);
      } catch (err) {
        console.error('Erro ao abrir detalhes da tarefa:', err);
        showToast('Erro ao carregar detalhes: ' + err.message);
      }
    }
    window.openTaskDetailModal = openTaskDetailModal;

    function closeTaskDetailModal() {
      const modal = document.getElementById('modal-task-detail');
      if (modal) modal.classList.add('hidden');
      currentDetailTaskId = null;
      currentDetailData = null;
    }
    window.closeTaskDetailModal = closeTaskDetailModal;

    function renderCardDetailModal(data) {
      if (!data) return;

      const titleEl = document.getElementById('detail-task-title');
      const idEl = document.getElementById('detail-task-id');
      const secBadge = document.getElementById('detail-task-section-badge');
      const respEl = document.getElementById('detail-task-responsible');
      const secSelect = document.getElementById('detail-select-section');
      const tagsEl = document.getElementById('detail-task-tags');
      const descView = document.getElementById('detail-desc-view');
      const descInput = document.getElementById('detail-desc-input');

      if (titleEl) titleEl.innerText = data.title || data.id;
      if (idEl) idEl.innerText = data.id;

      const secNames = {
        backlog: { name: '📌 Backlog', cls: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30' },
        todo: { name: '📋 A Fazer', cls: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' },
        in_progress: { name: '🚀 Em Andamento', cls: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' },
        homologacao: { name: '🔬 Homologação', cls: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' },
        done: { name: '✅ Concluído', cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' },
        archived: { name: '🗄️ Arquivado', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30' }
      };
      const curSec = data.section || 'backlog';
      const secInfo = secNames[curSec] || secNames.backlog;

      if (secBadge) {
        secBadge.innerText = secInfo.name;
        secBadge.className = 'px-2 py-0.5 rounded text-[11px] font-bold ' + secInfo.cls;
      }
      if (secSelect) {
        secSelect.value = curSec;
      }
      if (respEl) {
        respEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500"></span> ${data.responsible || 'Squad Nexus'}`;
      }

      // Tags
      if (tagsEl) {
        const tags = data.tags && data.tags.length > 0 ? data.tags : ['Engenharia'];
        let tagsHtml = tags.map(tag => `
          <span class="px-2.5 py-0.5 rounded-lg bg-[#ff914d]/15 text-[#ff914d] border border-[#ff914d]/30 text-xs font-semibold flex items-center gap-1">
            ${tag}
            <button onclick="removeTag('${tag}')" class="hover:text-rose-400 ml-0.5 cursor-pointer">&times;</button>
          </span>
        `).join('');
        tagsHtml += `
          <button onclick="addTagPrompt()" class="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition text-xs flex items-center cursor-pointer" title="Adicionar etiqueta">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
          </button>
        `;
        tagsEl.innerHTML = tagsHtml;
      }

      // Descrição
      const desc = data.description || '';
      if (descView) {
        descView.innerText = desc || 'Nenhuma descrição detalhada informada. Clique em "Editar" para adicionar contexto, critérios de aceite ou comandos.';
      }
      if (descInput) {
        descInput.value = desc;
      }

      renderCardLinks(data.links || []);
      renderCardAttachments(data.attachments || []);
      renderCardComments(data.comments || []);

      if (window.lucide) lucide.createIcons();
    }

    function toggleEditTaskDescription(force) {
      const view = document.getElementById('detail-desc-view');
      const editBox = document.getElementById('detail-desc-edit-box');
      const btn = document.getElementById('btn-toggle-edit-desc');
      if (!view || !editBox) return;

      const isEditing = force !== undefined ? force : editBox.classList.contains('hidden');
      if (isEditing) {
        view.classList.add('hidden');
        editBox.classList.remove('hidden');
        if (btn) btn.classList.add('hidden');
        const input = document.getElementById('detail-desc-input');
        if (input) input.focus();
      } else {
        view.classList.remove('hidden');
        editBox.classList.add('hidden');
        if (btn) btn.classList.remove('hidden');
      }
    }
    window.toggleEditTaskDescription = toggleEditTaskDescription;

    async function saveTaskDescription() {
      if (!currentDetailTaskId) return;
      const input = document.getElementById('detail-desc-input');
      const newDesc = input ? input.value : '';

      try {
        const payload = Object.assign({}, currentDetailData || {}, {
          id: currentDetailTaskId,
          description: newDesc
        });
        const res = await fetch('/api/tasks/details', {
          method: 'POST',
          headers: getTaskAuthHeaders(),
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Falha ao salvar descrição');

        if (currentDetailData) currentDetailData.description = newDesc;
        const view = document.getElementById('detail-desc-view');
        if (view) view.innerText = newDesc || 'Nenhuma descrição detalhada informada.';
        toggleEditTaskDescription(false);
        showToast('Descrição atualizada com sucesso! 📝');
      } catch (err) {
        console.error(err);
        showToast('Erro ao salvar descrição: ' + err.message);
      }
    }
    window.saveTaskDescription = saveTaskDescription;

    function renderCardLinks(links) {
      const container = document.getElementById('detail-links-container');
      if (!container) return;

      if (!links || links.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-1">Nenhum link anexado.</p>`;
        return;
      }

      container.innerHTML = links.map(l => `
        <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 group hover:border-sky-500/40 transition">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center bg-sky-500/10 text-sky-500 shrink-0">
              <i data-lucide="link" class="w-3.5 h-3.5"></i>
            </div>
            <a href="${l.url}" target="_blank" rel="noopener noreferrer" class="text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline truncate" title="${l.url}">
              ${l.title || l.url}
            </a>
            <span class="text-[10px] text-slate-400 font-mono hidden sm:inline">${l.created_at || ''}</span>
          </div>
          <button onclick="deleteCardLink('${l.id}')" class="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer" title="Remover link">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `).join('');
      if (window.lucide) lucide.createIcons();
    }

    async function promptAddLink() {
      if (!currentDetailTaskId) return;
      const url = prompt('Digite a URL do link (ex: https://...):');
      if (!url) return;
      const title = prompt('Digite o título/nome do link (opcional):') || url;

      try {
        const res = await fetch('/api/tasks/link', {
          method: 'POST',
          headers: getTaskAuthHeaders(),
          body: JSON.stringify({ id: currentDetailTaskId, title, url })
        });
        if (!res.ok) throw new Error('Falha ao adicionar link');
        const data = await res.json();
        if (currentDetailData) {
          if (!currentDetailData.links) currentDetailData.links = [];
          currentDetailData.links.push(data.link);
          renderCardLinks(currentDetailData.links);
        }
        showToast('Link adicionado com sucesso! 🔗');
      } catch (err) {
        showToast('Erro ao adicionar link: ' + err.message);
      }
    }
    window.promptAddLink = promptAddLink;

    async function deleteCardLink(linkId) {
      if (!currentDetailTaskId || !linkId) return;
      try {
        const res = await fetch(`/api/tasks/link?id=${encodeURIComponent(currentDetailTaskId)}&link_id=${encodeURIComponent(linkId)}`, {
          method: 'DELETE',
          headers: getTaskAuthHeaders()
        });
        if (!res.ok) throw new Error('Falha ao remover link');
        if (currentDetailData && currentDetailData.links) {
          currentDetailData.links = currentDetailData.links.filter(l => l.id !== linkId);
          renderCardLinks(currentDetailData.links);
        }
        showToast('Link removido.');
      } catch (err) {
        showToast('Erro ao remover link: ' + err.message);
      }
    }
    window.deleteCardLink = deleteCardLink;

    function renderCardAttachments(attachments) {
      const container = document.getElementById('detail-attachments-container');
      if (!container) return;

      if (!attachments || attachments.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-1">Nenhum arquivo anexado.</p>`;
        return;
      }

      container.innerHTML = attachments.map(a => {
        const isImg = (a.type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(a.name);
        return `
          <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 group hover:border-amber-500/40 transition">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-500 shrink-0 font-bold text-[10px] font-mono">
                ${isImg ? '<i data-lucide="image" class="w-4 h-4"></i>' : (a.name.split('.').pop() || 'FILE').toUpperCase().slice(0, 4)}
              </div>
              <div class="min-w-0">
                <a href="/${a.path}" target="_blank" rel="noopener noreferrer" class="text-xs font-semibold text-slate-900 dark:text-slate-100 hover:text-[#ff914d] hover:underline truncate block" title="${a.name}">
                  ${a.name}
                </a>
                <span class="text-[10px] text-slate-400 font-mono">${a.size || ''} • ${a.created_at || ''}</span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <a href="/${a.path}" target="_blank" download class="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition" title="Baixar arquivo">
                <i data-lucide="download" class="w-3.5 h-3.5"></i>
              </a>
              <button onclick="deleteCardAttachment('${a.id}')" class="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer" title="Remover anexo">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        `;
      }).join('');
      if (window.lucide) lucide.createIcons();
    }

    async function uploadTaskAttachment(event) {
      if (!currentDetailTaskId) return;
      const file = event.target.files ? event.target.files[0] : null;
      if (!file) return;

      const formData = new FormData();
      formData.append('id', currentDetailTaskId);
      formData.append('file', file);

      showToast('Enviando arquivo anexado... ⏳');
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('nexus_auth_token') || '';
        const headers = {};
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/tasks/upload', {
          method: 'POST',
          headers,
          body: formData
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Falha no upload');
        }
        const data = await res.json();
        if (currentDetailData) {
          if (!currentDetailData.attachments) currentDetailData.attachments = [];
          currentDetailData.attachments.push(data.attachment);
          renderCardAttachments(currentDetailData.attachments);
        }
        showToast('Arquivo anexado com sucesso! 📎');
      } catch (err) {
        showToast('Erro ao anexar arquivo: ' + err.message);
      } finally {
        event.target.value = '';
      }
    }
    window.uploadTaskAttachment = uploadTaskAttachment;

    async function deleteCardAttachment(attId) {
      if (!currentDetailTaskId || !attId) return;
      try {
        const res = await fetch(`/api/tasks/attachment?id=${encodeURIComponent(currentDetailTaskId)}&attachment_id=${encodeURIComponent(attId)}`, {
          method: 'DELETE',
          headers: getTaskAuthHeaders()
        });
        if (!res.ok) throw new Error('Falha ao excluir anexo');
        if (currentDetailData && currentDetailData.attachments) {
          currentDetailData.attachments = currentDetailData.attachments.filter(a => a.id !== attId);
          renderCardAttachments(currentDetailData.attachments);
        }
        showToast('Anexo excluído.');
      } catch (err) {
        showToast('Erro ao excluir anexo: ' + err.message);
      }
    }
    window.deleteCardAttachment = deleteCardAttachment;

    function renderCardComments(comments) {
      const container = document.getElementById('detail-comments-container');
      if (!container) return;

      if (!comments || comments.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic py-2 text-center">Nenhum comentário registrado ainda. Adicione uma atualização acima!</p>`;
        return;
      }

      container.innerHTML = comments.map(c => `
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 space-y-1.5 group">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-base">${c.avatar || '👨‍💻'}</span>
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${c.author || 'Usuário'}</span>
              <span class="text-[10px] text-slate-400 font-mono">${c.created_at || ''}</span>
            </div>
            <button onclick="deleteCardComment('${c.id}')" class="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition cursor-pointer" title="Excluir comentário">
              <i data-lucide="trash-2" class="w-3 h-3"></i>
            </button>
          </div>
          <p class="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">${c.text}</p>
        </div>
      `).join('');
      if (window.lucide) lucide.createIcons();
    }

    async function submitTaskComment() {
      if (!currentDetailTaskId) return;
      const input = document.getElementById('detail-comment-input');
      const text = input ? input.value.trim() : '';
      if (!text) {
        showToast('Escreva algo no comentário!');
        return;
      }

      try {
        const res = await fetch('/api/tasks/comment', {
          method: 'POST',
          headers: getTaskAuthHeaders(),
          body: JSON.stringify({
            id: currentDetailTaskId,
            text,
            author: 'Lucivaldo Junior',
            avatar: '👨‍💻'
          })
        });
        if (!res.ok) throw new Error('Falha ao adicionar comentário');
        const data = await res.json();
        if (currentDetailData) {
          if (!currentDetailData.comments) currentDetailData.comments = [];
          currentDetailData.comments.unshift(data.comment);
          renderCardComments(currentDetailData.comments);
        }
        if (input) input.value = '';
        showToast('Comentário adicionado! 💬');
      } catch (err) {
        showToast('Erro ao comentar: ' + err.message);
      }
    }
    window.submitTaskComment = submitTaskComment;

    async function deleteCardComment(commentId) {
      if (!currentDetailTaskId || !commentId) return;
      try {
        const res = await fetch(`/api/tasks/comment?id=${encodeURIComponent(currentDetailTaskId)}&comment_id=${encodeURIComponent(commentId)}`, {
          method: 'DELETE',
          headers: getTaskAuthHeaders()
        });
        if (!res.ok) throw new Error('Falha ao excluir comentário');
        if (currentDetailData && currentDetailData.comments) {
          currentDetailData.comments = currentDetailData.comments.filter(c => c.id !== commentId);
          renderCardComments(currentDetailData.comments);
        }
        showToast('Comentário excluído.');
      } catch (err) {
        showToast('Erro ao excluir comentário: ' + err.message);
      }
    }
    window.deleteCardComment = deleteCardComment;

    async function changeTaskSectionFromDetail(newSec) {
      if (!currentDetailTaskId || !newSec) return;
      try {
        const res = await fetch('/api/tasks/move', {
          method: 'POST',
          headers: getTaskAuthHeaders(),
          body: JSON.stringify({ id: currentDetailTaskId, section: newSec })
        });
        if (!res.ok) throw new Error('Falha ao mover tarefa');
        if (currentDetailData) currentDetailData.section = newSec;
        await fetchTasks();
        showToast(`Tarefa movida para nova fase! 📋`);
      } catch (err) {
        showToast('Erro ao mudar fase: ' + err.message);
      }
    }
    window.changeTaskSectionFromDetail = changeTaskSectionFromDetail;

    function editCurrentTaskFromDetail() {
      if (!currentDetailTaskId) return;
      const tid = currentDetailTaskId;
      closeTaskDetailModal();
      openEditTaskModal(tid);
    }
    window.editCurrentTaskFromDetail = editCurrentTaskFromDetail;

    function addTagPrompt() {
      const tag = prompt('Digite o nome da nova etiqueta (ex: Backend, Frontend, Urgente):');
      if (!tag) return;
      if (!currentDetailData) return;
      if (!currentDetailData.tags) currentDetailData.tags = [];
      if (!currentDetailData.tags.includes(tag.trim())) {
        currentDetailData.tags.push(tag.trim());
        saveTaskDetailsMetadata();
      }
    }
    window.addTagPrompt = addTagPrompt;

    function removeTag(tagToRemove) {
      if (!currentDetailData || !currentDetailData.tags) return;
      currentDetailData.tags = currentDetailData.tags.filter(t => t !== tagToRemove);
      saveTaskDetailsMetadata();
    }
    window.removeTag = removeTag;

    async function saveTaskDetailsMetadata() {
      if (!currentDetailTaskId || !currentDetailData) return;
      try {
        await fetch('/api/tasks/details', {
          method: 'POST',
          headers: getTaskAuthHeaders(),
          body: JSON.stringify(currentDetailData)
        });
        renderCardDetailModal(currentDetailData);
      } catch (err) {
        console.error('Erro ao salvar etiquetas:', err);
      }
    }

    // ==========================================
    // MENU DE EXPORTAÇÃO DO QUADRO (.JSON, .CSV, .MD, .TXT)
    // ==========================================
    function toggleExportMenu(event) {
      if (event) {
        event.stopPropagation();
      }
      const menu = document.getElementById('export-tasks-menu');
      if (menu) {
        menu.classList.toggle('hidden');
        if (window.lucide) lucide.createIcons();
      }
    }
    window.toggleExportMenu = toggleExportMenu;

    document.addEventListener('click', (e) => {
      const menu = document.getElementById('export-tasks-menu');
      const btn = document.getElementById('btn-export-tasks');
      if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
          menu.classList.add('hidden');
        }
      }
    });


