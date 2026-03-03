/* ======================================================
   notebook.js — Modelo 3D do MacBook criado
   programaticamente com Three.js (sem arquivos externos)
   ====================================================== */

/**
 * Constrói e retorna um grupo Three.js representando um
 * MacBook minimalista visto em perspectiva 3/4.
 *
 * Hierarquia do grupo:
 *   notebookGroup
 *     ├── base         (corpo + teclado + trackpad)
 *     ├── hingeLeft    (cilindro esquerdo)
 *     ├── hingeRight   (cilindro direito)
 *     └── lidGroup     (pivot da tampa na dobradiça)
 *           └── lid    (tampa + moldura + tela + logo)
 *
 * @param {THREE.Scene} scene — cena para adicionar o grupo
 * @returns {{ group, lidGroup, screenMesh, screenLight }}
 */
function createNotebook(scene) {

  // ── Materiais ─────────────────────────────────────────

  // Alumínio principal — cinza claro metálico
  const aluminiumMat = new THREE.MeshStandardMaterial({
    color: 0xaaaaaa,
    roughness: 0.35,
    metalness: 0.80,
  });

  // Alumínio mais escuro (interior da base, parte interna da tampa)
  const darkAluminiumMat = new THREE.MeshStandardMaterial({
    color: 0x888888,
    roughness: 0.40,
    metalness: 0.70,
  });

  // Moldura/bezel preto fosco
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.80,
    metalness: 0.10,
  });

  // Tela (emissive — acende durante a animação)
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0a1a2a,
    emissive: new THREE.Color(0x0a1a2a),
    emissiveIntensity: 0.0, // começa apagada; animado pelo animation.js
    roughness: 0.05,
    metalness: 0.0,
  });

  // Teclado — cinza ligeiramente mais escuro com leve emissivo
  const keyboardMat = new THREE.MeshStandardMaterial({
    color: 0x777777,
    emissive: new THREE.Color(0x1a2a3a),
    emissiveIntensity: 0.0, // aumenta conforme a tela abre
    roughness: 0.70,
    metalness: 0.40,
  });

  // Trackpad
  const trackpadMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.20,
    metalness: 0.80,
  });

  // Dobradiça
  const hingeMat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.30,
    metalness: 0.90,
  });

  // Logo Apple — sutil brilho prateado
  const logoMat = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.20,
    metalness: 0.90,
  });

  // ── Dimensões (unidades Three.js) ─────────────────────
  const BW = 3.2;   // largura da base
  const BD = 2.1;   // profundidade da base
  const BH = 0.12;  // espessura da base
  const LW = 3.15;  // largura da tampa
  const LD = 2.05;  // altura/profundidade da tampa (quando aberta)
  const LH = 0.06;  // espessura da tampa

  // ── Grupo raiz ────────────────────────────────────────
  const notebookGroup = new THREE.Group();

  // ── BASE ─────────────────────────────────────────────
  const baseGeo = new THREE.BoxGeometry(BW, BH, BD);
  const baseMesh = new THREE.Mesh(baseGeo, aluminiumMat);
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  notebookGroup.add(baseMesh);

  // Superfície do teclado (painel plano por cima da base)
  const kbGeo = new THREE.PlaneGeometry(BW * 0.88, BD * 0.80);
  const kbMesh = new THREE.Mesh(kbGeo, keyboardMat);
  kbMesh.rotation.x = -Math.PI / 2;
  kbMesh.position.set(0, BH / 2 + 0.002, -BD * 0.04);
  kbMesh.receiveShadow = true;
  notebookGroup.add(kbMesh);

  // Teclas — grid simples de pequenos retângulos
  const keyW = 0.085, keyD = 0.085, keyH = 0.008;
  const keyGeo = new THREE.BoxGeometry(keyW, keyH, keyD);
  const cols = 14, rows = 4;
  const keySpacingX = (BW * 0.80) / cols;
  const keySpacingZ = (BD * 0.55) / rows;
  const startX = -(keySpacingX * (cols - 1)) / 2;
  const startZ = -(keySpacingZ * (rows - 1)) / 2 - BD * 0.06;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = new THREE.Mesh(keyGeo, darkAluminiumMat);
      key.position.set(
        startX + c * keySpacingX,
        BH / 2 + keyH / 2 + 0.001,
        startZ + r * keySpacingZ
      );
      notebookGroup.add(key);
    }
  }

  // Barra de espaço
  const spaceGeo = new THREE.BoxGeometry(BW * 0.30, keyH, keyD);
  const spaceMesh = new THREE.Mesh(spaceGeo, darkAluminiumMat);
  spaceMesh.position.set(0, BH / 2 + keyH / 2 + 0.001, startZ + rows * keySpacingZ);
  notebookGroup.add(spaceMesh);

  // Trackpad
  const tpGeo = new THREE.BoxGeometry(0.65, 0.005, 0.45);
  const tpMesh = new THREE.Mesh(tpGeo, trackpadMat);
  tpMesh.position.set(0, BH / 2 + 0.003, BD * 0.30);
  notebookGroup.add(tpMesh);

  // ── DOBRADIÇAS ────────────────────────────────────────
  const hingeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12);
  hingeGeo.rotateZ(Math.PI / 2);

  const hingeLeft = new THREE.Mesh(hingeGeo, hingeMat);
  hingeLeft.position.set(-BW * 0.35, BH / 2, -BD / 2);
  notebookGroup.add(hingeLeft);

  const hingeRight = new THREE.Mesh(hingeGeo.clone(), hingeMat);
  hingeRight.position.set(BW * 0.35, BH / 2, -BD / 2);
  notebookGroup.add(hingeRight);

  // ── TAMPA (pivot na dobradiça) ─────────────────────────
  // O grupo pivô fica na posição da dobradiça (borda traseira da base).
  const lidGroup = new THREE.Group();
  lidGroup.position.set(0, BH / 2, -BD / 2);
  notebookGroup.add(lidGroup);

  // Tampa exterior (alumínio)
  const lidGeo = new THREE.BoxGeometry(LW, LH, LD);
  const lidMesh = new THREE.Mesh(lidGeo, aluminiumMat);
  // O centro da caixa da tampa deve ficar a LD/2 para cima do pivot
  lidMesh.position.set(0, LD / 2, 0);
  lidMesh.castShadow = true;
  lidGroup.add(lidMesh);

  // Moldura interna (bezel) — face voltada para o usuário
  const bezelGeo = new THREE.PlaneGeometry(LW * 0.96, LD * 0.96);
  const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
  bezelMesh.position.set(0, LD / 2, LH / 2 + 0.001);
  lidGroup.add(bezelMesh);

  // Tela (painel emissivo)
  const screenGeo = new THREE.PlaneGeometry(LW * 0.82, LD * 0.78);
  const screenMesh = new THREE.Mesh(screenGeo, screenMat);
  screenMesh.position.set(0, LD / 2, LH / 2 + 0.002);
  lidGroup.add(screenMesh);

  // Logo Apple (pequeno plano na face traseira)
  const logoGeo = new THREE.PlaneGeometry(0.22, 0.22);
  const logoMesh = new THREE.Mesh(logoGeo, logoMat);
  logoMesh.position.set(0, LD / 2, -(LH / 2 + 0.001));
  logoMesh.rotation.y = Math.PI; // virado para fora
  lidGroup.add(logoMesh);

  // Tampa começa FECHADA (0°) — rotação X negativa fecha sobre a base
  lidGroup.rotation.x = 0;

  // ── Luz da tela ───────────────────────────────────────
  // Simula o brilho da tela iluminando o teclado
  const screenLight = new THREE.PointLight(0x99ccff, 0.0, 4.0);
  screenLight.position.set(0, LD / 2, LH / 2 + 0.3);
  lidGroup.add(screenLight);

  // ── Adiciona à cena ───────────────────────────────────
  // Inclina o grupo todo para dar o ângulo 3/4
  notebookGroup.rotation.y = Math.PI / 6; // 30° — perspectiva 3/4
  notebookGroup.position.set(0, -0.3, 0);

  scene.add(notebookGroup);

  return { group: notebookGroup, lidGroup, screenMesh, screenLight, keyboardMesh: kbMesh };
}
