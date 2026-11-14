    // ==========================================
    // SISTEMA DE MODAIS & DIÁLOGOS NEXUS
    // ==========================================
    const NexusModal = {
      show(options) {
        return new Promise((resolve) => {
          const backdrop = document.getElementById('nexus-modal-backdrop');
          const titleEl = document.getElementById('nexus-modal-title');
          const msgEl = document.getElementById('nexus-modal-msg');
          const iconBox = document.getElementById('nexus-modal-icon-box');
          const icon = document.getElementById('nexus-modal-icon');
          const closeX = document.getElementById('nexus-modal-close-x');
          const inputContainer = document.getElementById('nexus-modal-input-container');
          const input = document.getElementById('nexus-modal-input');
          const btnCancel = document.getElementById('nexus-modal-cancel');
          const btnConfirm = document.getElementById('nexus-modal-confirm');

          titleEl.textContent = options.title || 'Nexus Console';
          msgEl.textContent = options.message || '';

          const type = options.type || 'info'; // 'info', 'warning', 'danger', 'success'
          if (type === 'danger') {
            iconBox.className = 'w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30';
            icon.setAttribute('data-lucide', 'alert-triangle');
            btnConfirm.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer';
          } else if (type === 'warning') {
            iconBox.className = 'w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30';
            icon.setAttribute('data-lucide', 'help-circle');
            btnConfirm.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer';
          } else if (type === 'success') {
            iconBox.className = 'w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
            icon.setAttribute('data-lucide', 'check-circle-2');
            btnConfirm.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer';
          } else {
            iconBox.className = 'w-7 h-7 rounded-lg flex items-center justify-center bg-brand-500/15 text-brand-600 dark:text-brand-400 border border-brand-500/30';
            icon.setAttribute('data-lucide', 'info');
            btnConfirm.className = 'px-4 py-2 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition flex items-center gap-1.5 cursor-pointer';
          }

          btnConfirm.textContent = options.confirmText || 'Confirmar';
          btnCancel.textContent = options.cancelText || 'Cancelar';
          btnCancel.classList.toggle('hidden', options.isAlert === true);

          if (options.isPrompt) {
            inputContainer.classList.remove('hidden');
            input.value = options.defaultValue || '';
            input.placeholder = options.placeholder || '';
          } else {
            inputContainer.classList.add('hidden');
          }

          backdrop.classList.remove('hidden');
          if (window.lucide) lucide.createIcons();
          if (options.isPrompt) {
            setTimeout(() => input.focus(), 50);
          }

          const close = (val) => {
            backdrop.classList.add('hidden');
            resolve(val);
          };

          btnConfirm.onclick = () => close(options.isPrompt ? input.value : true);
          btnCancel.onclick = () => close(options.isPrompt ? null : false);
          closeX.onclick = () => close(options.isPrompt ? null : false);

          if (options.isPrompt) {
            input.onkeydown = (e) => {
              if (e.key === 'Enter') btnConfirm.click();
              if (e.key === 'Escape') btnCancel.click();
            };
          }
        });
      },

      confirm(title, message, options = {}) {
        return this.show({
          title,
          message,
          type: options.type || 'warning',
          confirmText: options.confirmText || 'Confirmar',
          cancelText: options.cancelText || 'Cancelar',
          isAlert: false
        });
      },

      alert(title, message, type = 'info') {
        return this.show({
          title,
          message,
          type,
          confirmText: 'Entendido',
          isAlert: true
        });
      },

      prompt(title, message, defaultValue = '', placeholder = '') {
        return this.show({
          title,
          message,
          defaultValue,
          placeholder,
          type: 'info',
          confirmText: 'Prosseguir',
          cancelText: 'Cancelar',
          isPrompt: true
        });
      }
    };
    window.NexusModal = NexusModal;

    // Fechar modais ao clicar fora (no backdrop) ou pressionar Escape
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList && e.target.classList.contains('fixed') && e.target.classList.contains('inset-0')) {
        if (e.target.id && !e.target.classList.contains('hidden') && e.target.id !== 'graph-panel-backdrop') {
          if (e.target.id === 'nexus-modal-backdrop') {
            document.getElementById('nexus-modal-cancel')?.click();
          } else if (typeof closeModal === 'function') {
            closeModal(e.target.id);
          } else {
            e.target.classList.add('hidden');
          }
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.fixed.inset-0:not(.hidden)').forEach(modal => {
          if (modal.id && modal.id !== 'graph-panel-backdrop') {
            if (modal.id === 'nexus-modal-backdrop') {
              document.getElementById('nexus-modal-cancel')?.click();
            } else if (typeof closeModal === 'function') {
              closeModal(modal.id);
            } else {
              modal.classList.add('hidden');
            }
          }
        });
      }
    });

