/**
 * Siri Sofa Services — Next-Gen Full-Page 3D Spatial Scroll Engine
 * 
 * Features:
 * - Full-page 3D perspective scroll transformations (Z-axis translation, 3D section tilting)
 * - Interactive 3D cursor tilt with dynamic specular light glare on all cards
 * - Ambient spatial canvas with floating 3D geometric depth rings and bubbles
 * - Smooth scroll velocity calculation and depth layers
 * - High performance (60 FPS): RAF loops, GPU-accelerated transforms, zero layout thrashing
 */

class Spatial3DScrollEngine {
  constructor() {
    this.scrollY = 0;
    this.targetScrollY = 0;
    this.scrollVelocity = 0;
    this.lastScrollY = 0;
    this.isScrolling = false;
    this.mouse = { x: 0.5, y: 0.5, currentX: 0.5, currentY: 0.5 };
    
    this.sections = [];
    this.tiltCards = [];
    this.spatialCanvas = null;
    this.spatialCtx = null;
    this.spatialParticles = [];
    
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    console.log("🌌 Initializing Siri Sofa Full-Page 3D Spatial Scroll Engine...");

    // 1. Setup Document 3D Perspective
    document.documentElement.classList.add('spatial-3d-active');
    
    // 2. Setup Ambient 3D Canvas
    this.setupSpatialCanvas();

    // 3. Register Event Listeners
    window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: true });
    window.addEventListener('resize', () => this.handleResize(), { passive: true });

    // 4. Scan & Register 3D Elements
    this.refreshElements();

    // 5. Setup Observer for Dynamic Content (view changes)
    const appEl = document.getElementById('app');
    if (appEl) {
      const observer = new MutationObserver(() => {
        setTimeout(() => this.refreshElements(), 100);
      });
      observer.observe(appEl, { childList: true, subtree: true });
    }

    // 6. Start Main Animation Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  refreshElements() {
    // Collect all major sections for 3D perspective flow
    const sectionSelectors = [
      'section',
      '.spatial-section',
      '#hero-view-container',
      '#hygiene-view-container',
      '#services-view-container',
      '#reviews-view-container'
    ];
    this.sections = Array.from(document.querySelectorAll(sectionSelectors.join(',')))
      .filter((el, idx, arr) => arr.indexOf(el) === idx);

    // Collect all interactive cards for 3D cursor tilt
    const cardSelectors = [
      '.timeline-step-card',
      '.service-card',
      '.glass-card',
      '.why-card',
      '.spatial-3d-card',
      '.step-card',
      '.metric-card'
    ];
    
    const cards = document.querySelectorAll(cardSelectors.join(','));
    this.tiltCards = [];

    cards.forEach(card => {
      if (card.dataset.tilt3dInit) return;
      card.dataset.tilt3dInit = 'true';
      card.classList.add('spatial-tilt-item');

      // Add specular glare overlay if not present
      if (!card.querySelector('.spatial-glare-fx')) {
        const glare = document.createElement('div');
        glare.className = 'spatial-glare-fx';
        card.appendChild(glare);
      }

      this.tiltCards.push(card);
      this.attachTiltEvents(card);
    });
  }

  attachTiltEvents(card) {
    let bounds = null;
    let isHovered = false;

    card.addEventListener('mouseenter', () => {
      bounds = card.getBoundingClientRect();
      isHovered = true;
      card.style.transition = 'transform 0.15s cubic-bezier(0.2, 0.8, 0.3, 1), box-shadow 0.2s ease';
    });

    card.addEventListener('mousemove', (e) => {
      if (!isHovered || !bounds) return;
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      const nx = (x / bounds.width) * 2 - 1; // -1 to +1
      const ny = (y / bounds.height) * 2 - 1; // -1 to +1

      // 3D rotation angles
      const rotX = -ny * 9; // Tilt up/down
      const rotY = nx * 11; // Tilt left/right

      card.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateZ(16px) scale(1.02)`;

      // Specular light glare positioning
      const glare = card.querySelector('.spatial-glare-fx');
      if (glare) {
        const glareX = (x / bounds.width) * 100;
        const glareY = (y / bounds.height) * 100;
        glare.style.opacity = '1';
        glare.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 65%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      isHovered = false;
      card.style.transition = 'transform 0.5s cubic-bezier(0.2, 1, 0.3, 1), box-shadow 0.5s ease';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale(1)';

      const glare = card.querySelector('.spatial-glare-fx');
      if (glare) {
        glare.style.opacity = '0';
      }
    });
  }

  setupSpatialCanvas() {
    this.spatialCanvas = document.getElementById('bg-ambient-canvas');
    if (!this.spatialCanvas) {
      this.spatialCanvas = document.createElement('canvas');
      this.spatialCanvas.id = 'bg-ambient-canvas';
      this.spatialCanvas.className = 'fixed inset-0 w-full h-full pointer-events-none z-0';
      document.body.prepend(this.spatialCanvas);
    }

    this.spatialCtx = this.spatialCanvas.getContext('2d');
    this.handleResize();

    // Create 3D Spatial Particles (Clean floating bubbles & hygiene rings with Z-depth)
    this.spatialParticles = [];
    const count = 45;
    for (let i = 0; i < count; i++) {
      this.spatialParticles.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        z: Math.random() * 800 - 400, // Z-depth from -400 to +400
        radius: 12 + Math.random() * 28,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: (Math.random() - 0.5) * 0.3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        type: Math.random() > 0.4 ? 'ring' : 'orb',
        color: Math.random() > 0.35 ? 'rgba(12, 74, 52, ' : 'rgba(52, 147, 110, ' // Forest emerald tones
      });
    }
  }

  handleResize() {
    if (!this.spatialCanvas) return;
    this.canvasWidth = window.innerWidth;
    this.canvasHeight = window.innerHeight;
    this.spatialCanvas.width = this.canvasWidth;
    this.spatialCanvas.height = this.canvasHeight;
  }

  handleScroll() {
    this.scrollY = window.scrollY || window.pageYOffset;
    this.isScrolling = true;
  }

  handleMouseMove(e) {
    this.mouse.x = e.clientX / window.innerWidth;
    this.mouse.y = e.clientY / window.innerHeight;
  }

  animate() {
    requestAnimationFrame(this.animate);

    // 1. Calculate Scroll Velocity & Inertia
    this.scrollVelocity = (this.scrollY - this.lastScrollY) * 0.4;
    this.lastScrollY = this.scrollY;

    // Smooth mouse coordinates
    this.mouse.currentX += (this.mouse.x - this.mouse.currentX) * 0.08;
    this.mouse.currentY += (this.mouse.y - this.mouse.currentY) * 0.08;

    // 2. Full-Page 3D Perspective Transformations on Sections
    const viewportHeight = window.innerHeight;
    const scrollCenter = this.scrollY + viewportHeight * 0.5;

    this.sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const sectionTop = this.scrollY + rect.top;
      const sectionHeight = rect.height || 400;
      const sectionCenter = sectionTop + sectionHeight * 0.5;

      // Distance from center of viewport (-1 to +1)
      const distFromCenter = (sectionCenter - scrollCenter) / (viewportHeight * 0.85);

      // Only apply 3D transformation when near viewport
      if (distFromCenter >= -1.8 && distFromCenter <= 1.8) {
        // Clamped tilt values for elegant, non-disorienting 3D depth
        const clampedDist = Math.max(-1, Math.min(1, distFromCenter));
        
        // Tilt rotation: tilts slightly away as it enters/leaves
        const rotX = clampedDist * 3.5; 
        // Parallax Z-depth: pushes back slightly when distant from center
        const transZ = -Math.abs(clampedDist) * 45;
        // Subtle scale
        const scale = 1.0 - Math.abs(clampedDist) * 0.025;
        // Subtle mouse parallax tilt
        const mouseParallaxY = (this.mouse.currentX - 0.5) * 1.5;

        section.style.transform = `perspective(1400px) rotateX(${rotX.toFixed(2)}deg) rotateY(${mouseParallaxY.toFixed(2)}deg) translateZ(${transZ.toFixed(1)}px) scale(${scale.toFixed(3)})`;
        section.style.transformOrigin = clampedDist > 0 ? '50% 0%' : '50% 100%';
      }
    });

    // 3. Render 3D Ambient Spatial Canvas
    this.renderSpatialCanvas();
  }

  renderSpatialCanvas() {
    if (!this.spatialCtx || !this.spatialCanvas) return;
    const ctx = this.spatialCtx;
    const w = this.canvasWidth;
    const h = this.canvasHeight;

    ctx.clearRect(0, 0, w, h);

    const fov = 600; // 3D Camera Field of View
    const velY = this.scrollVelocity * 0.15;
    const mouseOffsetX = (this.mouse.currentX - 0.5) * 80;
    const mouseOffsetY = (this.mouse.currentY - 0.5) * 60;

    this.spatialParticles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY - velY;
      p.rot += p.rotSpeed;

      // Wrap-around in 3D bounds
      if (p.x < -60) p.x = w + 60;
      if (p.x > w + 60) p.x = -60;
      if (p.y < -60) p.y = h + 60;
      if (p.y > h + 60) p.y = -60;

      // 3D Perspective Projection
      const cameraZ = 700;
      const zDepth = cameraZ + p.z;
      if (zDepth <= 50) return;

      const scale = fov / zDepth;
      const projX = (p.x - w / 2 + mouseOffsetX) * scale + w / 2;
      const projY = (p.y - h / 2 + mouseOffsetY) * scale + h / 2;
      const projRadius = Math.max(1, p.radius * scale);
      const alpha = Math.min(0.35, Math.max(0.04, (0.45 * scale)));

      ctx.save();
      ctx.translate(projX, projY);
      ctx.rotate(p.rot);

      if (p.type === 'ring') {
        // Delicate 3D hygiene ring
        ctx.beginPath();
        ctx.ellipse(0, 0, projRadius * 1.3, projRadius * 0.6, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `${p.color}${alpha})`;
        ctx.lineWidth = 1.5 * scale;
        ctx.stroke();
      } else {
        // Soft glowing 3D steam orb / bubble
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, projRadius);
        grad.addColorStop(0, `${p.color}${alpha * 1.4})`);
        grad.addColorStop(0.7, `${p.color}${alpha * 0.5})`);
        grad.addColorStop(1, `${p.color}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, projRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }
}

// Global initialization
window.Spatial3DScrollEngine = Spatial3DScrollEngine;
window.spatial3DEngine = new Spatial3DScrollEngine();
