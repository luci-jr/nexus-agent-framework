/**
 * 🌌 NEXUS CONSOLE — APLICAÇÃO PRINCIPAL E CONTROLADOR DE INTERFACE
 * Inicialização dos módulos, barra de busca, gaveta lateral e ouvintes de eventos.
 */

window.NexusUI = (function() {
  const drawer = document.getElementById('drawer');
  const svcName = document.getElementById('svc-name');
  const svcId = document.getElementById('svc-id');
  const svcPill = document.getElementById('svc-status-pill');
  const metricCpu = document.getElementById('metric-cpu');
  const metricMem = document.getElementById('metric-mem');
  const metricImage = document.getElementById('metric-image');
  const metricConn = document.getElementById('metric-connections');
  const svcActivity = document.getElementById('svc-activity');

  function openDrawer(node) {
    if (!drawer) return;
    svcName.textContent = node.name;
    const isAgent = node.isAgent || node.type === 'agent';
    svcId.textContent = (isAgent ? 'agent://' : 'container://') + node.id;
    svcPill.textContent = (node.status || 'running').toUpperCase();
    svcPill.className = `status-pill status-${node.status || 'running'}`;
    metricCpu.textContent = node.cpu || '0.5%';
    metricMem.textContent = node.mem || '24.0 MB';
    metricImage.textContent = node.image || '-';
    metricConn.textContent = `${(node.neighbors && node.neighbors.length) || 0} sinapses ativas`;

    if (svcActivity) {
      svcActivity.textContent = node.activity || node.current_activity || 'Operando ativamente com alta disponibilidade e integridade no ecossistema Nexus.';
    }

    window.NexusTelemetry.startLogStream(node.id);
    drawer.classList.add('open');
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    window.NexusTelemetry.stopLogStream();
    if (window.NexusGraph) window.NexusGraph.clearFocus();
  }

  return {
    openDrawer,
    closeDrawer
  };
})();

// Inicializador Principal
window.addEventListener('DOMContentLoaded', async () => {
  const containerEl = document.getElementById('graph-container');
  if (containerEl) {
    await window.NexusGraph.init(containerEl);
  }

  // Conecta ao backend Go para monitoramento em tempo real
  window.NexusTelemetry.connectToGoBackend();

  // Ouvinte de evento para fechar a gaveta lateral
  const closeBtn = document.getElementById('close-drawer');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.NexusUI.closeDrawer();
    });
  }



  // Ações de contêineres disparadas pelos botões da gaveta lateral
  window.sendAction = function(action) {
    window.NexusTelemetry.sendAction(action);
  };

  // Barra de busca rápida no HUD
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        window.NexusUI.closeDrawer();
        return;
      }
      const nodes = window.NexusGraph ? window.NexusGraph.getNodes() : [];
      const match = nodes.find(n => (n.name && n.name.toLowerCase().includes(q)) || (n.id && n.id.toLowerCase().includes(q)));
      if (match) {
        window.NexusGraph.focusNode(match);
      }
    });
  }

  // Redimensionamento responsivo do Three.js (vinculado estritamente às dimensões do contêiner)
  window.addEventListener('resize', () => {
    if (window.NexusGraph) {
      const container = document.getElementById('nexus-3d-graph') || document.getElementById('graph-container');
      if (container && container.clientWidth && container.clientHeight) {
        window.NexusGraph.resize(container.clientWidth, container.clientHeight);
      }
    }
  });
});
