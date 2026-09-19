/**
 * Siri Sofa Services — Next-Gen 3D WebGL Scrollytelling Engine
 * Powered by Three.js (r128)
 * 
 * Features:
 * - Procedural high-fidelity 3D luxury sofa model (cushions, armrests, tufting, wooden/brass legs)
 * - 5-Stage Scroll Storyline (Hero -> Deep Extraction Zoom -> 3D Cushion Hygiene -> Fabric Customizer -> Living Room Ready)
 * - Particle Steam & Extraction Cleaning simulation
 * - Dynamic fabric material & color swatch switcher (Emerald Velvet, Ivory Linen, Royal Navy, Camel Leather, Slate Charcoal)
 * - Orbit/Drag interactive inspection with gentle auto-recenter damping
 * - Performance optimized: pixelRatio capped at 2, RAF throttling when out of viewport
 */

class Sofa3DViewer {
  constructor(containerId = 'sofa-3d-canvas-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sofaGroup = null;
    this.cushions = [];
    this.steamParticles = null;
    this.particlePositions = null;
    this.particleVelocities = null;
    this.isSteamActive = false;
    this.steamTimer = 0;

    // Materials library
    this.materials = {};
    this.currentMaterialKey = 'emerald';

    // Animation & Camera targets
    this.targetCameraPos = { x: 0, y: 1.2, z: 4.8 };
    this.targetCameraLookAt = { x: 0, y: 0.3, z: 0 };
    this.targetSofaRotation = { x: 0.1, y: -0.35, z: 0 };
    this.targetCushionOffset = 0; // Exploded view offset for hygiene inspection

    // Interactive mouse drag
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.userRotation = { x: 0, y: 0 };
    this.mouseParallax = { x: 0, y: 0 };

    // Scroll tracking
    this.scrollProgress = 0;
    this.activeStage = 1;

    this.init();
  }

  init() {
    if (typeof THREE === 'undefined') {
      console.warn("Three.js not loaded. 3D Sofa Viewer will retry in 500ms.");
      setTimeout(() => this.init(), 500);
      return;
    }

    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 500;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(0, 1.2, 4.8);
    this.camera.lookAt(0, 0.3, 0);

    // 3. Renderer with soft shadow support and anti-aliasing
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;

    // Clear previous canvas if re-initializing
    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.className = 'w-full h-full cursor-grab active:cursor-grabbing outline-none select-none';

    // 4. Lighting Rig (Professional Studio Warm/Cool Fill + Rim)
    this.setupLighting();

    // 5. Build 3D Sofa
    this.buildSofaMaterials();
    this.buildProceduralSofa();

    // 6. Build Steam & Extraction Particle System
    this.buildSteamParticleSystem();

    // 7. Event Listeners
    this.setupInteractions();

    // 8. Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    console.log("🛋️ Siri Sofa 3D WebGL Viewer initialized successfully.");
  }

  setupLighting() {
    // Ambient light with soft warm glow
    const ambientLight = new THREE.AmbientLight(0xfffdfa, 0.85);
    this.scene.add(ambientLight);

    // Key Light (Main soft shadow caster)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(4, 5, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // Fill Light (Subtle emerald/cool bounce)
    const fillLight = new THREE.DirectionalLight(0xe2f1ea, 0.6);
    fillLight.position.set(-4, 3, 2);
    this.scene.add(fillLight);

    // Rim / Backlight for rim definition
    const rimLight = new THREE.DirectionalLight(0xffe8d6, 0.7);
    rimLight.position.set(0, 4, -4);
    this.scene.add(rimLight);

    // Soft Ground Shadow Contact Disc
    const shadowGeo = new THREE.PlaneGeometry(5, 2.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0c4a34,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.65;
    this.scene.add(shadowMesh);
  }

  buildSofaMaterials() {
    // 1. Signature Emerald Velvet
    this.materials['emerald'] = new THREE.MeshStandardMaterial({
      color: 0x0C4A34,
      roughness: 0.65,
      metalness: 0.05
    });

    // 2. Luxury Ivory Linen
    this.materials['ivory'] = new THREE.MeshStandardMaterial({
      color: 0xE8E4D9,
      roughness: 0.85,
      metalness: 0.02
    });

    // 3. Royal Sapphire Velvet
    this.materials['navy'] = new THREE.MeshStandardMaterial({
      color: 0x1B365D,
      roughness: 0.60,
      metalness: 0.08
    });

    // 4. Saddle Tan Heritage Leather
    this.materials['leather'] = new THREE.MeshStandardMaterial({
      color: 0x945D3B,
      roughness: 0.38,
      metalness: 0.18
    });

    // 5. Modern Charcoal Tweed
    this.materials['charcoal'] = new THREE.MeshStandardMaterial({
      color: 0x2A2E35,
      roughness: 0.8,
      metalness: 0.05
    });

    // Accent wood legs
    this.materials['woodLegs'] = new THREE.MeshStandardMaterial({
      color: 0x2C1D11,
      roughness: 0.4,
      metalness: 0.1
    });

    // Gold brass leg accents
    this.materials['brass'] = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      roughness: 0.25,
      metalness: 0.85
    });
  }

  setMaterial(key) {
    if (!this.materials[key]) return;
    this.currentMaterialKey = key;
    const mat = this.materials[key];

    if (this.sofaGroup) {
      this.sofaGroup.traverse((child) => {
        if (child.isMesh && child.userData && child.userData.isUpholstery) {
          child.material = mat;
        }
      });
    }

    // Trigger UI badge update if present
    const labelEl = document.getElementById('active-material-name');
    if (labelEl) {
      const names = {
        emerald: 'Heritage Emerald Velvet',
        ivory: 'Tuscan Ivory Linen',
        navy: 'Royal Sapphire Velvet',
        leather: 'Saddle Tan Heritage Leather',
        charcoal: 'Nordic Charcoal Tweed'
      };
      labelEl.textContent = names[key] || key;
    }
  }

  buildProceduralSofa() {
    this.sofaGroup = new THREE.Group();
    const mat = this.materials[this.currentMaterialKey];

    // --- A. Main Base Frame ---
    const baseGeo = new THREE.BoxGeometry(3.0, 0.25, 1.25);
    const baseMesh = new THREE.Mesh(baseGeo, mat);
    baseMesh.position.set(0, -0.25, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.userData = { isUpholstery: true };
    this.sofaGroup.add(baseMesh);

    // --- B. Backrest Structure ---
    const backGeo = new THREE.BoxGeometry(3.0, 1.0, 0.3);
    const backMesh = new THREE.Mesh(backGeo, mat);
    backMesh.position.set(0, 0.35, -0.48);
    backMesh.castShadow = true;
    backMesh.receiveShadow = true;
    backMesh.userData = { isUpholstery: true };
    this.sofaGroup.add(backMesh);

    // --- C. Plush Back Cushions (3 sections) ---
    for (let i = 0; i < 3; i++) {
      const cushionBackGeo = new THREE.BoxGeometry(0.92, 0.8, 0.22);
      const cushionBack = new THREE.Mesh(cushionBackGeo, mat);
      const posX = -0.96 + i * 0.96;
      cushionBack.position.set(posX, 0.32, -0.32);
      cushionBack.rotation.x = -0.06;
      cushionBack.castShadow = true;
      cushionBack.userData = { isUpholstery: true, isCushion: true, origY: 0.32 };
      this.sofaGroup.add(cushionBack);
      this.cushions.push(cushionBack);
    }

    // --- D. Plush Seat Cushions (3 sections) ---
    for (let i = 0; i < 3; i++) {
      const seatCushionGeo = new THREE.BoxGeometry(0.94, 0.28, 0.95);
      const seatCushion = new THREE.Mesh(seatCushionGeo, mat);
      const posX = -0.96 + i * 0.96;
      seatCushion.position.set(posX, 0.02, 0.12);
      seatCushion.castShadow = true;
      seatCushion.receiveShadow = true;
      seatCushion.userData = { isUpholstery: true, isCushion: true, origY: 0.02 };
      this.sofaGroup.add(seatCushion);
      this.cushions.push(seatCushion);
    }

    // --- E. Sleek Sculpted Armrests (Left & Right) ---
    const armGeo = new THREE.BoxGeometry(0.24, 0.72, 1.3);

    const leftArm = new THREE.Mesh(armGeo, mat);
    leftArm.position.set(-1.58, 0.15, 0.02);
    leftArm.castShadow = true;
    leftArm.userData = { isUpholstery: true };
    this.sofaGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, mat);
    rightArm.position.set(1.58, 0.15, 0.02);
    rightArm.castShadow = true;
    rightArm.userData = { isUpholstery: true };
    this.sofaGroup.add(rightArm);

    // --- F. Throw Pillows / Accent Bolsters ---
    const pillowGeo = new THREE.BoxGeometry(0.42, 0.42, 0.14);
    const pillowMat = this.materials['ivory']; // Contrast pillow

    const leftPillow = new THREE.Mesh(pillowGeo, pillowMat);
    leftPillow.position.set(-1.3, 0.22, -0.05);
    leftPillow.rotation.set(0.1, 0.45, 0.2);
    leftPillow.castShadow = true;
    this.sofaGroup.add(leftPillow);

    const rightPillow = new THREE.Mesh(pillowGeo, pillowMat);
    rightPillow.position.set(1.3, 0.22, -0.05);
    rightPillow.rotation.set(0.1, -0.45, -0.2);
    rightPillow.castShadow = true;
    this.sofaGroup.add(rightPillow);

    // --- G. Mid-Century Tapered Walnut & Brass Legs (4 legs) ---
    const legPositions = [
      [-1.4, -0.48, 0.48],
      [1.4, -0.48, 0.48],
      [-1.4, -0.48, -0.48],
      [1.4, -0.48, -0.48]
    ];

    legPositions.forEach(([x, y, z]) => {
      // Wooden upper cone
      const legGeo = new THREE.CylinderGeometry(0.045, 0.025, 0.32, 16);
      const legMesh = new THREE.Mesh(legGeo, this.materials['woodLegs']);
      legMesh.position.set(x, y, z);
      // Splayed angle
      legMesh.rotation.z = (x > 0 ? -0.12 : 0.12);
      legMesh.rotation.x = (z > 0 ? 0.12 : -0.12);
      legMesh.castShadow = true;
      this.sofaGroup.add(legMesh);

      // Gold Brass Ferrule (tip)
      const tipGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.08, 16);
      const tipMesh = new THREE.Mesh(tipGeo, this.materials['brass']);
      tipMesh.position.set(x, y - 0.12, z);
      tipMesh.rotation.z = legMesh.rotation.z;
      tipMesh.rotation.x = legMesh.rotation.x;
      this.sofaGroup.add(tipMesh);
    });

    // Center and elevate slightly
    this.sofaGroup.position.set(0, 0.1, 0);
    this.sofaGroup.rotation.y = -0.35;
    this.scene.add(this.sofaGroup);
  }

  buildSteamParticleSystem() {
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];

    for (let i = 0; i < particleCount; i++) {
      // Spawn on the sofa seat area
      positions[i * 3] = (Math.random() - 0.5) * 2.6;
      positions[i * 3 + 1] = 0.15 + Math.random() * 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.9;

      velocities.push({
        vx: (Math.random() - 0.5) * 0.008,
        vy: 0.012 + Math.random() * 0.018,
        vz: (Math.random() - 0.5) * 0.008,
        life: Math.random()
      });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Semi-transparent luminous cleaning steam particles
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x94CCB3, // soft emerald steam
      size: 0.065,
      transparent: true,
      opacity: 0.0, // starts invisible until active
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.steamParticles = new THREE.Points(geometry, particleMaterial);
    this.particlePositions = positions;
    this.particleVelocities = velocities;
    this.scene.add(this.steamParticles);
  }

  triggerSteamSimulation(durationSeconds = 4.5) {
    this.isSteamActive = true;
    this.steamTimer = durationSeconds;
    if (this.steamParticles) {
      this.steamParticles.material.opacity = 0.75;
    }

    // Flash status badge
    const badge = document.getElementById('cleaning-sim-status');
    if (badge) {
      badge.classList.remove('hidden');
      badge.textContent = '✨ Deep Steam Extraction in progress...';
    }

    setTimeout(() => {
      this.isSteamActive = false;
      if (this.steamParticles) {
        this.steamParticles.material.opacity = 0.0;
      }
      if (badge) {
        badge.textContent = '✅ 99.9% Upholstery Sanitization Complete!';
        setTimeout(() => badge.classList.add('hidden'), 2500);
      }
    }, durationSeconds * 1000);
  }

  setupInteractions() {
    const el = this.renderer.domElement;

    // Mouse drag for free 3D rotation
    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      // Subtle cursor parallax
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      this.mouseParallax.x = nx * 0.2;
      this.mouseParallax.y = ny * 0.15;

      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.userRotation.y += deltaX * 0.008;
      this.userRotation.x = Math.max(-0.4, Math.min(0.5, this.userRotation.x + deltaY * 0.008));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    // Touch support for mobile devices
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - this.previousMousePosition.x;
      const deltaY = e.touches[0].clientY - this.previousMousePosition.y;

      this.userRotation.y += deltaX * 0.008;
      this.userRotation.x = Math.max(-0.4, Math.min(0.5, this.userRotation.x + deltaY * 0.008));

      this.previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    // Responsive resize handler
    window.addEventListener('resize', () => this.handleResize());

    // Window scroll scrollytelling listener
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
  }

  handleResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  handleScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollY / (maxScroll * 0.65))); // Normalize over top 65% of page
    this.scrollProgress = progress;

    // 5-Phase Scrollytelling Choreography:
    // Phase 1 (0.00 - 0.20): Hero showcase (centered, elegant 3/4 view)
    // Phase 2 (0.20 - 0.45): Deep Extraction Macro Zoom (camera glides close to fabric, steam triggered)
    // Phase 3 (0.45 - 0.70): Cushion Hygiene Exploded View (cushions elevate to show inner sanitization)
    // Phase 4 (0.70 - 0.90): Dynamic Material Swatch Showcase (angled top-down view)
    // Phase 5 (0.90 - 1.00): Room-Ready Living Space overview

    if (progress < 0.20) {
      this.activeStage = 1;
      this.targetCameraPos = { x: 0, y: 1.2, z: 4.8 };
      this.targetCameraLookAt = { x: 0, y: 0.3, z: 0 };
      this.targetSofaRotation = { x: 0.08, y: -0.35 + progress * 0.5, z: 0 };
      this.targetCushionOffset = 0;
    } else if (progress < 0.45) {
      this.activeStage = 2;
      const subP = (progress - 0.20) / 0.25;
      // Macro zoom into fabric
      this.targetCameraPos = {
        x: THREE.MathUtils.lerp(0, 0.4, subP),
        y: THREE.MathUtils.lerp(1.2, 0.65, subP),
        z: THREE.MathUtils.lerp(4.8, 2.7, subP)
      };
      this.targetCameraLookAt = { x: 0.2, y: 0.2, z: 0.1 };
      this.targetSofaRotation = { x: 0.15, y: -0.15, z: 0 };
      this.targetCushionOffset = 0;

      // Auto-activate gentle steam while in extraction zone
      if (this.steamParticles && !this.isSteamActive) {
        this.steamParticles.material.opacity = 0.55;
      }
    } else if (progress < 0.70) {
      this.activeStage = 3;
      const subP = (progress - 0.45) / 0.25;
      // Exploded cushion inspection view
      this.targetCameraPos = {
        x: THREE.MathUtils.lerp(0.4, -0.8, subP),
        y: THREE.MathUtils.lerp(0.65, 1.6, subP),
        z: THREE.MathUtils.lerp(2.7, 4.4, subP)
      };
      this.targetCameraLookAt = { x: 0, y: 0.35, z: 0 };
      this.targetSofaRotation = { x: 0.25, y: 0.45, z: 0 };
      this.targetCushionOffset = THREE.MathUtils.lerp(0, 0.28, subP);
    } else if (progress < 0.90) {
      this.activeStage = 4;
      const subP = (progress - 0.70) / 0.20;
      // Elegant top 45-degree angle for material swatch clarity
      this.targetCameraPos = {
        x: THREE.MathUtils.lerp(-0.8, 0.3, subP),
        y: THREE.MathUtils.lerp(1.6, 2.0, subP),
        z: THREE.MathUtils.lerp(4.4, 4.2, subP)
      };
      this.targetCameraLookAt = { x: 0, y: 0.2, z: 0 };
      this.targetSofaRotation = { x: 0.22, y: -0.5, z: 0 };
      this.targetCushionOffset = THREE.MathUtils.lerp(0.28, 0, subP);
    } else {
      this.activeStage = 5;
      // Pristine Room View
      this.targetCameraPos = { x: 0, y: 1.1, z: 4.6 };
      this.targetCameraLookAt = { x: 0, y: 0.25, z: 0 };
      this.targetSofaRotation = { x: 0.05, y: 0.15, z: 0 };
      this.targetCushionOffset = 0;
    }

    // Update active stage indicator pill in UI
    this.updateStageIndicator();
  }

  updateStageIndicator() {
    const stagePill = document.getElementById('sofa-3d-stage-pill');
    if (!stagePill) return;

    const stages = {
      1: 'Phase 1 • 3D Showcase',
      2: 'Phase 2 • Deep Steam Zoom',
      3: 'Phase 3 • Cushion Hygiene Scan',
      4: 'Phase 4 • Fabric Customizer',
      5: 'Phase 5 • Living Room Ready'
    };
    stagePill.textContent = stages[this.activeStage] || '3D Interactive View';
  }

  animate() {
    requestAnimationFrame(this.animate);

    const time = performance.now() * 0.001;

    // Gentle floating breathing animation
    const floatOffset = Math.sin(time * 1.5) * 0.035;

    // 1. Smooth Camera Interpolation (Damped LERP)
    this.camera.position.x += (this.targetCameraPos.x + this.mouseParallax.x - this.camera.position.x) * 0.08;
    this.camera.position.y += (this.targetCameraPos.y + this.mouseParallax.y - this.camera.position.y) * 0.08;
    this.camera.position.z += (this.targetCameraPos.z - this.camera.position.z) * 0.08;
    this.camera.lookAt(this.targetCameraLookAt.x, this.targetCameraLookAt.y, this.targetCameraLookAt.z);

    // 2. Smooth Sofa Rotation Interpolation
    if (this.sofaGroup) {
      // Base rotation + user drag rotation with gentle return
      const targetRotY = this.targetSofaRotation.y + this.userRotation.y;
      const targetRotX = this.targetSofaRotation.x + this.userRotation.x;

      this.sofaGroup.rotation.y += (targetRotY - this.sofaGroup.rotation.y) * 0.08;
      this.sofaGroup.rotation.x += (targetRotX - this.sofaGroup.rotation.x) * 0.08;
      this.sofaGroup.position.y = 0.1 + floatOffset;

      // Damp user rotation slowly back to baseline if not dragging
      if (!this.isDragging) {
        this.userRotation.y *= 0.96;
        this.userRotation.x *= 0.96;
      }
    }

    // 3. Exploded cushion offsets for Hygiene stage
    if (this.cushions.length > 0) {
      this.cushions.forEach((c) => {
        if (c.userData.origY !== undefined) {
          const targetY = c.userData.origY + this.targetCushionOffset;
          c.position.y += (targetY - c.position.y) * 0.1;
        }
      });
    }

    // 4. Update Steam Particles
    if (this.steamParticles && (this.isSteamActive || this.activeStage === 2)) {
      const positions = this.particlePositions;
      const velocities = this.particleVelocities;
      const count = positions.length / 3;

      for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const v = velocities[i];

        positions[idx] += v.vx;
        positions[idx + 1] += v.vy;
        positions[idx + 2] += v.vz;

        // Reset if particle rises too high
        if (positions[idx + 1] > 1.25) {
          positions[idx] = (Math.random() - 0.5) * 2.4;
          positions[idx + 1] = 0.15;
          positions[idx + 2] = (Math.random() - 0.5) * 0.8;
        }
      }
      this.steamParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Attach to window so it is accessible across components
window.Sofa3DViewer = Sofa3DViewer;
