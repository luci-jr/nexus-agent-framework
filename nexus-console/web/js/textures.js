/**
 * 🌌 NEXUS CONSOLE — GERADOR PROCEDURAL DE TEXTURAS THREE.JS
 */

window.NexusTextures = (function() {
  // ✦ Gerador Procedural de Textura Estelar Cósmica Pura (Halo e Raios de Difração baseados na cor do nó)
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

    // 2. Raios de Difração Estelar Telescópicos (Hubble / James Webb)
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

    // Raios finos, nítidos e elegantes
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

  // ✦ Rótulo Estelar Minimalista & Destacado (Texto Puro sem Quadrado / Pill de Fundo)
  // ✦ Rótulo Estelar de Alta Legibilidade (Cápsula Anti-Brilho Ofuscante e Tipografia Cristalina)
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

    // 1. Cápsula Escura de Proteção Anti-Brilho Ofuscante (evita que a luz das estrelas ofusque as letras)
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

  function createShockwaveTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128, cy = 128;

    const grad = ctx.createRadialGradient(cx, cy, 75, cx, cy, 120);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.15)');
    grad.addColorStop(0.82, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.92, 'rgba(112, 214, 255, 0.85)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 120, 0, 2 * Math.PI);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function createActionPotentialTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 32, 512, 32);
    grad.addColorStop(0.0, 'rgba(0, 245, 212, 0.0)');
    grad.addColorStop(0.15, 'rgba(0, 180, 255, 0.15)');
    grad.addColorStop(0.50, 'rgba(0, 230, 255, 0.45)');
    grad.addColorStop(0.82, 'rgba(112, 214, 255, 0.90)');
    grad.addColorStop(0.96, '#ffffff');
    grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(10, 32);
    ctx.lineTo(460, 15);
    ctx.arc(460, 32, 16, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(10, 32);
    ctx.closePath();
    ctx.fill();

    const coreGrad = ctx.createLinearGradient(60, 32, 480, 32);
    coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
    coreGrad.addColorStop(0.40, 'rgba(255, 255, 255, 0.35)');
    coreGrad.addColorStop(0.75, 'rgba(255, 255, 255, 0.85)');
    coreGrad.addColorStop(0.96, '#ffffff');
    coreGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = coreGrad;
    ctx.fillRect(60, 29, 410, 6);

    const glow = ctx.createRadialGradient(460, 32, 0, 460, 32, 32);
    glow.addColorStop(0.0, 'rgba(255, 255, 255, 0.95)');
    glow.addColorStop(0.45, 'rgba(0, 245, 212, 0.7)');
    glow.addColorStop(1.0, 'rgba(0, 245, 212, 0.0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(460, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function createCosmicGasTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const cx = 128, cy = 128;

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 126);
    grad.addColorStop(0.0, 'rgba(0, 245, 212, 0.40)');
    grad.addColorStop(0.22, 'rgba(112, 214, 255, 0.22)');
    grad.addColorStop(0.55, 'rgba(20, 60, 120, 0.10)');
    grad.addColorStop(0.85, 'rgba(5, 15, 35, 0.02)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  return {
    createStarSpriteTexture,
    createTextSprite,
    createShockwaveTexture,
    createActionPotentialTexture,
    createCosmicGasTexture
  };
})();
