"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface SofaShowroomCanvasProps {
  progress: number; // 0.0 to 1.0
  mousePos: { x: number; y: number }; // -1 to 1
}

// Procedurally generate a high-resolution woven fabric normal map for photorealistic textile texture
function createFabricNormalMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // Woven twill / velvet fiber cross-hatch pattern
      const waveX = Math.sin((x / size) * Math.PI * 64);
      const waveY = Math.cos((y / size) * Math.PI * 64);
      const noise = (Math.random() - 0.5) * 0.15;
      
      const nx = (waveX * 0.5 + noise) * 127 + 128;
      const ny = (waveY * 0.5 + noise) * 127 + 128;
      const nz = 220; // Strong upward normal

      data[idx] = Math.min(255, Math.max(0, nx));
      data[idx + 1] = Math.min(255, Math.max(0, ny));
      data[idx + 2] = nz;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

export const SofaShowroomCanvas: React.FC<SofaShowroomCanvasProps> = ({
  progress,
  mousePos,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const mouseRef = useRef(mousePos);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    mouseRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 1. Scene & Renderer Setup
    const scene = new THREE.Scene();
    const bgDark = new THREE.Color("#080B0F");
    const bgWarmLight = new THREE.Color("#FAF9F6");
    scene.background = bgDark.clone();
    scene.fog = new THREE.FogExp2(0x080b0f, 0.07);

    const camera = new THREE.PerspectiveCamera(
      38,
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.6, 6.4);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. High-Fidelity Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // Warm Studio Softbox Key Light
    const keySpot = new THREE.SpotLight(0xfff3e0, 4.5);
    keySpot.position.set(4.5, 6.5, 4.5);
    keySpot.angle = Math.PI / 3.5;
    keySpot.penumbra = 0.85;
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 2048;
    keySpot.shadow.mapSize.height = 2048;
    keySpot.shadow.bias = -0.0001;
    scene.add(keySpot);

    // Cool Rim Accent Light (traced along velvet contours)
    const rimLight = new THREE.DirectionalLight(0x34d399, 2.8);
    rimLight.position.set(-4, 5, -4);
    scene.add(rimLight);

    // Soft Front Fill Light
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    fillLight.position.set(0, 2, 5);
    scene.add(fillLight);

    // Dynamic 12-Bar Extraction Laser Beam
    const laserSpot = new THREE.SpotLight(0x00f5d4, 0);
    laserSpot.position.set(0, 3.5, 2.5);
    laserSpot.angle = Math.PI / 7;
    laserSpot.penumbra = 0.6;
    scene.add(laserSpot);

    // 3. Photorealistic Fabric Shader with Microfiber Velvet Anisotropy & Extraction Wipe
    const fabricNormalMap = createFabricNormalMap();

    const customFabricMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCleanProgress: { value: 0.0 },
        uSweepX: { value: -3.5 },
        uTime: { value: 0.0 },
        uNormalMap: { value: fabricNormalMap },
        // Dirty State: Oxidized body oils, dust patina, dull gray-brown
        uDirtyBase: { value: new THREE.Color("#3A342E") },
        uDirtyShadow: { value: new THREE.Color("#24201C") },
        // Clean State: Architectural Emerald Velvet with satin sheen
        uCleanBase: { value: new THREE.Color("#0C4A34") },
        uCleanHighlight: { value: new THREE.Color("#126649") },
        uCleanSheen: { value: new THREE.Color("#34D399") },
        uLaserGlow: { value: new THREE.Color("#00F5D4") },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        varying vec3 vViewPosition;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uCleanProgress;
        uniform float uSweepX;
        uniform float uTime;
        uniform sampler2D uNormalMap;

        uniform vec3 uDirtyBase;
        uniform vec3 uDirtyShadow;
        uniform vec3 uCleanBase;
        uniform vec3 uCleanHighlight;
        uniform vec3 uCleanSheen;
        uniform vec3 uLaserGlow;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        varying vec3 vViewPosition;

        // Micro procedural noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          
          // Fabric micro-normal perturbation
          vec3 normalTex = texture2D(uNormalMap, vUv * 8.0).rgb * 2.0 - 1.0;
          vec3 N = normalize(vNormal + normalTex * 0.22);

          // Velvet Anisotropic Sheen / Grazing Fuzz (Fresnel)
          float NdotV = max(dot(N, viewDir), 0.0);
          float velvetSheen = pow(1.0 - NdotV, 2.6);

          // Clean wave threshold calculation
          float distToSweep = vWorldPosition.x - uSweepX;
          float isClean = step(0.0, -distToSweep);
          if (uCleanProgress >= 0.70) isClean = 1.0;
          if (uCleanProgress <= 0.38) isClean = 0.0;

          // Subtle textile surface grain
          float grain = hash(vUv * 90.0) * 0.05;

          // Dirty state: dull, flat, low sheen, stained shading
          vec3 dirtyColor = mix(uDirtyShadow, uDirtyBase, NdotV * 0.8 + 0.2) + grain;

          // Clean state: rich deep emerald with radiant satiny grazing highlights
          vec3 cleanColor = mix(uCleanBase, uCleanHighlight, NdotV) + (uCleanSheen * velvetSheen * 0.75) + (grain * 0.3);

          vec3 finalColor = mix(dirtyColor, cleanColor, isClean);

          // Active 12-Bar extraction laser line
          if (uCleanProgress > 0.40 && uCleanProgress < 0.68) {
            float laserLine = smoothstep(0.18, 0.0, abs(distToSweep));
            finalColor += uLaserGlow * laserLine * 2.2;
          }

          // Directional lighting response
          vec3 lightDir = normalize(vec3(0.6, 1.2, 0.8));
          float diffuse = max(dot(N, lightDir), 0.25);
          finalColor *= diffuse + 0.25;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    // 4. Build Photorealistic Designer Sofa with Pillows, Creases, and Welted Seams
    const sofaGroup = new THREE.Group();

    // Brushed Brass Leg Material
    const brassMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.2,
    });

    // Dark Crevice Shadow Material (Ambient occlusion in seams)
    const shadowSeamMat = new THREE.MeshBasicMaterial({
      color: 0x0a0c0e,
      transparent: true,
      opacity: 0.6,
    });

    // A. Base Platform with Chamfered Edges
    const baseGeo = new THREE.BoxGeometry(3.8, 0.32, 1.7);
    const baseMesh = new THREE.Mesh(baseGeo, customFabricMaterial);
    baseMesh.position.y = 0.42;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    sofaGroup.add(baseMesh);

    // Welted piping cord around the base edge
    const basePipingGeo = new THREE.TorusGeometry(1.85, 0.02, 8, 48);
    basePipingGeo.scale(1.0, 0.05, 0.45);
    const basePiping = new THREE.Mesh(basePipingGeo, customFabricMaterial);
    basePiping.rotation.x = Math.PI / 2;
    basePiping.position.set(0, 0.58, 0);
    sofaGroup.add(basePiping);

    // B. 3 Deep Plush Cushions with Welted Seams and Realistic Soft Crown
    const cushionCount = 3;
    const cushionWidth = 1.18;

    for (let i = 0; i < cushionCount; i++) {
      const posX = (i - 1) * (cushionWidth + 0.04);

      // Main plush cushion body
      const seatGeo = new THREE.CylinderGeometry(0.62, 0.62, 0.36, 32);
      seatGeo.scale(0.95, 1.0, 1.35); // Pill shape
      const seat = new THREE.Mesh(seatGeo, customFabricMaterial);
      seat.position.set(posX, 0.72, 0.06);
      seat.castShadow = true;
      seat.receiveShadow = true;
      sofaGroup.add(seat);

      // Welted perimeter seam cord around cushion crown
      const weltGeo = new THREE.TorusGeometry(0.62, 0.018, 8, 32);
      weltGeo.scale(0.95, 1.0, 1.35);
      weltGeo.rotateX(Math.PI / 2);
      const welt = new THREE.Mesh(weltGeo, customFabricMaterial);
      welt.position.set(posX, 0.88, 0.06);
      sofaGroup.add(welt);

      // Contact shadow plate between cushions
      if (i < 2) {
        const creviceGeo = new THREE.PlaneGeometry(0.04, 1.2);
        const crevice = new THREE.Mesh(creviceGeo, shadowSeamMat);
        crevice.rotation.x = -Math.PI / 2;
        crevice.position.set(posX + cushionWidth / 2 + 0.02, 0.89, 0.06);
        sofaGroup.add(crevice);
      }
    }

    // C. Padded Backrest with Vertical Fluted Channel Tufting
    const backSupportGeo = new THREE.BoxGeometry(3.7, 0.72, 0.38);
    const backSupport = new THREE.Mesh(backSupportGeo, customFabricMaterial);
    backSupport.position.set(0, 0.98, -0.66);
    backSupport.castShadow = true;
    sofaGroup.add(backSupport);

    // Backrest Top Roll
    const topRollGeo = new THREE.CylinderGeometry(0.22, 0.22, 3.7, 24);
    topRollGeo.rotateZ(Math.PI / 2);
    const topRoll = new THREE.Mesh(topRollGeo, customFabricMaterial);
    topRoll.position.set(0, 1.34, -0.66);
    topRoll.castShadow = true;
    sofaGroup.add(topRoll);

    // 5 Fluted Vertical Tufting Channels on Backrest
    for (let j = -2; j <= 2; j++) {
      const fluteGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.65, 12);
      const flute = new THREE.Mesh(fluteGeo, shadowSeamMat);
      flute.position.set(j * 0.72, 1.0, -0.46);
      sofaGroup.add(flute);
    }

    // D. 2 Flared Sculptural Armrests with Piping Trim
    const armGeo = new THREE.BoxGeometry(0.35, 0.62, 1.65);
    
    // Left Arm
    const leftArm = new THREE.Mesh(armGeo, customFabricMaterial);
    leftArm.position.set(-1.95, 0.82, 0.06);
    leftArm.castShadow = true;
    sofaGroup.add(leftArm);

    // Left Arm Top Curved Cap
    const armCapGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.65, 16);
    armCapGeo.rotateX(Math.PI / 2);
    const leftCap = new THREE.Mesh(armCapGeo, customFabricMaterial);
    leftCap.position.set(-1.95, 1.13, 0.06);
    leftCap.castShadow = true;
    sofaGroup.add(leftCap);

    // Right Arm
    const rightArm = new THREE.Mesh(armGeo, customFabricMaterial);
    rightArm.position.set(1.95, 0.82, 0.06);
    rightArm.castShadow = true;
    sofaGroup.add(rightArm);

    const rightCap = new THREE.Mesh(armCapGeo, customFabricMaterial);
    rightCap.position.set(1.95, 1.13, 0.06);
    rightCap.castShadow = true;
    sofaGroup.add(rightCap);

    // E. 2 Designer Luxury Accent Throw Pillows (Adds realistic showroom staging)
    const pillowMat = customFabricMaterial.clone();

    // Pillow Left (Resting angled against left arm)
    const pillowGeo = new THREE.BoxGeometry(0.55, 0.55, 0.22);
    const pillowLeft = new THREE.Mesh(pillowGeo, pillowMat);
    pillowLeft.position.set(-1.52, 0.95, -0.2);
    pillowLeft.rotation.set(0.15, 0.35, -0.3);
    pillowLeft.castShadow = true;
    sofaGroup.add(pillowLeft);

    // Pillow Right (Resting angled against right arm)
    const pillowRight = new THREE.Mesh(pillowGeo, pillowMat);
    pillowRight.position.set(1.52, 0.95, -0.15);
    pillowRight.rotation.set(0.1, -0.4, 0.28);
    pillowRight.castShadow = true;
    sofaGroup.add(pillowRight);

    // F. 4 Architectural Tapered Brass Legs with Dark Shadow Rings
    const legGeo = new THREE.CylinderGeometry(0.042, 0.022, 0.38, 16);
    const legCoords = [
      [-1.75, 0.19, -0.68],
      [1.75, 0.19, -0.68],
      [-1.75, 0.19, 0.68],
      [1.75, 0.19, 0.68],
    ];

    legCoords.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, brassMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      sofaGroup.add(leg);

      // Contact shadow disc under each leg
      const shadowDisc = new THREE.Mesh(
        new THREE.CircleGeometry(0.09, 16),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 })
      );
      shadowDisc.rotation.x = -Math.PI / 2;
      shadowDisc.position.set(x, 0.005, z);
      sofaGroup.add(shadowDisc);
    });

    scene.add(sofaGroup);

    // Large Ground Shadow Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.45 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // 5. 1,400 Micro-Dust & Extraction Steam Particle Physics
    const particleCount = 1400;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const originalPos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 4.4;
      const y = Math.random() * 1.6 + 0.35;
      const z = (Math.random() - 0.5) * 2.6;

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      originalPos[i * 3] = x;
      originalPos[i * 3 + 1] = y;
      originalPos[i * 3 + 2] = z;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.048,
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particles);

    // 6. Camera Waypoint Choreography
    const cameraTarget = new THREE.Vector3(0, 0.5, 0);

    const getCameraWaypoint = (t: number) => {
      // 0.00 - 0.15: Scene 1 - Cinematic Dark Prologue
      if (t <= 0.15) {
        const subT = t / 0.15;
        return {
          pos: new THREE.Vector3(0, 1.8, 6.4).lerp(new THREE.Vector3(0.5, 1.5, 5.6), subT),
          target: new THREE.Vector3(0, 0.45, 0),
          fogDensity: 0.07,
          envClean: 0.0,
        };
      }
      // 0.15 - 0.30: Scene 2 - Emergence & Curvature Highlight
      if (t <= 0.30) {
        const subT = (t - 0.15) / 0.15;
        return {
          pos: new THREE.Vector3(0.5, 1.5, 5.6).lerp(new THREE.Vector3(1.3, 1.25, 4.2), subT),
          target: new THREE.Vector3(0, 0.5, 0),
          fogDensity: 0.05 - subT * 0.02,
          envClean: 0.12,
        };
      }
      // 0.30 - 0.45: Scene 3 - Macro Inspection of Fabric Weave & Amber Dust
      if (t <= 0.45) {
        const subT = (t - 0.30) / 0.15;
        return {
          pos: new THREE.Vector3(1.3, 1.25, 4.2).lerp(new THREE.Vector3(-0.75, 0.88, 2.3), subT),
          target: new THREE.Vector3(-0.25, 0.68, 0.2),
          fogDensity: 0.03,
          envClean: 0.22,
        };
      }
      // 0.45 - 0.65: Scene 4 - Active 12-Bar Thermal Extraction Sweep
      if (t <= 0.65) {
        const subT = (t - 0.45) / 0.20;
        return {
          pos: new THREE.Vector3(-0.75, 0.88, 2.3).lerp(new THREE.Vector3(1.7, 1.15, 3.4), subT),
          target: new THREE.Vector3(0.1, 0.5, 0),
          fogDensity: 0.02,
          envClean: 0.35 + subT * 0.5,
        };
      }
      // 0.65 - 0.78: Scene 5 - Pull-Back: Bright Sanctuary Daylight
      if (t <= 0.78) {
        const subT = (t - 0.65) / 0.13;
        return {
          pos: new THREE.Vector3(1.7, 1.15, 3.4).lerp(new THREE.Vector3(0, 1.55, 4.9), subT),
          target: new THREE.Vector3(0, 0.45, 0),
          fogDensity: 0.01,
          envClean: 0.85 + subT * 0.15,
        };
      }
      // 0.78 - 0.90: Scene 6 - 3D Showroom Offset for Service Cards
      if (t <= 0.90) {
        const subT = (t - 0.78) / 0.12;
        return {
          pos: new THREE.Vector3(0, 1.55, 4.9).lerp(new THREE.Vector3(-1.35, 1.25, 4.3), subT),
          target: new THREE.Vector3(0.35, 0.45, 0),
          fogDensity: 0.005,
          envClean: 1.0,
        };
      }
      // 0.90 - 1.00: Scene 7 - Final Centered Grand CTA
      const subT = (t - 0.90) / 0.10;
      return {
        pos: new THREE.Vector3(-1.35, 1.25, 4.3).lerp(new THREE.Vector3(0, 1.45, 4.8), subT),
        target: new THREE.Vector3(0, 0.45, 0),
        fogDensity: 0.005,
        envClean: 1.0,
      };
    };

    // 7. Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      const elapsedTime = clock.getElapsedTime();
      const p = progressRef.current;
      const mouse = mouseRef.current;

      // Update shader uniforms
      customFabricMaterial.uniforms.uTime.value = elapsedTime;
      customFabricMaterial.uniforms.uCleanProgress.value = p;

      // Map progress 0.40 - 0.68 to sweep line X (-2.7 to +2.7)
      if (p >= 0.40 && p <= 0.68) {
        const sweepT = (p - 0.40) / 0.28;
        customFabricMaterial.uniforms.uSweepX.value = -2.8 + sweepT * 5.6;
        laserSpot.intensity = Math.sin(sweepT * Math.PI) * 5.2;
        laserSpot.position.x = customFabricMaterial.uniforms.uSweepX.value;
      } else {
        laserSpot.intensity = 0;
      }

      // Camera interpolation from scroll
      const waypoint = getCameraWaypoint(p);

      // Smooth camera position with slight mouse parallax
      const targetCamX = waypoint.pos.x + mouse.x * 0.32;
      const targetCamY = waypoint.pos.y - mouse.y * 0.22;
      const targetCamZ = waypoint.pos.z;

      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.y += (targetCamY - camera.position.y) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;

      cameraTarget.x += (waypoint.target.x + mouse.x * 0.12 - cameraTarget.x) * 0.08;
      cameraTarget.y += (waypoint.target.y - cameraTarget.y) * 0.08;
      cameraTarget.z += (waypoint.target.z - cameraTarget.z) * 0.08;

      camera.lookAt(cameraTarget);

      // Subtle sofa idle breathing
      sofaGroup.rotation.y = Math.sin(elapsedTime * 0.55) * 0.025 + mouse.x * 0.07;
      sofaGroup.rotation.x = mouse.y * 0.035;

      // Dynamic background color transition (Dark charcoal -> Warm sanctuary daylight)
      const currentBg = bgDark.clone().lerp(bgWarmLight, waypoint.envClean);
      scene.background = currentBg;
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color = currentBg;
        (scene.fog as THREE.FogExp2).density = waypoint.fogDensity;
      }

      // Dynamic studio lighting intensity
      keySpot.intensity = 3.0 + waypoint.envClean * 2.5;

      // 8. Particle System Dynamics
      const positions = particleGeo.attributes.position.array as Float32Array;

      // Problem Phase (0.28 - 0.45): Amber dust particles reveal
      if (p >= 0.26 && p < 0.45) {
        const dustAlpha = Math.min(1.0, (p - 0.26) / 0.10);
        particleMaterial.opacity = dustAlpha * 0.85;
        particleMaterial.color.setHex(0xf59e0b); // Amber allergen dust

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += Math.sin(elapsedTime * 2.0 + i) * 0.002;
          positions[i * 3] += Math.cos(elapsedTime * 1.5 + i) * 0.002;
        }
      }
      // Extraction Phase (0.45 - 0.68): High-speed extraction steam vortex
      else if (p >= 0.45 && p <= 0.68) {
        particleMaterial.opacity = 0.95;
        particleMaterial.color.setHex(0x00f5d4); // Cyan steam mist

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += 0.045; // Rapid upward suction
          positions[i * 3] += Math.sin(positions[i * 3 + 1] * 3.5) * 0.025;

          if (positions[i * 3 + 1] > 3.6) {
            positions[i * 3 + 1] = 0.45;
            positions[i * 3] = originalPos[i * 3];
          }
        }
      }
      // Clean Sanctuary Phase (0.68+): Micro pure-oxygen emerald sparkles
      else if (p > 0.68) {
        particleMaterial.opacity = 0.38;
        particleMaterial.color.setHex(0x10b981); // Emerald pure sparkles

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += 0.004;
          if (positions[i * 3 + 1] > 2.8) positions[i * 3 + 1] = 0.5;
        }
      } else {
        particleMaterial.opacity = 0.0;
      }

      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 9. Resize Handling
    const handleResize = () => {
      if (!canvas) return;
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      customFabricMaterial.dispose();
      fabricNormalMap.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
