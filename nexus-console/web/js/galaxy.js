/**
 * 🌌 NEXUS CONSOLE — CENÁRIO CÓSMICO PROCEDURAL (THREE.JS)
 * Braços de Bernoulli, Bojo Central, Gás Ionizado H-II/O-III e Halo de Deep Space.
 */

window.NexusGalaxy = (function() {
  let galaxyGroup = null;
  let deepSpaceHalo = null;

  const GALAXY_PARAMS = {
    starCount: 6500,
    gasCount: 1600,
    arms: 4,
    radius: 1700,
    spin: 3.5,
    power: 1.8,
    coreRadius: 280
  };

  const corePalette = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#fff4e8'),
    new THREE.Color('#ffe2b0'),
    new THREE.Color('#ffd180'),
    new THREE.Color('#ffb347')
  ];

  const armPalette = [
    new THREE.Color('#bbccff'),
    new THREE.Color('#9bb0ff'),
    new THREE.Color('#70d6ff'),
    new THREE.Color('#f0f4ff'),
    new THREE.Color('#00f5d4')
  ];

  const gasPalette = [
    new THREE.Color('#00f5d4'), // Ciano O-III ionizado
    new THREE.Color('#70d6ff'), // Azul suave elétrico
    new THREE.Color('#0077b6'), // Azul oceânico profundo
    new THREE.Color('#023e8a'), // Azul abissal
    new THREE.Color('#3a86ff')  // Azul cobalto cósmico
  ];

  const haloPalette = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#cfe2ff'),
    new THREE.Color('#ffe8cc'),
    new THREE.Color('#99bbff'),
    new THREE.Color('#ffd299')
  ];

  function init(scene) {
    scene.fog = new THREE.FogExp2(0x010206, 0.00012);

    galaxyGroup = new THREE.Group();
    const cosmicGasTex = window.NexusTextures.createCosmicGasTexture();

    // 1. Estrelas do Bojo Central e Braços Espirais
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

    // 2. Nuvens de Gás Cósmico e Poeira Interestelar
    const gasGeo = new THREE.BufferGeometry();
    const gasPositions = new Float32Array(GALAXY_PARAMS.gasCount * 3);
    const gasColors = new Float32Array(GALAXY_PARAMS.gasCount * 3);

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
      size: 130,
      map: cosmicGasTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });
    const galaxyGas = new THREE.Points(gasGeo, gasMat);
    galaxyGroup.add(galaxyGas);

    // 3. Halo Cósmico Esférico de Fundo Infinito (2.800 estrelas)
    const haloGeo = new THREE.BufferGeometry();
    const haloCount = 2800;
    const haloPositions = new Float32Array(haloCount * 3);
    const haloColors = new Float32Array(haloCount * 3);

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
    deepSpaceHalo = new THREE.Points(haloGeo, haloMat);
    scene.add(deepSpaceHalo);

    // Inclinação isométrica e iluminação
    galaxyGroup.rotation.x = 0.42;
    galaxyGroup.rotation.z = 0.18;
    scene.add(galaxyGroup);

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
  }

  function update(isRotating = true) {
    if (!isRotating) return;
    if (galaxyGroup) galaxyGroup.rotation.y += 0.00063;
    if (deepSpaceHalo) deepSpaceHalo.rotation.y += 0.00018;
  }

  return {
    init,
    update
  };
})();
