    // ==========================================
    // BASE VIVA DE MEMÓRIA (COFRE & EDITOR MARKDOWN)
    // ==========================================
    let currentVaultNotePath = '';
    let currentVaultRawContent = '';
    let isVaultEditMode = false;
    let vaultTreeData = null;

    async function loadVaultTab() {
      applyAuthUIState();
      if (!window.nexusIsAuthenticated) {
        return;
      }
      if (!vaultTreeData) {
        await loadVaultTree();
      }
      if (!currentVaultNotePath) {
        // Abre automaticamente a memória contínua do Lucy como documento padrão
        openVaultNote('agentes/memoria_lucy.md');
      }
    }

    async function loadVaultTree() {
      if (!window.nexusIsAuthenticated) {
        applyAuthUIState();
        return;
      }
      const container = document.getElementById('vault-tree-container');
      const countEl = document.getElementById('vault-tree-count');
      const badgeCount = document.getElementById('vault-count');
      if (!container) return;

      container.innerHTML = '<div class="p-3 text-slate-400 font-mono text-xs">Carregando árvore do Vault...</div>';

      try {
        const res = await fetch('/api/tree');
        if (res.status === 401) {
          window.nexusIsAuthenticated = false;
          applyAuthUIState();
          return;
        }
        if (!res.ok) throw new Error('Falha ao obter árvore');
        vaultTreeData = await res.json();
        
        let totalFiles = 0;
        const countFiles = (node) => {
          if (node.type === 'file') totalFiles++;
          if (node.children) node.children.forEach(countFiles);
        };
        countFiles(vaultTreeData);
        if (countEl) countEl.textContent = `${totalFiles} arquivos`;
        if (badgeCount) badgeCount.textContent = `${totalFiles}`;

        container.innerHTML = '';
        vaultAllExpanded = false;
        updateVaultCollapseButtonState();
        if (vaultTreeData.children && vaultTreeData.children.length > 0) {
          vaultTreeData.children.forEach(child => {
            container.appendChild(createTreeNodeElement(child, 0));
          });
        } else {
          container.innerHTML = '<div class="p-3 text-slate-400">Nenhum arquivo encontrado.</div>';
        }
        if (window.lucide) lucide.createIcons();
      } catch (err) {
        container.innerHTML = `<div class="p-3 text-rose-500 text-xs">Erro: ${err.message}</div>`;
      }
    }

    let vaultAllExpanded = false;

    function updateVaultCollapseButtonState() {
      const toggleBtn = document.getElementById('btn-vault-toggle-all');
      const toggleIcon = document.getElementById('icon-vault-toggle-all');
      if (toggleBtn) {
        toggleBtn.title = vaultAllExpanded ? 'Recolher todas as pastas' : 'Expandir todas as pastas';
      }
      if (toggleIcon) {
        toggleIcon.setAttribute('data-lucide', vaultAllExpanded ? 'chevrons-down-up' : 'chevrons-up-down');
      }
      if (window.lucide) lucide.createIcons();
    }

    function toggleCollapseAllVaultTree() {
      vaultAllExpanded = !vaultAllExpanded;
      const allChildren = document.querySelectorAll('#vault-tree-container .vault-folder-children');
      const allIcons = document.querySelectorAll('#vault-tree-container .vault-folder-icon');

      allChildren.forEach(child => {
        if (vaultAllExpanded) {
          child.classList.remove('hidden');
        } else {
          child.classList.add('hidden');
        }
      });

      allIcons.forEach(icon => {
        icon.setAttribute('data-lucide', vaultAllExpanded ? 'folder-open' : 'folder');
      });

      updateVaultCollapseButtonState();
    }
    window.toggleCollapseAllVaultTree = toggleCollapseAllVaultTree;

    function createTreeNodeElement(node, depth = 0) {
      const wrapper = document.createElement('div');
      wrapper.className = 'select-none';

      const paddingLeft = depth * 14 + 4;

      if (node.type === 'folder') {
        const folderHeader = document.createElement('div');
        folderHeader.className = 'flex items-center gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 cursor-pointer text-slate-700 dark:text-slate-300 transition group vault-folder-header';
        folderHeader.style.paddingLeft = `${paddingLeft}px`;

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'folder');
        icon.className = 'w-3.5 h-3.5 text-amber-500 shrink-0 vault-folder-icon';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-semibold truncate text-[11px] group-hover:text-amber-500 transition';
        nameSpan.textContent = node.name;

        folderHeader.appendChild(icon);
        folderHeader.appendChild(nameSpan);

        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'space-y-0.5 vault-folder-children hidden'; // Inicia recolhido para não poluir com 500+ notas

        folderHeader.onclick = (e) => {
          e.stopPropagation();
          const isHidden = childrenContainer.classList.contains('hidden');
          if (isHidden) {
            childrenContainer.classList.remove('hidden');
            icon.setAttribute('data-lucide', 'folder-open');
          } else {
            childrenContainer.classList.add('hidden');
            icon.setAttribute('data-lucide', 'folder');
          }
          if (window.lucide) lucide.createIcons();
        };

        if (node.children) {
          node.children.forEach(child => {
            childrenContainer.appendChild(createTreeNodeElement(child, depth + 1));
          });
        }

        wrapper.appendChild(folderHeader);
        wrapper.appendChild(childrenContainer);
      } else {
        const fileItem = document.createElement('div');
        const isActive = currentVaultNotePath === node.path;
        fileItem.className = `flex items-center gap-1.5 py-1 px-1.5 rounded-lg cursor-pointer transition ${
          isActive 
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold border-l-2 border-amber-500' 
            : 'hover:bg-slate-200/60 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
        }`;
        fileItem.style.paddingLeft = `${paddingLeft}px`;

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', node.ext === '.md' ? 'file-text' : 'file-code');
        icon.className = `w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'truncate text-[11px]';
        nameSpan.textContent = node.name;

        fileItem.appendChild(icon);
        fileItem.appendChild(nameSpan);

        fileItem.onclick = () => {
          openVaultNote(node.path);
        };

        wrapper.appendChild(fileItem);
      }

      return wrapper;
    }

    const VAULT_PROTECTED_FILES = new Set([
      'memoria_lucy.md',
      'agentes/memoria_lucy.md',
      'tasks/todo.md',
      'tasks/lessons.md',
      'README.md',
      'backup_nexus.sh',
      '.mcp.json',
      '.gitignore',
      '.gitattributes',
      'nexus.code-workspace'
    ]);

    const VAULT_PROTECTED_PREFIXES = [
      '.git',
      '.agy',
      '.github',
      '.system_generated',
      'iac',
      'nexus-mcp',
      'agentes/memoria',
      'agentes/agents',
      'scripts/setup'
    ];

    function isVaultFileProtected(relPath) {
      if (!relPath) return true;
      const clean = relPath.replace(/^\/+/, '');
      if (VAULT_PROTECTED_FILES.has(clean)) return true;
      for (const prefix of VAULT_PROTECTED_PREFIXES) {
        if (clean === prefix || clean.startsWith(prefix + '/')) {
          return true;
        }
      }
      return false;
    }

    async function openVaultNote(relPath) {
      currentVaultNotePath = relPath;
      const filenameEl = document.getElementById('vault-active-filename');
      const readingView = document.getElementById('vault-reading-view');
      const textarea = document.getElementById('vault-editor-textarea');
      const statusEl = document.getElementById('vault-save-status');

      if (filenameEl) filenameEl.textContent = relPath;
      if (statusEl) statusEl.textContent = 'Carregando...';

      // Atualiza visual na árvore
      document.querySelectorAll('#vault-tree-container div').forEach(el => {
        el.classList.remove('bg-amber-500/15', 'text-amber-600', 'dark:text-amber-400', 'font-semibold', 'border-l-2', 'border-amber-500');
      });

      try {
        const res = await fetch(`/api/file?path=${encodeURIComponent(relPath)}`);
        if (!res.ok) throw new Error('Não foi possível ler o arquivo');
        const data = await res.json();
        currentVaultRawContent = data.content || '';

        // Renderiza no modo leitura com marked.js
        if (typeof marked !== 'undefined') {
          readingView.innerHTML = marked.parse(currentVaultRawContent);
        } else {
          readingView.textContent = currentVaultRawContent;
        }

        if (textarea) textarea.value = currentVaultRawContent;
        if (statusEl) statusEl.textContent = 'Salvo em disco';

        // Atualiza botões de exclusão de acordo com a política de integridade (tanto no topo quanto inline na nota)
        const deleteBtns = [document.getElementById('btn-delete-note'), document.getElementById('btn-delete-note-inline')].filter(Boolean);
        const isProtected = isVaultFileProtected(relPath);
        deleteBtns.forEach(btnDelete => {
          if (isProtected) {
            btnDelete.disabled = true;
            btnDelete.classList.add('opacity-40', 'cursor-not-allowed');
            btnDelete.classList.remove('cursor-pointer', 'hover:border-rose-500');
            btnDelete.title = 'Arquivo vital de sistema protegido contra exclusão.';
            btnDelete.innerHTML = '<i data-lucide="shield-alert" class="w-4 h-4 text-amber-500"></i>';
          } else {
            btnDelete.disabled = false;
            btnDelete.classList.remove('opacity-40', 'cursor-not-allowed');
            btnDelete.classList.add('cursor-pointer', 'hover:border-rose-500');
            btnDelete.title = 'Mover nota aberta para a Lixeira (.trash)';
            btnDelete.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
          }
        });

        if (window.lucide) lucide.createIcons();

        // No mobile, rola a tela suavemente para o cabeçalho e editor da nota
        if (window.innerWidth < 1024) {
          const editorBox = document.getElementById('vault-active-filename');
          if (editorBox) {
            setTimeout(() => {
              editorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
          }
        }
      } catch (err) {
        readingView.innerHTML = `<div class="p-6 text-rose-500 font-mono text-xs">Erro ao abrir nota: ${err.message}</div>`;
        if (statusEl) statusEl.textContent = 'Erro';
      }
    }

    async function toggleNoteMode() {
      const readingView = document.getElementById('vault-reading-view');
      const editingView = document.getElementById('vault-editing-view');
      const btnSave = document.getElementById('btn-save-note');
      const labelMode = document.getElementById('label-note-mode');
      const iconMode = document.getElementById('icon-note-mode');
      const textarea = document.getElementById('vault-editor-textarea');

      if (isVaultEditMode) {
        // Usuário está tentando sair do modo de edição
        const hasUnsavedChanges = textarea && textarea.value !== currentVaultRawContent;
        if (hasUnsavedChanges) {
          const confirmed = await NexusModal.confirm(
            'Descartar Alterações?',
            `Você possui modificações não salvas na nota '${currentVaultNotePath || 'atual'}'. Se sair agora, as alterações não salvas serão descartadas. Deseja realmente sair do modo de edição?`,
            {
              type: 'danger',
              confirmText: 'Descartar e Sair',
              cancelText: 'Permanecer Editando'
            }
          );
          if (!confirmed) return;

          if (textarea) {
            textarea.value = currentVaultRawContent;
          }
        }

        // Se não fez nenhuma alteração (ou confirmou o descarte), volta imediatamente sem perguntar
        isVaultEditMode = false;
        if (textarea && typeof marked !== 'undefined') {
          readingView.innerHTML = marked.parse(currentVaultRawContent);
        }
        editingView.classList.add('hidden');
        readingView.classList.remove('hidden');

        [document.getElementById('btn-save-note'), document.getElementById('btn-save-note-inline')].filter(Boolean).forEach(b => b.classList.add('hidden'));
        [document.getElementById('btn-toggle-note-mode'), document.getElementById('btn-toggle-note-mode-inline')].filter(Boolean).forEach(btn => {
          btn.title = 'Modo Edição (Lápis - Editar nota)';
          btn.innerHTML = '<i data-lucide="pencil" class="w-4 h-4 text-brand-400"></i>';
        });
      } else {
        // Entrar no modo de edição (exibir olhinho para voltar a visualizar)
        isVaultEditMode = true;
        readingView.classList.add('hidden');
        editingView.classList.remove('hidden');

        [document.getElementById('btn-save-note'), document.getElementById('btn-save-note-inline')].filter(Boolean).forEach(b => b.classList.remove('hidden'));
        [document.getElementById('btn-toggle-note-mode'), document.getElementById('btn-toggle-note-mode-inline')].filter(Boolean).forEach(btn => {
          btn.title = 'Modo Visualização (Olhinho - Ver formatado)';
          btn.innerHTML = '<i data-lucide="eye" class="w-4 h-4 text-emerald-400"></i>';
        });
        if (textarea) textarea.focus();
      }
      if (window.lucide) lucide.createIcons();
    }

    async function saveCurrentNote() {
      if (!currentVaultNotePath) return;
      const textarea = document.getElementById('vault-editor-textarea');
      const statusEl = document.getElementById('vault-save-status');
      if (!textarea) return;

      const confirmed = await NexusModal.confirm(
        'Salvar Alterações no Disco',
        `Deseja salvar as alterações realizadas na nota '${currentVaultNotePath}' diretamente no disco?`,
        { type: 'warning', confirmText: 'Salvar Alterações', cancelText: 'Cancelar' }
      );
      if (!confirmed) return;

      const content = textarea.value;
      if (statusEl) statusEl.textContent = 'Salvando...';

      try {
        const res = await fetch('/api/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: currentVaultNotePath,
            content: content
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Erro ao salvar');
        }

        currentVaultRawContent = content;
        if (statusEl) statusEl.textContent = 'Salvo às ' + new Date().toLocaleTimeString();
        showToast('Nota salva no disco com sucesso! 💾');
      } catch (err) {
        if (statusEl) statusEl.textContent = 'Falha ao salvar';
        NexusModal.alert('Erro ao Salvar', 'Erro ao salvar arquivo: ' + err.message, 'danger');
      }
    }

    function handleEditorShortcuts(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCurrentNote();
      }
      // Suporte a Tab para indentação com 2 espaços
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        e.target.value = e.target.value.substring(0, start) + '  ' + e.target.value.substring(end);
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }
    }

    async function promptNewNote() {
      const notePath = await NexusModal.prompt(
        'Criar Nova Nota Markdown',
        'Digite o caminho ou nome do arquivo no Vault (ex: relatorios/meu_relatorio.md ou ideias.md):',
        '',
        'caminho/arquivo.md'
      );
      if (!notePath || !notePath.trim()) return;

      try {
        const res = await fetch('/api/file/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: notePath.trim() })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Falha ao criar nota');
        }

        showToast('Nova nota criada com sucesso!');
        await loadVaultTree();
        const finalPath = notePath.trim().endsWith('.md') ? notePath.trim() : notePath.trim() + '.md';
        openVaultNote(finalPath);
        if (!isVaultEditMode) toggleNoteMode();
      } catch (err) {
        NexusModal.alert('Erro ao Criar Nota', err.message, 'danger');
      }
    }

    function resetVaultActiveFile() {
      currentVaultNotePath = null;
      currentVaultRawContent = '';
      const filenameEl = document.getElementById('vault-active-filename');
      if (filenameEl) filenameEl.textContent = 'Memória Contínua';
      const readingView = document.getElementById('vault-reading-view');
      if (readingView) readingView.innerHTML = '<div class="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center font-mono text-xs"><i data-lucide="file-text" class="w-12 h-12 mb-3 text-slate-300 dark:text-slate-700"></i><span>Selecione uma nota na árvore ao lado para ler ou editar</span></div>';
      const textarea = document.getElementById('vault-editor-textarea');
      if (textarea) textarea.value = '';
      const statusEl = document.getElementById('vault-save-status');
      if (statusEl) statusEl.textContent = '';
      const deleteBtns = [document.getElementById('btn-delete-note'), document.getElementById('btn-delete-note-inline')].filter(Boolean);
      deleteBtns.forEach(btnDelete => {
        btnDelete.disabled = true;
        btnDelete.classList.add('opacity-40', 'cursor-not-allowed');
        btnDelete.classList.remove('cursor-pointer', 'hover:border-rose-500');
        btnDelete.title = 'Selecione uma nota para excluir';
        btnDelete.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
      });
      if (window.lucide) lucide.createIcons();
    }

    async function openDeleteNoteModal() {
      if (!currentVaultNotePath) return;
      const targetPath = currentVaultNotePath;

      if (isVaultFileProtected(targetPath)) {
        NexusModal.alert('Arquivo Vital Protegido', `O arquivo '${targetPath}' faz parte do núcleo ou código-fonte do ecossistema e não pode ser excluído pelo console web.`, 'warning');
        return;
      }

      const confirmed = await NexusModal.confirm(
        'Mover Nota para a Lixeira',
        `Tens certeza de que queres mover o arquivo '${targetPath}' para a Lixeira (.trash)? Ele não será destruído e poderá ser recuperado a qualquer momento.`,
        { type: 'danger', confirmText: 'Mover para Lixeira', cancelText: 'Cancelar' }
      );
      if (!confirmed) return;

      try {
        const res = await fetch('/api/file/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Falha ao mover para lixeira');
        }

        showToast(`Nota '${targetPath}' movida para .trash com sucesso! 🗑️`);
        resetVaultActiveFile();
        await loadVaultTree();
      } catch (err) {
        NexusModal.alert('Erro ao Excluir', err.message, 'danger');
      }
    }

    async function confirmDeleteNote() {
      if (!currentVaultNotePath) return;
      const targetPath = currentVaultNotePath;
      const btnConfirm = document.getElementById('btn-confirm-delete');
      if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.innerText = 'Movendo...';
      }

      try {
        const res = await fetch('/api/file/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: targetPath })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Falha ao mover para lixeira');
        }

        closeModal('modal-delete-note');
        showToast(`Nota '${targetPath}' movida para .trash com sucesso! 🗑️`);
        resetVaultActiveFile();
        await loadVaultTree();
      } catch (err) {
        NexusModal.alert('Erro ao Excluir', err.message, 'danger');
      } finally {
        if (btnConfirm) {
          btnConfirm.disabled = false;
          btnConfirm.innerHTML = '<i data-lucide="trash-2" class="w-3.5 h-3.5"></i> <span>Confirmar Exclusão</span>';
          if (window.lucide) lucide.createIcons();
        }
      }
    }

    let vaultSearchTimeout = null;
    function handleVaultSearch(e) {
      clearTimeout(vaultSearchTimeout);
      const query = e.target.value.trim();
      const resultsContainer = document.getElementById('vault-search-results');
      if (!resultsContainer) return;

      if (!query || query.length < 2) {
        resultsContainer.classList.add('hidden');
        resultsContainer.innerHTML = '';
        return;
      }

      vaultSearchTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          if (!res.ok) return;
          const matches = await res.json();

          resultsContainer.innerHTML = '';
          if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="p-2 text-slate-400">Nenhum resultado.</div>';
          } else {
            matches.slice(0, 15).forEach(m => {
              const item = document.createElement('div');
              item.className = 'p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded cursor-pointer transition';
              item.innerHTML = `
                <div class="font-semibold text-amber-500 text-[11px] truncate">${m.path} <span class="text-[9px] text-slate-400 font-mono">:L${m.line}</span></div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 truncate">${m.excerpt}</div>
              `;
              item.onclick = () => {
                openVaultNote(m.path);
                resultsContainer.classList.add('hidden');
              };
              resultsContainer.appendChild(item);
            });
          }
          resultsContainer.classList.remove('hidden');
        } catch (err) {
          console.error(err);
        }
      }, 250);
    }

    // Interatividade no Kanban: Alternar Checkbox via API
    async function toggleTaskStatus(taskId, checkboxEl) {
      if (!taskId) return;
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Faça login com a senha mestra para alternar o status das tarefas.');
        if (checkboxEl) checkboxEl.checked = !checkboxEl.checked;
        return;
      }
      try {
        const token = localStorage.getItem('nexus_token') || localStorage.getItem('nexus_auth_token') || (typeof getNexusAuthToken === 'function' ? getNexusAuthToken() : '');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const res = await fetch('/api/tasks/toggle', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({ id: taskId })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Erro ao alternar');
        }
        const data = await res.json();
        showToast(`Tarefa [${taskId}] ${data.completed ? 'concluída! ✅' : 'reaberta! 📌'}`);
        setTimeout(fetchTasks, 400);
      } catch (err) {
        NexusModal.alert('Erro ao Atualizar', 'Erro ao atualizar tarefa: ' + err.message, 'danger');
        if (checkboxEl) checkboxEl.checked = !checkboxEl.checked;
      }
    }

    function showToast(message) {
      let toast = document.getElementById('nexus-toast');
      if (!toast) {
        toast = document.createElement('div');
        toast.id = 'nexus-toast';
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-[99999] px-4 py-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md text-white border border-brand-500/40 shadow-2xl font-mono text-xs flex items-center gap-2 transform transition-all duration-300 opacity-0 translate-y-4 max-w-[90vw] whitespace-nowrap';
        document.body.appendChild(toast);
      }
      toast.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> <span>${message}</span>`;
      if (window.lucide) lucide.createIcons();
      toast.classList.remove('opacity-0', 'translate-y-4');
      toast.classList.add('opacity-100', 'translate-y-0');
      setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-4');
      }, 2500);
    }

