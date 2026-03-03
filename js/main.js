/* ======================================================
   main.js — Orquestrador da animação
   Inicializa Three.js, cena, câmera, iluminação e
   conecta notebook.js, particles.js e animation.js.
   ====================================================== */

(function () {
  'use strict';

  // ── Elementos DOM ─────────────────────────────────────
  const canvas   = document.getElementById('three-canvas');
  const overlay  = document.getElementById('animation-overlay');
  const iframe   = document.getElementById('site-iframe');
  const skipBtn  = document.getElementById('skip-btn');

  // ── Renderer ──────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
  renderer.outputEncoding    = THREE.sRGBEncoding;

  // ── Cena ──────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);
  // Névoa suave para dar profundidade
  scene.fog = new THREE.Fog(0x000000, 8, 20);

  // ── Câmera ────────────────────────────────────────────
  // Campo de visão adaptado ao tamanho da tela
  const isMobile = window.innerWidth < 768;
  const fov      = isMobile ? 65 : 50;

  const camera = new THREE.PerspectiveCamera(
    fov,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 1.8, 5.5);
  camera.lookAt(0, 0.5, 0);

  // ── Iluminação ────────────────────────────────────────

  // Luz ambiente muito sutil
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.10);
  scene.add(ambientLight);

  // Spotlight principal traseiro/superior (feixe do cone de luz)
  const spotLight = new THREE.SpotLight(0xffffff, 1.8);
  spotLight.position.set(0.4, 7.0, -5.0);
  spotLight.target.position.set(0, 0, 0);
  spotLight.angle    = Math.PI / 7;
  spotLight.penumbra = 0.35;
  spotLight.castShadow = true;
  spotLight.shadow.mapSize.width  = 1024;
  spotLight.shadow.mapSize.height = 1024;
  scene.add(spotLight);
  scene.add(spotLight.target);

  // Luz de preenchimento lateral suave
  const fillLight = new THREE.DirectionalLight(0x334466, 0.4);
  fillLight.position.set(-3, 2, 2);
  scene.add(fillLight);

  // ── Notebook ──────────────────────────────────────────
  const notebook = createNotebook(scene);

  // ── Partículas ────────────────────────────────────────
  const particles = createParticles(scene, camera);

  // ── Timeline da animação ──────────────────────────────
  const anim = createAnimation({
    camera,
    renderer,
    scene,
    notebook,
    particles,
    onComplete: handleAnimationComplete,
  });

  anim.start();

  // ── Skip button ───────────────────────────────────────
  skipBtn.addEventListener('click', () => {
    anim.skip();
  });

  // ── Loop de renderização ──────────────────────────────
  let lastTime = performance.now();
  let rafId    = null;

  function renderLoop() {
    rafId = requestAnimationFrame(renderLoop);

    const now   = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.05); // segundos, máx 50ms
    lastTime = now;

    // Atualiza partículas
    particles.update(delta);

    // Atualiza timeline da animação
    anim.tick(delta);

    renderer.render(scene, camera);
  }

  renderLoop();

  // ── Ao completar a animação ───────────────────────────
  function handleAnimationComplete() {
    // Fade-out rápido do overlay
    overlay.classList.add('fade-out');

    // Fade-in do iframe
    iframe.classList.add('visible');

    // Após a transição CSS, remove o overlay e libera recursos Three.js
    setTimeout(() => {
      overlay.style.display = 'none';
      disposeThreeJS();
    }, 450);
  }

  // ── Limpeza de recursos Three.js ─────────────────────
  function disposeThreeJS() {
    // Para o loop de renderização
    cancelAnimationFrame(rafId);

    // Limpa partículas
    particles.dispose();

    // Limpa todos os objetos da cena
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => m.dispose());
        } else if (obj.material) {
          obj.material.dispose();
        }
      }
    });

    // Limpa o renderer
    renderer.dispose();
    renderer.forceContextLoss();
  }

  // ── Responsividade ────────────────────────────────────
  window.addEventListener('resize', () => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    camera.aspect = w / h;
    // Ajusta fov para mobile
    camera.fov = w < 768 ? 65 : 50;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
  });

})();
