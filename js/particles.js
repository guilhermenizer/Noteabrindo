/* ======================================================
   particles.js — Sistema de partículas de poeira e
   feixe de luz volumétrico
   ====================================================== */

/**
 * Cria o sistema de partículas e o cone de luz volumétrico.
 *
 * As partículas ficam dentro do cone de luz que vem de
 * trás/acima do notebook.  Reagem ao mouse (desktop) e
 * ao touch (mobile).
 *
 * @param {THREE.Scene}    scene
 * @param {THREE.Camera}   camera
 * @returns {{ update, dispose, setOpacity }}
 */
function createParticles(scene, camera) {

  // ── Cone de luz volumétrico ───────────────────────────
  // Cone semitransparente com gradiente (MeshBasicMaterial)
  const coneHeight = 8.0;
  const coneRadTop = 0.01;  // ponta (origem) — fora da câmera
  const coneRadBot = 2.8;   // base (próxima ao notebook)

  const coneGeo = new THREE.CylinderGeometry(
    coneRadTop, coneRadBot, coneHeight, 32, 1, true
  );
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.04,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const coneMesh = new THREE.Mesh(coneGeo, coneMat);

  // Posiciona a origem do cone bem acima e atrás do notebook
  // (fora do campo de visão da câmera)
  coneMesh.position.set(0.4, 5.5, -4.5);
  // Inclina em direção ao notebook (~35° para a frente)
  coneMesh.rotation.x = THREE.MathUtils.degToRad(35);
  scene.add(coneMesh);

  // ── Partículas de poeira ──────────────────────────────
  const PARTICLE_COUNT = 280;

  // Distribui as partículas dentro do volume do cone
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = [];      // velocidade individual de flutuação
  const basePositions = [];   // posição base (sem influência do mouse)

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const pos = randomInsideCone(
      coneMesh.position,
      coneMesh.rotation,
      coneRadTop, coneRadBot, coneHeight
    );
    positions[i * 3]     = pos.x;
    positions[i * 3 + 1] = pos.y;
    positions[i * 3 + 2] = pos.z;
    basePositions.push(pos.clone());

    // Velocidade aleatória suave de drift
    velocities.push(new THREE.Vector3(
      (Math.random() - 0.5) * 0.002,
      (Math.random() - 0.5) * 0.002 + 0.0005, // leve subida
      (Math.random() - 0.5) * 0.001
    ));
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
  );

  const particleMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.022,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const particleSystem = new THREE.Points(particleGeo, particleMat);
  scene.add(particleSystem);

  // ── Influência do mouse / touch ───────────────────────
  // Vetor normalizado da posição do ponteiro na tela [-1, 1]
  const mouseNDC = new THREE.Vector2(0, 0);
  const mouseInfluence = 0.35; // quanto o mouse afasta as partículas

  function onMouseMove(e) {
    mouseNDC.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouseNDC.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  function onTouchMove(e) {
    if (e.touches.length > 0) {
      const t = e.touches[0];
      mouseNDC.x =  (t.clientX / window.innerWidth)  * 2 - 1;
      mouseNDC.y = -((t.clientY / window.innerHeight) * 2 - 1);
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('touchmove',  onTouchMove, { passive: true });

  // ── Controle de opacidade global ─────────────────────
  let globalOpacity = 1.0;

  // ── Loop de atualização (chamado pelo main.js) ────────
  function update(delta) {
    const pos = particleGeo.attributes.position;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Drift suave
      basePositions[i].add(velocities[i]);

      // Reintroduz partículas que saíram muito do cone
      const bp = basePositions[i];
      const dist = bp.distanceTo(coneMesh.position);
      if (dist > coneRadBot * 1.4 || bp.y > coneMesh.position.y + 0.5) {
        const newPos = randomInsideCone(
          coneMesh.position,
          coneMesh.rotation,
          coneRadTop, coneRadBot, coneHeight
        );
        bp.copy(newPos);
      }

      // Repulsão suave do mouse (projetada no plano XY da cena)
      const mx = mouseNDC.x * mouseInfluence;
      const my = mouseNDC.y * mouseInfluence;

      pos.setXYZ(
        i,
        bp.x + mx * (0.5 - Math.random() * 0.1),
        bp.y + my * (0.5 - Math.random() * 0.1),
        bp.z
      );
    }

    pos.needsUpdate = true;
    particleMat.opacity = 0.55 * globalOpacity;
    coneMat.opacity     = 0.04 * globalOpacity;
  }

  // Permite que animation.js esmaece as partículas na transição final
  function setOpacity(value) {
    globalOpacity = Math.max(0, Math.min(1, value));
  }

  // Limpa recursos ao final da animação
  function dispose() {
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('touchmove',  onTouchMove);
    particleGeo.dispose();
    particleMat.dispose();
    coneGeo.dispose();
    coneMat.dispose();
    scene.remove(particleSystem);
    scene.remove(coneMesh);
  }

  return { update, dispose, setOpacity };
}

// ── Helpers ───────────────────────────────────────────

/**
 * Retorna um Vector3 aleatório dentro do volume do cone,
 * no espaço de mundo, considerando posição e rotação do cone.
 */
function randomInsideCone(conePos, coneRot, rTop, rBot, height) {
  // Amostragem uniforme ao longo da altura
  const t = Math.random(); // 0 = topo (estreito), 1 = base (largo)
  const r = rTop + (rBot - rTop) * t;
  const radius = Math.sqrt(Math.random()) * r;
  const angle  = Math.random() * Math.PI * 2;

  // Coordenadas locais do cone (y = eixo central)
  const localY = (t - 0.5) * height;
  const localX = Math.cos(angle) * radius;
  const localZ = Math.sin(angle) * radius;

  // Aplica a inclinação do cone (rotation.x)
  const sinRX = Math.sin(coneRot.x);
  const cosRX = Math.cos(coneRot.x);
  const worldX = conePos.x + localX;
  const worldY = conePos.y + localY * cosRX - localZ * sinRX;
  const worldZ = conePos.z + localY * sinRX + localZ * cosRX;

  return new THREE.Vector3(worldX, worldY, worldZ);
}
