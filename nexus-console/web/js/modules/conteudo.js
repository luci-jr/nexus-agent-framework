    // ==========================================
    // ESTÚDIO DE MÍDIA & CONTEÚDO
    // ==========================================
    let conteudoData = { videos: [], carrosseis: [], thumbnails: [], sites: [], total: 0 };
    let currentConteudoFilter = 'all';

    async function loadConteudoTab() {
      const grid = document.getElementById('conteudo-cards-grid');
      if (grid) grid.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400 font-mono text-xs">Carregando mídias geradas...</div>';

      try {
        const res = await fetch('/api/conteudo');
        if (!res.ok) throw new Error('Falha ao obter lista de conteúdos');
        conteudoData = await res.json();

        // Atualizar contadores
        const countAll = document.getElementById('count-all-conteudo');
        const countVid = document.getElementById('count-video-conteudo');
        const countCar = document.getElementById('count-carrossel-conteudo');
        const countThu = document.getElementById('count-thumb-conteudo');
        const countSit = document.getElementById('count-site-conteudo');
        const sitesBadge = document.getElementById('sites-badge');

        if (countAll) countAll.textContent = conteudoData.total || 0;
        if (countVid) countVid.textContent = (conteudoData.videos || []).length;
        if (countCar) countCar.textContent = (conteudoData.carrosseis || []).length;
        if (countThu) countThu.textContent = (conteudoData.thumbnails || []).length;
        if (countSit) countSit.textContent = (conteudoData.sites || []).length;
        if (sitesBadge) sitesBadge.textContent = ((conteudoData.sites || []).length) + ' Sites';

        renderConteudoCards();
      } catch (err) {
        if (grid) grid.innerHTML = `<div class="col-span-full text-center py-12 text-rose-500 font-mono text-xs">Erro: ${err.message}</div>`;
      }
    }

    function filterConteudoUI(type) {
      currentConteudoFilter = type;
      ['all', 'video', 'carrossel', 'thumbnail', 'site'].forEach(t => {
        const b = document.getElementById('filter-btn-' + t);
        if (b) {
          if (t === type) {
            b.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E0684B]/60 bg-[#E0684B]/15 text-[#E0684B] dark:text-[#ff914d] transition shadow-xs';
          } else {
            b.className = 'px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 transition';
          }
        }
      });
      renderConteudoCards();
    }

    function renderConteudoCards() {
      const grid = document.getElementById('conteudo-cards-grid');
      if (!grid) return;
      const isAuth = window.nexusIsAuthenticated;

      let items = [];
      if (currentConteudoFilter === 'all' || currentConteudoFilter === 'video') {
        items = items.concat(conteudoData.videos || []);
      }
      if (currentConteudoFilter === 'all' || currentConteudoFilter === 'carrossel') {
        items = items.concat(conteudoData.carrosseis || []);
      }
      if (currentConteudoFilter === 'all' || currentConteudoFilter === 'thumbnail') {
        items = items.concat(conteudoData.thumbnails || []);
      }
      if (currentConteudoFilter === 'all' || currentConteudoFilter === 'site') {
        items = items.concat(conteudoData.sites || []);
      }

      if (items.length === 0) {
        grid.innerHTML = `
          <div class="col-span-full text-center py-12 text-slate-400 font-mono text-xs space-y-3">
            <p>Nenhuma mídia encontrada para este filtro.</p>
            <p class="text-slate-500 text-[11px]">Use os scripts em <code>scripts/gerar_video_retro.py</code> ou cadastre sites na aba "Sites & Projetos Web".</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = items.map(item => {
        const safeTitle = (item.titulo || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const safeUrl = (item.url || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const deleteBtnHtml = isAuth ? `
          <button onclick="deleteConteudoItem('${item.tipo}', '${item.slug}', '${safeTitle}')" class="p-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500 transition cursor-pointer" title="Excluir este item permanentemente">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        ` : '';

        if (item.tipo === 'video') {
          return `
            <div class="glass-card rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col group hover:border-brand-500/50 transition">
              <div class="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                <video src="${item.principal}" controls preload="metadata" class="w-full h-full object-contain"></video>
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 font-['Space_Grotesk']">${item.titulo}</h4>
                  <div class="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                    <span>${item.data}</span>
                    <span>•</span>
                    <span class="text-[#E0684B] font-bold">🎬 Vídeo Retro • Graphic Novel</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-slate-300/80 dark:border-slate-800 font-mono">
                  <a href="${item.principal}" download="${item.slug}.mp4" class="flex-1 py-2 px-3 rounded-xl border border-[#ff914d]/60 bg-[#ff914d]/10 hover:bg-[#ff914d]/20 text-[#ff914d] hover:text-white text-xs font-mono font-semibold shadow-xs transition flex items-center justify-center gap-1.5" title="Baixar arquivo de vídeo MP4">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> Baixar MP4
                  </a>
                  <a href="${item.principal}" target="_blank" class="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:border-[#E0684B] text-slate-700 dark:text-slate-300 transition" title="Abrir vídeo em tela cheia">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                  </a>
                  ${deleteBtnHtml}
                </div>
              </div>
            </div>
          `;
        } else if (item.tipo === 'carrossel') {
          const firstSlide = (item.arquivos || []).find(a => a.includes('slide_01')) || item.principal;
          const pdfFile = (item.arquivos || []).find(a => a.endsWith('.pdf')) || item.principal;
          return `
            <div class="retro-card overflow-hidden flex flex-col group">
              <div class="relative bg-slate-950 aspect-[4/3] flex items-center justify-center overflow-hidden">
                <img src="${firstSlide}" alt="${item.titulo}" class="w-full h-full object-cover">
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 font-['Space_Grotesk']">${item.titulo}</h4>
                  <div class="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                    <span>${item.data}</span>
                    <span>•</span>
                    <span class="text-emerald-500 font-bold">📱 Carrossel • Slides PNG + PDF</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-slate-300/80 dark:border-slate-800 font-mono">
                  <a href="${pdfFile}" download="${item.slug}.pdf" class="flex-1 py-2 px-3 rounded-xl border border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-white text-xs font-mono font-semibold shadow-xs transition flex items-center justify-center gap-1.5" title="Baixar arquivo PDF oficial">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> Baixar PDF
                  </a>
                  <a href="${firstSlide}" target="_blank" class="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:border-[#E0684B] text-slate-700 dark:text-slate-300 transition" title="Ver capa em tamanho real">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                  </a>
                  ${deleteBtnHtml}
                </div>
              </div>
            </div>
          `;
        } else if (item.tipo === 'site') {
          const hasImg = item.principal && (item.principal.endsWith('.png') || item.principal.endsWith('.jpg') || item.principal.endsWith('.jpeg') || item.principal.endsWith('.webp'));
          const imgPreviewHtml = hasImg
            ? `<img src="${item.principal}" alt="${item.titulo}" class="w-full h-full object-cover object-top cursor-zoom-in group-hover:scale-105 transition duration-300" onclick="openSiteLightbox('${item.principal}', '${safeTitle}', '${safeUrl}')">`
            : `<div class="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950">
                 <i data-lucide="globe" class="w-10 h-10 text-amber-500/60 mb-2"></i>
                 <span class="text-xs font-mono text-slate-400 line-clamp-1">${item.url || item.titulo}</span>
               </div>`;

          const visitBtnHtml = item.url ? `
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="flex-1 py-2 px-3 rounded-xl border border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-white text-xs font-mono font-semibold shadow-xs transition flex items-center justify-center gap-1.5" title="Visitar site em nova aba">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i> Visitar Site
            </a>
          ` : `
            <button onclick="switchTab('tab-sites')" class="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-mono font-semibold text-center flex items-center justify-center gap-1.5">
              <i data-lucide="info" class="w-3.5 h-3.5"></i> Ver Projeto
            </button>
          `;

          return `
            <div class="retro-card overflow-hidden flex flex-col group">
              <!-- Mockup de Navegador Retrô -->
              <div class="bg-slate-200/90 dark:bg-slate-950 px-3 py-1.5 border-b border-slate-300 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 shrink-0">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                </div>
                <div class="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-[180px]">${item.url ? item.url.replace(/^https?:\/\//, '') : item.slug}</div>
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-500 font-semibold border border-amber-500/20">Web</span>
              </div>
              <div class="relative bg-slate-950 aspect-[16/10] overflow-hidden">
                ${imgPreviewHtml}
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono text-[10px] font-semibold border border-amber-500/20">${item.nicho || 'Landing Page'}</span>
                    <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-semibold border border-emerald-500/20 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> ${item.status || 'Online'}</span>
                  </div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 font-['Space_Grotesk']">${item.titulo}</h4>
                  <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">${item.descricao || 'Projeto web registrado para acompanhamento contínuo.'}</p>
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-slate-300/80 dark:border-slate-800 font-mono">
                  ${visitBtnHtml}
                  ${deleteBtnHtml}
                </div>
              </div>
            </div>
          `;
        } else {
          // Thumbnail A/B/C
          const pngs = (item.arquivos || []).filter(a => a.endsWith('.png'));
          const thumbA = pngs.find(a => a.includes('thumb_a')) || item.principal || (pngs[0] || '');
          return `
            <div class="retro-card overflow-hidden flex flex-col group">
              <div class="relative bg-slate-950 aspect-video flex items-center justify-center overflow-hidden">
                <img id="img-thumb-${item.slug}" src="${thumbA}" alt="${item.titulo}" class="w-full h-full object-cover">
              </div>
              <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 class="font-bold text-sm text-slate-900 dark:text-white line-clamp-2 font-['Space_Grotesk']">${item.titulo}</h4>
                  <div class="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-1">
                    <span>${item.data}</span>
                    <span>•</span>
                    <span class="text-amber-500 font-bold">🎨 Thumbnail A/B/C • 1280x720 (16:9)</span>
                  </div>
                </div>

                <!-- Seletor de Variações A/B/C Retrô -->
                <div class="flex items-center gap-1.5 pt-1">
                  ${pngs.map((imgUrl, i) => `
                    <button onclick="selectThumbVar('${item.slug}', '${imgUrl}')" class="thumb-var-btn flex-1 py-1 px-1.5 rounded-lg text-[10px] font-mono text-center border transition ${i === 0 ? 'bg-[#E0684B]/25 border-[#E0684B] text-[#E0684B] font-bold shadow-xs' : 'text-slate-400 border-slate-700/80 bg-slate-900/60 hover:border-[#E0684B]/50'}" data-thumb-group="${item.slug}">
                      Var ${String.fromCharCode(65 + i)}
                    </button>
                  `).join('')}
                </div>

                <div class="flex items-center gap-2 pt-2 border-t border-slate-300/80 dark:border-slate-800 font-mono">
                  <a id="download-thumb-${item.slug}" href="${thumbA}" download="${item.slug}.png" class="flex-1 py-2 px-3 rounded-xl border border-[#ff914d]/60 bg-[#ff914d]/10 hover:bg-[#ff914d]/20 text-[#ff914d] hover:text-white text-xs font-mono font-semibold shadow-xs transition flex items-center justify-center gap-1.5" title="Baixar imagem da Thumbnail">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i> Baixar PNG
                  </a>
                  <a id="view-thumb-${item.slug}" href="${thumbA}" target="_blank" class="p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:border-[#E0684B] text-slate-700 dark:text-slate-300 transition" title="Abrir imagem em tamanho real">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                  </a>
                  ${deleteBtnHtml}
                </div>
              </div>
            </div>
          `;
        }
      }).join('');

      if (window.lucide) lucide.createIcons();
    }

    function selectThumbVar(slug, imgUrl) {
      const imgEl = document.getElementById('img-thumb-' + slug);
      const dlEl = document.getElementById('download-thumb-' + slug);
      const viewEl = document.getElementById('view-thumb-' + slug);
      if (imgEl) imgEl.src = imgUrl;
      if (dlEl) dlEl.href = imgUrl;
      if (viewEl) viewEl.href = imgUrl;

      document.querySelectorAll(`button[data-thumb-group="${slug}"]`).forEach(btn => {
        btn.classList.remove('bg-[#E0684B]/25', 'border-[#E0684B]', 'text-[#E0684B]', 'font-bold', 'shadow-xs');
        btn.classList.add('text-slate-400', 'border-slate-700/80', 'bg-slate-900/60');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(imgUrl)) {
          btn.classList.add('bg-[#E0684B]/25', 'border-[#E0684B]', 'text-[#E0684B]', 'font-bold', 'shadow-xs');
          btn.classList.remove('text-slate-400', 'border-slate-700/80', 'bg-slate-900/60');
        }
      });
    }
    window.selectThumbVar = selectThumbVar;

    async function deleteConteudoItem(tipo, slug, titulo) {
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Faça login com a senha mestra para excluir mídias e conteúdos.');
        return;
      }
      const tipoLabel = tipo === 'video' ? 'Vídeo Retro' : (tipo === 'carrossel' ? 'Carrossel' : (tipo === 'site' ? 'Projeto Web' : 'Thumbnail'));
      const confirmed = await NexusModal.confirm(
        `Deseja realmente excluir permanentemente o ${tipoLabel} "${titulo}" (${slug})? A mídia será movida com segurança para a Lixeira (.trash).`,
        {
          title: 'Confirmar Exclusão de Mídia',
          type: 'danger',
          confirmText: 'Sim, Excluir Mídia'
        }
      );
      if (!confirmed) return;

      try {
        const res = await fetch('/api/conteudo/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo, slug })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          await NexusModal.alert('Erro ao excluir mídia: ' + (data.error || 'Falha na requisição'), {
            title: 'Falha na Exclusão',
            type: 'error'
          });
          return;
        }
        await loadConteudoTab();
        if (typeof loadSitesTab === 'function') await loadSitesTab();
      } catch (err) {
        await NexusModal.alert('Erro de conexão ao excluir mídia: ' + err.message, {
          title: 'Erro de Conexão',
          type: 'error'
        });
      }
    }
    window.deleteConteudoItem = deleteConteudoItem;

