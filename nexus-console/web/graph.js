/**
 * 🌌 NEXUS CONSOLE — GRAFO DE FORÇA 3D E SINAPSES BIOELÉTRICAS
 * Renderização dos nós estelares, links neurais bioelétricos, física e eventos 3D.
 */

window.NexusGraph = (function() {
  let Graph = null;
  let nodes = [];
  let links = [];
  let nodeMap = new Map();

  let selectedNode = null;
  let hoveredLink = null;
  const highlightNodes = new Set();
  const highlightLinks = new Set();
  const searchMatches = new Set();
  let isSearchActive = false;
  const activePulseLinks = [];
  let currentCategoryFilter = 'all';

  const SQUAD_IDS = new Set(['backend', 'frontend', 'sysops', 'qa', 'secops', 'bi', 'finops', 'frellas', 'suporte']);
  const EGM_IDS = new Set(['egm-bootstrap', 'egm-codebase', 'egm-synthesizer', 'agent-secretario']);
  const SERVICE_IDS = new Set(['traefik', 'postgres', 'redis', 'evolution', 'n8n', 'nexus-mcp', 'nexus-console', 'portainer']);

  function isNodeInCategory(n, cat) {
    if (!cat || cat === 'all') return true;
    if (!n) return false;
    if (cat === 'core') return n.id === 'lucy-core';
    if (cat === 'squad') return SQUAD_IDS.has(n.id);
    if (cat === 'egm') return EGM_IDS.has(n.id);
    if (cat === 'agent') return n.id === 'lucy-core' || SQUAD_IDS.has(n.id) || EGM_IDS.has(n.id) || n.isAgent === true || n.type === 'agent';
    if (cat === 'service') return SERVICE_IDS.has(n.id) || (!n.isAgent && n.type !== 'agent' && n.id !== 'lucy-core');
    return true;
  }

  // 📐 Coordenadas de Enquadramento Cósmico Perfeito (Lucy Core no Centro 0,0,0 - Idêntico à Imagem Padrão)
  function getCosmicCenterCamera() {
    const isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
    return {
      pos: {
        x: 0,
        y: isMobile ? 65 : 45,
        z: isMobile ? 540 : 440
      },
      lookAt: {
        x: 0,
        y: 0,
        z: 0
      }
    };
  }

  function isLinkInCategory(link, cat) {
    if (!cat || cat === 'all') return true;
    const src = typeof link.source === 'object' ? link.source : (nodeMap && nodeMap.get(link.source));
    const tgt = typeof link.target === 'object' ? link.target : (nodeMap && nodeMap.get(link.target));
    if (!src || !tgt) return false;

    if (cat === 'agent') {
      return isNodeInCategory(src, 'agent') && isNodeInCategory(tgt, 'agent');
    }
    if (cat === 'core') {
      return src.id === 'lucy-core' || tgt.id === 'lucy-core';
    }
    if (cat === 'squad') {
      const srcSquad = isNodeInCategory(src, 'squad');
      const tgtSquad = isNodeInCategory(tgt, 'squad');
      return (srcSquad && tgtSquad) || (srcSquad && tgt.id === 'lucy-core') || (tgtSquad && src.id === 'lucy-core');
    }
    if (cat === 'egm') {
      const srcEgm = isNodeInCategory(src, 'egm');
      const tgtEgm = isNodeInCategory(tgt, 'egm');
      return (srcEgm && tgtEgm) || (srcEgm && tgt.id === 'lucy-core') || (tgtEgm && src.id === 'lucy-core');
    }
    if (cat === 'service') {
      const srcServ = isNodeInCategory(src, 'service');
      const tgtServ = isNodeInCategory(tgt, 'service');
      return (srcServ && tgtServ) || (srcServ && tgt.id === 'lucy-core') || (tgtServ && src.id === 'lucy-core');
    }
    return false;
  }

  let starTextures = {};
  let shockwaveTexture = null;

  async function init(containerEl) {
    shockwaveTexture = window.NexusTextures.createShockwaveTexture();
    starTextures = {
      running: window.NexusTextures.createStarSpriteTexture('#00f5d4'),
      degraded: window.NexusTextures.createStarSpriteTexture('#ffb703'),
      error: window.NexusTextures.createStarSpriteTexture('#f72585')
    };

    // Tenta sincronizar nós ao vivo com o backend Go
    try {
      const res = await fetch('/api/graph');
      if (res.ok) {
        const data = await res.json();
        if (data && data.nodes && data.nodes.length > 0) {
          nodes = data.nodes.map(n => ({
            id: n.id,
            name: n.label || n.id,
            status: n.status || 'running',
            image: n.image || '-',
            cpu: n.cpu || '0.5%',
            mem: n.memory || '24.0 MB',
            val: n.size || 16,
            color: (window.NexusTopology && window.NexusTopology.NODE_COLORS && window.NexusTopology.NODE_COLORS[n.id]) || n.color || '#00f5d4',
            isAgent: n.type === 'agent' || n.group === 'core' || n.group === 'squad' || n.group === 'egm',
            activity: n.current_activity || n.summary || '',
            description: n.description || ''
          }));
          links = (data.edges || []).map(e => ({
            source: e.source,
            target: e.target,
            name: e.label || 'Sinapse',
            rps: 35
          }));
        }
      }
    } catch (e) {
      // Modo isolado autônomo: alternativa resiliente de reserva silenciosa
    }

    // Clona os nós e conexões iniciais como alternativa resiliente de reserva
    if (!nodes || nodes.length === 0) {
      nodes = window.NexusTopology.INITIAL_NODES.map(n => ({ ...n }));
      links = window.NexusTopology.INITIAL_LINKS.map(l => ({ ...l }));
    }

    // Posicionamento geodésico orbital com Lucy Core no centro absoluto (0, 0, 0)
    nodes.forEach((n, idx) => {
      if (n.id === 'lucy-core') {
        n.x = 0; n.y = 0; n.z = 0;
        n.fx = 0; n.fy = 0; n.fz = 0;
        n.homeX = 0; n.homeY = 0; n.homeZ = 0;
        n.val = 22;
        n.name = '🧠 Lucy Core (Ecossistema Nexus)';
        n.city = 'Núcleo Cósmico Central (Lucy Core / Ecossistema Nexus)';
        return;
      }
      const geo = window.NexusTopology.GEO_LOCATIONS[n.id] || {
        lat: ((idx % 4) * 30) - 45,
        lng: (idx * (360 / Math.max(1, nodes.length))) - 180,
        city: 'Orbital Node'
      };
      const pos = window.NexusTopology.latLngToVector3(geo.lat, geo.lng, window.NexusTopology.NODE_ORBIT_RADIUS);
      n.x = pos.x; n.y = pos.y; n.z = pos.z;
      n.fx = pos.x; n.fy = pos.y; n.fz = pos.z;
      n.homeX = pos.x; n.homeY = pos.y; n.homeZ = pos.z;
      n.city = geo.city;
    });

    nodeMap = new Map(nodes.map(n => [n.id, n]));
    rebuildNeighbors();

    const linkTooltip = document.getElementById('link-tooltip');

    const initialW = containerEl.clientWidth || 960;
    const initialH = containerEl.clientHeight || 640;

    Graph = ForceGraph3D()(containerEl)
      .width(initialW)
      .height(initialH)
      .backgroundColor('#010206')
      .graphData({ nodes, links })
      .nodeId('id')
      .nodeVal('val')
      .nodeLabel(node => `✨ ${node.name} (${node.status})`)
      .nodeThreeObject(node => {
        const group = new THREE.Group();
        const statusColorHex = (window.NexusTopology && window.NexusTopology.NODE_COLORS && window.NexusTopology.NODE_COLORS[node.id]) || node.color || window.NexusTheme.STATUS_COLORS[node.status] || '#70d6ff';
        const texture = starTextures[statusColorHex] || (starTextures[statusColorHex] = window.NexusTextures.createStarSpriteTexture(statusColorHex));
        const baseSize = Math.sqrt(node.val || 14) * 7.5;

        // Esfera 3D Solar Emissiva (Núcleo Fotorrealista com Cor Preservada)
        const coreGeo = new THREE.SphereGeometry(baseSize * 0.16, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(statusColorHex),
          toneMapped: true
        });
        const coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(coreMesh);

        // Estrela Central (Halo Incandescente)
        const starMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const starSprite = new THREE.Sprite(starMat);
        starSprite.scale.set(baseSize, baseSize, 1);
        group.add(starSprite);

        // Coroa de Plasma
        const coronaMat = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const coronaSprite = new THREE.Sprite(coronaMat);
        coronaSprite.scale.set(baseSize * 1.5, baseSize * 1.5, 1);
        group.add(coronaSprite);

        // Onda de Choque de Spawn (Shockwave)
        const shockwaveMat = new THREE.SpriteMaterial({
          map: shockwaveTexture,
          color: new THREE.Color(statusColorHex),
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const shockwaveSprite = new THREE.Sprite(shockwaveMat);
        shockwaveSprite.scale.set(0.001, 0.001, 1);
        group.add(shockwaveSprite);

        // Etiqueta Holográfica de Alto Contraste (Otimizada para Celular & Mobile)
        const isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
        const labelScaleW = isMobile ? 44 : 32;
        const labelScaleH = labelScaleW * (96 / 512);

        const textSprite = window.NexusTextures.createTextSprite(
          node.name || '',
          statusColorHex,
          36,
          true
        );
        textSprite.scale.set(labelScaleW, labelScaleH, 1);
        textSprite.position.y = (baseSize / 2) + (isMobile ? 15.0 : 12.0);
        group.add(textSprite);

        const isNewlySpawned = node.isNew || false;
        group.userData = {
          node, coreMesh, starSprite, coronaSprite, shockwaveSprite, textSprite, starMat, coronaMat, shockwaveMat, baseSize,
          labelScaleW, labelScaleH,
          birthStartTime: isNewlySpawned ? performance.now() : 0,
          birthDuration: 2200,
          isBirthing: isNewlySpawned
        };

        if (isNewlySpawned) {
          coreMesh.scale.set(0.001, 0.001, 0.001);
          starSprite.scale.set(0.001, 0.001, 1);
          coronaSprite.scale.set(0.001, 0.001, 1);
          textSprite.scale.set(0.001, 0.001, 1);
        }
        return group;
      })
      .linkColor(link => {
        if (hoveredLink && link === hoveredLink) return 'rgba(0, 245, 212, 0.95)';
        if (selectedNode) {
          if (highlightLinks.has(link)) return 'rgba(255, 209, 102, 0.90)';
          return 'rgba(112, 214, 255, 0.05)';
        }
        if (currentCategoryFilter && currentCategoryFilter !== 'all') {
          if (highlightLinks.has(link)) return 'rgba(0, 245, 212, 0.92)'; // Ciano cósmico vivo e hiper acentuado
          return 'rgba(112, 214, 255, 0.04)'; // Atenuado fora da categoria
        }
        return 'rgba(112, 214, 255, 0.14)'; // Leve rastro cósmico translúcido contínuo
      })
      .linkWidth(link => {
        if (hoveredLink && link === hoveredLink) return 2.0;
        if (selectedNode) {
          if (highlightLinks.has(link)) return 1.8;
          return 0.3;
        }
        if (currentCategoryFilter && currentCategoryFilter !== 'all') {
          if (highlightLinks.has(link)) return 2.4; // Linha de conexão bem acentuada e destacada
          return 0.25;
        }
        return 0.5; // Espessura fina e discreta de rastro
      })
      .linkThreeObjectExtend(true)
      .linkThreeObject(link => {
        const group = new THREE.Group();
        const pulses = [];

        for (let i = 0; i < 3; i++) {
          const pulse = new THREE.Group();
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: '#00eaff',
            transparent: true,
            opacity: 0.40,
            blending: THREE.AdditiveBlending,
            depthWrite: false
          });
          const coreMaterial = new THREE.MeshBasicMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 0.90,
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
              new THREE.CylinderGeometry(0.11, 0.11, direction.length(), 5),
              glowMaterial
            );
            const core = new THREE.Mesh(
              new THREE.CylinderGeometry(0.032, 0.032, direction.length(), 5),
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

          const glowSpark = new THREE.Mesh(new THREE.SphereGeometry(0.30, 8, 8), glowMaterial);
          const coreSpark = new THREE.Mesh(new THREE.SphereGeometry(0.10, 8, 8), coreMaterial);
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
        // ✦ Velocidade lenta e cadenciada para contemplar o tráfego bioelétrico
        const speed = 0.00028 + Math.min((group.userData.linkRps || 10) * 0.000005, 0.00040);
        const time = performance.now();

        group.userData.pulses.forEach((pulse, index) => {
          const progress = (time * speed + group.userData.phase + index * 0.5) % 1;
          const crackle = Math.abs(Math.sin(time * 0.065 + pulse.userData.flicker))
            * Math.abs(Math.sin(time * 0.023 + pulse.userData.flicker * 2.1));
          const flicker = 0.42 + crackle * 0.58;
          pulse.position.set((progress - 0.5) * Math.max(0, length - 16), 0, 0);

          if (isHovered) {
            pulse.userData.glowMaterial.color.set('#ffd166');
            pulse.userData.glowMaterial.opacity = 0.85;
            pulse.userData.coreMaterial.opacity = 1.0;
          } else {
            pulse.userData.glowMaterial.color.set('#00eaff');
            pulse.userData.glowMaterial.opacity = 0.45 + flicker * 0.35;
            pulse.userData.coreMaterial.opacity = 0.70 + flicker * 0.25;
          }
          const pulseScale = isHovered ? 1.35 : 1.0;
          pulse.scale.set(pulseScale, pulseScale, pulseScale);
        });
        return true;
      })
      .linkDirectionalParticles(link => {
        if (hoveredLink && link === hoveredLink) return 5;
        if (selectedNode) {
          return highlightLinks.has(link) ? 4 : 1;
        }
        if (currentCategoryFilter && currentCategoryFilter !== 'all') {
          return highlightLinks.has(link) ? 4 : 1;
        }
        return 2; // ✦ Fluxo contínuo de dados: 2 partículas ativas fluindo por sinapse
      })
      .linkDirectionalParticleWidth(link => {
        return (highlightLinks.has(link) || link === hoveredLink) ? 2.6 : 1.8;
      })
      .linkDirectionalParticleSpeed(link => {
        const rps = link.rps || 25;
        return (highlightLinks.has(link) || link === hoveredLink) ? 0.009 : (0.004 + rps * 0.00004);
      })
      .linkDirectionalParticleColor(link => {
        if (selectedNode && highlightLinks.has(link)) return '#ffd166';
        if (hoveredLink && link === hoveredLink) return '#ffd166';
        return '#00f5d4';
      })
      .onLinkHover(link => {
        hoveredLink = link || null;
        if (hoveredLink && linkTooltip) {
          const source = typeof link.source === 'object' ? link.source : nodeMap.get(link.source);
          const target = typeof link.target === 'object' ? link.target : nodeMap.get(link.target);
          linkTooltip.textContent = `${source ? source.name : link.source}  →  ${target ? target.name : link.target}  |  ${link.name || 'Fluxo de dados'}  |  ${link.rps || 0} req/s`;
          linkTooltip.style.display = 'block';
        } else if (linkTooltip) {
          linkTooltip.style.display = 'none';
        }
        updateVisuals();
      })
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
          fromX: node.x, fromY: node.y, fromZ: node.z,
          targetX, targetY, targetZ,
          started: performance.now(), duration: 700
        };
      })
      .onNodeClick(node => {
        focusNode(node);
      })
      .onBackgroundClick(() => {
        if (window.NexusUI) window.NexusUI.closeDrawer();
      });

    Graph.d3Force('charge').strength(-220);
    Graph.d3Force('link').distance(95);

    Graph.cooldownTicks(90);
    Graph.onEngineStop(() => {
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

    // ========================================================
    // 🌌 PÓS-PROCESSAMENTO HDR: BRILHO INTENSO (BLOOM) E MAPEAMENTO DE TONS FÍSICO
    // ========================================================
    try {
      const renderer = Graph.renderer();
      if (renderer) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        renderer.outputEncoding = THREE.sRGBEncoding;
      }

      const composer = Graph.postProcessingComposer();
      if (composer && window.THREE && typeof window.THREE.UnrealBloomPass === 'function') {
        const bloomPass = new THREE.UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          0.90, // Intensidade de incandescência focada nas ondas e partículas
          0.32, // Dispersão controlada para nitidez
          0.45  // Limiar equilibrado que preserva cores das estrelas
        );
        composer.addPass(bloomPass);
      }
    } catch (err) {
      console.warn('[Nexus Console]: Pós-processamento HDR operando em fallback.', err);
    }

    // Inicializa o cenário galáctico na cena Three.js
    window.NexusGalaxy.init(Graph.scene());

    // Controles Orbitais com amortecimento e retomada suave de rotação
    let isUserInteracting = false;
    let resumeTimer = null;
    const controls = Graph.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.85;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.addEventListener('start', () => {
        isUserInteracting = true;
        if (resumeTimer) clearTimeout(resumeTimer);
      });
      controls.addEventListener('end', () => {
        resumeTimer = setTimeout(() => {
          isUserInteracting = false;
        }, 800);
      });
    }

    // Observador de Redimensionamento Confinado ao Contêiner do Grafo
    if (window.ResizeObserver && containerEl) {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          if (cr.width > 0 && cr.height > 0 && Graph) {
            Graph.width(cr.width);
            Graph.height(cr.height);
          }
        }
      });
      ro.observe(containerEl);
    }

    // Câmera Inicial Galáctica Perfeita (Enquadramento Cósmico Perfeito 0,0,0)
    const centerCam = getCosmicCenterCamera();
    Graph.cameraPosition(centerCam.pos, centerCam.lookAt);

    // Loop de Animação e Efeitos (Idêntico ao index-teste.html)
    (function renderLoop() {
      const now = performance.now();
      window.NexusGalaxy.update(autoRotationActive && !isUserInteracting);

      // Rotação orbital automática suave e contínua da câmera em torno do centro do grafo
      if (controls) {
        if (autoRotationActive && !isUserInteracting && !selectedNode) {
          controls.autoRotate = true;
          controls.update();
        } else {
          controls.autoRotate = false;
        }
      }

      nodes.forEach(node => {
        const motion = node.returnMotion;
        if (motion) {
          const progress = Math.min(1, (now - motion.started) / motion.duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          node.fx = motion.fromX + (motion.targetX - motion.fromX) * eased;
          node.fy = motion.fromY + (motion.targetY - motion.fromY) * eased;
          node.fz = motion.fromZ + (motion.targetZ - motion.fromZ) * eased;
          node.x = node.fx; node.y = node.fy; node.z = node.fz;
          if (progress >= 1) {
            node.homeX = motion.targetX;
            node.homeY = motion.targetY;
            node.homeZ = motion.targetZ;
            delete node.returnMotion;
          }
        }

        const obj = node.__threeObj;
        if (!obj || !obj.userData) return;
        const { coreMesh, starSprite, coronaSprite, textSprite, starMat, coronaMat, baseSize } = obj.userData;

        let birthScaleFactor = 1.0;
        let birthFlashOpacity = 0.0;

        if (coreMesh) {
          coreMesh.rotation.y += 0.018;
          coreMesh.rotation.x += 0.009;
        }

        if (obj.userData.isBirthing) {
          const birthElapsed = now - obj.userData.birthStartTime;
          const bProgress = Math.min(1.0, birthElapsed / obj.userData.birthDuration);
          if (bProgress < 1.0) {
            if (bProgress < 0.25) {
              const p = bProgress / 0.25;
              birthScaleFactor = Math.pow(p, 3) * 0.6;
              birthFlashOpacity = p * 1.5;
            } else if (bProgress < 0.55) {
              const p = (bProgress - 0.25) / 0.3;
              birthScaleFactor = 0.6 + Math.sin(p * Math.PI * 0.5) * 1.2;
              birthFlashOpacity = 1.0 - (p * 0.4);
            } else {
              const p = (bProgress - 0.55) / 0.45;
              birthScaleFactor = 1.0 + (0.8 * (1 - p));
              birthFlashOpacity = (1 - p) * 0.6;
            }

            if (bProgress >= 0.25 && bProgress < 0.95) {
              const waveProgress = (bProgress - 0.25) / 0.70;
              const waveScale = baseSize * (0.8 + Math.pow(waveProgress, 0.6) * 4.8);
              obj.userData.shockwaveSprite.scale.set(waveScale, waveScale, 1);
              const waveOpacity = Math.sin(waveProgress * Math.PI) * Math.pow(1 - waveProgress, 0.8);
              obj.userData.shockwaveMat.opacity = Math.max(0.0, waveOpacity * 0.95);
            } else {
              obj.userData.shockwaveMat.opacity = 0.0;
              obj.userData.shockwaveSprite.scale.set(0.001, 0.001, 1);
            }
            const textScaleP = Math.max(0.001, (bProgress - 0.4) / 0.6);
            const targetW = obj.userData.labelScaleW || 30;
            const targetH = obj.userData.labelScaleH || 6.6;
            textSprite.scale.set(targetW * textScaleP, targetH * textScaleP, 1);
          } else {
            obj.userData.isBirthing = false;
            obj.userData.shockwaveMat.opacity = 0.0;
            obj.userData.shockwaveSprite.scale.set(0.001, 0.001, 1);
            const targetW = obj.userData.labelScaleW || 30;
            const targetH = obj.userData.labelScaleH || 6.6;
            textSprite.scale.set(targetW, targetH, 1);
          }
        }

        if (coreMesh) {
          coreMesh.scale.set(birthScaleFactor, birthScaleFactor, birthScaleFactor);
        }

        const finalScale = baseSize * birthScaleFactor;
        starSprite.scale.set(finalScale, finalScale, 1);
        const coronaScale = baseSize * 1.35 * birthScaleFactor;
        coronaSprite.scale.set(coronaScale, coronaScale, 1);

        const isFocused = selectedNode !== null;
        const isCategoryActive = currentCategoryFilter && currentCategoryFilter !== 'all';
        const isHighlighted = highlightNodes.has(node);
        const isSearchHit = !isSearchActive || searchMatches.has(node);

        let alphaBase = 1.0;
        if (isFocused) {
          alphaBase = isHighlighted ? 1.0 : 0.08;
        } else if (isCategoryActive) {
          alphaBase = isHighlighted ? 1.0 : 0.15;
        }
        if (!isSearchHit) {
          alphaBase = 0.06;
        }

        starMat.opacity = Math.min(1.0, alphaBase + birthFlashOpacity);
        coronaMat.opacity = Math.min(1.0, (0.34 + birthFlashOpacity) * alphaBase);

        if (textSprite && textSprite.material) {
          textSprite.material.opacity = (isFocused && !isHighlighted) || (isCategoryActive && !isHighlighted) ? 0.25 : 1.0;
        }

        // ✦ Dinâmica Estelar: Rotação suave da corona de plasma
        starMat.rotation += 0.0018;
        coronaMat.rotation -= 0.0014;
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
        const speed = 0.00085 + Math.min((group.userData.linkRps || 10) * 0.000025, 0.00075);

        group.userData.pulses.forEach((pulse, index) => {
          const progress = (now * speed + group.userData.phase + (index / 3)) % 1;
          const crackle = Math.abs(Math.sin(now * 0.065 + pulse.userData.flicker))
            * Math.abs(Math.sin(now * 0.023 + pulse.userData.flicker * 2.1));
          const flicker = 0.42 + crackle * 0.58;
          pulse.position.set((progress - 0.5) * Math.max(0, length - 16), 0, 0);
          pulse.rotation.x = now * 0.004 + index;

          if (isHovered) {
            pulse.userData.glowMaterial.color.set('#ffd166');
            pulse.userData.glowMaterial.opacity = 0.95;
            pulse.userData.coreMaterial.opacity = 1.0;
          } else {
            pulse.userData.glowMaterial.color.set('#00eaff');
            pulse.userData.glowMaterial.opacity = 0.65 + flicker * 0.35;
            pulse.userData.coreMaterial.opacity = 0.88 + flicker * 0.12;
          }
          const pulseScale = isHovered ? 1.35 : 1.0;
          pulse.scale.set(pulseScale, pulseScale, pulseScale);
        });
      });

      requestAnimationFrame(renderLoop);
    })();
  }

  function rebuildNeighbors() {
    nodes.forEach(n => { n.neighbors = []; n.connectedLinks = []; });
    links.forEach(l => {
      const src = nodeMap.get(typeof l.source === 'object' ? l.source.id : l.source);
      const tgt = nodeMap.get(typeof l.target === 'object' ? l.target.id : l.target);
      if (src && tgt) {
        src.neighbors.push(tgt);
        tgt.neighbors.push(src);
        src.connectedLinks.push(l);
        tgt.connectedLinks.push(l);
      }
    });
  }

  function updateVisuals() {
    if (!Graph) return;
    Graph.linkColor(Graph.linkColor())
      .linkWidth(Graph.linkWidth())
      .linkDirectionalParticles(Graph.linkDirectionalParticles());
  }

  function focusNode(node) {
    if (!node) return;
    const targetNode = (node.id && nodeMap.has(node.id)) ? nodeMap.get(node.id) : node;
    selectedNode = targetNode;
    currentCategoryFilter = 'all';
    highlightNodes.clear();
    highlightLinks.clear();
    highlightNodes.add(targetNode);
    if (Array.isArray(targetNode.neighbors)) targetNode.neighbors.forEach(n => highlightNodes.add(n));
    if (Array.isArray(targetNode.connectedLinks)) targetNode.connectedLinks.forEach(l => highlightLinks.add(l));

    // 🌟 Dispara a pulsada suave com onda de choque destacando o escolhido
    pulseNode(targetNode);

    try {
      if (typeof window.openGraphDrawer === 'function') window.openGraphDrawer(targetNode, true);
      if (window.NexusUI && typeof window.NexusUI.openDrawer === 'function') window.NexusUI.openDrawer(targetNode);
    } catch (e) {
      console.warn('[Nexus Graph] Erro ao abrir drawer do nó:', e);
    }
    updateVisuals();

    if (!Graph) return;

    // 📐 Enquadramento Responsivo Inteligente:
    // 📱 Mobile: O painel abre como Bottom Sheet na base (56% inferiores). O alvo mira abaixo do nó (-Y), projetando-o no terço superior livre!
    // 💻 Desktop: O painel abre na lateral direita. O alvo mira à direita do nó (+X), projetando-o no terço esquerdo livre!
    const isMobile = (window.innerWidth <= 768) || ('ontouchstart' in window);
    const nx = Number.isFinite(targetNode.x) ? targetNode.x : 0;
    const ny = Number.isFinite(targetNode.y) ? targetNode.y : 0;
    const nz = Number.isFinite(targetNode.z) ? targetNode.z : 0;

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

    Graph.cameraPosition(
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

  function setCategoryFilter(group) {
    currentCategoryFilter = group || 'all';
    selectedNode = null;
    highlightNodes.clear();
    highlightLinks.clear();

    if (currentCategoryFilter === 'all') {
      updateVisuals();
      if (Graph) {
        const centerCam = getCosmicCenterCamera();
        Graph.cameraPosition(centerCam.pos, centerCam.lookAt, 1000);
      }
      return;
    }

    nodes.forEach(n => {
      if (isNodeInCategory(n, currentCategoryFilter)) {
        highlightNodes.add(n);
        pulseNode(n);
      }
    });

    links.forEach(l => {
      if (isLinkInCategory(l, currentCategoryFilter)) {
        highlightLinks.add(l);
      }
    });

    updateVisuals();

    if (Graph) {
      const centerCam = getCosmicCenterCamera();
      Graph.cameraPosition(centerCam.pos, centerCam.lookAt, 1100);
    }
  }

  let isClearingFocus = false;
  function clearFocus() {
    if (isClearingFocus) return;
    isClearingFocus = true;
    try {
      selectedNode = null;
      highlightNodes.clear();
      highlightLinks.clear();
      searchMatches.clear();
      isSearchActive = false;

      if (typeof window.closeGraphDrawer === 'function') {
        window.closeGraphDrawer();
      } else {
        const drawer = document.getElementById('graph-drawer');
        if (drawer) {
          drawer.classList.add('translate-x-full');
          setTimeout(() => drawer.classList.add('hidden'), 250);
        }
      }

      if (typeof window.closeGraphNodePanel === 'function') {
        window.closeGraphNodePanel(false);
      } else {
        const panel = document.getElementById('graph-node-panel');
        if (panel) {
          panel.classList.add('opacity-0', 'translate-x-4');
          setTimeout(() => panel.classList.add('hidden'), 250);
        }
      }

      if (window.NexusUI && typeof window.NexusUI.closeDrawer === 'function') {
        window.NexusUI.closeDrawer();
      }

      const searchInput = document.getElementById('graph-search') || document.getElementById('search-input');
      if (searchInput && searchInput.value) {
        searchInput.value = '';
      }

      updateVisuals();

      if (Graph) {
        const centerCam = getCosmicCenterCamera();
        Graph.cameraPosition(centerCam.pos, centerCam.lookAt, 1000);
      }
    } finally {
      isClearingFocus = false;
    }
  }

  function highlightSearch(query) {
    const q = (query || '').trim().toLowerCase();
    searchMatches.clear();
    if (!q) {
      isSearchActive = false;
      updateVisuals();
      return;
    }
    isSearchActive = true;
    nodes.forEach(n => {
      const matchName = n.name && n.name.toLowerCase().includes(q);
      const matchId = n.id && n.id.toLowerCase().includes(q);
      if (matchName || matchId) {
        searchMatches.add(n);
      }
    });
    updateVisuals();
  }

  function pulseNode(node) {
    if (!node) return;
    const target = (node.id && nodeMap.has(node.id)) ? nodeMap.get(node.id) : node;
    nodes.forEach(n => {
      const group = n.__threeObj;
      if (group && group.userData && n.id === target.id) {
        group.userData.birthStartTime = performance.now();
        group.userData.birthDuration = 1800;
        group.userData.isBirthing = true;
        if (group.userData.shockwaveSprite) {
          group.userData.shockwaveSprite.scale.set(group.userData.baseSize * 2.2, group.userData.baseSize * 2.2, 1);
        }
      }
    });
  }

  let autoRotationActive = true;
  function togglePhysics() {
    autoRotationActive = !autoRotationActive;
    const controls = Graph ? Graph.controls() : null;
    if (controls) {
      controls.autoRotate = autoRotationActive;
      if (!autoRotationActive) controls.update();
    }
    return autoRotationActive;
  }

  function spawnStellarNode(customData) {
    if (!customData || !customData.id) return;
    const existing = nodes.find(n => n.id === customData.id || n.name === customData.name);
    if (existing) return;

    const randomSource = nodes[Math.floor(Math.random() * nodes.length)] || nodes[0];
    const newNode = {
      id: customData.id,
      name: customData.name,
      status: customData.status || 'running',
      image: customData.image || 'docker.nexus.io/service:latest',
      cpu: '0.0%', mem: '0.0 MB', val: 10,
      neighbors: [], connectedLinks: [],
      isNew: true
    };

    const newLink = {
      source: randomSource.id,
      target: newNode.id,
      name: customData.protocol || 'Docker Stream',
      rps: customData.rps || 25
    };

    nodes.push(newNode);
    nodeMap.set(newNode.id, newNode);
    links.push(newLink);
    rebuildNeighbors();
    Graph.graphData({ nodes, links });

    setTimeout(() => {
      if (!selectedNode) {
        Graph.cameraPosition(
          { x: newNode.x + 60, y: newNode.y + 30, z: newNode.z + 80 },
          newNode,
          1400
        );
      }
    }, 150);
  }

  return {
    init,
    getInstance: () => Graph,
    getNodes: () => nodes,
    getLinks: () => links,
    getSelectedNode: () => selectedNode,
    focusNode,
    clearFocus,
    centerView: () => clearFocus(),
    getCosmicCenterCamera,
    setCategoryFilter,
    highlightSearch,
    pulseNode,
    togglePhysics,
    isRotating: () => autoRotationActive,
    spawnStellarNode,
    resize: (w, h) => { if (Graph) { Graph.width(w); Graph.height(h); } }
  };
})();
