    // ==========================================
    // SITES & PROJETOS WEB (GALERIA & GERENCIAMENTO)
    // ==========================================
    let sitesData = [];
    let currentSiteFilter = 'all';
    let searchSiteQuery = '';

    async function loadSitesTab() {
      const grid = document.getElementById('sites-cards-grid');
      if (grid) grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400 font-mono text-xs">Carregando projetos web...</div>';

      try {
        const res = await fetch('/api/conteudo');
        if (!res.ok) throw new Error('Falha ao carregar conteúdos');
        const data = await res.json();
        conteudoData = data;
        sitesData = data.sites || [];

        const countEl = document.getElementById('count-all-sites');
        if (countEl) countEl.textContent = sitesData.length;
        const badgeEl = document.getElementById('sites-badge');
        if (badgeEl) badgeEl.textContent = sitesData.length + ' Sites';
        const countTabConteudo = document.getElementById('count-site-conteudo');
        if (countTabConteudo) countTabConteudo.textContent = sitesData.length;

        renderSitesGrid();
      } catch (err) {
        if (grid) grid.innerHTML = `<div class="col-span-full text-center py-12 text-rose-500 font-mono text-xs">Erro: ${err.message}</div>`;
      }
    }
    window.loadSitesTab = loadSitesTab;

    function filterSitesUI(nicho) {
      currentSiteFilter = nicho;
      ['all', 'landing', 'ecommerce', 'app'].forEach(key => {
        const b = document.getElementById('sfilter-' + key);
        if (b) {
          const match = (key === 'all' && nicho === 'all') ||
                        (key === 'landing' && nicho === 'Landing Page') ||
                        (key === 'ecommerce' && nicho === 'E-commerce') ||
                        (key === 'app' && nicho === 'Aplicação Web');
          if (match) {
            b.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-violet-500/60 bg-violet-500/15 text-violet-600 dark:text-violet-300 transition shadow-xs';
          } else {
            b.className = 'px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:border-violet-500/40 text-slate-600 dark:text-slate-400 transition';
          }
        }
      });
      renderSitesGrid();
    }
    window.filterSitesUI = filterSitesUI;

    function searchSites(query) {
      searchSiteQuery = (query || '').toLowerCase().trim();
      renderSitesGrid();
    }
    window.searchSites = searchSites;

    function renderSitesGrid() {
      const grid = document.getElementById('sites-cards-grid');
      if (!grid) return;
      const isAuth = window.nexusIsAuthenticated;

      let list = sitesData;
      if (currentSiteFilter !== 'all') {
        list = list.filter(s => (s.nicho || '').toLowerCase().includes(currentSiteFilter.toLowerCase()));
      }
      if (searchSiteQuery) {
        list = list.filter(s =>
          (s.titulo || '').toLowerCase().includes(searchSiteQuery) ||
          (s.descricao || '').toLowerCase().includes(searchSiteQuery) ||
          (s.nicho || '').toLowerCase().includes(searchSiteQuery) ||
          (s.url || '').toLowerCase().includes(searchSiteQuery)
        );
      }

      if (list.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-16 text-slate-400 font-mono text-xs space-y-3 glass-card rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <i data-lucide="globe" class="w-10 h-10 mx-auto text-violet-400/50"></i>
            <p class="font-bold text-slate-700 dark:text-slate-300 text-sm">Nenhum projeto web encontrado.</p>
            <p class="text-[11px] text-slate-500 max-w-md mx-auto">Cadastre teus sites, landing pages de clientes ou protótipos clicando em "+ Novo Site / Print".</p>
            <button onclick="openSiteModal()" class="px-4 py-2 rounded-xl border border-violet-500/60 hover:border-violet-400 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 font-mono text-xs font-bold inline-flex items-center gap-1.5 transition shadow-xs">
              <i data-lucide="plus-circle" class="w-4 h-4"></i> Cadastrar Primeiro Site
            </button>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      grid.innerHTML = list.map(item => {
        const safeTitle = (item.titulo || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeUrl = (item.url || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const rawItemJson = JSON.stringify(item).replace(/'/g, "&#39;");

        const hasImg = item.principal && (item.principal.endsWith('.png') || item.principal.endsWith('.jpg') || item.principal.endsWith('.jpeg') || item.principal.endsWith('.webp'));
        const imgHtml = hasImg
          ? `<img src="${item.principal}" alt="${item.titulo}" class="w-full h-full object-cover object-top cursor-zoom-in group-hover:scale-105 transition duration-300" onclick="openSiteLightbox('${item.principal}', '${safeTitle}', '${safeUrl}')">`
          : `<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-950">
               <i data-lucide="globe" class="w-10 h-10 text-violet-400/60 mb-2"></i>
               <span class="text-xs font-mono text-slate-400 line-clamp-1">${item.url || item.titulo}</span>
             </div>`;

        const statusMap = {
          online: { label: 'No Ar', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
          desenvolvimento: { label: 'Em Dev', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
          concluido: { label: 'Concluído', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', dot: 'bg-blue-500' }
        };
        const st = statusMap[item.status] || statusMap.online;

        const visitBtnHtml = item.url ? `
          <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="flex-1 py-1.5 px-3 rounded-xl border border-violet-500/60 hover:border-violet-400 bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-[11px] font-semibold text-center transition flex items-center justify-center gap-1.5 shadow-xs" title="Abrir site em nova aba">
            <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Visitar Site
          </a>
        ` : `
          <button onclick='openSiteModal(${rawItemJson})' class="flex-1 py-1.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold text-center transition flex items-center justify-center gap-1.5 hover:bg-violet-500/20 hover:text-violet-400">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Adicionar Link
          </button>
        `;

        const editBtnHtml = `
          <button onclick='openSiteModal(${rawItemJson})' class="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-violet-500/10 hover:text-violet-400 hover:border-violet-500/40 text-slate-500 dark:text-slate-400 transition cursor-pointer" title="Editar informações ou print">
            <i data-lucide="edit-3" class="w-4 h-4"></i>
          </button>
        `;

        const deleteBtnHtml = isAuth ? `
          <button onclick="deleteSiteItem('${item.slug}', '${safeTitle}')" class="p-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500 transition cursor-pointer" title="Excluir este site permanentemente">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : '';

        return `
          <div class="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col group hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/5 transition">
            <!-- Mockup de Barra de Navegador do Site -->
            <div class="bg-slate-200/90 dark:bg-slate-950 px-3 py-2 border-b border-slate-300 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <div class="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[200px]" title="${item.url || item.slug}">
                ${item.url ? item.url.replace(/^https?:\/\//, '') : item.slug}
              </div>
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 font-semibold border border-violet-500/20">WEB</span>
            </div>

            <!-- Preview do Print com Aspect Ratio 16:10 -->
            <div class="relative bg-slate-950 aspect-[16/10] overflow-hidden">
              ${imgHtml}
              ${hasImg ? `
                <button onclick="openSiteLightbox('${item.principal}', '${safeTitle}', '${safeUrl}')" class="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white hover:text-violet-400 transition" title="Ampliar print em tela cheia">
                  <i data-lucide="maximize-2" class="w-3.5 h-3.5"></i>
                </button>
              ` : ''}
            </div>

            <!-- Conteúdo do Card -->
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500 dark:text-violet-400 font-mono text-[10px] font-semibold border border-violet-500/20">${item.nicho || 'Landing Page'}</span>
                  <span class="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border flex items-center gap-1 ${st.class}"><span class="w-1.5 h-1.5 rounded-full ${st.dot}"></span> ${st.label}</span>
                  <span class="text-[10px] font-mono text-slate-400 ml-auto">${item.data}</span>
                </div>
                <h4 class="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">${item.titulo}</h4>
                <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">${item.descricao || 'Sem descrição informada.'}</p>
              </div>

              <!-- Ações -->
              <div class="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                ${visitBtnHtml}
                ${editBtnHtml}
                ${deleteBtnHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');

      if (window.lucide) lucide.createIcons();
    }
    window.renderSitesGrid = renderSitesGrid;

    function openSiteModal(site = null) {
      const modal = document.getElementById('modal-site-form');
      if (!modal) return;

      const titleEl = document.getElementById('site-modal-title');
      const slugInput = document.getElementById('site-form-slug');
      const tituloInput = document.getElementById('site-form-titulo');
      const urlInput = document.getElementById('site-form-url');
      const nichoInput = document.getElementById('site-form-nicho');
      const statusInput = document.getElementById('site-form-status');
      const descInput = document.getElementById('site-form-desc');
      const base64Input = document.getElementById('site-form-base64');
      const fileInput = document.getElementById('site-form-file');
      const prevContainer = document.getElementById('site-preview-container');
      const prevImg = document.getElementById('site-preview-img');

      if (fileInput) fileInput.value = '';
      if (base64Input) base64Input.value = '';

      if (site) {
        if (titleEl) titleEl.textContent = 'Editar Projeto Web';
        if (slugInput) slugInput.value = site.slug || '';
        if (tituloInput) tituloInput.value = site.titulo || '';
        if (urlInput) urlInput.value = site.url || '';
        if (nichoInput) nichoInput.value = site.nicho || 'Landing Page';
        if (statusInput) statusInput.value = site.status || 'online';
        if (descInput) descInput.value = site.descricao || '';
        if (site.principal && prevContainer && prevImg) {
          prevImg.src = site.principal;
          prevContainer.classList.remove('hidden');
        } else if (prevContainer) {
          prevContainer.classList.add('hidden');
        }
      } else {
        if (titleEl) titleEl.textContent = 'Registrar Novo Projeto Web / Print';
        if (slugInput) slugInput.value = '';
        if (tituloInput) tituloInput.value = '';
        if (urlInput) urlInput.value = '';
        if (nichoInput) nichoInput.value = 'Landing Page';
        if (statusInput) statusInput.value = 'online';
        if (descInput) descInput.value = '';
        if (prevContainer) prevContainer.classList.add('hidden');
      }

      modal.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
      setTimeout(() => tituloInput && tituloInput.focus(), 100);
    }
    window.openSiteModal = openSiteModal;

    function closeSiteModal() {
      const modal = document.getElementById('modal-site-form');
      if (modal) modal.classList.add('hidden');
    }
    window.closeSiteModal = closeSiteModal;

    function handleSiteImageUpload(input) {
      if (!input.files || !input.files[0]) return;
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Input = document.getElementById('site-form-base64');
        const prevContainer = document.getElementById('site-preview-container');
        const prevImg = document.getElementById('site-preview-img');
        if (base64Input) base64Input.value = e.target.result;
        if (prevImg) prevImg.src = e.target.result;
        if (prevContainer) prevContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
    window.handleSiteImageUpload = handleSiteImageUpload;

    function clearSitePreview() {
      const fileInput = document.getElementById('site-form-file');
      const base64Input = document.getElementById('site-form-base64');
      const prevContainer = document.getElementById('site-preview-container');
      const prevImg = document.getElementById('site-preview-img');
      if (fileInput) fileInput.value = '';
      if (base64Input) base64Input.value = '';
      if (prevImg) prevImg.src = '';
      if (prevContainer) prevContainer.classList.add('hidden');
    }
    window.clearSitePreview = clearSitePreview;

    async function submitSaveSite(event) {
      event.preventDefault();
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Faça login com a senha mestra para salvar ou editar projetos web.');
        return;
      }

      const slug = document.getElementById('site-form-slug').value.trim();
      const titulo = document.getElementById('site-form-titulo').value.trim();
      const url = document.getElementById('site-form-url').value.trim();
      const nicho = document.getElementById('site-form-nicho').value;
      const status = document.getElementById('site-form-status').value;
      const descricao = document.getElementById('site-form-desc').value.trim();
      const print_base64 = document.getElementById('site-form-base64').value;

      const btn = document.getElementById('btn-save-site');
      if (btn) btn.disabled = true;

      try {
        const payload = { slug, titulo, url, nicho, status, descricao, print_base64 };
        const res = await fetch('/api/conteudo/sites/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Falha ao salvar projeto');
        }

        showToast('Projeto web salvo com sucesso! 🌐');
        closeSiteModal();
        await loadSitesTab();
        await loadConteudoTab();
      } catch (err) {
        await NexusModal.alert('Erro ao salvar projeto: ' + err.message, {
          title: 'Erro no Salvamento',
          type: 'error'
        });
      } finally {
        if (btn) btn.disabled = false;
      }
    }
    window.submitSaveSite = submitSaveSite;

    async function deleteSiteItem(slug, titulo) {
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Faça login com a senha mestra para excluir projetos web.');
        return;
      }
      const confirmed = await NexusModal.confirm(
        `Deseja realmente excluir o projeto web "${titulo}"? A pasta em conteudo/sites/${slug} será movida com segurança para a Lixeira (.trash).`,
        {
          title: 'Confirmar Exclusão de Projeto Web',
          type: 'danger',
          confirmText: 'Sim, Excluir Projeto'
        }
      );
      if (!confirmed) return;

      try {
        const res = await fetch('/api/conteudo/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo: 'site', slug })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.error || 'Falha ao excluir');
        }
        showToast(`Projeto "${titulo}" movido para a Lixeira! 🗑️`);
        await loadSitesTab();
        await loadConteudoTab();
      } catch (err) {
        await NexusModal.alert('Erro ao excluir projeto web: ' + err.message, {
          title: 'Erro na Exclusão',
          type: 'error'
        });
      }
    }
    window.deleteSiteItem = deleteSiteItem;

    function openSiteLightbox(imgUrl, title, siteUrl) {
      const modal = document.getElementById('site-lightbox-modal');
      const img = document.getElementById('lightbox-site-img');
      const titleEl = document.getElementById('lightbox-site-title');
      const linkEl = document.getElementById('lightbox-site-link');

      if (!modal || !img) return;
      img.src = imgUrl;
      if (titleEl) titleEl.textContent = title || 'Print do Projeto Web';
      if (linkEl) {
        if (siteUrl && siteUrl !== '#') {
          linkEl.href = siteUrl;
          linkEl.classList.remove('hidden');
        } else {
          linkEl.classList.add('hidden');
        }
      }
      modal.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
    window.openSiteLightbox = openSiteLightbox;

    function closeSiteLightbox() {
      const modal = document.getElementById('site-lightbox-modal');
      if (modal) modal.classList.add('hidden');
    }
    window.closeSiteLightbox = closeSiteLightbox;

    async function refreshSites(manual = false) {
      triggerSpin('icon-refresh-sites');
      try {
        await loadSitesTab();
        if (manual) showToast('Galeria de sites atualizada! 🌐');
      } finally {
        clearSpin('icon-refresh-sites');
      }
    }
    window.refreshSites = refreshSites;

    async function refreshConteudos(manual = false) {
      triggerSpin('icon-refresh-conteudo');
      try {
        await loadConteudoTab();
        if (manual) showToast('Catálogo de conteúdos atualizado! 🎬');
      } finally {
        clearSpin('icon-refresh-conteudo');
      }
    }
    window.refreshConteudos = refreshConteudos;

