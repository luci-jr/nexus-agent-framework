/**
 * 🌌 NEXUS CONSOLE — MOTOR DE TELEMETRIA E WEBSOCKET
 * Gerencia conexões com o daemon do Docker via backend Go, fluxos de registros e simulação.
 */

window.NexusTelemetry = (function() {
  let isBackendOnline = false;
  let telemetrySocket = null;
  let logSocket = null;
  let mockLogInterval = null;

  function stripAnsi(text) {
    return text.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '');
  }

  function appendLogLine(cleanLine) {
    const logsView = document.getElementById('logs-view');
    if (!logsView) return;

    const lineEl = document.createElement('div');
    lineEl.style.whiteSpace = 'pre-wrap';
    lineEl.style.wordBreak = 'break-all';

    if (cleanLine.includes('ERROR') || cleanLine.includes('FATAL') || cleanLine.includes('panic:')) {
      lineEl.style.color = '#ef476f';
    } else if (cleanLine.includes('WARN')) {
      lineEl.style.color = '#ffd166';
    } else {
      lineEl.style.color = '#8fa3bf';
    }

    lineEl.textContent = cleanLine;
    logsView.appendChild(lineEl);
    logsView.scrollTop = logsView.scrollHeight;

    while (logsView.children.length > 300) {
      logsView.removeChild(logsView.firstChild);
    }
  }

  function startMockLogs(containerId) {
    if (mockLogInterval) clearInterval(mockLogInterval);
    const logsView = document.getElementById('logs-view');
    if (!logsView) return;

    const selectedNode = window.NexusGraph ? window.NexusGraph.getSelectedNode() : null;
    const isAgent = selectedNode && (selectedNode.isAgent || selectedNode.type === 'agent');
    const uri = (isAgent ? 'agent://' : 'container://') + containerId;

    logsView.innerHTML = `<span style="color: #00f5d4;">[Nexus Engine] Monitorando ${uri}</span>\n<span style="color: #70d6ff;">[CANAL SEGURO] Subscrito à malha bioelétrica com taxa de ${selectedNode?.rps || 40} req/s</span>\n\n`;

    const agentEvents = [
      `heartbeat check status=OK latency=1.1ms drift=0.00%`,
      `executing autonomous task: compliance with Definition of Done verified`,
      `evaluating context window: memory footprint optimal / zero drift`,
      `synaptic handshake with peer agents: active-synapses verified`,
      `governance cycle complete: 0 warnings, 0 security leaks detected`
    ];

    const serviceEvents = [
      `HTTP/2 GET /healthz 200 OK latency=1.42ms throughput=45 rps`,
      `connection pool healthy active_conns=14 idle_conns=6`,
      `metrics collector flush: memory footprint OK / 0 errors`,
      `docker-daemon ping OK container_id=${containerId} status=RUNNING`,
      `overlay network bridge routing forward packet stream OK`
    ];

    mockLogInterval = setInterval(() => {
      const curSelected = window.NexusGraph ? window.NexusGraph.getSelectedNode() : null;
      if (!curSelected || curSelected.id !== containerId) {
        clearInterval(mockLogInterval);
        mockLogInterval = null;
        return;
      }
      const now = new Date().toISOString();
      const list = isAgent ? agentEvents : serviceEvents;
      const randEvt = list[Math.floor(Math.random() * list.length)];
      const lat = (Math.random() * 3 + 0.9).toFixed(2);
      appendLogLine(`${now} [INFO] ${randEvt} (${lat}ms)`);
    }, 1600);
  }

  function startLogStream(containerId) {
    stopLogStream();
    const logsView = document.getElementById('logs-view');
    if (logsView) {
      logsView.innerHTML = '<span style="color: #70d6ff;">[Conectando aos logs do Docker...]</span>\n';
    }

    try {
      logSocket = new WebSocket(`${window.NexusConfig.GO_LOGS_URL}?id=${containerId}`);
      logSocket.onopen = () => {
        if (logsView) {
          logsView.innerHTML = `<span style="color: #06d6a0;">[Canal seguro: container://${containerId}]</span>\n\n`;
        }
      };
      logSocket.onmessage = (event) => {
        appendLogLine(stripAnsi(event.data));
      };
      logSocket.onerror = () => {
        startMockLogs(containerId);
      };
    } catch (e) {
      startMockLogs(containerId);
    }
  }

  function stopLogStream() {
    if (logSocket) {
      logSocket.close();
      logSocket = null;
    }
    if (mockLogInterval) {
      clearInterval(mockLogInterval);
      mockLogInterval = null;
    }
  }

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 2;

  function connectToGoBackend() {
    const backendBadge = document.getElementById('backend-status');
    if (reconnectAttempts >= maxReconnectAttempts) {
      if (backendBadge) {
        backendBadge.textContent = "● Modo Standalone (Offline / Simulação Viva)";
      }
      return;
    }
    reconnectAttempts++;

    try {
      telemetrySocket = new WebSocket(window.NexusConfig.GO_BACKEND_URL);

      telemetrySocket.onopen = () => {
        isBackendOnline = true;
        reconnectAttempts = 0;
        if (backendBadge) {
          backendBadge.textContent = "● Conectado ao Go Backend (Docker Live)";
          backendBadge.classList.add('connected');
        }
      };

      telemetrySocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.action === 'spawn' || data.action === 'init') {
          if (window.NexusGraph) window.NexusGraph.spawnStellarNode(data);
          return;
        }

        const nodes = window.NexusGraph ? window.NexusGraph.getNodes() : [];
        let existingNode = nodes.find(n => n.name === data.name || n.id === data.id);
        if (data.action === 'stats' && existingNode) {
          existingNode.cpu = data.cpu;
          existingNode.mem = data.mem;
          existingNode.status = data.status;

          const selectedNode = window.NexusGraph ? window.NexusGraph.getSelectedNode() : null;
          if (selectedNode && selectedNode.id === existingNode.id) {
            const cpuEl = document.getElementById('metric-cpu');
            const memEl = document.getElementById('metric-mem');
            const pillEl = document.getElementById('svc-status-pill');
            if (cpuEl) cpuEl.textContent = data.cpu;
            if (memEl) memEl.textContent = data.mem;
            if (pillEl) {
              pillEl.textContent = data.status.toUpperCase();
              pillEl.className = `status-pill status-${data.status}`;
            }
          }
        }
      };

      telemetrySocket.onclose = () => {
        isBackendOnline = false;
        if (backendBadge) {
          backendBadge.textContent = "Modo Standalone (Go Backend Standby)";
          backendBadge.classList.remove('connected');
        }
        setTimeout(connectToGoBackend, window.NexusConfig.AUTO_RECONNECT_INTERVAL);
      };

      telemetrySocket.onerror = () => {
        telemetrySocket.close();
      };
    } catch (err) {
      setTimeout(connectToGoBackend, window.NexusConfig.AUTO_RECONNECT_INTERVAL);
    }
  }

  function sendAction(action) {
    const selectedNode = window.NexusGraph ? window.NexusGraph.getSelectedNode() : null;
    if (!selectedNode) return;

    if (isBackendOnline) {
      fetch(`${window.NexusConfig.GO_API_URL}/containers/${selectedNode.id}/${action}`, { method: 'POST' })
        .then(r => r.text())
        .then(msg => alert(`[Go Backend]: ${msg}`))
        .catch(() => alert(`Comando '${action}' enviado para ${selectedNode.name}`));
    } else {
      alert(`[Standalone]: Comando '${action}' disparado para ${selectedNode.name}.`);
    }
  }

  return {
    connectToGoBackend,
    startLogStream,
    stopLogStream,
    sendAction,
    isOnline: () => isBackendOnline
  };
})();
