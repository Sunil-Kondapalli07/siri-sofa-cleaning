/**
 * Three.js 3D Sofa Visualizer & Particle System
 * Procedural Sofa 3D Model with configuration morphing, color customizer, and cleaning foam effects.
 */

class Sofa3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.sofaGroup = null;
    this.particlesGroup = null;
    this.foamParticles = [];
    this.sprayParticles = null;
    
    this.currentColor = 0x0C4A34; // Default Forest Emerald
    this.currentConfig = '3-seater'; // '1-seater', '2-seater', '3-seater', 'l-shape'
    this.isDirty = false;
    this.isSprayActive = false;
    this.autoRotate = true;

    this.init();
  }

  init() {
    const width = this.container.clientWidth || 600;
    const height = this.container.clientHeight || 460;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = null; // Transparent to blend with modern card background

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    this.camera.position.set(3.8, 2.2, 4.2);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
      this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
      this.controls.minDistance = 2.5;
      this.controls.maxDistance = 7.0;
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.6;
    }

    // 5. Lighting
    this.setupLighting();

    // 6. Ground Shadow Disc
    this.setupGroundShadow();

    // 7. Fabric Texture Generator
    this.fabricTexture = this.createFabricTexture();

    // 8. Build Sofa Model
    this.buildSofa(this.currentConfig);

    // 9. Particles System
    this.setupParticles();

    // 10. Interactive 3D Hotspots
    this.setupHotspots();

    // 11. Animation Loop
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    // 12. Resize Listener
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Soft Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    // Key Directional Light with Soft Shadows
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 7, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.bias = -0.001;
    this.scene.add(keyLight);

    // Fill Light
    const fillLight = new THREE.DirectionalLight(0xccfbf1, 0.6);
    fillLight.position.set(-5, 3, -4);
    this.scene.add(fillLight);

    // Back / Rim Light
    const rimLight = new THREE.PointLight(0xffffff, 0.8, 10);
    rimLight.position.set(0, 4, -4);
    this.scene.add(rimLight);
  }

  setupGroundShadow() {
    // Elegant soft contact shadow disc
    const shadowGeo = new THREE.PlaneGeometry(5.5, 4.5);
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
    gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.15)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.01;
    this.scene.add(shadowMesh);
  }

  createFabricTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);

    // Fine weave pattern
    ctx.fillStyle = '#f0f0f0';
    for (let x = 0; x < 256; x += 4) {
      for (let y = 0; y < 256; y += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    return texture;
  }

  createFabricMaterial(colorHex, isDirty = false) {
    let color = new THREE.Color(colorHex);
    let roughness = 0.78;

    if (isDirty) {
      // Darken and desaturate for soiled look
      color.multiplyScalar(0.72);
      roughness = 0.95;
    }

    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness,
      metalness: 0.05,
      bumpMap: this.fabricTexture,
      bumpScale: 0.02
    });
  }

  buildSofa(configType) {
    if (this.sofaGroup) {
      this.scene.remove(this.sofaGroup);
    }

    this.currentConfig = configType;
    this.sofaGroup = new THREE.Group();

    const fabricMat = this.createFabricMaterial(this.currentColor, this.isDirty);
    
    // Wooden legs material
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      roughness: 0.4,
      metalness: 0.1
    });

    // Determine dimensions based on config
    let seatCount = 3;
    let seatWidth = 0.85;
    let seatDepth = 0.9;
    let seatHeight = 0.32;
    let hasChaise = false;

    if (configType === '1-seater') {
      seatCount = 1;
    } else if (configType === '2-seater') {
      seatCount = 2;
    } else if (configType === '3-seater') {
      seatCount = 3;
    } else if (configType === 'l-shape') {
      seatCount = 3;
      hasChaise = true;
    }

    const totalWidth = seatCount * seatWidth;
    const startX = -totalWidth / 2 + seatWidth / 2;

    // 1. Sofa Base Frame
    const baseGeo = new THREE.BoxGeometry(totalWidth + 0.35, 0.2, seatDepth + 0.15);
    const baseMesh = new THREE.Mesh(baseGeo, fabricMat);
    baseMesh.position.set(0, 0.35, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.sofaGroup.add(baseMesh);

    // 2. Seat Cushions
    for (let i = 0; i < seatCount; i++) {
      const cx = startX + i * seatWidth;
      const isLastCushion = hasChaise && i === seatCount - 1;
      const cushionDepth = isLastCushion ? seatDepth + 0.7 : seatDepth;
      const cushionZ = isLastCushion ? 0.35 : 0;

      const cushionGeo = new THREE.BoxGeometry(seatWidth - 0.05, seatHeight, cushionDepth);
      const cushionMesh = new THREE.Mesh(cushionGeo, fabricMat);
      cushionMesh.position.set(cx, 0.58, cushionZ);
      cushionMesh.castShadow = true;
      cushionMesh.receiveShadow = true;
      this.sofaGroup.add(cushionMesh);

      // Backrest Cushion
      const backGeo = new THREE.BoxGeometry(seatWidth - 0.05, 0.55, 0.25);
      const backMesh = new THREE.Mesh(backGeo, fabricMat);
      backMesh.position.set(cx, 0.92, -seatDepth / 2 + 0.05);
      backMesh.rotation.x = 0.08; // Slight ergonomic recline
      backMesh.castShadow = true;
      backMesh.receiveShadow = true;
      this.sofaGroup.add(backMesh);
    }

    // 3. Backrest Frame Behind Pillows
    const backFrameGeo = new THREE.BoxGeometry(totalWidth + 0.35, 0.7, 0.15);
    const backFrame = new THREE.Mesh(backFrameGeo, fabricMat);
    backFrame.position.set(0, 0.8, -seatDepth / 2 - 0.05);
    backFrame.castShadow = true;
    this.sofaGroup.add(backFrame);

    // 4. Armrests (Left & Right)
    const armGeo = new THREE.BoxGeometry(0.22, 0.48, seatDepth + 0.18);
    
    // Left Armrest
    const leftArm = new THREE.Mesh(armGeo, fabricMat);
    leftArm.position.set(-totalWidth / 2 - 0.08, 0.62, 0);
    leftArm.castShadow = true;
    this.sofaGroup.add(leftArm);

    // Right Armrest (or Chaise arm)
    const rightArm = new THREE.Mesh(armGeo, fabricMat);
    const rightArmZ = hasChaise ? 0.35 : 0;
    const rightArmDepth = hasChaise ? seatDepth + 0.7 : seatDepth + 0.18;
    rightArm.geometry = new THREE.BoxGeometry(0.22, 0.48, rightArmDepth);
    rightArm.position.set(totalWidth / 2 + 0.08, 0.62, rightArmZ);
    rightArm.castShadow = true;
    this.sofaGroup.add(rightArm);

    // 5. Tapered Wooden Legs (4 standard legs + extra for chaise)
    const legGeo = new THREE.CylinderGeometry(0.04, 0.02, 0.26, 16);
    const legPositions = [
      [-totalWidth / 2, 0.13, -seatDepth / 2 + 0.1],
      [totalWidth / 2, 0.13, -seatDepth / 2 + 0.1],
      [-totalWidth / 2, 0.13, seatDepth / 2],
      [totalWidth / 2, 0.13, hasChaise ? seatDepth + 0.6 : seatDepth / 2]
    ];

    if (hasChaise) {
      legPositions.push([totalWidth / 2 - seatWidth, 0.13, seatDepth + 0.6]);
    }

    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, woodMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      this.sofaGroup.add(leg);
    });

    // 6. Accent Toss Pillows
    const pillowMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Fresh Green Accent
      roughness: 0.85
    });
    const pillowGeo = new THREE.BoxGeometry(0.35, 0.35, 0.12);
    
    const leftPillow = new THREE.Mesh(pillowGeo, pillowMat);
    leftPillow.position.set(-totalWidth / 2 + 0.18, 0.72, 0.05);
    leftPillow.rotation.y = 0.35;
    leftPillow.rotation.z = -0.15;
    leftPillow.castShadow = true;
    this.sofaGroup.add(leftPillow);

    if (!hasChaise) {
      const rightPillow = new THREE.Mesh(pillowGeo, pillowMat);
      rightPillow.position.set(totalWidth / 2 - 0.18, 0.72, 0.05);
      rightPillow.rotation.y = -0.35;
      rightPillow.rotation.z = 0.15;
      rightPillow.castShadow = true;
      this.sofaGroup.add(rightPillow);
    }

    // Center and adjust vertical alignment
    this.sofaGroup.position.set(0, 0, 0);
    this.scene.add(this.sofaGroup);
  }

  setupParticles() {
    this.particlesGroup = new THREE.Group();
    this.scene.add(this.particlesGroup);

    // Floating Cleaning Foam / Soap Bubbles
    const bubbleGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const bubbleMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 0.85,
      transparent: true,
      roughness: 0.1,
      ior: 1.33 // Water / Soap film
    });

    const bubbleCount = 28;
    for (let i = 0; i < bubbleCount; i++) {
      const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
      this.resetBubble(bubble);
      bubble.position.y = Math.random() * 2.2;
      this.particlesGroup.add(bubble);
      this.foamParticles.push(bubble);
    }

    // High Pressure Cleaning Spray particle system
    const sprayCount = 180;
    const sprayGeo = new THREE.BufferGeometry();
    const sprayPositions = new Float32Array(sprayCount * 3);
    const sprayVelocities = [];

    for (let i = 0; i < sprayCount; i++) {
      sprayPositions[i * 3] = 0;
      sprayPositions[i * 3 + 1] = -10; // hidden initially
      sprayPositions[i * 3 + 2] = 0;
      sprayVelocities.push({
        x: (Math.random() - 0.5) * 0.06,
        y: -0.04 - Math.random() * 0.05,
        z: (Math.random() - 0.5) * 0.06
      });
    }

    sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));
    const sprayMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.04,
      transparent: true,
      opacity: 0.8
    });

    this.sprayParticles = new THREE.Points(sprayGeo, sprayMat);
    this.sprayVelocities = sprayVelocities;
    this.scene.add(this.sprayParticles);
  }

  resetBubble(bubble) {
    bubble.position.x = (Math.random() - 0.5) * 3.5;
    bubble.position.z = (Math.random() - 0.5) * 2.5;
    bubble.position.y = 0.2 + Math.random() * 0.3;
    bubble.scale.setScalar(0.5 + Math.random() * 0.9);
    bubble.userData = {
      speedY: 0.008 + Math.random() * 0.012,
      wobbleSpeed: 2 + Math.random() * 3,
      wobbleAmp: 0.005 + Math.random() * 0.008,
      seed: Math.random() * 10
    };
  }

  setupHotspots() {
    this.hotspots = [
      {
        id: 'hs-extraction',
        pos: new THREE.Vector3(0, 0.72, 0.15),
        title: 'Deep Extraction Wand',
        step: 'Step 05 — Extraction',
        desc: 'Pressurized botanical rinse extracts 95% moisture & embedded grime.'
      },
      {
        id: 'hs-uv',
        pos: new THREE.Vector3(0, 1.25, -0.4),
        title: 'Anti-Mite UV Shield',
        step: 'Step 06 — Sanitization',
        desc: 'Sterilizes bacteria & kills 99.9% dust mites inside cushion foam.'
      },
      {
        id: 'hs-foam',
        pos: new THREE.Vector3(-1.2, 0.85, 0.1),
        title: 'Enzyme Pre-Treatment',
        step: 'Step 03 — Pre-Spray',
        desc: 'Breaks down coffee, grease & sweat stains without fabric discoloration.'
      }
    ];

    const oldHost = this.container.querySelector('.sofa-hotspots-host');
    if (oldHost) oldHost.remove();

    const host = document.createElement('div');
    host.className = 'sofa-hotspots-host absolute inset-0 pointer-events-none z-20';
    this.container.appendChild(host);

    this.hotspotElements = this.hotspots.map(hs => {
      const el = document.createElement('div');
      el.className = 'absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group';
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-60"></span>
          <div class="w-7 h-7 rounded-full bg-[#0C4A34] hover:bg-[#083324] text-white font-black text-xs flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-125 transition-transform">
            +
          </div>
          <div class="absolute bottom-9 left-1/2 -translate-x-1/2 w-52 bg-slate-950/95 backdrop-blur-md text-white p-3 rounded-2xl text-left border border-emerald-500/30 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
            <div class="text-[10px] font-bold uppercase text-emerald-400 font-mono tracking-wider">${hs.step}</div>
            <div class="text-xs font-black text-white mt-0.5">${hs.title}</div>
            <div class="text-[11px] text-stone-300 mt-1 leading-snug">${hs.desc}</div>
          </div>
        </div>
      `;
      host.appendChild(el);
      return { data: hs, dom: el };
    });
  }

  updateHotspots() {
    if (!this.hotspotElements || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const tempV = new THREE.Vector3();

    this.hotspotElements.forEach(item => {
      tempV.copy(item.data.pos);
      tempV.project(this.camera);

      if (tempV.z > 1) {
        item.dom.style.display = 'none';
        return;
      }

      item.dom.style.display = 'block';
      const x = (tempV.x * 0.5 + 0.5) * width;
      const y = (tempV.y * -0.5 + 0.5) * height;
      item.dom.style.left = `${x}px`;
      item.dom.style.top = `${y}px`;
    });
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    // Update OrbitControls
    if (this.controls) {
      this.controls.update();
    }

    // Update 3D Hotspots Screen Positions
    this.updateHotspots();

    // Animate Foam Bubbles
    this.foamParticles.forEach((bubble) => {
      bubble.position.y += bubble.userData.speedY;
      bubble.position.x += Math.sin(time * bubble.userData.wobbleSpeed + bubble.userData.seed) * bubble.userData.wobbleAmp;
      bubble.position.z += Math.cos(time * bubble.userData.wobbleSpeed + bubble.userData.seed) * bubble.userData.wobbleAmp;

      if (bubble.position.y > 2.6) {
        this.resetBubble(bubble);
      }
    });

    // Animate Spray Particles when active
    if (this.isSprayActive && this.sprayParticles) {
      const positions = this.sprayParticles.geometry.attributes.position.array;
      for (let i = 0; i < this.sprayVelocities.length; i++) {
        positions[i * 3] += this.sprayVelocities[i].x;
        positions[i * 3 + 1] += this.sprayVelocities[i].y;
        positions[i * 3 + 2] += this.sprayVelocities[i].z;

        // Reset spray droplet
        if (positions[i * 3 + 1] < 0.2) {
          positions[i * 3] = (Math.random() - 0.5) * 2.4;
          positions[i * 3 + 1] = 1.8 + Math.random() * 0.5;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
        }
      }
      this.sprayParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Public Methods
  setColor(hexColor) {
    this.currentColor = hexColor;
    this.buildSofa(this.currentConfig);
  }

  setConfig(configType) {
    this.currentConfig = configType;
    this.buildSofa(configType);
  }

  setDirtyState(dirty) {
    this.isDirty = dirty;
    this.buildSofa(this.currentConfig);
  }

  triggerCleaningDemo(onComplete) {
    this.isSprayActive = true;
    this.setDirtyState(true);

    // After 2.5s of deep washing, reveal pristine sanitized sofa
    setTimeout(() => {
      this.isSprayActive = false;
      // hide spray
      const positions = this.sprayParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i++) {
        positions[i] = -10;
      }
      this.sprayParticles.geometry.attributes.position.needsUpdate = true;
      this.setDirtyState(false);
      if (onComplete) onComplete();
    }, 2400);
  }
}

window.Sofa3DViewer = Sofa3DViewer;
