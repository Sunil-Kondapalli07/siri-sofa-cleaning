/**
 * Professional Ambient Background Animation — Siri Sofa Services
 * Subtle, luxury particle constellation & fluid gradient light orbs
 * Pure 60fps vanilla Canvas with mouse parallax and zero CPU overhead when tab is hidden.
 */

(function () {
  'use strict';

  function initAmbientBackground() {
    const canvas = document.getElementById('bg-ambient-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Honor prefers-reduced-motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse position with smooth damping
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 140
    };

    window.addEventListener('mousemove', (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    });

    // Particle nodes configuration
    const particleCount = Math.min(Math.floor((width * height) / 28000), 55);
    const particles = [];

    // Ambient floating soft color orbs (3 large, ultra-diffuse luxury ambient glow points)
    const orbs = [
      { x: width * 0.2, y: height * 0.25, r: 240, vx: 0.15, vy: 0.12, color: 'rgba(12, 74, 52, 0.035)' },
      { x: width * 0.8, y: height * 0.45, r: 280, vx: -0.12, vy: 0.16, color: 'rgba(22, 97, 68, 0.03)' },
      { x: width * 0.5, y: height * 0.85, r: 260, vx: 0.14, vy: -0.14, color: 'rgba(194, 226, 211, 0.04)' }
    ];

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.baseRadius = Math.random() * 2 + 1;
        this.radius = this.baseRadius;
        this.alpha = Math.random() * 0.35 + 0.15;
        // Warm emerald and soft gold-accented palette
        const palette = [
          '12, 74, 52',    // British Forest Green (#0C4A34)
          '22, 97, 68',    // Medium Emerald
          '52, 147, 110',  // Soft Mint
          '217, 119, 6'    // Muted Gold Amber
        ];
        this.color = palette[Math.floor(Math.random() * palette.length)];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce gently off screen boundaries
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse gentle repulsion physics
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const force = (1 - dist / mouse.radius) * 1.5;
          this.x -= (dx / dist) * force;
          this.y -= (dy / dist) * force;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Resize handling
    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    let animationFrameId = null;
    let isRunning = true;

    // Pause animation when tab is inactive to preserve CPU / battery
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isRunning = false;
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      } else {
        isRunning = true;
        animate();
      }
    });

    function animate() {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse damping
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // 1. Render subtle atmospheric ambient orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < orb.r || orb.x > width - orb.r) orb.vx *= -1;
        if (orb.y < orb.r || orb.y > height - orb.r) orb.vy *= -1;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, 'rgba(250, 249, 246, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Render connecting lines between close particles
      const maxDistance = 125;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(12, 74, 52, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Update & render particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    }

    animate();
  }

  // Self-initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAmbientBackground);
  } else {
    setTimeout(initAmbientBackground, 50);
  }

  window.initAmbientBackground = initAmbientBackground;
})();
