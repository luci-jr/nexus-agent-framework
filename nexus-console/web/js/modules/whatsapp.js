    // ==========================================
    // PONTE HEADLESS WHATSAPP ↔ LUCY CORE
    // ==========================================
    let whatsappSessionsData = {};

    function setWhatsAppPrompt(txt) {
      const area = document.getElementById('whatsapp-test-text');
      if (area) {
        area.value = txt;
        area.focus();
      }
    }

    async function loadWhatsAppTab() {
      try {
        // Status da Ponte
        const resStatus = await fetch('/api/ponte/status');
        if (resStatus.ok) {
          const status = await resStatus.json();
          const badge = document.getElementById('bridge-status-badge');
          if (badge) {
            badge.textContent = status.status === 'online' ? 'Online' : 'Offline';
            badge.className = status.status === 'online'
              ? 'px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : 'px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20';
          }
          const engineVal = document.getElementById('bridge-engine-val');
          if (engineVal) engineVal.textContent = (status.default_engine || 'agy') + ' (Headless)';
          const binVal = document.getElementById('bridge-bin-val');
          if (binVal) binVal.textContent = status.bin_agy || '/usr/local/bin/agy';
          const sessCount = document.getElementById('bridge-sessions-count');
          if (sessCount) sessCount.textContent = (status.active_sessions || 0) + ' sessões';
        }

        // Sessões Ativas
        const resSessions = await fetch('/api/ponte/sessions');
        if (resSessions.ok) {
          whatsappSessionsData = await resSessions.json();
          renderWhatsAppSessions();
        } else if (resSessions.status === 401) {
          const list = document.getElementById('whatsapp-sessions-list');
          if (list) {
            list.innerHTML = `
              <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono flex items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                  <i data-lucide="lock" class="w-4 h-4 shrink-0"></i>
                  <span>Sessões ativas protegidas por senha mestra. Faça login para gerenciar.</span>
                </div>
                <button onclick="openAuthModal('Faça login com a Chave Mestra para gerenciar sessões do WhatsApp.')" class="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] shrink-0 transition cursor-pointer">
                  ENTRAR
                </button>
              </div>
            `;
            if (window.lucide) lucide.createIcons();
          }
        }
      } catch (err) {
        console.error('Erro ao carregar ponte WhatsApp:', err);
      }
    }

    function renderWhatsAppSessions() {
      const list = document.getElementById('whatsapp-sessions-list');
      if (!list) return;
      const isAuth = window.nexusIsAuthenticated;
      const keys = Object.keys(whatsappSessionsData || {});
      if (keys.length === 0) {
        list.innerHTML = '<div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs font-mono">Nenhuma sessão ativa no momento. Envie uma mensagem pelo WhatsApp ou pelo simulador ao lado para abrir o primeiro contexto.</div>';
        return;
      }

      list.innerHTML = keys.map(k => {
        const s = whatsappSessionsData[k];
        const last = s.last_active ? new Date(s.last_active).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';
        const displaySender = isAuth ? s.sender : (s.sender || '').replace(/^(\d{4})\d+(\d{2})$/, '$1••••••$2');
        return `
          <div class="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold font-mono text-xs text-slate-900 dark:text-white">${displaySender}</span>
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-500">${s.engine || 'agy'}</span>
              </div>
              <div class="text-[11px] font-mono text-slate-400 mt-1">
                Turnos: <strong>${s.turns || 0}</strong> • Último contato: ${last}
              </div>
              ${s.conversation_id && isAuth ? `<div class="text-[10px] font-mono text-slate-500 truncate max-w-[280px]">ID: ${s.conversation_id}</div>` : ''}
            </div>
            ${isAuth ? `
              <button onclick="resetWhatsAppSender('${s.sender}')" class="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-black/5 dark:hover:bg-white/5 text-[11px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer" title="Zerar contexto da conversa">
                <i data-lucide="rotate-ccw" class="w-3 h-3"></i> Resetar
              </button>
            ` : `
              <span class="text-[10px] font-mono text-slate-400 flex items-center gap-1"><i data-lucide="lock" class="w-3 h-3"></i> Protegido</span>
            `}
          </div>
        `;
      }).join('');
      if (window.lucide) lucide.createIcons();
    }

    async function resetWhatsAppSender(sender) {
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Faça login com a senha mestra para gerenciar sessões do WhatsApp.');
        return;
      }
      const confirmed = await NexusModal.confirm(
        'Resetar Contexto WhatsApp',
        `Deseja resetar o contexto de conversa do remetente ${sender}? A conversa recente será zerada e uma nova sessão será iniciada mantendo a memória contínua íntegra.`,
        { type: 'danger', confirmText: 'Resetar Contexto' }
      );
      if (!confirmed) return;
      try {
        const res = await fetch('/api/ponte/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: sender, text: '/reset' })
        });
        const data = await res.json();
        await NexusModal.alert('Sessão Reiniciada', data.response || 'Sessão resetada com sucesso!', 'success');
        loadWhatsAppTab();
      } catch (err) {
        await NexusModal.alert('Erro ao Resetar', err.message, 'danger');
      }
    }

    async function sendRealWhatsAppMessage() {
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Acesso restrito: faça login com a senha mestra para disparar mensagens no WhatsApp físico.');
        return;
      }
      const senderInput = document.getElementById('whatsapp-test-sender');
      const textInput = document.getElementById('whatsapp-test-text');
      const btn = document.getElementById('btn-send-whatsapp-real');
      const resBox = document.getElementById('whatsapp-response-box');
      const resText = document.getElementById('whatsapp-res-text');
      const resTime = document.getElementById('whatsapp-res-time');
      const resMeta = document.getElementById('whatsapp-res-meta');

      const number = senderInput && senderInput.value.trim() ? senderInput.value.trim() : '5511999990000';
      const text = textInput ? textInput.value.trim() : '';
      if (!text) {
        NexusModal.alert('Campo Obrigatório', 'Digite a mensagem de texto que desejas disparar para o WhatsApp.', 'warning');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Despachando via Evolution Go...';
      resBox.classList.remove('hidden');
      resText.textContent = `⏳ Conectando na Evolution Go e entregando mensagem no WhatsApp (+${number})...`;
      resTime.textContent = '...';

      const startTime = performance.now();

      try {
        const res = await fetch('/api/ponte/whatsapp/send-real', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number: number, text: text })
        });

        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        const data = await res.json();

        resTime.textContent = `${elapsed}s`;
        if (res.ok && data.ok) {
          resText.textContent = `✅ Mensagem enviada com sucesso para o WhatsApp (+${number})!\nPodes conferir no teu celular agora mesmo. 📱🚀\n\nTexto enviado:\n"${text}"`;
          resMeta.textContent = 'Evolution Go • Entregue no Celular';
          showToast('Mensagem enviada para o WhatsApp com sucesso!', 'success');
        } else {
          resText.textContent = `❌ Falha ao enviar no WhatsApp: ${data.error || 'Erro desconhecido'}`;
          resMeta.textContent = 'Evolution Go • Falha';
        }
        loadWhatsAppTab();
      } catch (err) {
        resTime.textContent = 'Erro';
        resText.textContent = '❌ Erro de conexão com o servidor: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="smartphone" class="w-4 h-4"></i> Disparar Mensagem Real no Celular (WhatsApp)';
        if (window.lucide) lucide.createIcons();
      }
    }
    window.sendRealWhatsAppMessage = sendRealWhatsAppMessage;

    async function askLucyAndSendWhatsApp() {
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Acesso restrito: faça login com a senha mestra para perguntar ao Lucy com resposta no celular.');
        return;
      }
      const senderInput = document.getElementById('whatsapp-test-sender');
      const textInput = document.getElementById('whatsapp-test-text');
      const btn = document.getElementById('btn-ask-and-send-wa');
      const resBox = document.getElementById('whatsapp-response-box');
      const resText = document.getElementById('whatsapp-res-text');
      const resTime = document.getElementById('whatsapp-res-time');
      const resMeta = document.getElementById('whatsapp-res-meta');

      const sender = senderInput && senderInput.value.trim() ? senderInput.value.trim() : '5511999990000';
      const text = textInput ? textInput.value.trim() : '';
      if (!text) {
        NexusModal.alert('Campo Obrigatório', 'Digite a pergunta ou comando que o Lucy deve responder.', 'warning');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Lucy formulando...';
      resBox.classList.remove('hidden');
      resText.textContent = `⏳ Lucy executando tarefa no servidor e despachando a resposta no teu WhatsApp (+${sender})...`;
      resTime.textContent = '...';

      const startTime = performance.now();

      try {
        const res = await fetch('/api/ponte/whatsapp/ask-and-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: sender, text: text, engine: 'agy' })
        });

        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        const data = await res.json();

        resTime.textContent = `${elapsed}s`;
        if (res.ok && data.ok) {
          if (data.status === 'processing') {
            resText.textContent = `🚀 Pergunta enviada ao Lucy com sucesso!\n\nO orquestrador está processando em segundo plano e a resposta completa será enviada diretamente no teu WhatsApp físico (+${sender}). Podes acompanhar pelo teu celular! 📱✨`;
            resMeta.textContent = 'Lucy Core • Processamento em Background';
            showToast('Pergunta enviada! A resposta chegará no teu WhatsApp. 🚀', 'success');
            if (textInput) textInput.value = '';
          } else {
            const dispatchBadge = data.dispatched_to_wa ? '📱 [Enviado também no teu WhatsApp]' : '⚠️ [Falha no envio do WhatsApp]';
            resText.textContent = `${dispatchBadge}\n\n${data.response}`;
            resMeta.textContent = `Lucy Core • ${data.engine || 'agy'}`;
            showToast('Lucy respondeu e enviou no teu WhatsApp!', 'success');
          }
        } else {
          resText.textContent = `❌ Erro: ${data.error || data.response || 'Falha ao processar'}`;
        }
        loadWhatsAppTab();
      } catch (err) {
        resTime.textContent = 'Erro';
        resText.textContent = '❌ Erro de conexão com a API da ponte: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="bot" class="w-3.5 h-3.5"></i> Perguntar &amp; Enviar no Celular';
        if (window.lucide) lucide.createIcons();
      }
    }
    window.askLucyAndSendWhatsApp = askLucyAndSendWhatsApp;

    async function sendWhatsAppTestMessage() {
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Acesso restrito: faça login com a senha mestra para simular mensagens na tela.');
        return;
      }
      const senderInput = document.getElementById('whatsapp-test-sender');
      const textInput = document.getElementById('whatsapp-test-text');
      const btn = document.getElementById('btn-send-whatsapp-test');
      const resBox = document.getElementById('whatsapp-response-box');
      const resText = document.getElementById('whatsapp-res-text');
      const resTime = document.getElementById('whatsapp-res-time');
      const resMeta = document.getElementById('whatsapp-res-meta');

      const sender = senderInput && senderInput.value.trim() ? senderInput.value.trim() : '5511999990000';
      const text = textInput ? textInput.value.trim() : '';
      if (!text) {
        NexusModal.alert('Campo Obrigatório', 'Digite uma mensagem ou comando para simular.', 'warning');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Simulando...';
      resBox.classList.remove('hidden');
      resText.textContent = '⏳ Executando motor headless localmente (simulação em tela)...';
      resTime.textContent = '...';

      const startTime = performance.now();

      try {
        const res = await fetch('/api/ponte/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: sender,
            text: text,
            engine: 'agy'
          })
        });

        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        const data = await res.json();

        resTime.textContent = `${elapsed}s`;
        if (data.ok) {
          resText.textContent = `💻 [Simulação em Tela - Sem envio no WhatsApp]\n\n${data.response}`;
          resMeta.textContent = `Lucy Core (Mock) • ${data.engine || 'agy'}`;
        } else {
          resText.textContent = `❌ Erro: ${data.error || data.response || 'Falha ao processar'}`;
        }

        loadWhatsAppTab();
      } catch (err) {
        resTime.textContent = 'Erro';
        resText.textContent = '❌ Erro de conexão com a API da ponte: ' + err.message;
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i data-lucide="monitor" class="w-3.5 h-3.5"></i> Simular Apenas na Tela';
        if (window.lucide) lucide.createIcons();
      }
    }
    window.sendWhatsAppTestMessage = sendWhatsAppTestMessage;

