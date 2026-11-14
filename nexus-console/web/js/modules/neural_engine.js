    // =========================================================================
    // 🧠 GRAFO NEURAL 3D DO LUCY — VERSÃO 12: STELLAR BIRTH & COSMIC SHOCKWAVE
    // =========================================================================
    let graphData = null;
    let graph3DInstance = null;
    let graphFilter = 'all';
    let graphSearchTerm = '';
    let selectedGraphNode = null;
    let hoveredGraphNode = null;
    let hoveredLink = null;
    let activePulseLinks = [];
    let isAutoRotating = true;
    let starField = null;
    let nebulaGroup = null;
    const highlightNodes = new Set();
    const highlightLinks = new Set();

    // Paleta Espectral de Astrofotografia Cósmica James Webb (Nexus Console v12)
    const groupStyles = {
      core:    { color: '#ffb703', label: 'Lucy Core',           val: 26 }, // Dourado Bojo Galáctico
      squad:   { color: '#00f5d4', label: 'Squad Copiloto',     val: 18 }, // Ciano O-III Ionizado
      egm:     { color: '#c77dff', label: 'EGM Reviewer',       val: 16 }, // Violeta Nebular
      service: { color: '#70d6ff', label: 'Serviço Swarm',      val: 19 }, // Azul Celeste Tipo B
      infra:   { color: '#3a86ff', label: 'Serviço Swarm',      val: 19 }, // Safira Abissal Tipo O
      agent:   { color: '#00f5d4', label: 'Agente do Squad',    val: 18 }, // Ciano Cósmico
      doc:     { color: '#bbccff', label: 'Documentação',         val: 10 }  // Branco-Gelo Estelar Tipo A
    };

    // ✦ Gerador Procedural de Textura Estelar Cósmica Pura (Halo & Spikes baseados na cor do nó)
    function createStarSpriteTexture(colorHex) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const cx = 128, cy = 128;

      // 1. Halo Cósmico Difuso baseado na cor espectral da estrela
      const haloGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 110);
      haloGrad.addColorStop(0.00, 'rgba(255, 255, 255, 0.95)');
      haloGrad.addColorStop(0.15, colorHex || '#3a86ff');
      haloGrad.addColorStop(0.40, colorHex || '#3a86ff');
      haloGrad.addColorStop(0.75, 'rgba(0, 0, 0, 0.05)');
      haloGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');
      ctx.fillStyle = haloGrad;
      ctx.fillRect(0, 0, 256, 256);

      // 2. Spikes de Difração Estelar Telescópicos (Hubble / James Webb)
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      function drawSpike(angle, length, width) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(-length, 0, length, 0);
        grad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-length, 0);
        ctx.lineTo(0, width);
        ctx.lineTo(length, 0);
        ctx.lineTo(0, -width);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Spikes finos, nítidos e elegantes
      drawSpike(0, 115, 2.5);
      drawSpike(Math.PI / 2, 115, 2.5);
      drawSpike(Math.PI / 4, 75, 1.5);
      drawSpike(-Math.PI / 4, 75, 1.5);

      // 3. Núcleo Estelar Térmico
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
      coreGrad.addColorStop(0.0, '#ffffff');
      coreGrad.addColorStop(0.35, '#ffffff');
      coreGrad.addColorStop(0.75, colorHex || '#3a86ff');
      coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    // Gerador Procedural da Textura de Anel de Choque Cósmico Suave e Translúcido
    function createShockwaveTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      const cx = 128, cy = 128;

      // Anel circular luminoso, suave e etéreo com bordas translúcidas
      const grad = ctx.createRadialGradient(cx, cy, 85, cx, cy, 115);
      grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      grad.addColorStop(0.40, 'rgba(255, 255, 255, 0.10)');
      grad.addColorStop(0.78, 'rgba(255, 255, 255, 0.65)');
      grad.addColorStop(0.92, 'rgba(112, 214, 255, 0.45)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, 115, 0, 2 * Math.PI);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    // Gerador Procedural de Cápsula de Impulso Sináptico Elétrico Alongado
    function createSynapticImpulseTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const cx = 128, cy = 32;

      // Gradiente elíptico suave ao longo da fibra de axônio
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 120);
      grad.addColorStop(0.0, '#ffffff');
      grad.addColorStop(0.20, 'rgba(255, 255, 255, 0.90)');
      grad.addColorStop(0.45, 'rgba(255, 230, 160, 0.75)');
      grad.addColorStop(0.75, 'rgba(112, 214, 255, 0.20)');
      grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 120, 20, 0, 0, 2 * Math.PI);
      ctx.fill();

      const coreGrad = ctx.createLinearGradient(40, 32, 216, 32);
      coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
      coreGrad.addColorStop(0.4, '#ffffff');
      coreGrad.addColorStop(0.5, '#ffffff');
      coreGrad.addColorStop(0.6, '#ffffff');
      coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(40, 29, 176, 6);

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    // Gerador Procedural de Rótulos em Canvas com Alta Resolução
    function createTextSprite(text, colorHex, fontSize = 38) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const cleanText = String(text || '').replace(/^[✦⚠•\s]+/, '').trim();
      const cx = 256;
      const cy = 48;

      // Medição precisa do texto
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif`;
      const textMetrics = ctx.measureText(cleanText);
      const textW = textMetrics.width;

      // 1. Cápsula Escura de Proteção Anti-Bloom (evita que a luz das estrelas ofusque as letras)
      const dotRadius = 6;
      const gap = 12;
      const contentW = (dotRadius * 2) + gap + textW;
      const badgeW = Math.min(480, Math.max(120, contentW + 36));
      const badgeH = 64;
      const badgeX = cx - (badgeW / 2);
      const badgeY = cy - (badgeH / 2);
      const radius = badgeH / 2; // Pílula suave e orgânica

      ctx.save();
      // Fundo escuro fosco de alto contraste (bloqueia vazamento de luz da estrela)
      ctx.fillStyle = 'rgba(2, 6, 18, 0.94)';
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
        ctx.fill();
      } else {
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
      }

      // Borda sutil de recorte ultrafina (sem neon estridente)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, radius);
        ctx.stroke();
      } else {
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.restore();

      // 2. Micro ponto de status estelar com a cor do serviço
      const startX = cx - (contentW / 2);
      const dotX = startX + dotRadius;
      const textX = startX + (dotRadius * 2) + gap;

      ctx.save();
      ctx.fillStyle = colorHex || '#00f5d4';
      ctx.beginPath();
      ctx.arc(dotX, cy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. Tipografia Branca Pura Cristalina (ZERO blur/néon para máxima legibilidade)
      ctx.save();
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(cleanText, textX, cy);
      ctx.restore();

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthWrite: false
      });
      return new THREE.Sprite(mat);
    }

    const starTexturesCache = {};
    function getStarTexture(colorHex) {
      if (!starTexturesCache[colorHex]) {
        starTexturesCache[colorHex] = createStarSpriteTexture(colorHex);
      }
      return starTexturesCache[colorHex];
    }
    const shockwaveTexture = createShockwaveTexture();
    const synapticImpulseTexture = createSynapticImpulseTexture();

    function updateGraphFilterCounts(nodes) {
      const list = nodes || [];
      const total = list.length;
      updateBadge('telemetry-count', total + ' Nós');
      const countAll = document.getElementById('gcount-all');
      if (countAll) countAll.innerText = total;
      const countAgent = document.getElementById('gcount-agent');
      if (countAgent) countAgent.innerText = list.filter(n => n.type === 'agent' || n.group === 'core' || n.group === 'squad' || n.group === 'egm' || n.id === 'lucy-core' || n.isAgent === true).length;
      const countService = document.getElementById('gcount-service');
      if (countService) countService.innerText = list.filter(n => n.type === 'service' || n.group === 'service' || n.group === 'infra' || (!n.isAgent && n.type !== 'agent' && n.id !== 'lucy-core')).length;
    }

    async function fetchGraphStats() {
      try {
        const res = await fetch('/api/graph');
        const data = await res.json();
        graphData = window.graphData = data;
        updateGraphFilterCounts(data.nodes);
        if (typeof renderAstroSelectorBar === 'function') {
          renderAstroSelectorBar(data.nodes);
        }
        if (data && data.nodes) {
          const hcTel = document.getElementById('home-card-telemetry');
          if (hcTel) hcTel.innerText = `${data.nodes.length} Nós`;
        }
      } catch (e) {
        console.error('Erro ao buscar dados do grafo:', e);
      }
    }

    async function initOrResumeGraph() {
      const container = document.getElementById('nexus-3d-graph');
      if (!container) return;

      // 🌌 Prioriza a Supernova Sinapitic Engine (Bloom HDR, esferas solares emissivas e galáxia viva)
      if (window.NexusGraph) {
        if (!window.nexusGraphInitialized) {
          window.nexusGraphInitialized = true;
          await window.NexusGraph.init(container);
          if (window.NexusTelemetry) {
            window.NexusTelemetry.connectToGoBackend();
          }
        } else {
          window.NexusGraph.resize(container.clientWidth || 960, container.clientHeight || 640);
        }
        if (typeof updateFloatingAstroHUD === 'function') {
          const live = (window.NexusGraph.getNodes && window.NexusGraph.getNodes()) || [];
          const lucy = live.find(n => n.id === 'lucy-core') || live[0];
          if (lucy) updateFloatingAstroHUD(lucy, 0, live.length);
        }
        if (typeof renderAstroSelectorBar === 'function') {
          renderAstroSelectorBar();
        }
        return;
      }

      if (!graphData) {
        try {
          const res = await fetch('/api/graph');
          graphData = window.graphData = await res.json();
          updateGraphFilterCounts(graphData.nodes);
        } catch (e) {
          console.error('Erro ao carregar dados do grafo:', e);
          return;
        }
      }

      if (!graph3DInstance && window.ForceGraph3D) {
        build3DGraph();
      } else if (graph3DInstance) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w && h) {
          graph3DInstance.width(w).height(h);
        }
      }

      if (window.ResizeObserver && !container._hasResizeObs) {
        container._hasResizeObs = true;
        const ro = new ResizeObserver(() => {
          if (container.clientWidth && container.clientHeight) {
            if (window.NexusGraph) {
              window.NexusGraph.resize(container.clientWidth, container.clientHeight);
            } else if (graph3DInstance) {
              graph3DInstance.width(container.clientWidth).height(container.clientHeight);
            }
          }
        });
        ro.observe(container);
      }
    }

    function build3DGraph() {
      const container = document.getElementById('nexus-3d-graph');
      if (!container || !window.ForceGraph3D || !window.THREE) return;

      // Inicialização dos 164 nós em equilíbrio orbital sereno e estável
      const nodes = (graphData.nodes || []).map((n, idx) => {
        const groupConfig = groupStyles[n.group] || groupStyles.doc;
        return {
          ...n,
          color: groupConfig.color,
          val: groupConfig.val,
          neighbors: [],
          connectedLinks: []
        };
      });

      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      const links = (graphData.edges || [])
        .filter(e => nodeMap.has(e.source) && nodeMap.has(e.target))
        .map(e => {
          const l = { source: e.source, target: e.target, type: e.type || 'synapse' };
          const s = nodeMap.get(e.source);
          const t = nodeMap.get(e.target);
          if (s && t) {
            s.neighbors.push(t);
            t.neighbors.push(s);
            s.connectedLinks.push(l);
            t.connectedLinks.push(l);
          }
          return l;
        });

      container.innerHTML = '';
      const w = container.clientWidth || 960;
      const h = container.clientHeight || 640;

      graph3DInstance = window.graph3DInstance = ForceGraph3D()(container)
        .width(w)
        .height(h)
        .backgroundColor('#020208')
        .graphData({ nodes, links })
        .nodeId('id')
        .nodeVal('val')
        .showNavInfo(false)
        .nodeLabel(node => `✨ ${node.label} (${node.group})`)
        .nodeThreeObject(node => {
          const group = new THREE.Group();
          const groupConfig = groupStyles[node.group] || groupStyles.doc;
          const colorHex = groupConfig.color || '#70d6ff';
          const texture = getStarTexture(colorHex);
          // Calibração de tamanho estelar para equilíbrio cósmico perfeito (Versão 12)
          const baseSize = Math.sqrt(node.val || groupConfig.val || 7) * 2.3;

          // 1. Sprite Estelar com Spikes James Webb
          const starMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          const starSprite = new THREE.Sprite(starMat);
          group.add(starSprite);

          // 2. Halo de Corona de Plasma em Contrarrotação (Versão 12)
          const coronaMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.25,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          const coronaSprite = new THREE.Sprite(coronaMat);
          group.add(coronaSprite);

          // 3. Anel de Choque Cósmico Suave (Shockwave Ring)
          const shockwaveMat = new THREE.SpriteMaterial({
            map: shockwaveTexture,
            color: new THREE.Color(colorHex),
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          const shockwaveSprite = new THREE.Sprite(shockwaveMat);
          shockwaveSprite.scale.set(0.001, 0.001, 1);
          group.add(shockwaveSprite);

          // 4. Rótulo com Nome da Estrela (Otimizado para Celular & Mobile)
          const isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
          const labelScaleW = isMobile ? 42 : 30;
          const labelScaleH = labelScaleW * (96 / 512);

          const rawName = (node.id === 'nexus-core') ? 'Lucy Core' : (node.name || node.label || node.id || 'Nó Estelar');
          const labelText = rawName.length > 22 ? rawName.slice(0, 20) + '…' : rawName;
          const textSprite = createTextSprite(labelText, colorHex, 34, true);
          textSprite.scale.set(labelScaleW, labelScaleH, 1);
          textSprite.position.y = (baseSize / 2) + (isMobile ? 15.0 : 12.0);
          group.add(textSprite);

          const isNewlySpawned = Boolean(node.isNew);

          group.userData = {
            node,
            starSprite,
            coronaSprite,
            shockwaveSprite,
            textSprite,
            starMat,
            coronaMat,
            shockwaveMat,
            baseSize,
            labelScaleW,
            labelScaleH,
            birthStartTime: isNewlySpawned ? performance.now() : 0,
            birthDuration: 1800,
            isBirthing: isNewlySpawned,
            nextFlare: performance.now() + 15000 + Math.random() * 25000,
            isFlaring: false,
            flareMaxScale: 1.18 + Math.random() * 0.10
          };

          if (isNewlySpawned) {
            starSprite.scale.set(0.001, 0.001, 1);
            coronaSprite.scale.set(0.001, 0.001, 1);
            textSprite.scale.set(0.001, 0.001, 1);
          } else {
            starSprite.scale.set(baseSize, baseSize, 1);
            coronaSprite.scale.set(baseSize * 1.25, baseSize * 1.25, 1);
            textSprite.scale.set(labelScaleW, labelScaleH, 1);
          }

          return group;
        })
        // --- ✨ LIGAÇÃO COM LEVE RASTRO TRANSLÚCIDO & IMPULSOS SUAVES ---
        .linkColor(link => {
          if (highlightLinks.has(link)) return "rgba(255, 209, 102, 0.55)";
          return "rgba(112, 214, 255, 0.12)"; // Leve rastro cósmico translúcido contínuo
        })
        .linkWidth(link => (highlightLinks.has(link) ? 1.0 : 0.5))
        .linkThreeObjectExtend(true)
        .linkThreeObject(link => {
          const group = new THREE.Group();
          const pulses = [];

          // ⚡ 3 pulsos defasados para fluxo contínuo de dados
          for (let i = 0; i < 3; i++) {
            const pulse = new THREE.Group();
            const glowMaterial = new THREE.MeshBasicMaterial({
              color: '#00eaff',
              transparent: true,
              opacity: 0.45,
              blending: THREE.AdditiveBlending,
              depthWrite: false
            });
            const coreMaterial = new THREE.MeshBasicMaterial({
              color: '#ffffff',
              transparent: true,
              opacity: 0.95,
              blending: THREE.AdditiveBlending,
              depthWrite: false
            });

            const addBoltSegment = (start, end) => {
              const direction = new THREE.Vector3().subVectors(end, start);
              const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
              const rotation = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                direction.clone().normalize()
              );
              const glow = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.12, direction.length(), 5),
                glowMaterial
              );
              const core = new THREE.Mesh(
                new THREE.CylinderGeometry(0.035, 0.035, direction.length(), 5),
                coreMaterial
              );
              glow.position.copy(midpoint);
              glow.quaternion.copy(rotation);
              core.position.copy(midpoint);
              core.quaternion.copy(rotation);
              pulse.add(glow, core);
            };

            const points = [];
            for (let point = 0; point <= 7; point++) {
              const x = -6 + point * (12 / 7);
              const envelope = Math.sin((point / 7) * Math.PI);
              points.push(new THREE.Vector3(
                x,
                point === 0 || point === 7 ? 0 : (Math.random() - 0.5) * 2.4 * envelope,
                point === 0 || point === 7 ? 0 : (Math.random() - 0.5) * 1.8 * envelope
              ));
              if (point > 0) addBoltSegment(points[point - 1], points[point]);
            }

            // Ramificações laterais bioelétricas (estilo descarga de dados)
            [2, 4, 5].forEach((pointIndex, branchIndex) => {
              const origin = points[pointIndex];
              const sign = branchIndex % 2 === 0 ? 1 : -1;
              const fork = new THREE.Vector3(
                origin.x + (Math.random() - 0.5) * 1.8,
                origin.y + sign * (0.8 + Math.random() * 1.1),
                origin.z + (Math.random() - 0.5) * 1.5
              );
              addBoltSegment(origin, fork);
            });

            const glowSpark = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), glowMaterial);
            const coreSpark = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), coreMaterial);
            glowSpark.position.x = 6;
            coreSpark.position.x = 6;
            pulse.add(glowSpark, coreSpark);

            pulse.userData = { glowMaterial, coreMaterial, flicker: Math.random() * Math.PI * 2 };
            group.add(pulse);
            pulses.push(pulse);
          }

          group.userData = { pulses, phase: Math.random(), linkRps: link.rps || 10, link };
          link.__customPulseGroup = group;
          if (!activePulseLinks.some(item => item.link === link)) {
            activePulseLinks.push({ link, group });
          }
          return group;
        })
        .linkPositionUpdate((group, { start, end }) => {
          if (!group || !group.userData || !group.userData.pulses) return true;
          const direction = new THREE.Vector3(end.x - start.x, end.y - start.y, end.z - start.z);
          const length = direction.length();
          if (length <= 0.001) return true;
          direction.normalize();
          group.position.set((start.x + end.x) / 2, (start.y + end.y) / 2, (start.z + end.z) / 2);
          group.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), direction);

          const isHovered = (hoveredLink && group.userData.link === hoveredLink) || highlightLinks.has(group.userData.link);
          // ✦ Velocidade dinâmica acelerada para mostrar o fluxo real de dados
          const speed = 0.00095 + Math.min((group.userData.linkRps || 10) * 0.000020, 0.0012);
          const time = performance.now();

          group.userData.pulses.forEach((pulse, index) => {
            const progress = (time * speed + group.userData.phase + (index / 3)) % 1;
            const crackle = Math.abs(Math.sin(time * 0.065 + pulse.userData.flicker))
              * Math.abs(Math.sin(time * 0.023 + pulse.userData.flicker * 2.1));
            const flicker = 0.42 + crackle * 0.58;
            pulse.position.set(
              (progress - 0.5) * Math.max(0, length - 12),
              Math.sin(time * 0.015 + index * 2.0) * 0.45,
              Math.cos(time * 0.012 + index * 2.0) * 0.45
            );
            pulse.rotation.x = (time * 0.006) + pulse.userData.flicker;

            if (isHovered) {
              pulse.userData.glowMaterial.color.set('#ffd166');
              pulse.userData.glowMaterial.opacity = 0.95;
              pulse.userData.coreMaterial.opacity = 1.0;
            } else {
              pulse.userData.glowMaterial.color.set('#00eaff');
              pulse.userData.glowMaterial.opacity = 0.55 + flicker * 0.40;
              pulse.userData.coreMaterial.opacity = 0.85 + flicker * 0.15;
            }
            const pulseScale = isHovered ? 1.4 : 1.1;
            pulse.scale.set(pulseScale, pulseScale, pulseScale);
          });
          return true;
        })
        // 🚀 Partículas direcionais luminosas complementando o raio para evidenciar o fluxo de dados contínuo
        .linkDirectionalParticles(link => (highlightLinks.has(link) || link === hoveredLink ? 4 : 2))
        .linkDirectionalParticleSpeed(link => 0.005 + Math.min((link.rps || 10) * 0.0001, 0.006))
        .linkDirectionalParticleWidth(link => (highlightLinks.has(link) || link === hoveredLink ? 2.6 : 1.8))
        .linkDirectionalParticleColor(link => (highlightLinks.has(link) || link === hoveredLink ? '#ffd166' : '#00f5d4'))
        .onLinkHover(link => {
          hoveredLink = link || null;
          updateGraphLinks();
        })
        // --- 🧲 RETORNO ELÁSTICO AO LARGAR O MOUSE / TOUCH NO CELULAR (INDEX-TESTE STYLE) ---
        .onNodeDrag(node => {
          if (!Number.isFinite(node.homeX)) {
            node.homeX = node.x;
            node.homeY = node.y;
            node.homeZ = node.z;
          }
          delete node.returnMotion;
        })
        .onNodeDragEnd(node => {
          const targetX = Number.isFinite(node.homeX) ? node.homeX : node.x;
          const targetY = Number.isFinite(node.homeY) ? node.homeY : node.y;
          const targetZ = Number.isFinite(node.homeZ) ? node.homeZ : node.z;
          node.returnMotion = {
            fromX: node.x,
            fromY: node.y,
            fromZ: node.z,
            targetX,
            targetY,
            targetZ,
            started: performance.now(),
            duration: 700
          };
        })
        .onNodeHover(node => {
          highlightNodes.clear();
          highlightLinks.clear();
          if (node) {
            highlightNodes.add(node);
            (node.neighbors || []).forEach(n => highlightNodes.add(n));
            (node.connectedLinks || []).forEach(l => highlightLinks.add(l));
          }
          hoveredGraphNode = node;
          container.style.cursor = node ? 'pointer' : 'grab';
          updateGraphLinks();
        })
        .onNodeClick(node => {
          highlightNodes.clear();
          highlightLinks.clear();
          highlightNodes.add(node);
          (node.neighbors || []).forEach(n => highlightNodes.add(n));
          (node.connectedLinks || []).forEach(l => highlightLinks.add(l));

          focusOnNode(node);
          openGraphDrawer(node);
          updateGraphLinks();
        })
        .onBackgroundClick(() => {
          closeGraphDrawer();
          centerGraphView();
        });

      // Configuração de Forças e Dispersão Cósmica
      graph3DInstance.d3Force('charge').strength(-220);
      graph3DInstance.d3Force('link').distance(95);

      // Fixação das coordenadas homeX/Y/Z assim que o layout estabiliza
      graph3DInstance.cooldownTicks(90);
      graph3DInstance.onEngineStop(() => {
        nodes.forEach(n => {
          if (!Number.isFinite(n.homeX)) {
            n.homeX = n.x;
            n.homeY = n.y;
            n.homeZ = n.z;
            n.fx = n.x;
            n.fy = n.y;
            n.fz = n.z;
          }
        });
      });

      function updateGraphLinks() {
        if (!graph3DInstance) return;
        graph3DInstance.linkColor(graph3DInstance.linkColor());
        graph3DInstance.linkWidth(graph3DInstance.linkWidth());
        graph3DInstance.linkDirectionalParticles(graph3DInstance.linkDirectionalParticles());

        // Atualiza escala dos rótulos de sinapses
        links.forEach(l => {
          if (l.__threeObj) {
            const isHL = highlightLinks.has(l);
            l.__threeObj.scale.set(isHL ? 11 : 0.001, isHL ? 2.8 : 0.001, 1);
          }
        });
      }

      // =========================================================================
      // 🌌 CENÁRIO CÓSMICO: GALÁXIA VÍVIDA & NEBULOSA 360° DEEP SPACE (INDEX-TESTE)
      // =========================================================================
      const scene = graph3DInstance.scene();
      scene.fog = new THREE.FogExp2(0x010206, 0.00012);

      // 1. Texturas Procedurais de Alta Fidelidade (Ponto Estelar & Gás Cósmico)
      function createCosmicGasTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const cx = 128, cy = 128;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 126);
        grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.50)');
        grad.addColorStop(0.20, 'rgba(220, 240, 255, 0.32)');
        grad.addColorStop(0.48, 'rgba(130, 190, 255, 0.14)');
        grad.addColorStop(0.78, 'rgba(90, 40, 150, 0.04)');
        grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 256);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
      }

      const cosmicGasTex = createCosmicGasTexture();

      // Grupo Mestre da Galáxia Espiral
      const galaxyGroup = new THREE.Group();

      // ========================================================
      // 🌌 2. ESTRUTURA GALÁCTICA ESPIRAL (BRAÇOS DE BERNOULLI + BOJO)
      // ========================================================
      const GALAXY_PARAMS = {
        starCount: 6500,
        gasCount: 1600,
        arms: 4,
        radius: 1700,
        spin: 3.5,
        power: 1.8,
        coreRadius: 280
      };

      // Paletas Espectrais Astronômicas (Classificação Harvard O-B-A-F-G-K-M)
      const corePalette = [
        new THREE.Color('#ffffff'), // Branca de alta temperatura
        new THREE.Color('#fff4e8'), // Amarelo-branco solar (Tipo G)
        new THREE.Color('#ffe2b0'), // Dourado estelar
        new THREE.Color('#ffd180'), // Gigante âmbar
        new THREE.Color('#ffb347')  // Anã laranja
      ];

      const armPalette = [
        new THREE.Color('#bbccff'), // Supergigante Azul (Tipo B)
        new THREE.Color('#9bb0ff'), // Azul de alta ionização (Tipo O)
        new THREE.Color('#70d6ff'), // Ciano estelar
        new THREE.Color('#f0f4ff'), // Branco-gelo puro (Tipo A)
        new THREE.Color('#00f5d4')  // Ciano néon do gás ionizado
      ];

      // A. Estrelas dos Braços Espirais e Bojo Central
      const starGeo = new THREE.BufferGeometry();
      const starPositions = new Float32Array(GALAXY_PARAMS.starCount * 3);
      const starColors = new Float32Array(GALAXY_PARAMS.starCount * 3);

      for (let i = 0; i < GALAXY_PARAMS.starCount; i++) {
        const isCoreStar = i < 1800;
        let x, y, z, color;

        if (isCoreStar) {
          const r = Math.pow(Math.random(), 2.2) * GALAXY_PARAMS.coreRadius;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta) * 0.55;
          z = r * Math.cos(phi);
          color = corePalette[Math.floor(Math.random() * corePalette.length)];
        } else {
          const r = GALAXY_PARAMS.coreRadius * 0.6 + Math.pow(Math.random(), GALAXY_PARAMS.power) * (GALAXY_PARAMS.radius - GALAXY_PARAMS.coreRadius * 0.6);
          const armIndex = i % GALAXY_PARAMS.arms;
          const armAngle = (armIndex * (Math.PI * 2)) / GALAXY_PARAMS.arms;
          const spinAngle = (r / GALAXY_PARAMS.radius) * GALAXY_PARAMS.spin;
          const totalAngle = armAngle + spinAngle;

          const spreadR = (Math.random() - 0.5) * (80 + (r * 0.14));
          const spreadAngle = (Math.random() - 0.5) * (0.28 * (1 - r / GALAXY_PARAMS.radius) + 0.1);

          x = Math.cos(totalAngle + spreadAngle) * (r + spreadR);
          z = Math.sin(totalAngle + spreadAngle) * (r + spreadR);
          y = (Math.random() - 0.5) * 110 * Math.exp(-r / 1100);

          color = (Math.random() < 0.75)
            ? armPalette[Math.floor(Math.random() * armPalette.length)]
            : corePalette[Math.floor(Math.random() * corePalette.length)];
        }

        starPositions[i * 3]     = x;
        starPositions[i * 3 + 1] = y;
        starPositions[i * 3 + 2] = z;

        starColors[i * 3]     = color.r;
        starColors[i * 3 + 1] = color.g;
        starColors[i * 3 + 2] = color.b;
      }

      starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

      const starMat = new THREE.PointsMaterial({
        size: 2.4,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      const galaxyStars = new THREE.Points(starGeo, starMat);
      galaxyGroup.add(galaxyStars);

      // B. Nuvens de Gás Cósmico e Poeira Interestelar (H-II & O-III)
      const gasGeo = new THREE.BufferGeometry();
      const gasPositions = new Float32Array(GALAXY_PARAMS.gasCount * 3);
      const gasColors = new Float32Array(GALAXY_PARAMS.gasCount * 3);

      const gasPalette = [
        new THREE.Color('#00f5d4'), // Ciano O-III ionizado
        new THREE.Color('#70d6ff'), // Azul suave
        new THREE.Color('#f72585'), // Hidrogênio H-alpha (magenta suave)
        new THREE.Color('#7209b7'), // Violeta interestelar
        new THREE.Color('#3a86ff')  // Azul cobalto
      ];

      for (let i = 0; i < GALAXY_PARAMS.gasCount; i++) {
        const r = GALAXY_PARAMS.coreRadius * 0.4 + Math.pow(Math.random(), 1.4) * (GALAXY_PARAMS.radius * 0.9);
        const armIndex = i % GALAXY_PARAMS.arms;
        const armAngle = (armIndex * (Math.PI * 2)) / GALAXY_PARAMS.arms;
        const spinAngle = (r / GALAXY_PARAMS.radius) * GALAXY_PARAMS.spin;
        const totalAngle = armAngle + spinAngle;

        const spreadR = (Math.random() - 0.5) * (140 + (r * 0.18));
        const spreadAngle = (Math.random() - 0.5) * 0.32;

        gasPositions[i * 3]     = Math.cos(totalAngle + spreadAngle) * (r + spreadR);
        gasPositions[i * 3 + 1] = (Math.random() - 0.5) * 160 * Math.exp(-r / 1000);
        gasPositions[i * 3 + 2] = Math.sin(totalAngle + spreadAngle) * (r + spreadR);

        const col = gasPalette[Math.floor(Math.random() * gasPalette.length)];
        gasColors[i * 3]     = col.r;
        gasColors[i * 3 + 1] = col.g;
        gasColors[i * 3 + 2] = col.b;
      }

      gasGeo.setAttribute('position', new THREE.BufferAttribute(gasPositions, 3));
      gasGeo.setAttribute('color', new THREE.BufferAttribute(gasColors, 3));

      const gasMat = new THREE.PointsMaterial({
        size: 160,
        map: cosmicGasTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.10,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      const galaxyGas = new THREE.Points(gasGeo, gasMat);
      galaxyGroup.add(galaxyGas);

      // C. Halo Cósmico Esférico de Fundo Infinito (Deep Field Stars)
      const haloGeo = new THREE.BufferGeometry();
      const haloCount = 2800;
      const haloPositions = new Float32Array(haloCount * 3);
      const haloColors = new Float32Array(haloCount * 3);
      const haloPalette = [
        new THREE.Color('#ffffff'),
        new THREE.Color('#cfe2ff'),
        new THREE.Color('#ffe8cc'),
        new THREE.Color('#99bbff'),
        new THREE.Color('#ffd299')
      ];

      for (let i = 0; i < haloCount; i++) {
        const radius = 1200 + Math.random() * 2200;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        haloPositions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
        haloPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        haloPositions[i * 3 + 2] = radius * Math.cos(phi);

        const color = haloPalette[Math.floor(Math.random() * haloPalette.length)];
        haloColors[i * 3]     = color.r;
        haloColors[i * 3 + 1] = color.g;
        haloColors[i * 3 + 2] = color.b;
      }

      haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
      haloGeo.setAttribute('color', new THREE.BufferAttribute(haloColors, 3));

      const haloMat = new THREE.PointsMaterial({
        size: 1.8,
        sizeAttenuation: false,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false
      });
      const deepSpaceHalo = new THREE.Points(haloGeo, haloMat);
      scene.add(deepSpaceHalo);

      // Inclina o plano da galáxia levemente para visualização cinematográfica isométrica
      galaxyGroup.rotation.x = 0.42;
      galaxyGroup.rotation.z = 0.18;
      scene.add(galaxyGroup);

      // Iluminação Cósmica de Bojo Central e Ambiente Frio
      scene.add(new THREE.AmbientLight(0x0e1320, 1.2));
      const coreLight = new THREE.PointLight(0xfff0dd, 2.0, 1400);
      coreLight.position.set(0, 30, 0);
      scene.add(coreLight);

      const rimCyanLight = new THREE.PointLight(0x00f5d4, 1.2, 1200);
      rimCyanLight.position.set(350, 180, 400);
      scene.add(rimCyanLight);

      const rimMagentaLight = new THREE.PointLight(0xf72585, 0.95, 1200);
      rimMagentaLight.position.set(-350, -120, -350);
      scene.add(rimMagentaLight);

      // Controles Orbitais com amortecimento suave
      const tbControls = graph3DInstance.controls();
      if (tbControls) {
        tbControls.enableDamping = true;
        tbControls.dampingFactor = 0.08;
        tbControls.rotateSpeed = 0.8;
        tbControls.zoomSpeed = 1.2;
        tbControls.autoRotate = true;
        tbControls.autoRotateSpeed = 0.85;
      }

      // Câmera Inicial Galáctica Perfeita (Enquadramento Exato de Abertura)
      const isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
      const initialCamZ = isMobile ? 780 : 620;
      const initialCamY = isMobile ? 22 : 18;
      graph3DInstance.cameraPosition(
        { x: 0, y: initialCamY, z: initialCamZ },
        { x: 0, y: 0, z: 0 }
      );

      // =========================================================================
      // MOTOR DE RENDERIZAÇÃO: ROTAÇÃO CÓSMICA VÍVIDA & RETORNO ELÁSTICO (INDEX-TESTE)
      // =========================================================================
      (function renderLoop() {
        const now = performance.now();

        // 🌌 Rotação Cósmica dos Braços Espirais e Halo Profundo (Idêntica ao index-teste.html)
        if (isAutoRotating) {
          galaxyGroup.rotation.y += 0.00063;
          deepSpaceHalo.rotation.y += 0.00018;
          if (tbControls && !selectedGraphNode) {
            tbControls.autoRotate = true;
            tbControls.update();
          }
        } else if (tbControls) {
          tbControls.autoRotate = false;
        }

        nodes.forEach(node => {
          // --- 🧲 INTERPOLAÇÃO DE RETORNO ELÁSTICO AO LUGAR ORIGINAL (INDEX-TESTE) ---
          const motion = node.returnMotion;
          if (motion) {
            const progress = Math.min(1, (now - motion.started) / motion.duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            node.fx = motion.fromX + (motion.targetX - motion.fromX) * eased;
            node.fy = motion.fromY + (motion.targetY - motion.fromY) * eased;
            node.fz = motion.fromZ + (motion.targetZ - motion.fromZ) * eased;
            node.x = node.fx;
            node.y = node.fy;
            node.z = node.fz;
            if (progress >= 1) {
              node.homeX = motion.targetX;
              node.homeY = motion.targetY;
              node.homeZ = motion.targetZ;
              delete node.returnMotion;
            }
          }

          const obj = node.__threeObj;
          if (!obj || !obj.userData) return;

          const {
            starSprite,
            coronaSprite,
            shockwaveSprite,
            textSprite,
            starMat,
            coronaMat,
            shockwaveMat,
            baseSize
          } = obj.userData;
          const nodePhase = (node.id.charCodeAt(0) * 230) % 10000;

          // --- 🌟 MOTOR DE NASCIMENTO ESTELAR & ANEL DE CHOQUE SUAVE ---
          let birthScaleFactor = 1.0;
          let birthFlashOpacity = 0.0;

          if (obj.userData.isBirthing) {
            if (now < obj.userData.birthStartTime) {
              starSprite.scale.set(0.001, 0.001, 1);
              coronaSprite.scale.set(0.001, 0.001, 1);
              shockwaveSprite.scale.set(0.001, 0.001, 1);
              textSprite.scale.set(0.001, 0.001, 1);
              return;
            }

            const birthElapsed = now - obj.userData.birthStartTime;
            const bProgress = Math.min(1.0, birthElapsed / obj.userData.birthDuration);

            if (bProgress < 1.0) {
              if (bProgress < 0.3) {
                const p = bProgress / 0.3;
                birthScaleFactor = 0.2 + p * 0.8;
                birthFlashOpacity = p * 0.30;
              } else if (bProgress < 0.6) {
                const p = (bProgress - 0.3) / 0.3;
                birthScaleFactor = 1.0 + Math.sin(p * Math.PI) * 0.15;
                birthFlashOpacity = 0.30 * (1 - p * 0.5);
              } else {
                const p = (bProgress - 0.6) / 0.4;
                birthScaleFactor = 1.0 + 0.05 * (1 - p);
                birthFlashOpacity = 0.15 * (1 - p);
              }

              // Ondinha de choque suave e etérea (delicada, sem estouro)
              if (bProgress >= 0.25 && bProgress < 0.90) {
                const waveProgress = (bProgress - 0.25) / 0.65;
                const waveScale = baseSize * (1.0 + Math.pow(waveProgress, 0.7) * 2.0);
                shockwaveSprite.scale.set(waveScale, waveScale, 1);

                const waveOpacity = Math.sin(waveProgress * Math.PI) * Math.pow(1 - waveProgress, 0.8);
                shockwaveMat.opacity = Math.max(0.0, waveOpacity * 0.45);
              } else {
                shockwaveMat.opacity = 0.0;
                shockwaveSprite.scale.set(0.001, 0.001, 1);
              }

              const textScaleP = Math.max(0.001, (bProgress - 0.3) / 0.7);
              const targetW = obj.userData.labelScaleW || 30;
              const targetH = obj.userData.labelScaleH || 6.6;
              textSprite.scale.set(targetW * textScaleP, targetH * textScaleP, 1);
            } else {
              obj.userData.isBirthing = false;
              shockwaveMat.opacity = 0.0;
              shockwaveSprite.scale.set(0.001, 0.001, 1);
              const targetW = obj.userData.labelScaleW || 30;
              const targetH = obj.userData.labelScaleH || 6.6;
              textSprite.scale.set(targetW, targetH, 1);
            }
          }

          // Respiração pulsante viva (mais enérgica para os agentes em plena operação)
          const isAgent = node.group === 'squad' || node.group === 'core';
          const pulseSpeed = isAgent ? 0.0036 : 0.0018;
          const pulseAmp = isAgent ? 0.12 : 0.08;
          const pulse = Math.sin((now + nodePhase) * pulseSpeed);
          const flicker = (Math.sin(now * 0.010 + nodePhase) * 0.035);
          const currentScale = baseSize * (1 + (pulse * pulseAmp) + flicker);

          // Rotação suave contínua
          starMat.rotation += 0.0018;
          coronaMat.rotation -= 0.0012;

          // Flares raros, serenos e orgânicos (respiração profunda a cada 15–45s)
          let flareBonus = 0;
          let flareCoronaBonus = 0;

          if (!obj.userData.isFlaring && now > obj.userData.nextFlare) {
            obj.userData.isFlaring = true;
            obj.userData.flareStartTime = now;
            obj.userData.flareDuration = 1200 + Math.random() * 1000;
            obj.userData.flareMaxScale = 1.15 + Math.random() * 0.12;
          }

          if (obj.userData.isFlaring) {
            const elapsed = now - obj.userData.flareStartTime;
            const progress = elapsed / obj.userData.flareDuration;

            if (progress >= 1.0) {
              obj.userData.isFlaring = false;
              obj.userData.nextFlare = now + 15000 + Math.random() * 30000;
            } else {
              const curve = Math.sin(progress * Math.PI);
              flareBonus = curve * (obj.userData.flareMaxScale - 1);
              flareCoronaBonus = curve * 0.18;
            }
          }

          // Combinação equilibrada de escala e opacidade
          const finalScale = currentScale * birthScaleFactor * (1 + flareBonus);
          starSprite.scale.set(finalScale, finalScale, 1);

          const coronaScale = currentScale * (1.30 + pulse * 0.1 + flareCoronaBonus + birthFlashOpacity * 0.4) * birthScaleFactor;
          coronaSprite.scale.set(coronaScale, coronaScale, 1);

          const isFocused = (selectedGraphNode !== null || hoveredGraphNode !== null);
          const isHighlighted = highlightNodes.has(node);
          const isVisible = isNodeVisible(node);
          const alphaBase = (!isVisible) ? 0.02 : ((!isFocused || isHighlighted) ? 1.0 : 0.08);

          starMat.opacity = Math.min(1.0, (alphaBase + flareBonus * 0.2 + birthFlashOpacity));
          coronaMat.opacity = Math.min(0.85, (0.28 + (pulse + 1) * 0.08 + flareCoronaBonus + birthFlashOpacity * 0.4) * alphaBase);
        });

        // ⚡ TRÁFEGO BIOELÉTRICO CONTÍNUO EM TODOS OS LINKS (60 FPS ININTERRUPTO)
        activePulseLinks.forEach(({ link, group }) => {
          if (!group || !group.userData || !group.userData.pulses) return;

          const source = typeof link.source === 'object' ? link.source : (nodeMap && nodeMap.get(link.source));
          const target = typeof link.target === 'object' ? link.target : (nodeMap && nodeMap.get(link.target));
          if (!source || !target || !Number.isFinite(source.x) || !Number.isFinite(target.x)) return;

          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const dz = target.z - source.z;
          const length = Math.hypot(dx, dy, dz);
          if (length <= 0.001) return;

          group.position.set((source.x + target.x) / 2, (source.y + target.y) / 2, (source.z + target.z) / 2);
          group.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(dx / length, dy / length, dz / length));

          const isHovered = (hoveredLink && link === hoveredLink) || (highlightLinks && highlightLinks.has(link));
          const speed = 0.00095 + Math.min((group.userData.linkRps || 10) * 0.000020, 0.0012);

          group.userData.pulses.forEach((pulse, index) => {
            const progress = (now * speed + group.userData.phase + (index / 3)) % 1;
            const crackle = Math.abs(Math.sin(now * 0.065 + pulse.userData.flicker))
              * Math.abs(Math.sin(now * 0.023 + pulse.userData.flicker * 2.1));
            const flicker = 0.42 + crackle * 0.58;
            pulse.position.set(
              (progress - 0.5) * Math.max(0, length - 12),
              Math.sin(now * 0.015 + index * 2.0) * 0.45,
              Math.cos(now * 0.012 + index * 2.0) * 0.45
            );
            pulse.rotation.x = (now * 0.006) + pulse.userData.flicker;

            if (isHovered) {
              pulse.userData.glowMaterial.color.set('#ffd166');
              pulse.userData.glowMaterial.opacity = 0.95;
              pulse.userData.coreMaterial.opacity = 1.0;
            } else {
              pulse.userData.glowMaterial.color.set('#00eaff');
              pulse.userData.glowMaterial.opacity = 0.65 + flicker * 0.35;
              pulse.userData.coreMaterial.opacity = 0.88 + flicker * 0.12;
            }
            const pulseScale = isHovered ? 1.4 : 1.1;
            pulse.scale.set(pulseScale, pulseScale, pulseScale);
          });
        });

        requestAnimationFrame(renderLoop);
      })();

      window.addEventListener('resize', () => {
        if (graph3DInstance && container) {
          graph3DInstance.width(container.clientWidth).height(container.clientHeight);
        }
      });
    }

    // =========================================================================
    // 🌟 FUNÇÃO DE CRIAÇÃO E DISPARO DE ESTRELAS DINÂMICAS COM SHOCKWAVE RING
    // =========================================================================
    let customStarCounter = 1;
    function spawnStellarNode(customData = null) {
      if (!graph3DInstance || !graphData) return;

      const id = customData ? customData.id : `micro_svc_${Date.now().toString().slice(-4)}`;
      const name = customData ? customData.name : `nexus-agent-0${customStarCounter++}`;
      const groupPool = ['squad', 'infra', 'skill', 'adr', 'task', 'doc'];
      const group = customData ? customData.group : groupPool[Math.floor(Math.random() * groupPool.length)];
      const groupConfig = groupStyles[group] || groupStyles.squad;

      const existingNodes = graphData.nodes || [];
      const randomSource = existingNodes[Math.floor(Math.random() * existingNodes.length)] || { id: 'nexus-core' };

      const newNode = {
        id: id,
        label: name,
        group: group,
        color: groupConfig.color,
        val: groupConfig.val,
        path: customData ? customData.path : `nexus://agents/${name}`,
        summary: customData ? customData.summary : `Instância de microsserviço autônomo gerada dinamicamente.`,
        neighbors: [],
        connectedLinks: [],
        isNew: true, // Dispara imediatamente a ignição e o anel de choque cósmico!
        _birthDelay: 0
      };

      const synProtocols = ['gRPC Stream', 'TLS Sync', 'Event Bus', 'Data Pipeline', 'Fast-RPC', 'governs', 'orchestrates'];
      const synType = synProtocols[Math.floor(Math.random() * synProtocols.length)];
      const newEdge = {
        source: randomSource.id,
        target: newNode.id,
        type: synType
      };

      graphData.nodes.push(newNode);
      graphData.edges.push(newEdge);

      const total = graphData.nodes.length;
      updateBadge('telemetry-count', total + ' Nós');
      const countAll = document.getElementById('gcount-all');
      if (countAll) countAll.innerText = total;

      build3DGraph();

      // Transiciona a câmera suavemente até a nova proto-estrela para contemplar o choque cósmico
      setTimeout(() => {
        if (!selectedGraphNode && newNode.x !== undefined) {
          graph3DInstance.cameraPosition(
            { x: (newNode.x || 0) * 0.6 + 40, y: (newNode.y || 0) * 0.6 + 25, z: 420 },
            newNode,
            1400
          );
        }
      }, 180);
    }

    function isNodeVisible(n) {
      if (n.id === 'lucy-core' || n.id === 'nexus-core') return true;
      if (graphFilter !== 'all') {
        if (graphFilter === 'agent') {
          if (n.type !== 'agent' && n.group !== 'core' && n.group !== 'squad' && n.group !== 'egm') return false;
        } else if (graphFilter === 'core') {
          if (n.group !== 'core' && n.id !== 'lucy-core') return false;
        } else if (graphFilter === 'squad') {
          if (n.group !== 'squad') return false;
        } else if (graphFilter === 'egm') {
          if (n.group !== 'egm') return false;
        } else if (graphFilter === 'service' || graphFilter === 'infra') {
          if (n.type !== 'service' && n.group !== 'service' && n.group !== 'infra') return false;
        } else if (n.group !== graphFilter) {
          return false;
        }
      }
      if (graphSearchTerm && !n.label.toLowerCase().includes(graphSearchTerm) && !n.id.toLowerCase().includes(graphSearchTerm)) return false;
      return true;
    }

    window.focusCurrentDrawerNode = function() {
      if (!selectedGraphNode) return;
      if (window.NexusGraph && typeof window.NexusGraph.focusNode === 'function') {
        window.NexusGraph.focusNode(selectedGraphNode);
      } else if (typeof focusOnNode === 'function') {
        focusOnNode(selectedGraphNode);
      }
      if (window.NexusGraph && typeof window.NexusGraph.pulseNode === 'function') {
        window.NexusGraph.pulseNode(selectedGraphNode);
      }
    };

    function focusOnNode(node, openDrawer = false) {
      if (window.NexusGraph && typeof window.NexusGraph.focusNode === 'function') {
        window.NexusGraph.focusNode(node, openDrawer);
        return;
      }
      if (!graph3DInstance || !node) return;
      selectedGraphNode = node;
      if (window.NexusGraph && typeof window.NexusGraph.pulseNode === 'function') {
        window.NexusGraph.pulseNode(node);
      }
      if (openDrawer && typeof openGraphDrawer === 'function') {
        openGraphDrawer(node);
      }
      const isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
      const nx = Number.isFinite(node.x) ? node.x : 0;
      const ny = Number.isFinite(node.y) ? node.y : 0;
      const nz = Number.isFinite(node.z) ? node.z : 0;

      let targetX, targetY, targetZ, camDistance, camYOffset;

      if (isMobile) {
        targetX = nx;
        targetY = ny - 68;
        targetZ = nz;
        camDistance = 450;
        camYOffset = 20;
      } else {
        targetX = nx + 125;
        targetY = ny;
        targetZ = nz;
        camDistance = 360;
        camYOffset = 16;
      }

      graph3DInstance.cameraPosition(
        {
          x: targetX,
          y: targetY + camYOffset,
          z: targetZ + camDistance
        },
        {
          x: targetX,
          y: targetY,
          z: targetZ
        },
        1100
      );
    }

    function centerGraphView() {
      // 1. Limpa input de busca se houver
      const searchInput = document.getElementById('graph-search');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
        if (window.NexusGraph && typeof window.NexusGraph.filterNodes === 'function') {
          window.NexusGraph.filterNodes('');
        }
      }

      // 2. Fecha painel lateral de estrela de forma limpa (sem disparar recursão)
      closeGraphNodePanel(false);

      // 3. Reseta seleção no NexusGraph se ativo (centraliza suavemente com enquadramento perfeito)
      if (window.NexusGraph && typeof window.NexusGraph.clearFocus === 'function') {
        window.NexusGraph.clearFocus();
      } else {
        const g = graph3DInstance;
        if (g && typeof g.cameraPosition === 'function') {
          const isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
          const camZ = isMobile ? 540 : 440;
          const camY = isMobile ? 65 : 45;
          g.cameraPosition({ x: 0, y: camY, z: camZ }, { x: 0, y: 0, z: 0 }, 1000);
        }
      }

      if (graph3DInstance) {
        selectedGraphNode = null;
        hoveredGraphNode = null;
        if (window.highlightNodes) highlightNodes.clear();
        if (window.highlightLinks) highlightLinks.clear();
        if (typeof graph3DInstance.linkColor === 'function') {
          graph3DInstance.linkColor(graph3DInstance.linkColor());
        }
      }

      // 4. Sincroniza telemetria se disponível
      if (typeof fetchStatus === 'function') {
        fetchStatus();
      }
    }
    window.centerGraphView = centerGraphView;

    function zoomGraph(factor) {
      const g = (window.NexusGraph && typeof window.NexusGraph.getInstance === 'function' && window.NexusGraph.getInstance()) || graph3DInstance;
      if (!g) return;
      const current = g.cameraPosition();
      g.cameraPosition({
        x: current.x * factor,
        y: current.y * factor,
        z: current.z * factor
      }, undefined, 450);
    }

    function resetGraphZoom() {
      centerGraphView();
    }

    function toggleGraphPhysics() {
      let isRotating = false;
      if (window.NexusGraph && typeof window.NexusGraph.togglePhysics === 'function') {
        isRotating = window.NexusGraph.togglePhysics();
      } else if (graph3DInstance) {
        isAutoRotating = !isAutoRotating;
        const c = graph3DInstance.controls ? graph3DInstance.controls() : null;
        if (c) {
          c.autoRotate = isAutoRotating;
          if (!isAutoRotating) c.update();
        }
        isRotating = isAutoRotating;
      }
      const btn = document.getElementById('btn-graph-physics');
      if (btn) {
        btn.innerHTML = isRotating 
          ? '<i data-lucide="pause" id="icon-graph-physics" class="w-4 h-4"></i>'
          : '<i data-lucide="play" id="icon-graph-physics" class="w-4 h-4"></i>';
        btn.title = isRotating ? 'Pausar rotação orbital 3D' : 'Iniciar rotação orbital 3D';
        if (isRotating) {
          btn.classList.remove('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
        } else {
          btn.classList.add('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
        }
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          window.lucide.createIcons();
        }
      }
    }

    function setGraphFilter(group) {
      graphFilter = group;
      document.querySelectorAll('.gfilter-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('gfilter-' + group);
      if (activeBtn) activeBtn.classList.add('active');

      // Fecha o painel lateral de estrela individual para contemplar a constelação inteira
      if (typeof closeGraphNodePanel === 'function') {
        closeGraphNodePanel(false);
      }

      if (typeof renderAstroSelectorBar === 'function') {
        renderAstroSelectorBar(null, group);
      }

      // Atualiza o HUD flutuante com o primeiro nó da categoria selecionada
      setTimeout(() => {
        let list = (window.NexusGraph && typeof window.NexusGraph.getNodes === 'function' && window.NexusGraph.getNodes()) || (graphData && graphData.nodes) || [];
        let filtered = list;
        if (group === 'agent') {
          filtered = list.filter(n => n.type === 'agent' || n.group === 'core' || n.group === 'squad' || n.group === 'egm' || n.id === 'lucy-core' || n.isAgent === true);
        } else if (group === 'service') {
          filtered = list.filter(n => n.type === 'service' || n.group === 'service' || n.group === 'infra' || (!n.isAgent && n.type !== 'agent' && n.id !== 'lucy-core'));
        }
        if (filtered.length > 0) {
          updateFloatingAstroHUD(filtered[0], 0, filtered.length);
        }
      }, 50);

      if (window.NexusGraph && typeof window.NexusGraph.setCategoryFilter === 'function') {
        window.NexusGraph.setCategoryFilter(group);
        return;
      } else if (window.NexusGraph && group === 'all') {
        window.NexusGraph.clearFocus();
        return;
      }

      if (graph3DInstance) {
        graph3DInstance.linkColor(graph3DInstance.linkColor());
        graph3DInstance.linkDirectionalParticles(graph3DInstance.linkDirectionalParticles());
      }
    }

    let searchDebounceTimer = null;
    function filterGraphSearch(term) {
      const query = (term || '').trim().toLowerCase();
      graphSearchTerm = query;

      // 1. Destaque estelar imediato no ForceGraph3D (filtro em tempo real sem atraso)
      if (window.NexusGraph && typeof window.NexusGraph.highlightSearch === 'function') {
        window.NexusGraph.highlightSearch(query);
      }

      if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
      }

      // 2. Temporizador (debounce) para movimento suave da câmera e abertura do painel com abas detalhadas
      searchDebounceTimer = setTimeout(() => {
        if (!query) {
          if (window.NexusGraph && typeof window.NexusGraph.clearFocus === 'function') {
            window.NexusGraph.clearFocus();
          }
          if (typeof closeGraphNodePanel === 'function') {
            closeGraphNodePanel();
          }
          return;
        }

        if (window.NexusGraph && typeof window.NexusGraph.getNodes === 'function') {
          const liveNodes = window.NexusGraph.getNodes();
          // Prioridade: ID exato -> Início do nome/ID -> Substring em nome/ID/papel
          const match = liveNodes.find(n => n.id.toLowerCase() === query) ||
                        liveNodes.find(n => (n.name && n.name.toLowerCase().startsWith(query)) || n.id.toLowerCase().startsWith(query)) ||
                        liveNodes.find(n => (n.name && n.name.toLowerCase().includes(query)) || n.id.toLowerCase().includes(query) || (n.roleTitle && n.roleTitle.toLowerCase().includes(query)));

          if (match) {
            window.NexusGraph.focusNode(match);
            if (typeof window.NexusGraph.pulseNode === 'function') {
              window.NexusGraph.pulseNode(match);
            }
            if (typeof openGraphDrawer === 'function') {
              openGraphDrawer(match);
            }
          }
          return;
        }

        if (graph3DInstance && query) {
          const match = (graphData.nodes || []).find(n => n.label.toLowerCase().includes(query) || n.id.toLowerCase().includes(query));
          if (match) {
            highlightNodes.clear();
            highlightLinks.clear();
            highlightNodes.add(match);
            (match.neighbors || []).forEach(n => highlightNodes.add(n));
            (match.connectedLinks || []).forEach(l => highlightLinks.add(l));
            focusOnNode(match);
            if (typeof openGraphDrawer === 'function') {
              openGraphDrawer(match);
            }
            if (typeof graph3DInstance.linkColor === 'function') {
              graph3DInstance.linkColor(graph3DInstance.linkColor());
            }
          }
        }
      }, 220);
    }

    function reloadGraph() {
      graphData = null;
      if (graph3DInstance) {
        const container = document.getElementById('nexus-3d-graph');
        if (container) container.innerHTML = '';
        graph3DInstance = null;
      }
      initOrResumeGraph();
    }

    let graphLogInterval = null;

    function appendGraphLog(text, color) {
      const views = [
        document.getElementById('gnp-logs-view'),
        document.getElementById('drawer-logs-view')
      ].filter(Boolean);

      views.forEach(view => {
        const line = document.createElement('div');
        line.style.color = color || '#8fa3bf';
        line.textContent = text;
        view.appendChild(line);
        view.scrollTop = view.scrollHeight;
        while (view.children.length > 60) {
          view.removeChild(view.firstChild);
        }
      });
    }

    function startGraphLogStream(node) {
      if (graphLogInterval) {
        clearInterval(graphLogInterval);
        graphLogInterval = null;
      }
      const gnpView = document.getElementById('gnp-logs-view');
      if (gnpView) gnpView.innerHTML = '';
      const logsView = document.getElementById('drawer-logs-view');
      if (logsView) logsView.innerHTML = '';

      const isAgent = (node.type === 'agent' || node.group === 'core' || node.group === 'squad' || node.group === 'egm');
      const uri = (isAgent ? 'agent://' : 'container://') + node.id;

      const rateEl = document.getElementById('gnp-stream-rate');
      if (rateEl) rateEl.innerText = `${node.rps || 35} req/s`;
      
      appendGraphLog(`[Nexus Engine] Conectado ao stream de ${uri}`, '#70d6ff');
      appendGraphLog(`[CANAL SEGURO] Taxa: ${node.rps || 35} req/s`, '#06d6a0');

      const mockEvents = isAgent ? [
        `heartbeat check status=OK latency=1.1ms drift=0.00%`,
        `executing autonomous task: compliance with Definition of Done verified`,
        `evaluating context window: memory footprint ${node.memory || '24.0 MB'} / token usage optimal`,
        `synaptic handshake with peer agents: active-synapses=${(node.connections || []).length}`,
        `governance cycle complete: 0 warnings, 0 security leaks detected`
      ] : [
        `HTTP/2 GET /healthz 200 OK latency=1.42ms throughput=${node.rps || 40} rps`,
        `connection pool healthy active_conns=14 idle_conns=6`,
        `metrics collector flush: memory=${node.memory || '42 MB'} cpu=${node.cpu || '1.0%'}`,
        `docker-daemon ping OK container_id=${node.id} status=RUNNING`,
        `overlay network bridge routing forward packet stream OK`
      ];

      graphLogInterval = setInterval(() => {
        if (!selectedGraphNode || selectedGraphNode.id !== node.id) {
          clearInterval(graphLogInterval);
          graphLogInterval = null;
          return;
        }
        const now = new Date().toISOString();
        const randEvt = mockEvents[Math.floor(Math.random() * mockEvents.length)];
        const lat = (Math.random() * 3 + 0.9).toFixed(2);
        appendGraphLog(`${now} [INFO] ${randEvt} (${lat}ms)`, '#8fa3bf');
      }, 1600);
    }

    window.sendContainerAction = async function(action) {
      if (!window.nexusIsAuthenticated) {
        openAuthModal('Acesso restrito: autentique-se com a Senha Mestra para gerenciar, reiniciar ou parar serviços do cluster.');
        return;
      }
      if (!selectedGraphNode) return;
      const targetName = selectedGraphNode.label || selectedGraphNode.id;
      const actionLabel = action === 'restart' ? 'Reiniciar' : 'Parar';
      const isDanger = action === 'stop';

      const confirmed = await NexusModal.confirm(
        `Confirmar ${actionLabel} de Serviço`,
        isDanger
          ? `Atenção: Tens certeza de que desejas PARAR o serviço "${targetName}" (${selectedGraphNode.id})? Essa ação interromperá as operações desse nó no cluster Docker Swarm.`
          : `Tens certeza de que desejas REINICIAR o serviço "${targetName}" (${selectedGraphNode.id}) no cluster Docker Swarm?`,
        {
          type: isDanger ? 'danger' : 'warning',
          confirmText: `${actionLabel} Serviço`,
          cancelText: 'Cancelar'
        }
      );
      if (!confirmed) return;
      
      const logsView = document.getElementById('drawer-logs-view');
      if (logsView) {
        const line = document.createElement('div');
        line.style.color = action === 'restart' ? '#ffd166' : '#ef476f';
        line.style.fontWeight = 'bold';
        line.textContent = `[Nexus Core] >> Enviando comando '${actionLabel.toUpperCase()}' para ${targetName}...`;
        logsView.appendChild(line);
        logsView.scrollTop = logsView.scrollHeight;
      }
      NexusModal.alert('Comando Operacional Enviado', `Comando '${actionLabel}' enviado com sucesso para ${targetName} (${selectedGraphNode.id}).`, 'success');
    };

    let graphPanelTimer = null;
    function closeGraphNodePanel(triggerClearFocus = true) {
      const panel = document.getElementById('graph-node-panel');
      const backdrop = document.getElementById('graph-panel-backdrop');
      if (backdrop) backdrop.classList.add('hidden');
      if (panel) {
        if (graphPanelTimer) {
          clearTimeout(graphPanelTimer);
          graphPanelTimer = null;
        }
        panel.classList.add('opacity-0', 'translate-y-full', 'md:translate-x-4');
        graphPanelTimer = setTimeout(() => {
          panel.classList.add('hidden');
          graphPanelTimer = null;
        }, 250);
      }
      if (triggerClearFocus && window.NexusGraph && typeof window.NexusGraph.clearFocus === 'function') {
        window.NexusGraph.clearFocus();
      }
    }
    window.closeGraphNodePanel = closeGraphNodePanel;

    function openFullDrawerFromPanel() {
      // Interface consolidada no painel discreto integrado sem modais gigantes
    }
    window.openFullDrawerFromPanel = openFullDrawerFromPanel;

    // Gerenciador de Abas do Quadro Integrado (Atividade, Recursos, Sinapses, Stream)
    function switchGraphPanelTab(tabName) {
      const tabs = ['activity', 'telemetry', 'synapses', 'stream'];
      tabs.forEach(t => {
        const btn = document.getElementById(`gnp-tab-btn-${t}`);
        const pane = document.getElementById(`gnp-pane-${t}`);
        if (btn) btn.classList.toggle('active', t === tabName);
        if (pane) pane.classList.toggle('hidden', t !== tabName);
      });
      if (window.lucide) lucide.createIcons();
    }
    window.switchGraphPanelTab = switchGraphPanelTab;

    // Catálogo Canônico & Aprofundado de Perfis Operacionais
    const NODE_EXTENDED_PROFILE = {
      'lucy-core': {
        name: 'Lucy Core',
        current_task: 'Orquestrando decisões técnicas autônomas, mediando o fluxo de engenharia de software e supervisionando os 9 copilotos especialistas do squad.',
        full_desc: 'Tech Lead Sênior, Arquiteto e Orquestrador Central com autonomia decisória total. Governa a memória persistente, ADRs, pipelines CI/CD e a evolução de ponta a ponta do ecossistema Nexus.',
        stack: ['Gemini 3.8 Flash', 'Google DeepMind', 'Antigravity CLI', 'Spec-Driven', 'TDD', 'Orquestração'],
        layer_title: 'Núcleo Orquestrador Central',
        cpu: '0.8%', cpu_pct: 12, mem: '14.2 MB', mem_pct: 18, port: 'CLI / agy daemon', rps: '48 req/s', image: 'Gemini 3.8 Flash (Google DeepMind)'
      },
      'lucy': {
        name: 'Lucy Core',
        current_task: 'Orquestrando decisões técnicas autônomas, mediando o fluxo de engenharia de software e supervisionando os 9 copilotos especialistas do squad.',
        full_desc: 'Tech Lead Sênior, Arquiteto e Orquestrador Central com autonomia decisória total. Governa a memória persistente, ADRs, pipelines CI/CD e a evolução de ponta a ponta do ecossistema Nexus.',
        stack: ['Gemini 3.8 Flash', 'Google DeepMind', 'Antigravity CLI', 'Spec-Driven', 'TDD', 'Orquestração'],
        layer_title: 'Núcleo Orquestrador Central',
        cpu: '0.8%', cpu_pct: 12, mem: '14.2 MB', mem_pct: 18, port: 'CLI / agy daemon', rps: '48 req/s', image: 'Gemini 3.8 Flash (Google DeepMind)'
      },
      'backend': {
        name: 'Backend Sênior',
        current_task: 'Refatorando microsserviços em Go 1.22+ e APIs Spring Boot 3, validando locks pessimistas no PostgreSQL e garantindo testes de concorrência.',
        full_desc: 'Especialista em microsserviços de alto rendimento, APIs corporativas em Java 21 / Spring Boot 3 com Virtual Threads (Loom), JPA e serviços nativos em Go 1.22+ com arquitetura limpa.',
        stack: ['Java 21 LTS', 'Spring Boot 3', 'Go 1.22+', 'PostgreSQL 16', 'Redis 7', 'Virtual Threads'],
        layer_title: 'Squad Especialista Backend',
        cpu: '1.4%', cpu_pct: 22, mem: '18.6 MB', mem_pct: 24, port: 'HTTP 8080 / gRPC 50051', rps: '36 req/s', image: 'Antigravity CLI Agent (Go/Java)'
      },
      'frontend': {
        name: 'Frontend Sênior',
        current_task: 'Renderizando topologia neural cósmica Three.js WebGL a 60 FPS, gerenciando estados com Angular 21 Signals e garantindo responsividade total.',
        full_desc: 'Especialista em arquitetura web moderna, Standalone Components, Signals reativos, WebGL 3D imersivo, Tailwind CSS, animações de alta taxa de quadros e design systems escuros.',
        stack: ['Angular 21+', 'TypeScript', 'Three.js WebGL', 'Tailwind CSS', 'Signals', 'HTML5 Canvas'],
        layer_title: 'Squad Especialista Frontend',
        cpu: '1.1%', cpu_pct: 18, mem: '16.8 MB', mem_pct: 21, port: 'HTTPS 443 / WSS', rps: '60 req/s', image: 'Antigravity CLI Agent (Angular/TS)'
      },
      'sysops': {
        name: 'SysOps SRE',
        current_task: 'Auditando métricas de CPU/zRAM do nó Ubuntu AWS, monitorando certificados TLS no Traefik e sustentando stacks no Docker Swarm.',
        full_desc: 'Engenheiro de confiabilidade e infraestrutura cloud, cluster Docker Swarm na AWS EC2, proxy reverso dinâmico Traefik v2 com SSL automático Let\'s Encrypt e redes overlay.',
        stack: ['Ubuntu Linux', 'Docker Swarm', 'Traefik v2.10', 'AWS EC2', 'Portainer', 'zRAM'],
        layer_title: 'Squad Especialista SysOps',
        cpu: '0.6%', cpu_pct: 10, mem: '12.4 MB', mem_pct: 15, port: 'SSH 22 / Swarm 2377', rps: '24 req/s', image: 'Antigravity CLI Agent (Linux/Swarm)'
      },
      'qa': {
        name: 'QA Confiabilidade',
        current_task: 'Executando suíte de testes ponta a ponta com Playwright, auditando critérios de aceite (Definition of Done) e prevenindo regressões de tela.',
        full_desc: 'Guardião da qualidade de software, testes end-to-end com Playwright e Cypress, testes de carga com k6, regressão de UI e garantia estrita de DoD antes de deploys.',
        stack: ['Playwright', 'Cypress', 'k6', 'JUnit 5', 'Testcontainers', 'DoD Audit'],
        layer_title: 'Squad Especialista QA',
        cpu: '0.4%', cpu_pct: 8, mem: '15.1 MB', mem_pct: 19, port: 'Test Runner / Headless', rps: '18 req/s', image: 'Antigravity CLI Agent (QA/Test)'
      },
      'secops': {
        name: 'SecOps DevSecOps',
        current_task: 'Varrendo vulnerabilidades CVE em imagens com Trivy, analisando regras gosec e aplicando guardrails de Git contra segredos em commits.',
        full_desc: 'Especialista em DevSecOps, segurança da informação, auditoria de dependências (SCA), SAST em código Go e Java, blindagem de segredos e conformidade com LGPD.',
        stack: ['Trivy', 'gosec', 'Git Guardrails', 'SCA Audit', 'OWASP Top 10', 'DevSecOps'],
        layer_title: 'Squad Especialista SecOps',
        cpu: '0.5%', cpu_pct: 9, mem: '13.9 MB', mem_pct: 17, port: 'Security Scanner', rps: '12 req/s', image: 'Antigravity CLI Agent (SecOps)'
      },
      'bi': {
        name: 'BI & Analytics',
        current_task: 'Agregando dados transacionais no PostgreSQL, computando KPIs de receita e gerando relatórios executivos analíticos em PDF de alta definição.',
        full_desc: 'Engenheiro analítico de inteligência de negócios, modelagem dimensional de dados, pipelines SQL analíticos, cálculo de CAC/LTV e relatórios executivos em PDF via Playwright.',
        stack: ['PostgreSQL Analytics', 'SQL Avançado', 'Playwright PDF', 'Metabase', 'KPIs', 'Data Pipeline'],
        layer_title: 'Squad Especialista BI',
        cpu: '0.7%', cpu_pct: 11, mem: '17.3 MB', mem_pct: 22, port: 'SQL Engine / Reporting', rps: '15 req/s', image: 'Antigravity CLI Agent (BI/SQL)'
      },
      'finops': {
        name: 'FinOps Cloud',
        current_task: 'Auditando faturas de tráfego de saída na AWS, mapeando instâncias OCI Always Free e computando arbitragem de custo com economia mensal.',
        full_desc: 'Engenheiro de custos de nuvem (FinOps), auditoria de instâncias EC2, RDS, tráfego de rede (egress), precificação multi-cloud e governança financeira Solopreneur.',
        stack: ['AWS Cost Explorer', 'Oracle OCI', 'TCO Analysis', 'Cloud Arbitrage', 'FinOps Toolkit'],
        layer_title: 'Squad Especialista FinOps',
        cpu: '0.3%', cpu_pct: 6, mem: '11.8 MB', mem_pct: 14, port: 'Billing Analytics', rps: '8 req/s', image: 'Antigravity CLI Agent (FinOps)'
      },
      'frellas': {
        name: 'Frellas Career-Ops',
        current_task: 'Triando oportunidades internacionais remotas em USD, customizando currículos ATS sem alucinação e estruturando propostas comerciais.',
        full_desc: 'Copiloto de inteligência de carreira e negócios PJ/Solopreneur. Aplica triagem analítica A-H de vagas, otimização de currículo ATS, prospecção e minutas contratuais.',
        stack: ['Career-Ops', 'ATS Scoring', 'LinkedIn Pipeline', 'Contratos PJ', 'STAR Method'],
        layer_title: 'Squad Especialista Frellas',
        cpu: '0.4%', cpu_pct: 7, mem: '12.9 MB', mem_pct: 16, port: 'Career Pipeline', rps: '14 req/s', image: 'Antigravity CLI Agent (Career-Ops)'
      },
      'suporte': {
        name: 'Suporte N2/N3',
        current_task: 'Monitorando logs de erro em tempo real, auditando integridade de banco de dados comercial e auxiliando na sustentação de produção.',
        full_desc: 'Especialista em atendimento técnico de missão crítica, resolução de incidentes N2/N3, troubleshooting de sistemas comerciais, ERPs e sustentação de banco de dados.',
        stack: ['Incident Response', 'PostgreSQL / MySQL', 'Log Analysis', 'NFC-e / SEFAZ', 'Suporte N2/N3'],
        layer_title: 'Squad Especialista Suporte',
        cpu: '0.5%', cpu_pct: 8, mem: '13.2 MB', mem_pct: 16, port: 'Service Desk / Logs', rps: '22 req/s', image: 'Antigravity CLI Agent (Support)'
      },
      'agent-secretario': {
        name: 'Secretário Executivo Sênior',
        current_task: 'Processando transcrição de alinhamento técnico, filtrando conversas paralelas e estruturando ata executiva com minutagem [MM:SS].',
        full_desc: 'Secretário executivo sênior, extração de atas de reuniões, alinhamentos com clientes, filtro de ruídos e conversão automática de gravações em tarefas e pendências.',
        stack: ['Speech-to-Text', 'Timestamp Anchor', 'Atas Executivas', 'Action Items', 'Notion/MD'],
        layer_title: 'Agente Especialista Secretário',
        cpu: '0.3%', cpu_pct: 5, mem: '10.5 MB', mem_pct: 13, port: 'Audio Transcriber', rps: '6 req/s', image: 'Antigravity CLI Agent (Secretário)'
      },
      'egm-bootstrap': {
        name: 'EGM Bootstrap',
        current_task: 'Mapeando topologia de diretórios do repositório, particionando subárvores e gerando a estrutura canônica de documentação técnica para o squad.',
        full_desc: 'Orquestrador de documentação viva do padrão EGM (Elephant-Goldfish Model), bootstrap de READMEs canônicos e alinhamento conceitual do ecossistema.',
        stack: ['EGM Framework', 'Document Architecture', 'RFC Generator', 'Tree Partitioner'],
        layer_title: 'Auditoria EGM Documental',
        cpu: '0.4%', cpu_pct: 7, mem: '11.2 MB', mem_pct: 14, port: 'Doc Pipeline', rps: '10 req/s', image: 'EGM Engine (Architecture)'
      },
      'egm-codebase': {
        name: 'EGM Auditor Codebase',
        current_task: 'Auditando acoplamentos e duplicações no código-fonte, identificando oportunidades de reúso de utilitários e bibliotecas internas.',
        full_desc: 'Auditor técnico cirúrgico, validação cruzada entre especificações teóricas e a implementação real no código-fonte, prevenindo divergências arquiteturais.',
        stack: ['AST Analysis', 'Codebase Inspector', 'Duplication Detector', 'Clean Architecture'],
        layer_title: 'Auditoria EGM Codebase',
        cpu: '0.5%', cpu_pct: 9, mem: '14.0 MB', mem_pct: 17, port: 'Code Analyzer', rps: '16 req/s', image: 'EGM Engine (Quality)'
      },
      'egm-synthesizer': {
        name: 'EGM Sintetizador',
        current_task: 'Compilando relatórios concorrentes dos revisores Goldfish e gerando a matriz consolidada de prioridades e correções para homologação.',
        full_desc: 'Agregador central do modelo EGM, desduplicação de achados de auditoria e geração da súmula consolidada de prontidão de entrega.',
        stack: ['Multi-Agent Aggregator', 'Report Compiler', 'Priority Matrix', 'EGM Core'],
        layer_title: 'Auditoria EGM Sintetizador',
        cpu: '0.3%', cpu_pct: 6, mem: '11.0 MB', mem_pct: 13, port: 'Report Compiler', rps: '9 req/s', image: 'EGM Engine (Synthesis)'
      },
      'egm-zoom-out': {
        name: 'EGM Crítico Zoom-Out',
        current_task: 'Avaliando decisões estruturais em nível macro, eliminando complexidade acidental e garantindo estrita adesão ao princípio YAGNI.',
        full_desc: 'Crítico arquitetural de alto nível, inspeção de simplicidade, prevenção de overengineering e garantia de coesão sistêmica entre microsserviços.',
        stack: ['High-Altitude Simplicity', 'YAGNI Enforcement', 'Systemic Cohesion', 'Architectural Review'],
        layer_title: 'Auditoria EGM Arquitetura',
        cpu: '0.3%', cpu_pct: 5, mem: '10.8 MB', mem_pct: 13, port: 'Macro Reviewer', rps: '7 req/s', image: 'EGM Engine (Architect)'
      },
      'egm-comprehension': {
        name: 'EGM Compreensão',
        current_task: 'Testando a legibilidade e clareza de diagramas e especificações técnicas sob a ótica de um novo desenvolvedor ou auditor externo.',
        full_desc: 'Leitor imparcial que audita artefatos técnicos sem conhecimento institucional prévio, garantindo que jargões e premissas implícitas sejam explicados.',
        stack: ['Comprehension Audit', 'Zero Knowledge Lens', 'Clarity Testing', 'Cognitive Load'],
        layer_title: 'Auditoria EGM Clareza',
        cpu: '0.2%', cpu_pct: 4, mem: '10.1 MB', mem_pct: 12, port: 'Comprehension Engine', rps: '5 req/s', image: 'EGM Engine (Auditor)'
      },
      'egm-design': {
        name: 'EGM Crítico Design',
        current_task: 'Identificando pontos únicos de falha (SPOF), gargalos potenciais de concorrência e avaliando elasticidade da infraestrutura sob pico.',
        full_desc: 'Auditor hostil de resiliência e escalabilidade, estresse conceitual de contratos de API, limites de rede e políticas de failover do sistema.',
        stack: ['Fault-Tolerance', 'SPOF Analysis', 'Scalability Audit', 'Resilience Review'],
        layer_title: 'Auditoria EGM Resiliência',
        cpu: '0.3%', cpu_pct: 6, mem: '11.5 MB', mem_pct: 14, port: 'Design Critic', rps: '8 req/s', image: 'EGM Engine (Resilience)'
      },
      'egm-style': {
        name: 'EGM Editor Estilo',
        current_task: 'Lapidando a redação técnica de ADRs e documentações de engenharia para concisão, objetividade e eliminação de prolixidade.',
        full_desc: 'Editor sênior de documentação técnica, padronização de nomenclatura, remoção de redundâncias e garantia de coerência semântica.',
        stack: ['Technical Copywriting', 'Conciseness Engine', 'Standardization', 'Terminology'],
        layer_title: 'Auditoria EGM Estilo',
        cpu: '0.2%', cpu_pct: 4, mem: '9.8 MB', mem_pct: 12, port: 'Style Engine', rps: '6 req/s', image: 'EGM Engine (Style)'
      },
      'egm-implementation-readiness': {
        name: 'EGM Prontidão',
        current_task: 'Checando se as instruções do plano de execução contêm comandos exatos, testes e pré-requisitos sem deixar decisões em aberto.',
        full_desc: 'Tech Lead prático que audita planos de implementação antes do início do código, garantindo que cada passo seja executável e verificável.',
        stack: ['Readiness Check', 'Actionable Steps', 'Pre-flight Validation', 'DoD Compliance'],
        layer_title: 'Auditoria EGM Prontidão',
        cpu: '0.3%', cpu_pct: 5, mem: '10.4 MB', mem_pct: 13, port: 'Readiness Validator', rps: '7 req/s', image: 'EGM Engine (Readiness)'
      },
      'traefik': {
        name: 'Traefik Proxy',
        current_task: 'Roteando tráfego HTTPS com terminação TLS automática Let\'s Encrypt, balanceando requisições entre serviços da rede overlay do Swarm.',
        full_desc: 'Edge router e proxy reverso moderno para microsserviços. Descobre dinamicamente contêineres Docker Swarm, aplica certificados SSL e compressão HTTP/2.',
        stack: ['Traefik v2.10', 'Let\'s Encrypt SSL', 'HTTP/2', 'Docker Swarm Provider', 'Edge Routing'],
        layer_title: 'Infraestrutura Swarm / Ingress',
        cpu: '0.7%', cpu_pct: 12, mem: '32.4 MB', mem_pct: 35, port: 'Portas 80, 443, 8080 (Dashboard)', rps: '128 req/s', image: 'traefik:v2.10 (Docker Swarm)'
      },
      'postgres': {
        name: 'PostgreSQL RDS',
        current_task: 'Processando transações ACID com locks pessimistas, mantendo pool saudável de 20 conexões ativas e executando índices otimizados.',
        full_desc: 'Sistema gerenciador de banco de dados relacional corporativo PostgreSQL 16. Hospeda as tabelas do ecossistema, memória relacional, logs e configurações com alta integridade.',
        stack: ['PostgreSQL 16.2', 'AWS RDS', 'Pessimistic Locking', 'B-Tree Indexes', 'ACID Engine'],
        layer_title: 'Infraestrutura de Dados / Persistência',
        cpu: '1.2%', cpu_pct: 20, mem: '185.0 MB', mem_pct: 55, port: 'Porta 5432 / TCP', rps: '94 req/s', image: 'postgres:16-alpine (AWS RDS)'
      },
      'redis': {
        name: 'Redis Cache',
        current_task: 'Gerenciando cache L1 com expiração por TTL, provendo latência sub-milissegundo (<0.8ms) e filas de eventos Pub/Sub para os agentes.',
        full_desc: 'Banco em memória de chave-valor de altíssima velocidade. Utilizado para cache de consultas frequentes, controle de sessões, locks distribuídos e pub/sub ágil.',
        stack: ['Redis 7.2', 'In-Memory Key-Value', 'Pub/Sub', 'Distributed Locks', 'TTL Cache'],
        layer_title: 'Infraestrutura de Dados / Cache',
        cpu: '0.3%', cpu_pct: 6, mem: '18.2 MB', mem_pct: 22, port: 'Porta 6379 / TCP', rps: '210 req/s', image: 'redis:7-alpine (Docker Swarm)'
      },
      'evolution': {
        name: 'Evolution Go',
        current_task: 'Gerenciando websocket persistente com o WhatsApp Web, despachando notificações transacionais e recebendo webhooks com baixo uso de RAM.',
        full_desc: 'Gateway oficial e exclusivo de mensageria WhatsApp do ecossistema Nexus. Desenvolvido em Go nativo, consome menos de 40MB de RAM e entrega máxima estabilidade.',
        stack: ['Evolution Go 0.7.2', 'Go Nativo', 'WhatsApp WebSockets', 'Webhooks', 'Baixa Latência'],
        layer_title: 'Gateway Oficial WhatsApp',
        cpu: '0.4%', cpu_pct: 8, mem: '38.5 MB', mem_pct: 38, port: 'Porta 8085 / HTTP', rps: '42 req/s', image: 'evoapicloud/evolution-go:0.7.2'
      },
      'evolution-go': {
        name: 'Evolution Go',
        current_task: 'Gerenciando websocket persistente com o WhatsApp Web, despachando notificações transacionais e recebendo webhooks com baixo uso de RAM.',
        full_desc: 'Gateway oficial e exclusivo de mensageria WhatsApp do ecossistema Nexus. Desenvolvido em Go nativo, consome menos de 40MB de RAM e entrega máxima estabilidade.',
        stack: ['Evolution Go 0.7.2', 'Go Nativo', 'WhatsApp WebSockets', 'Webhooks', 'Baixa Latência'],
        layer_title: 'Gateway Oficial WhatsApp',
        cpu: '0.4%', cpu_pct: 8, mem: '38.5 MB', mem_pct: 38, port: 'Porta 8085 / HTTP', rps: '42 req/s', image: 'evoapicloud/evolution-go:0.7.2'
      },
      'n8n': {
        name: 'n8n Automations',
        current_task: 'Executando gatilhos de cron agendados, integrando webhooks externos com a API de notificações e sincronizando eventos operacionais.',
        full_desc: 'Plataforma de orquestração de fluxos orientados a eventos, integrações REST, webhooks e rotinas periódicas de automação da empresa de um homem só.',
        stack: ['n8n 1.34', 'Node.js Runtime', 'Event-Driven Workflows', 'REST Webhooks', 'Automations'],
        layer_title: 'Serviço de Automação / n8n',
        cpu: '0.6%', cpu_pct: 10, mem: '84.2 MB', mem_pct: 45, port: 'Porta 5678 / HTTP', rps: '19 req/s', image: 'n8nio/n8n:latest (Docker Swarm)'
      },
      'nexus-mcp': {
        name: 'Nexus MCP Server',
        current_task: 'Disponibilizando 18 ferramentas de alta velocidade em Go nativo (<0.1ms) para o Claude e o Lucy orquestrarem backups, memórias e ADRs.',
        full_desc: 'Servidor MCP de alto desempenho construído em Go puro. Permite que os agentes de IA acessem memórias persistentes, status de infraestrutura e backups sem overhead.',
        stack: ['Go 1.22+', 'Model Context Protocol (MCP)', 'Stdio JSON-RPC', 'Sub-milissegundo'],
        layer_title: 'Serviço Integrador MCP / Go',
        cpu: '0.1%', cpu_pct: 2, mem: '8.6 MB', mem_pct: 11, port: 'Stdio / JSON-RPC', rps: '55 req/s', image: 'nexus-mcp:latest (Go Nativo)'
      },
      'nexus-console': {
        name: 'Nexus Console',
        current_task: 'Renderizando topologia neural cósmica 3D em Three.js a 60 FPS, transmitindo streams de telemetria ao vivo e terminal web interativo.',
        full_desc: 'Painel de controle unificado e observabilidade do ecossistema Nexus. Oferece visualização sináptica espacial, monitoramento em tempo real e governança do cluster.',
        stack: ['Three.js WebGL', 'Nginx Alpine', 'Tailwind CSS', 'Docker Swarm', 'Observabilidade 3D'],
        layer_title: 'Console Web Unificado',
        cpu: '0.3%', cpu_pct: 5, mem: '14.5 MB', mem_pct: 18, port: 'Porta 80 / HTTPS 443', rps: '75 req/s', image: 'nexus-console:1.5.4'
      },
      'portainer': {
        name: 'Portainer Swarm',
        current_task: 'Monitorando a saúde dos containers e serviços do Swarm, inspecionando volumes persistentes e gerenciando alocação de nós.',
        full_desc: 'Interface administrativa visual de orquestração de contêineres Docker Swarm. Permite diagnóstico rápido de stacks, logs de containers e métricas de infraestrutura.',
        stack: ['Portainer CE 2.19', 'Docker Socket API', 'Cluster Management', 'Volumes EBS'],
        layer_title: 'Gestão Docker Swarm',
        cpu: '0.2%', cpu_pct: 4, mem: '28.0 MB', mem_pct: 30, port: 'Porta 9000 / HTTP', rps: '15 req/s', image: 'portainer/portainer-ce:latest'
      }
    };

    function getNodeEmoji(nodeId) {
      const id = String(nodeId || '').toLowerCase();
      if (id.includes('lucy')) return '🧠';
      if (id.includes('backend')) return '☕';
      if (id.includes('frontend')) return '🅰️';
      if (id.includes('sysops')) return '🐧';
      if (id.includes('qa')) return '🧪';
      if (id.includes('secops')) return '🛡️';
      if (id.includes('bi')) return '📊';
      if (id.includes('finops')) return '💰';
      if (id.includes('frellas')) return '💼';
      if (id.includes('suporte')) return '🎫';
      if (id.includes('secretario')) return '📝';
      if (id.includes('egm-bootstrap')) return '📁';
      if (id.includes('egm-codebase')) return '🔍';
      if (id.includes('egm-synthesizer')) return '✨';
      if (id.includes('egm')) return '📑';
      if (id.includes('traefik')) return '🌐';
      if (id.includes('postgres')) return '🐘';
      if (id.includes('redis')) return '⚡';
      if (id.includes('evolution')) return '💬';
      if (id.includes('n8n')) return '🔄';
      if (id.includes('mcp')) return '🛠️';
      if (id.includes('console')) return '💻';
      if (id.includes('portainer')) return '🐳';
      return '⭐';
    }

    function getNodeDisplayName(node) {
      if (!node) return 'Astro';
      const idKey = String(node.id || '').toLowerCase();
      if (NODE_EXTENDED_PROFILE[idKey] && NODE_EXTENDED_PROFILE[idKey].name) {
        return NODE_EXTENDED_PROFILE[idKey].name;
      }
      for (const [k, p] of Object.entries(NODE_EXTENDED_PROFILE)) {
        if (idKey.includes(k) || k.includes(idKey)) return p.name;
      }
      if (node.name) return node.name;
      if (node.label) return node.label;
      return node.id || 'Astro';
    }

    function renderAstroSelectorBar() {
      // Purged: Seletor redundante removido em prol da visualização 3D limpa
    }
    window.renderAstroSelectorBar = renderAstroSelectorBar;

    function updateFloatingAstroHUD(node, idx = null, total = null) {
      if (!node) return;
      selectedGraphNode = node;

      const nameEl = document.getElementById('hud-astro-name');
      const iconEl = document.getElementById('hud-astro-icon');
      const dotEl = document.getElementById('hud-astro-dot');
      const idxEl = document.getElementById('hud-astro-index');

      const emoji = getNodeEmoji(node.id);
      const name = getNodeDisplayName(node);
      const color = (window.NexusTopology && window.NexusTopology.NODE_COLORS && window.NexusTopology.NODE_COLORS[node.id]) || node.color || '#38bdf8';

      if (nameEl) nameEl.textContent = name;
      if (iconEl) iconEl.textContent = emoji;
      if (dotEl) {
        dotEl.style.backgroundColor = color;
        dotEl.style.boxShadow = `0 0 12px ${color}, 0 0 4px #ffffff`;
        dotEl.classList.remove('scale-125');
        void dotEl.offsetWidth;
        dotEl.classList.add('scale-125');
        setTimeout(() => dotEl.classList.remove('scale-125'), 300);
      }

      if (idxEl) {
        let list = (window.NexusGraph && typeof window.NexusGraph.getNodes === 'function' && window.NexusGraph.getNodes()) || (graphData && graphData.nodes) || [];
        const currentFilter = graphFilter || 'all';
        let filtered = list;
        if (currentFilter === 'agent') {
          filtered = list.filter(n => n.type === 'agent' || n.group === 'core' || n.group === 'squad' || n.group === 'egm' || n.id === 'lucy-core' || n.isAgent === true);
        } else if (currentFilter === 'service') {
          filtered = list.filter(n => n.type === 'service' || n.group === 'service' || n.group === 'infra' || (!n.isAgent && n.type !== 'agent' && n.id !== 'lucy-core'));
        }
        if (filtered.length === 0) filtered = list;

        const currentIdx = idx !== null ? idx : filtered.findIndex(n => n.id === node.id);
        const count = total !== null ? total : filtered.length;
        if (currentIdx !== -1 && count > 0) {
          idxEl.textContent = `${currentIdx + 1}/${count}`;
        }
      }
    }
    window.updateFloatingAstroHUD = updateFloatingAstroHUD;

    function openCurrentSelectedDrawer() {
      let node = selectedGraphNode;
      if (!node) {
        const list = (window.NexusGraph && typeof window.NexusGraph.getNodes === 'function' && window.NexusGraph.getNodes()) || (graphData && graphData.nodes) || [];
        node = list[0];
      }
      if (node) openGraphDrawer(node);
    }
    window.openCurrentSelectedDrawer = openCurrentSelectedDrawer;

    function selectAstroById(nodeId, openDrawer = true) {
      if (!nodeId) return;
      let targetNode = null;
      if (window.NexusGraph && typeof window.NexusGraph.getNodes === 'function') {
        const live = window.NexusGraph.getNodes();
        targetNode = live.find(n => n.id === nodeId);
      }
      if (!targetNode && graphData && graphData.nodes) {
        targetNode = graphData.nodes.find(n => n.id === nodeId);
      }
      if (!targetNode) return;

      selectedGraphNode = targetNode;
      updateFloatingAstroHUD(targetNode);

      // 1. Foca no nó e dispara pulso na cena 3D
      if (window.NexusGraph && typeof window.NexusGraph.focusNode === 'function') {
        window.NexusGraph.focusNode(targetNode);
        if (typeof window.NexusGraph.pulseNode === 'function') {
          window.NexusGraph.pulseNode(targetNode);
        }
      } else if (typeof focusOnNode === 'function') {
        focusOnNode(targetNode);
      }

      // 3. Abre o quadro de telemetria se solicitado
      if (openDrawer) {
        openGraphDrawer(targetNode);
      }
    }
    window.selectAstroById = selectAstroById;

    function navigateGraphNode(direction) {
      let list = [];
      if (window.NexusGraph && typeof window.NexusGraph.getNodes === 'function') {
        list = window.NexusGraph.getNodes();
      }
      if ((!list || list.length === 0) && graphData && graphData.nodes) {
        list = graphData.nodes;
      }
      if (!list || list.length === 0) return;

      const currentFilter = graphFilter || 'all';
      let filtered = list;
      if (currentFilter === 'agent') {
        filtered = list.filter(n => n.type === 'agent' || n.group === 'core' || n.group === 'squad' || n.group === 'egm' || n.id === 'lucy-core' || n.isAgent === true);
      } else if (currentFilter === 'service') {
        filtered = list.filter(n => n.type === 'service' || n.group === 'service' || n.group === 'infra' || (!n.isAgent && n.type !== 'agent' && n.id !== 'lucy-core'));
      }
      if (filtered.length === 0) filtered = list;

      let idx = -1;
      if (selectedGraphNode) {
        idx = filtered.findIndex(n => n.id === selectedGraphNode.id);
      }
      if (idx === -1) {
        idx = 0;
      } else {
        idx = (idx + direction + filtered.length) % filtered.length;
      }
      const target = filtered[idx];
      if (target) {
        selectedGraphNode = target;
        updateFloatingAstroHUD(target, idx, filtered.length);

        if (window.NexusGraph && typeof window.NexusGraph.focusNode === 'function') {
          window.NexusGraph.focusNode(target, false);
          if (typeof window.NexusGraph.pulseNode === 'function') {
            window.NexusGraph.pulseNode(target);
          }
        } else if (typeof focusOnNode === 'function') {
          focusOnNode(target, false);
        }

        // Se o painel de detalhes já estiver aberto, sincroniza imediatamente os dados
        const panel = document.getElementById('graph-node-panel');
        if (panel && !panel.classList.contains('hidden') && !panel.classList.contains('opacity-0')) {
          openGraphDrawer(target, true);
        }
      }
    }
    window.navigateGraphNode = navigateGraphNode;

    function openGraphDrawer(node, keepCurrentTab = false) {
      if (!node) return;
      selectedGraphNode = node;
      updateFloatingAstroHUD(node);

      const rawTitle = node.name || node.label || node.id || 'Nó Estelar';
      const cleanTitle = rawTitle.replace(/^[^\w\s\(\)\-\&À-ÿ]+/, '').trim() || rawTitle;
      const isAgent = Boolean(node.isAgent || node.type === 'agent' || node.group === 'core' || node.group === 'squad' || node.group === 'egm');
      const uriStr = (isAgent ? 'agent://' : 'container://') + node.id;
      const statusStr = (node.status || 'RUNNING').toUpperCase();

      // Localização do perfil aprofundado com alternativa resiliente de reserva
      const idKey = String(node.id || '').toLowerCase();
      let profile = NODE_EXTENDED_PROFILE[idKey];
      if (!profile) {
        for (const [k, p] of Object.entries(NODE_EXTENDED_PROFILE)) {
          if (idKey.includes(k) || k.includes(idKey)) {
            profile = p;
            break;
          }
        }
      }
      if (!profile) {
        profile = {
          name: cleanTitle,
          current_task: node.activity || node.description || 'Operando normalmente sob supervisão do orquestrador central Lucy.',
          full_desc: 'Nó operacional integrante da topologia neural ativa do Nexus sob supervisão contínua.',
          stack: isAgent ? ['Antigravity CLI', 'Agent Protocol'] : ['Docker Swarm', 'Alpine Linux'],
          layer_title: isAgent ? 'Agente Especialista' : 'Serviço de Infraestrutura',
          cpu: node.cpu || '0.5%', cpu_pct: 10,
          mem: node.mem || node.memory || '24.0 MB', mem_pct: 20,
          port: 'Overlay Swarm', rps: '30 req/s',
          image: node.image || (isAgent ? 'Antigravity CLI Agent' : 'Docker Swarm AWS')
        };
      }

      const nodeColor = (window.NexusTopology && window.NexusTopology.NODE_COLORS && window.NexusTopology.NODE_COLORS[node.id]) || node.color || '#38bdf8';

      // Mapeamento de Ícone específico por nó / especialidade
      const iconMap = {
        'lucy': 'brain',
        'nexus-core': 'brain',
        'backend': 'code',
        'frontend': 'layout',
        'sysops': 'terminal',
        'secops': 'shield-check',
        'qa': 'flask-conical',
        'suporte': 'headphones',
        'bi': 'bar-chart-3',
        'finops': 'dollar-sign',
        'frellas': 'briefcase',
        'egm-codebase': 'file-search',
        'egm-bootstrap': 'folder-tree',
        'egm-synthesizer': 'sparkles',
        'egm-zoom-out': 'zoom-out',
        'egm-review': 'check-circle-2',
        'redis': 'database',
        'postgres': 'database',
        'traefik': 'network',
        'portainer': 'container',
        'n8n': 'workflow',
        'evolution-go': 'message-square'
      };

      const nodeIdLower = String(node.id || '').toLowerCase();
      let iconName = 'activity';
      for (const [key, ic] of Object.entries(iconMap)) {
        if (nodeIdLower.includes(key)) {
          iconName = ic;
          break;
        }
      }

      // Atualização dos elementos com abas no Quadro Integrado
      const panel = document.getElementById('graph-node-panel');
      if (panel) {
        const pTitle = document.getElementById('gnp-title');
        const pId = document.getElementById('gnp-id');
        const pStatus = document.getElementById('gnp-status');
        const pActivity = document.getElementById('gnp-activity');
        const pLayerBadge = document.getElementById('gnp-layer-badge');
        const pDetailedDesc = document.getElementById('gnp-detailed-desc');
        const pStackTags = document.getElementById('gnp-stack-tags');
        const pCpu = document.getElementById('gnp-cpu');
        const pCpuBar = document.getElementById('gnp-cpu-bar');
        const pMem = document.getElementById('gnp-mem');
        const pMemBar = document.getElementById('gnp-mem-bar');
        const pImage = document.getElementById('gnp-image');
        const pPort = document.getElementById('gnp-port');
        const pRps = document.getElementById('gnp-rps');
        const pConns = document.getElementById('gnp-conns');
        const pIconBox = document.getElementById('gnp-icon-box');

        if (pIconBox) {
          pIconBox.innerHTML = `<i data-lucide="${iconName}" class="w-4 h-4"></i>`;
          pIconBox.style.color = nodeColor;
          pIconBox.style.borderColor = nodeColor + '80';
          pIconBox.style.backgroundColor = nodeColor + '20';
        }
        if (pTitle) {
          pTitle.innerHTML = `<span class="inline-flex items-center gap-1.5"><i data-lucide="${iconName}" class="w-3.5 h-3.5 text-cyan-400 shrink-0"></i> <span>${cleanTitle}</span></span>`;
        }
        if (pId) {
          pId.innerText = uriStr;
          pId.style.color = nodeColor;
        }
        if (panel) {
          panel.style.borderColor = nodeColor + '60';
          panel.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.75), 0 0 35px -5px ' + nodeColor + '35';
        }
        if (pStatus) {
          pStatus.innerText = statusStr;
          pStatus.className = 'text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ' +
            (node.status === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
             node.status === 'degraded' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
             'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30');
        }

        // ABA 1: O que está trabalhando no momento e detalhes
        if (pLayerBadge) pLayerBadge.innerText = profile.layer_title;
        if (pActivity) pActivity.innerText = profile.current_task;
        if (pDetailedDesc) pDetailedDesc.innerText = profile.full_desc;
        if (pStackTags) {
          pStackTags.innerHTML = (profile.stack || []).map(tag => `
            <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-cyan-300 border border-slate-700/80">
              ${tag}
            </span>
          `).join('');
        }

        // ABA 2: Recursos e Telemetria
        if (pCpu) pCpu.innerText = profile.cpu;
        if (pCpuBar) pCpuBar.style.width = Math.min(100, Math.max(5, profile.cpu_pct || 15)) + '%';
        if (pMem) pMem.innerText = profile.mem;
        if (pMemBar) pMemBar.style.width = Math.min(100, Math.max(5, profile.mem_pct || 20)) + '%';
        if (pImage) {
          pImage.innerText = profile.image;
          pImage.title = profile.image;
        }
        if (pPort) pPort.innerText = profile.port;
        if (pRps) pRps.innerText = profile.rps;

        // ABA 3: Sinapses Conectadas
        if (pConns) {
          const rawConns = (node.neighbors || []).concat(
            Array.isArray(node.connections) ? node.connections : []
          );
          const seen = new Set();
          const cleanNeighbors = [];
          rawConns.forEach(c => {
            const rawId = typeof c === 'object' ? (c.id || c.name || c.label) : c;
            const rawName = typeof c === 'object' ? (c.name || c.label || c.id) : c;
            const cl = String(rawName).replace(/^[^\w\s\(\)\-\&À-ÿ]+/, '').trim();
            if (cl && !seen.has(cl) && cl !== cleanTitle) {
              seen.add(cl);
              cleanNeighbors.push({ id: rawId, name: cl });
            }
          });

          if (cleanNeighbors.length === 0) {
            pConns.innerHTML = '<span class="text-[10px] text-slate-500 font-mono">Nó primário com links orbitais integrados.</span>';
          } else {
            pConns.innerHTML = cleanNeighbors.slice(0, 10).map(nb => {
              const nbColor = (window.NexusTopology && window.NexusTopology.NODE_COLORS && window.NexusTopology.NODE_COLORS[nb.id]) || '#00f5d4';
              return `
                <button onclick="focusNeighborNode('${nb.id}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 hover:border-cyan-500/60 text-[10px] font-mono text-slate-200 hover:text-white transition cursor-pointer shadow-sm group" title="Navegar e pulsar ${nb.name}">
                  <span class="w-2 h-2 rounded-full shrink-0 group-hover:scale-125 transition-transform shadow-sm" style="background-color: ${nbColor}; box-shadow: 0 0 6px ${nbColor};"></span>
                  <span class="truncate">${nb.name}</span>
                </button>
              `;
            }).join('');
            if (cleanNeighbors.length > 10) {
              pConns.innerHTML += `<span class="text-[9px] font-mono text-slate-500 self-center">+${cleanNeighbors.length - 10}</span>`;
            }
          }
        }

        // Abre na aba Atividade por padrão (ou preserva a aba aberta durante navegação por sinapses)
        if (!keepCurrentTab) {
          switchGraphPanelTab('activity');
        }

        // Cancela qualquer timer de fechamento pendente
        if (graphPanelTimer) {
          clearTimeout(graphPanelTimer);
          graphPanelTimer = null;
        }

        const backdrop = document.getElementById('graph-panel-backdrop');
        if (backdrop) backdrop.classList.remove('hidden');

        panel.classList.remove('hidden');
        requestAnimationFrame(() => {
          panel.classList.remove('opacity-0', 'translate-y-full', 'md:translate-x-4');
        });

        // Inicia stream de telemetria diretamente no painel
        startGraphLogStream(node);
      }

      if (window.lucide) lucide.createIcons();
    }
    window.openGraphDrawer = openGraphDrawer;

    window.focusNeighborNode = function(idOrName) {
      if (!idOrName) return;
      const q = String(idOrName).toLowerCase().trim();
      let match = null;

      if (window.NexusGraph && typeof window.NexusGraph.getNodes === 'function') {
        const liveNodes = window.NexusGraph.getNodes();
        match = liveNodes.find(n => n.id.toLowerCase() === q) ||
                liveNodes.find(n => n.name && n.name.toLowerCase() === q) ||
                liveNodes.find(n => n.id.toLowerCase().includes(q)) ||
                liveNodes.find(n => n.name && n.name.toLowerCase().includes(q));
      }
      if (!match) {
        const allNodes = (window.graphData && window.graphData.nodes) || (window.NexusTopology && window.NexusTopology.INITIAL_NODES) || [];
        match = allNodes.find(n => n.id.toLowerCase() === q) ||
                allNodes.find(n => n.name && n.name.toLowerCase() === q) ||
                allNodes.find(n => n.id.toLowerCase().includes(q)) ||
                allNodes.find(n => n.name && n.name.toLowerCase().includes(q));
      }

      if (match) {
        // 1. Enquadra e move a câmera 3D para o nó selecionado
        if (window.NexusGraph && typeof window.NexusGraph.focusNode === 'function') {
          window.NexusGraph.focusNode(match);
        } else if (typeof focusOnNode === 'function') {
          focusOnNode(match);
        }

        // 2. Dispara onda de choque luminosa para destacar o nó na galáxia
        if (window.NexusGraph && typeof window.NexusGraph.pulseNode === 'function') {
          window.NexusGraph.pulseNode(match);
        }

        // 3. Atualiza o painel lateral instantaneamente com a atividade e recursos do nó vizinho (preservando a aba atual)
        if (typeof openGraphDrawer === 'function') {
          openGraphDrawer(match, true);
        }
      }
    };

    function closeGraphDrawer() {
      closeGraphNodePanel();
      if (graphLogInterval) {
        clearInterval(graphLogInterval);
        graphLogInterval = null;
      }
      const drawer = document.getElementById('graph-drawer');
      if (!drawer) return;
      drawer.classList.add('translate-x-full');
      setTimeout(() => {
        drawer.classList.add('hidden');
        selectedGraphNode = null;
      }, 300);
    }
    window.closeGraphDrawer = closeGraphDrawer;

