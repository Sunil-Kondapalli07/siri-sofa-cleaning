"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";

interface SofaShowroomCanvasProps {
  progress: number; // 0.0 to 1.0
  mousePos: { x: number; y: number }; // -1 to 1
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
    const bgDark = new THREE.Color("#090C10");
    const bgLight = new THREE.Color("#FAF9F6");
    scene.background = bgDark.clone();
    scene.fog = new THREE.FogExp2(0x090c10, 0.08);

    const camera = new THREE.PerspectiveCamera(
      42,
      canvas.offsetWidth / canvas.offsetHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.8, 6.2);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const keySpot = new THREE.SpotLight(0xffffff, 3.8);
    keySpot.position.set(4, 6, 4);
    keySpot.angle = Math.PI / 4;
    keySpot.penumbra = 0.8;
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.width = 1024;
    keySpot.shadow.mapSize.height = 1024;
    scene.add(keySpot);

    const fillLight = new THREE.DirectionalLight(0x8bc34a, 1.2);
    fillLight.position.set(-5, 3, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 2.5);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Extraction Laser Light (Activated during cleaning 0.45 - 0.65)
    const laserSpot = new THREE.SpotLight(0x22d3ee, 0);
    laserSpot.position.set(0, 3, 2);
    laserSpot.angle = Math.PI / 6;
    scene.add(laserSpot);

    // 3. Dynamic Transformation Shader for the Sofa Velvet
    const customMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCleanProgress: { value: 0.0 }, // 0.0 = dirty, 1.0 = clean
        uSweepX: { value: -3.0 }, // Sweep line from -2.5 to +2.5
        uTime: { value: 0.0 },
        uDirtyColor: { value: new THREE.Color("#433C35") }, // Dull, oxidized oils, dust
        uCleanColor: { value: new THREE.Color("#0C4A34") }, // Rich luxury emerald velvet
        uCleanHighlight: { value: new THREE.Color("#10B981") }, // Specular velvet sheen
        uLaserColor: { value: new THREE.Color("#00F5D4") }, // 12-bar thermal laser line
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uCleanProgress;
        uniform float uSweepX;
        uniform float uTime;
        uniform vec3 uDirtyColor;
        uniform vec3 uCleanColor;
        uniform vec3 uCleanHighlight;
        uniform vec3 uLaserColor;

        varying vec3 vNormal;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        // Subtle procedural noise for textile fibers
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);

          // Calculate distance to active cleaning wave
          float distToSweep = vWorldPosition.x - uSweepX;
          
          // Determine clean vs dirty state based on progress and wave position
          float isClean = step(0.0, -distToSweep);
          if (uCleanProgress >= 0.70) isClean = 1.0;
          if (uCleanProgress <= 0.40) isClean = 0.0;

          // Micro textile noise
          float grain = hash(vUv * 80.0) * 0.08;

          // Velvet lighting response
          vec3 dirtyShade = uDirtyColor + grain;
          vec3 cleanShade = mix(uCleanColor, uCleanHighlight, fresnel * 0.85) + (grain * 0.5);

          vec3 finalColor = mix(dirtyShade, cleanShade, isClean);

          // Glowing laser line at the extraction boundary
          if (uCleanProgress > 0.42 && uCleanProgress < 0.68) {
            float laserGlow = smoothstep(0.18, 0.0, abs(distToSweep));
            finalColor += uLaserColor * laserGlow * 1.8;
          }

          // Subtle ambient shading
          float NdotL = max(dot(vNormal, normalize(vec3(0.5, 1.0, 0.8))), 0.2);
          finalColor *= NdotL + 0.3;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    });

    // 4. Build Architectural 3D Designer Sofa
    const sofaGroup = new THREE.Group();

    // Wood / Brass Leg Material
    const legMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.25,
    });

    // Base Frame (Low slung luxury silhouette)
    const baseGeo = new THREE.BoxGeometry(3.6, 0.28, 1.6);
    const baseMesh = new THREE.Mesh(baseGeo, customMaterial);
    baseMesh.position.y = 0.4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    sofaGroup.add(baseMesh);

    // 3 Plush Seat Cushions
    const cushionGeo = new THREE.CylinderGeometry(0.58, 0.58, 0.32, 32);
    cushionGeo.scale(1.0, 1.0, 1.35); // Curved pill cushion shape

    for (let i = -1; i <= 1; i++) {
      const seat = new THREE.Mesh(cushionGeo, customMaterial);
      seat.position.set(i * 1.15, 0.65, 0.05);
      seat.castShadow = true;
      seat.receiveShadow = true;
      sofaGroup.add(seat);
    }

    // Ergonomic Backrest with Smooth Organic Curve
    const backGeo = new THREE.CylinderGeometry(0.24, 0.24, 3.6, 24);
    backGeo.rotateZ(Math.PI / 2);
    const backMesh = new THREE.Mesh(backGeo, customMaterial);
    backMesh.position.set(0, 1.15, -0.65);
    backMesh.castShadow = true;
    sofaGroup.add(backMesh);

    const backSupportGeo = new THREE.BoxGeometry(3.6, 0.6, 0.35);
    const backSupport = new THREE.Mesh(backSupportGeo, customMaterial);
    backSupport.position.set(0, 0.85, -0.65);
    backSupport.castShadow = true;
    sofaGroup.add(backSupport);

    // 2 Sculptural Padded Armrests
    const armGeo = new THREE.BoxGeometry(0.32, 0.52, 1.55);
    const leftArm = new THREE.Mesh(armGeo, customMaterial);
    leftArm.position.set(-1.85, 0.75, 0.05);
    leftArm.castShadow = true;
    sofaGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, customMaterial);
    rightArm.position.set(1.85, 0.75, 0.05);
    rightArm.castShadow = true;
    sofaGroup.add(rightArm);

    // 4 Architectural Tapered Legs
    const legGeo = new THREE.CylinderGeometry(0.035, 0.02, 0.32, 16);
    const legOffsets = [
      [-1.65, 0.16, -0.65],
      [1.65, 0.16, -0.65],
      [-1.65, 0.16, 0.65],
      [1.65, 0.16, 0.65],
    ];

    legOffsets.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMaterial);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      sofaGroup.add(leg);
    });

    scene.add(sofaGroup);

    // Shadow Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // 5. Particle System (1,200 Particles: Dust, Allergens & Extraction Steam)
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const originalPos = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 4.2;
      const y = Math.random() * 1.5 + 0.3;
      const z = (Math.random() - 0.5) * 2.5;

      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;

      originalPos[i * 3] = x;
      originalPos[i * 3 + 1] = y;
      originalPos[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.01;
      velocities[i * 3 + 1] = Math.random() * 0.02 + 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.045,
      color: 0xf59e0b, // Amber dust initial color
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMaterial);
    scene.add(particles);

    // 6. Camera Waypoints Keyframes
    const cameraTarget = new THREE.Vector3(0, 0.5, 0);

    const getCameraWaypoint = (t: number) => {
      // 0.00 - 0.15: Scene 1 - Prologue (Far away, mysterious low angle)
      if (t <= 0.15) {
        const subT = t / 0.15;
        return {
          pos: new THREE.Vector3(0, 1.8, 6.2).lerp(new THREE.Vector3(0.6, 1.6, 5.4), subT),
          target: new THREE.Vector3(0, 0.4, 0),
          fogDensity: 0.08,
          envClean: 0.0,
        };
      }
      // 0.15 - 0.30: Scene 2 - Emergence (Glides closer, studio lights warm up)
      if (t <= 0.30) {
        const subT = (t - 0.15) / 0.15;
        return {
          pos: new THREE.Vector3(0.6, 1.6, 5.4).lerp(new THREE.Vector3(1.3, 1.3, 4.2), subT),
          target: new THREE.Vector3(0, 0.5, 0),
          fogDensity: 0.06 - subT * 0.02,
          envClean: 0.1,
        };
      }
      // 0.30 - 0.45: Scene 3 - Macro Zoom into Fabric & Dust Mites
      if (t <= 0.45) {
        const subT = (t - 0.30) / 0.15;
        return {
          pos: new THREE.Vector3(1.3, 1.3, 4.2).lerp(new THREE.Vector3(-0.7, 0.85, 2.2), subT),
          target: new THREE.Vector3(-0.25, 0.65, 0.2),
          fogDensity: 0.03,
          envClean: 0.2,
        };
      }
      // 0.45 - 0.65: Scene 4 - Extraction Sweep & Steam Vortex
      if (t <= 0.65) {
        const subT = (t - 0.45) / 0.20;
        return {
          pos: new THREE.Vector3(-0.7, 0.85, 2.2).lerp(new THREE.Vector3(1.6, 1.1, 3.4), subT),
          target: new THREE.Vector3(0.1, 0.5, 0),
          fogDensity: 0.02,
          envClean: 0.3 + subT * 0.5,
        };
      }
      // 0.65 - 0.78: Scene 5 - Pull-Back: Pristine Sanctuary Result
      if (t <= 0.78) {
        const subT = (t - 0.65) / 0.13;
        return {
          pos: new THREE.Vector3(1.6, 1.1, 3.4).lerp(new THREE.Vector3(0, 1.55, 4.8), subT),
          target: new THREE.Vector3(0, 0.45, 0),
          fogDensity: 0.01,
          envClean: 0.85 + subT * 0.15,
        };
      }
      // 0.78 - 0.90: Scene 6 - 3D Showroom Offset (shifts for service cards)
      if (t <= 0.90) {
        const subT = (t - 0.78) / 0.12;
        return {
          pos: new THREE.Vector3(0, 1.55, 4.8).lerp(new THREE.Vector3(-1.3, 1.25, 4.2), subT),
          target: new THREE.Vector3(0.35, 0.45, 0),
          fogDensity: 0.005,
          envClean: 1.0,
        };
      }
      // 0.90 - 1.00: Scene 7 - Final Centered Grand CTA
      const subT = (t - 0.90) / 0.10;
      return {
        pos: new THREE.Vector3(-1.3, 1.25, 4.2).lerp(new THREE.Vector3(0, 1.45, 4.6), subT),
        target: new THREE.Vector3(0, 0.45, 0),
        fogDensity: 0.005,
        envClean: 1.0,
      };
    };

    // 7. Animation Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const render = () => {
      const elapsedTime = clock.getElapsedTime();
      const p = progressRef.current;
      const mouse = mouseRef.current;

      // Update shader uniforms
      customMaterial.uniforms.uTime.value = elapsedTime;
      customMaterial.uniforms.uCleanProgress.value = p;

      // Map progress 0.45 - 0.65 to sweep line X (-2.5 to +2.5)
      if (p >= 0.42 && p <= 0.68) {
        const sweepT = (p - 0.42) / 0.26;
        customMaterial.uniforms.uSweepX.value = -2.6 + sweepT * 5.2;
        laserSpot.intensity = Math.sin(sweepT * Math.PI) * 4.5;
        laserSpot.position.x = customMaterial.uniforms.uSweepX.value;
      } else {
        laserSpot.intensity = 0;
      }

      // Camera interpolation from scroll
      const waypoint = getCameraWaypoint(p);

      // Smooth camera position with slight mouse parallax
      const targetCamX = waypoint.pos.x + mouse.x * 0.35;
      const targetCamY = waypoint.pos.y - mouse.y * 0.25;
      const targetCamZ = waypoint.pos.z;

      camera.position.x += (targetCamX - camera.position.x) * 0.08;
      camera.position.y += (targetCamY - camera.position.y) * 0.08;
      camera.position.z += (targetCamZ - camera.position.z) * 0.08;

      cameraTarget.x += (waypoint.target.x + mouse.x * 0.15 - cameraTarget.x) * 0.08;
      cameraTarget.y += (waypoint.target.y - cameraTarget.y) * 0.08;
      cameraTarget.z += (waypoint.target.z - cameraTarget.z) * 0.08;

      camera.lookAt(cameraTarget);

      // Subtle sofa idle breathing rotation
      sofaGroup.rotation.y = Math.sin(elapsedTime * 0.6) * 0.03 + mouse.x * 0.08;
      sofaGroup.rotation.x = mouse.y * 0.04;

      // Dynamic scene background transition (Dark charcoal -> Warm daylight)
      const currentBg = bgDark.clone().lerp(bgLight, waypoint.envClean);
      scene.background = currentBg;
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color = currentBg;
        (scene.fog as THREE.FogExp2).density = waypoint.fogDensity;
      }

      // Adjust Key light intensity based on daylight transition
      keySpot.intensity = 2.5 + waypoint.envClean * 2.0;

      // 8. Particle System Dynamics
      const positions = particleGeo.attributes.position.array as Float32Array;

      // In Problem phase (0.28 - 0.45): Amber dust particles reveal
      if (p >= 0.25 && p < 0.45) {
        const dustAlpha = Math.min(1.0, (p - 0.25) / 0.10);
        particleMaterial.opacity = dustAlpha * 0.85;
        particleMaterial.color.setHex(0xf59e0b); // Amber dust

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += Math.sin(elapsedTime * 2.0 + i) * 0.002;
          positions[i * 3] += Math.cos(elapsedTime * 1.5 + i) * 0.002;
        }
      }
      // In Extraction phase (0.45 - 0.65): Particles vortex upward like steam
      else if (p >= 0.45 && p <= 0.68) {
        particleMaterial.opacity = 0.9;
        particleMaterial.color.setHex(0x22d3ee); // Cyan steam droplets

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += 0.04; // Lift upward
          positions[i * 3] += Math.sin(positions[i * 3 + 1] * 4.0) * 0.02;

          if (positions[i * 3 + 1] > 3.5) {
            positions[i * 3 + 1] = 0.4;
            positions[i * 3] = originalPos[i * 3];
          }
        }
      }
      // In Clean phase (0.68+): Micro pure-oxygen emerald sparkles
      else if (p > 0.68) {
        particleMaterial.opacity = 0.35;
        particleMaterial.color.setHex(0x10b981); // Emerald pure sparkles

        for (let i = 0; i < particleCount; i++) {
          positions[i * 3 + 1] += 0.005;
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
      customMaterial.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};
