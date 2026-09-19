/**
 * Siri Sofa Services — Photorealistic 3D Sofa Scroll-Storytelling Engine
 * Built with Three.js (r128)
 * 
 * Flow:
 * - 0% - 22%: Hero Showcase (Centered, floating, cursor parallax)
 * - 22% - 45%: The Problem (Macro zoom into fabric; trapped dust & allergen particles appear)
 * - 45% - 70%: Deep Cleaning & Steam Extraction (Sofa turns 45°; vacuum & steam extraction particles dissolve dust)
 * - 70% - 88%: Cushion Hygiene & Exploded View (Cushions elevate to inspect deep sanitization & rapid 2-3h drying)
 * - 88% - 100%: Restored Showroom Freshness (Particles vanish, sparkling clean sofa glides into services)
 */

class ThreeSofaStoryEngine {
  constructor(containerId = 'sofa-story-canvas-container') {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sofaGroup = null;
    this.cushions = [];
    
    // Particles
    this.dustParticles = null;
    this.dustPositions = null;
    this.steamParticles = null;
    this.steamPositions = null;
    this.steamVelocities = null;

    // Materials
    this.materials = {};
    this.activeFabric = 'emerald';

    // Animation & Lerp State
    this.scrollProgress = 0;
    this.activePhase = 1;
    this.targetCameraPos = { x: 0, y: 1.2, z: 5.0 };
    this.targetCameraLookAt = { x: 0, y: 0.3, z: 0 };
    this.targetSofaRotation = { x: 0.08, y: -0.32, z: 0 };
    this.targetCushionElevate = 0;
    this.targetDustOpacity = 0;
    this.targetSteamOpacity = 0;

    // Interaction State
    this.isDragging = false;
    this.prevMousePos = { x: 0, y: 0 };
    this.userRotation = { x: 0, y: 0 };
    this.mouseParallax = { x: 0, y: 0 };

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      console.warn("Three.js not loaded. Retrying in 400ms...");
      setTimeout(() => this.init(), 400);
      return;
    }

    // Check for reduced motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      console.log("Reduced motion preferred: Using simplified static 3D perspective.");
      this.isReducedMotion = true;
    }

    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 520;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 5.0);
    this.camera.lookAt(0, 0.3, 0);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'w-full h-full cursor-grab active:cursor-grabbing select-none outline-none';

    // 4. Lighting Rig (Cinematic Studio Lighting)
    this.setupLighting();

    // 5. Materials
    this.setupMaterials();

    // 6. Build Procedural Luxury Sofa Model
    this.buildSofa();

    // 7. Build Dust & Steam Particles
    this.buildParticleSystems();

    // 8. Event Listeners
    this.setupListeners();

    // 9. Main Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    console.log("🛋️ ThreeSofaStoryEngine initialized successfully.");
  }

  setupLighting() {
    // Warm ambient base
    const ambient = new THREE.AmbientLight(0xfffdfa, 0.85);
    this.scene.add(ambient);

    // Key directional light with soft shadow
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(4, 5, 4);
    key.castShadow = true;
    key.shadow.mapSize.width = 1024;
    key.shadow.mapSize.height = 1024;
    key.shadow.bias = -0.001;
    this.scene.add(key);

    // Soft cool bounce fill
    const fill = new THREE.DirectionalLight(0xe0f2fe, 0.55);
    fill.position.set(-4, 3, 2);
    this.scene.add(fill);

    // Subtle warm rim light for fabric definition
    const rim = new THREE.DirectionalLight(0xffedd5, 0.65);
    rim.position.set(0, 4, -4);
    this.scene.add(rim);

    // Contact shadow disc on floor
    const shadowGeo = new THREE.PlaneGeometry(5.2, 2.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0c4a34,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.66;
    this.scene.add(shadow);
  }

  setupMaterials() {
    // Signature Emerald Velvet
    this.materials['emerald'] = new THREE.MeshStandardMaterial({
      color: 0x0C4A34,
      roughness: 0.68,
      metalness: 0.05
    });

    // Tuscan Ivory Linen
    this.materials['ivory'] = new THREE.MeshStandardMaterial({
      color: 0xE8E4D9,
      roughness: 0.82,
      metalness: 0.02
    });

    // Royal Sapphire Velvet
    this.materials['navy'] = new THREE.MeshStandardMaterial({
      color: 0x1B365D,
      roughness: 0.62,
      metalness: 0.08
    });

    // Dark Walnut Wood Legs
    this.materials['wood'] = new THREE.MeshStandardMaterial({
      color: 0x24180E,
      roughness: 0.45,
      metalness: 0.05
    });

    // Gold Brass Ferrules
    this.materials['brass'] = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.28,
      metalness: 0.85
    });
  }

  buildSofa() {
    this.sofaGroup = new THREE.Group();
    const fabricMat = this.materials[this.activeFabric];

    // 1. Sofa Main Base Platform
    const baseGeo = new THREE.BoxGeometry(3.1, 0.26, 1.28);
    const baseMesh = new THREE.Mesh(baseGeo, fabricMat);
    baseMesh.position.set(0, -0.25, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.userData = { isFabric: true };
    this.sofaGroup.add(baseMesh);

    // 2. Backrest Panel
    const backGeo = new THREE.BoxGeometry(3.1, 1.02, 0.32);
    const backMesh = new THREE.Mesh(backGeo, fabricMat);
    backMesh.position.set(0, 0.36, -0.48);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    backMesh.userData = { isFabric: true };
    this.sofaGroup.add(backMesh);

    // 3. Three Back Cushions
    for (let i = 0; i < 3; i++) {
      const bGeo = new THREE.BoxGeometry(0.94, 0.82, 0.24);
      const bMesh = new THREE.Mesh(bGeo, fabricMat);
      const posX = -0.98 + i * 0.98;
      bMesh.position.set(posX, 0.34, -0.32);
      bMesh.rotation.x = -0.06;
      bMesh.castShadow = true;
      bMesh.userData = { isFabric: true, isCushion: true, origY: 0.34 };
      this.sofaGroup.add(bMesh);
      this.cushions.push(bMesh);
    }

    // 4. Three Seat Cushions
    for (let i = 0; i < 3; i++) {
      const sGeo = new THREE.BoxGeometry(0.96, 0.28, 0.96);
      const sMesh = new THREE.Mesh(sGeo, fabricMat);
      const posX = -0.98 + i * 0.98;
      sMesh.position.set(posX, 0.02, 0.12);
      sMesh.castShadow = true;
      sMesh.receiveShadow = true;
      sMesh.userData = { isFabric: true, isCushion: true, origY: 0.02 };
      this.sofaGroup.add(sMesh);
      this.cushions.push(sMesh);
    }

    // 5. Left & Right Sculpted Bolster Armrests
    const armGeo = new THREE.BoxGeometry(0.25, 0.74, 1.32);

    const leftArm = new THREE.Mesh(armGeo, fabricMat);
    leftArm.position.set(-1.62, 0.16, 0.02);
    leftArm.castShadow = true;
    leftArm.userData = { isFabric: true };
    this.sofaGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, fabricMat);
    rightArm.position.set(1.62, 0.16, 0.02);
    rightArm.castShadow = true;
    rightArm.userData = { isFabric: true };
    this.sofaGroup.add(rightArm);

    // 6. Contrast Throw Pillows
    const pillowGeo = new THREE.BoxGeometry(0.44, 0.44, 0.15);
    const pillowMat = this.materials['ivory'];

    const leftPillow = new THREE.Mesh(pillowGeo, pillowMat);
    leftPillow.position.set(-1.32, 0.22, -0.05);
    leftPillow.rotation.set(0.1, 0.45, 0.2);
    leftPillow.castShadow = true;
    this.sofaGroup.add(leftPillow);

    const rightPillow = new THREE.Mesh(pillowGeo, pillowMat);
    rightPillow.position.set(1.32, 0.22, -0.05);
    rightPillow.rotation.set(0.1, -0.45, -0.2);
    rightPillow.castShadow = true;
    this.sofaGroup.add(rightPillow);

    // 7. Four Mid-Century Tapered Walnut Legs with Brass Ferrules
    const legCoords = [
      [-1.42, -0.48, 0.5],
      [1.42, -0.48, 0.5],
      [-1.42, -0.48, -0.5],
      [1.42, -0.48, -0.5]
    ];

    legCoords.forEach(([x, y, z]) => {
      // Wood cone
      const coneGeo = new THREE.CylinderGeometry(0.045, 0.025, 0.32, 16);
      const cone = new THREE.Mesh(coneGeo, this.materials['wood']);
      cone.position.set(x, y, z);
      cone.rotation.z = (x > 0 ? -0.12 : 0.12);
      cone.rotation.x = (z > 0 ? 0.12 : -0.12);
      cone.castShadow = true;
      this.sofaGroup.add(cone);

      // Brass tip
      const tipGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.08, 16);
      const tip = new THREE.Mesh(tipGeo, this.materials['brass']);
      tip.position.set(x, y - 0.12, z);
      tip.rotation.z = cone.rotation.z;
      tip.rotation.x = cone.rotation.x;
      this.sofaGroup.add(tip);
    });

    this.sofaGroup.position.set(0, 0.1, 0);
    this.sofaGroup.rotation.y = -0.32;
    this.scene.add(this.sofaGroup);
  }

  buildParticleSystems() {
    // A. Dust & Allergen Particles (The Problem Phase)
    const dustCount = 140;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);

    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 2.7;
      dustPos[i * 3 + 1] = 0.08 + Math.random() * 0.28;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 0.95;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

    const dustMat = new THREE.PointsMaterial({
      color: 0xC8B89A, // Muted dust/allergen tone
      size: 0.05,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.dustParticles = new THREE.Points(dustGeo, dustMat);
    this.scene.add(this.dustParticles);

    // B. High-Extraction Luminous Steam Particles (Deep Cleaning Phase)
    const steamCount = 180;
    const steamGeo = new THREE.BufferGeometry();
    const steamPos = new Float32Array(steamCount * 3);
    const steamVels = [];

    for (let i = 0; i < steamCount; i++) {
      steamPos[i * 3] = (Math.random() - 0.5) * 2.6;
      steamPos[i * 3 + 1] = 0.1 + Math.random() * 0.2;
      steamPos[i * 3 + 2] = (Math.random() - 0.5) * 0.9;

      steamVels.push({
        vx: (Math.random() - 0.5) * 0.007,
        vy: 0.014 + Math.random() * 0.02,
        vz: (Math.random() - 0.5) * 0.007
      });
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPos, 3));

    const steamMat = new THREE.PointsMaterial({
      color: 0x5BAE8B, // Fresh sanitization emerald steam
      size: 0.065,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.steamParticles = new THREE.Points(steamGeo, steamMat);
    this.steamPositions = steamPos;
    this.steamVelocities = steamVels;
    this.scene.add(this.steamParticles);
  }

  setupListeners() {
    const el = this.renderer.domElement;

    // Mouse drag for interactive inspection
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouseParallax.x = nx * 0.18;
      this.mouseParallax.y = ny * 0.12;

      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;

      this.userRotation.y += dx * 0.008;
      this.userRotation.x = Math.max(-0.35, Math.min(0.45, this.userRotation.x + dy * 0.008));
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    // Mobile touch
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.prevMousePos.x;
      const dy = e.touches[0].clientY - this.prevMousePos.y;

      this.userRotation.y += dx * 0.008;
      this.userRotation.x = Math.max(-0.35, Math.min(0.45, this.userRotation.x + dy * 0.008));
      this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    // Window scroll storytelling handler
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    window.addEventListener('resize', () => this.handleResize());
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w === 0 || h === 0) return;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    // Map scroll progress across first 1600px of page (Hero + Story sections)
    const storyRange = Math.min(2200, Math.max(1200, window.innerHeight * 2.2));
    const p = Math.min(1.0, Math.max(0.0, scrollY / storyRange));
    this.scrollProgress = p;

    // 5-Stage Storyline Mapping:
    // Phase 1 (0.00 - 0.22): Hero State
    if (p < 0.22) {
      this.activePhase = 1;
      this.targetCameraPos = { x: 0, y: 1.2, z: 5.0 };
      this.targetCameraLookAt = { x: 0, y: 0.3, z: 0 };
      this.targetSofaRotation = { x: 0.08, y: -0.32 + p * 0.3, z: 0 };
      this.targetCushionElevate = 0;
      this.targetDustOpacity = 0.0;
      this.targetSteamOpacity = 0.0;
    } 
    // Phase 2 (0.22 - 0.45): The Problem (Dust & Allergens)
    else if (p < 0.45) {
      this.activePhase = 2;
      const subP = (p - 0.22) / 0.23;
      this.targetCameraPos = {
        x: THREE.MathUtils.lerp(0, 0.35, subP),
        y: THREE.MathUtils.lerp(1.2, 0.72, subP),
        z: THREE.MathUtils.lerp(5.0, 2.9, subP)
      };
      this.targetCameraLookAt = { x: 0.15, y: 0.18, z: 0.05 };
      this.targetSofaRotation = { x: 0.14, y: -0.15, z: 0 };
      this.targetCushionElevate = 0;
      this.targetDustOpacity = THREE.MathUtils.lerp(0.0, 0.85, subP);
      this.targetSteamOpacity = 0.0;
    } 
    // Phase 3 (0.45 - 0.70): Deep Extraction Steam
    else if (p < 0.70) {
      this.activePhase = 3;
      const subP = (p - 0.45) / 0.25;
      this.targetCameraPos = {
        x: THREE.MathUtils.lerp(0.35, -0.65, subP),
        y: THREE.MathUtils.lerp(0.72, 1.35, subP),
        z: THREE.MathUtils.lerp(2.9, 4.1, subP)
      };
      this.targetCameraLookAt = { x: 0, y: 0.3, z: 0 };
      this.targetSofaRotation = { x: 0.18, y: THREE.MathUtils.lerp(-0.15, 0.65, subP), z: 0 };
      this.targetCushionElevate = 0;
      // Dust fades out as steam extracts it
      this.targetDustOpacity = THREE.MathUtils.lerp(0.85, 0.0, subP);
      this.targetSteamOpacity = THREE.MathUtils.lerp(0.0, 0.85, subP);
    } 
    // Phase 4 (0.70 - 0.88): Cushion Hygiene Exploded View
    else if (p < 0.88) {
      this.activePhase = 4;
      const subP = (p - 0.70) / 0.18;
      this.targetCameraPos = {
        x: THREE.MathUtils.lerp(-0.65, 0.1, subP),
        y: THREE.MathUtils.lerp(1.35, 1.65, subP),
        z: THREE.MathUtils.lerp(4.1, 4.5, subP)
      };
      this.targetCameraLookAt = { x: 0, y: 0.35, z: 0 };
      this.targetSofaRotation = { x: 0.22, y: THREE.MathUtils.lerp(0.65, -0.2, subP), z: 0 };
      this.targetCushionElevate = THREE.MathUtils.lerp(0, 0.35, subP);
      this.targetDustOpacity = 0.0;
      this.targetSteamOpacity = THREE.MathUtils.lerp(0.85, 0.2, subP);
    } 
    // Phase 5 (0.88 - 1.00): Restored Showroom Freshness
    else {
      this.activePhase = 5;
      const subP = (p - 0.88) / 0.12;
      this.targetCameraPos = { x: 0, y: 1.15, z: 4.8 };
      this.targetCameraLookAt = { x: 0, y: 0.25, z: 0 };
      this.targetSofaRotation = { x: 0.06, y: 0.1, z: 0 };
      this.targetCushionElevate = THREE.MathUtils.lerp(0.35, 0, subP);
      this.targetDustOpacity = 0.0;
      this.targetSteamOpacity = 0.0;
    }

    this.updateUIBadge();
  }

  updateUIBadge() {
    const badge = document.getElementById('sofa-story-phase-badge');
    if (!badge) return;

    const titles = {
      1: '01 • 3D Showcase',
      2: '02 • Deep Dust & Trapped Allergens',
      3: '03 • High-Extraction Steam Cleaning',
      4: '04 • Exploded Cushion Hygiene Scan',
      5: '05 • 99.9% Sanitized & Room-Ready'
    };
    badge.textContent = titles[this.activePhase] || '3D Interactive View';
  }

  animate() {
    requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;
    const float = Math.sin(time * 1.5) * 0.025;

    // 1. Camera LERP
    this.camera.position.x += (this.targetCameraPos.x + this.mouseParallax.x - this.camera.position.x) * 0.08;
    this.camera.position.y += (this.targetCameraPos.y + this.mouseParallax.y - this.camera.position.y) * 0.08;
    this.camera.position.z += (this.targetCameraPos.z - this.camera.position.z) * 0.08;
    this.camera.lookAt(this.targetCameraLookAt.x, this.targetCameraLookAt.y, this.targetCameraLookAt.z);

    // 2. Sofa Rotation LERP
    if (this.sofaGroup) {
      const rotY = this.targetSofaRotation.y + this.userRotation.y;
      const rotX = this.targetSofaRotation.x + this.userRotation.x;
      this.sofaGroup.rotation.y += (rotY - this.sofaGroup.rotation.y) * 0.08;
      this.sofaGroup.rotation.x += (rotX - this.sofaGroup.rotation.x) * 0.08;
      this.sofaGroup.position.y = 0.1 + float;

      // Damp user rotation back if not dragging
      if (!this.isDragging) {
        this.userRotation.y *= 0.95;
        this.userRotation.x *= 0.95;
      }
    }

    // 3. Cushion Explosion LERP
    if (this.cushions.length > 0) {
      this.cushions.forEach(c => {
        if (c.userData.origY !== undefined) {
          const targetY = c.userData.origY + this.targetCushionElevate;
          c.position.y += (targetY - c.position.y) * 0.1;
        }
      });
    }

    // 4. Dust Particles Opacity LERP
    if (this.dustParticles) {
      const cur = this.dustParticles.material.opacity;
      this.dustParticles.material.opacity += (this.targetDustOpacity - cur) * 0.1;
    }

    // 5. Steam Particles Update
    if (this.steamParticles) {
      const cur = this.steamParticles.material.opacity;
      this.steamParticles.material.opacity += (this.targetSteamOpacity - cur) * 0.1;

      if (this.steamParticles.material.opacity > 0.01) {
        const pos = this.steamPositions;
        const vel = this.steamVelocities;
        const count = pos.length / 3;

        for (let i = 0; i < count; i++) {
          const idx = i * 3;
          pos[idx] += vel[i].vx;
          pos[idx + 1] += vel[i].vy;
          pos[idx + 2] += vel[i].vz;

          if (pos[idx + 1] > 1.3) {
            pos[idx] = (Math.random() - 0.5) * 2.5;
            pos[idx + 1] = 0.12;
            pos[idx + 2] = (Math.random() - 0.5) * 0.9;
          }
        }
        this.steamParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

window.ThreeSofaStoryEngine = ThreeSofaStoryEngine;
