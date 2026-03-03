/* ======================================================
   animation.js — Timeline da animação e transição para
   o iframe
   ====================================================== */

/**
 * Cria e gerencia a timeline da animação de introdução.
 *
 * Fases (~3 s no total):
 *   0.0 → 0.5s  — Fade-in do notebook (tampa fechada)
 *   0.5 → 1.5s  — Tampa abre (0° → 110°)
 *   1.5 → 2.0s  — Pausa com notebook aberto
 *   2.0 → 3.0s  — Zoom da câmera em direção à tela + fade-out
 *   3.0s+        — Transição para o iframe; libera recursos Three.js
 *
 * @param {object} params
 * @param {THREE.Camera}    params.camera
 * @param {THREE.WebGLRenderer} params.renderer
 * @param {THREE.Scene}     params.scene
 * @param {object}          params.notebook   — retorno de createNotebook()
 * @param {object}          params.particles  — retorno de createParticles()
 * @param {Function}        params.onComplete — chamado ao terminar
 * @returns {{ start, skip }}
 */
function createAnimation({ camera, renderer, scene, notebook, particles, onComplete }) {

  const { group, lidGroup, screenMesh, screenLight, keyboardMesh } = notebook;

  // Posição inicial da câmera (vista 3/4)
  const CAM_START = new THREE.Vector3(0, 1.8, 5.5);
  // Posição final do zoom (dentro da tela)
  const CAM_END   = new THREE.Vector3(0, 0.9, 1.8);

  // Ângulo da tampa: 0 = fechada, Math.PI * (110/180) = aberta
  const LID_OPEN_ANGLE = -Math.PI * (110 / 180);

  let elapsed = 0;
  let running = false;
  let completed = false;

  // Grupo opacidade para fade-in inicial do notebook
  // (aplica ao grupo root usando material.opacity nos meshes)
  let notebookOpacity = 0;

  // ── Helpers de easing ────────────────────────────────

  /** Interpola suavemente entre a e b com t ∈ [0,1]. */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /** Suavização cúbica (ease-in-out). */
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  /** Ease-in quadrática. */
  function easeInQuad(t) { return t * t; }

  /** Normaliza elapsed para [0,1] dentro de [start, end]. */
  function progress(start, end) {
    return Math.min(1, Math.max(0, (elapsed - start) / (end - start)));
  }

  // ── Aplica opacidade a todos os meshes do notebook ───
  function setNotebookOpacity(value) {
    notebookOpacity = value;
    group.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        obj.material.transparent = true;
        obj.material.opacity = value;
      }
    });
  }

  // ── Atualização frame a frame ─────────────────────────
  function tick(delta) {
    if (!running || completed) return;

    elapsed += delta;

    // ── Fase 1: Fade-in (0 → 0.5s) ──────────────────
    if (elapsed < 0.5) {
      const t = smoothstep(progress(0, 0.5));
      setNotebookOpacity(t);
    }

    // ── Fase 2: Tampa abre (0.5 → 1.5s) ─────────────
    if (elapsed >= 0.5 && elapsed < 1.5) {
      const t = smoothstep(progress(0.5, 1.5));
      lidGroup.rotation.x = lerp(0, LID_OPEN_ANGLE, t);

      // Luz da tela acende conforme a tampa abre
      screenLight.intensity    = lerp(0, 1.2, t);
      screenMesh.material.emissiveIntensity = lerp(0, 0.6, t);
      keyboardMesh.material.emissiveIntensity = lerp(0, 0.25, t);
    }

    // ── Fase 3: Pausa (1.5 → 2.0s) ──────────────────
    if (elapsed >= 1.5 && elapsed < 2.0) {
      // Garante estado final da fase 2
      lidGroup.rotation.x = LID_OPEN_ANGLE;
      screenLight.intensity = 1.2;
      screenMesh.material.emissiveIntensity  = 0.6;
      keyboardMesh.material.emissiveIntensity = 0.25;
    }

    // ── Fase 4: Zoom (2.0 → 3.0s) ───────────────────
    if (elapsed >= 2.0 && elapsed < 3.0) {
      const t = easeInQuad(progress(2.0, 3.0));

      // Move câmera em direção à tela
      camera.position.lerpVectors(CAM_START, CAM_END, t);
      camera.lookAt(0, 0.8, 0);

      // Fade-out das partículas
      particles.setOpacity(1 - t);

      // Fade-out do overlay começa mais cedo (a partir de 60% do zoom)
      if (t > 0.6) {
        const fadeT = (t - 0.6) / 0.4;
        setNotebookOpacity(1 - fadeT);
      }
    }

    // ── Fase 5: Transição completa (>= 3.0s) ─────────
    if (elapsed >= 3.0 && !completed) {
      finalize();
    }
  }

  // ── Finaliza e passa para o iframe ───────────────────
  function finalize() {
    completed = true;
    running   = false;
    onComplete();
  }

  // ── API pública ───────────────────────────────────────

  /** Inicia a animação a partir do estado inicial. */
  function start() {
    // Estado inicial
    camera.position.copy(CAM_START);
    camera.lookAt(0, 0.5, 0);
    setNotebookOpacity(0);
    lidGroup.rotation.x = 0;
    screenLight.intensity = 0;
    screenMesh.material.emissiveIntensity  = 0;
    keyboardMesh.material.emissiveIntensity = 0;

    elapsed  = 0;
    running  = true;
    completed = false;
  }

  /** Pula direto para a transição final com fade rápido. */
  function skip() {
    if (completed) return;
    // Avança para a fase de finalização
    elapsed = 3.0;
    tick(0);
  }

  return { tick, start, skip };
}
