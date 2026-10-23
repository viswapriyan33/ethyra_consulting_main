/**
 * ============================================================================
 * ETHYRA CONSULTING SERVICES - ADVANCED 3D INTERACTIVE CONTACT ENGINE
 * Features:
 * 1. 3D Constellation Sphere & Orbital Grid on Hero Canvas
 * 2. Floating 3D Parallax Badges in Hero Section
 * 3. True Multi-Plane 3D Tilt with Real-time Specular Glare & Depth Parallax
 * 4. Concentric 3D Gyroscope Orbital Rings for Closing Tagline
 * 5. Interactive 3D Dynamic Shimmer & Particle Trails
 * ============================================================================
 */

(function() {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContact3DEngine);
  } else {
    initContact3DEngine();
  }

  function initContact3DEngine() {
    initHero3DCanvas();
    initHero3DParallax();
    initMultiPlane3DCards();
    initTagline3DGyroscope();
    initInteractive3DChips();
  }

  /* --------------------------------------------------------------------------
     1. Interactive 3D Constellation Sphere & Orbital Lattice (Hero Canvas)
     -------------------------------------------------------------------------- */
  function initHero3DCanvas() {
    const heroWrap = document.querySelector('.contact-hero-wrap');
    if (!heroWrap) return;

    // Check or create canvas
    let canvas = document.getElementById('contact-hero-3d-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'contact-hero-3d-canvas';
      canvas.className = 'contact-hero-3d-canvas';
      // Insert behind the hero content container
      const container = heroWrap.querySelector('.contact-hero-container');
      if (container) {
        heroWrap.insertBefore(canvas, container);
      } else {
        heroWrap.appendChild(canvas);
      }
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = heroWrap.offsetWidth);
    let height = (canvas.height = heroWrap.offsetHeight);

    function onResize() {
      if (!heroWrap) return;
      width = canvas.width = heroWrap.offsetWidth;
      height = canvas.height = heroWrap.offsetHeight;
    }
    window.addEventListener('resize', onResize);

    // 3D Particles on a spherical shell + latitude rings
    const NUM_PARTICLES = 85;
    const RADIUS = Math.min(width, height) * 0.42;
    const particles = [];

    for (let i = 0; i < NUM_PARTICLES; i++) {
      // Golden ratio spiral distribution on sphere
      const phi = Math.acos(1 - 2 * (i + 0.5) / NUM_PARTICLES);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;

      particles.push({
        origX: RADIUS * Math.sin(phi) * Math.cos(theta),
        origY: RADIUS * Math.sin(phi) * Math.sin(theta),
        origZ: RADIUS * Math.cos(phi),
        projX: 0,
        projY: 0,
        projScale: 1,
        projAlpha: 1,
        size: 2.2 + Math.random() * 2.6,
        pulseOffset: Math.random() * Math.PI * 2,
        color: i % 4 === 0 ? '#f59e0b' : (i % 3 === 0 ? '#38bdf8' : (i % 2 === 0 ? '#00b4d8' : '#009ae0'))
      });
    }

    // 3D Orbital ring points
    const RING_POINTS = 36;
    const ringParticles = [];
    const RING_RADIUS = RADIUS * 1.15;
    for (let i = 0; i < RING_POINTS; i++) {
      const angle = (i / RING_POINTS) * Math.PI * 2;
      ringParticles.push({
        origX: RING_RADIUS * Math.cos(angle),
        origY: (RING_RADIUS * 0.28) * Math.sin(angle),
        origZ: RING_RADIUS * Math.sin(angle),
        projX: 0,
        projY: 0,
        projAlpha: 0.5
      });
    }

    let rotX = 0.22;
    let rotY = 0;
    let targetRotX = 0.22;
    let targetRotY = 0;
    let mouseX = 0, mouseY = 0;
    let isMouseOver = false;

    heroWrap.addEventListener('mousemove', (e) => {
      const rect = heroWrap.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      const nx = mouseX / rect.width - 0.5;
      const ny = mouseY / rect.height - 0.5;
      targetRotY = nx * 1.8;
      targetRotX = -ny * 1.2;
      isMouseOver = true;
    });

    heroWrap.addEventListener('mouseleave', () => {
      targetRotX = 0.22;
      targetRotY = 0;
      isMouseOver = false;
    });

    let autoAngle = 0;
    let pulseTick = 0;

    function render3D() {
      ctx.clearRect(0, 0, width, height);

      autoAngle += 0.0028;
      pulseTick += 0.04;
      rotX += (targetRotX - rotX) * 0.06;
      rotY += (targetRotY + autoAngle - rotY) * 0.06;

      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);

      const fov = 460;
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      // Project Sphere Particles
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const p = particles[i];
        // Rotate around Y
        let x1 = p.origX * cosY - p.origZ * sinY;
        let z1 = p.origZ * cosY + p.origX * sinY;

        // Rotate around X
        let y2 = p.origY * cosX - z1 * sinX;
        let z2 = z1 * cosX + p.origY * sinX;

        // Perspective projection
        const scale = fov / (fov + z2 + RADIUS * 1.15);
        p.projX = centerX + x1 * scale;
        p.projY = centerY + y2 * scale;
        p.projScale = Math.max(0.2, scale);
        p.projAlpha = Math.max(0.12, (z2 + RADIUS) / (2 * RADIUS) * 0.85);

        // Interactive mouse repelling distortion
        if (isMouseOver) {
          const dx = p.projX - mouseX;
          const dy = p.projY - mouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110 && dist > 1) {
            const force = (1 - dist / 110) * 18;
            p.projX += (dx / dist) * force;
            p.projY += (dy / dist) * force;
          }
        }
      }

      // Draw 3D Lines Between Near Nodes
      ctx.lineWidth = 0.9;
      for (let i = 0; i < NUM_PARTICLES; i++) {
        for (let j = i + 1; j < NUM_PARTICLES; j++) {
          const dx = particles[i].projX - particles[j].projX;
          const dy = particles[i].projY - particles[j].projY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 95) {
            const lineAlpha = (1 - dist / 95) * Math.min(particles[i].projAlpha, particles[j].projAlpha) * 0.42;
            ctx.strokeStyle = `rgba(0, 180, 216, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].projX, particles[i].projY);
            ctx.lineTo(particles[j].projX, particles[j].projY);
            ctx.stroke();
          }
        }
      }

      // Draw 3D Orbital Equator Ring
      ctx.beginPath();
      for (let i = 0; i < RING_POINTS; i++) {
        const rp = ringParticles[i];
        let x1 = rp.origX * cosY - rp.origZ * sinY;
        let z1 = rp.origZ * cosY + rp.origX * sinY;
        let y2 = rp.origY * cosX - z1 * sinX;
        let z2 = z1 * cosX + rp.origY * sinX;

        const scale = fov / (fov + z2 + RADIUS * 1.15);
        rp.projX = centerX + x1 * scale;
        rp.projY = centerY + y2 * scale;
        rp.projAlpha = Math.max(0.08, (z2 + RING_RADIUS) / (2 * RING_RADIUS) * 0.6);

        if (i === 0) {
          ctx.moveTo(rp.projX, rp.projY);
        } else {
          ctx.lineTo(rp.projX, rp.projY);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.22)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Draw Nodes
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const p = particles[i];
        const pulse = 1 + 0.25 * Math.sin(pulseTick + p.pulseOffset);
        const currentSize = p.size * p.projScale * pulse;

        // Core dot
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.projAlpha;
        ctx.beginPath();
        ctx.arc(p.projX, p.projY, currentSize, 0, Math.PI * 2);
        ctx.fill();

        // 3D Glow halo for closer particles
        if (p.projAlpha > 0.45) {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.projAlpha * 0.28;
          ctx.beginPath();
          ctx.arc(p.projX, p.projY, currentSize * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1.0;
      requestAnimationFrame(render3D);
    }

    render3D();
  }

  /* --------------------------------------------------------------------------
     2. Interactive 3D Perspective Tilt for Hero Content
     -------------------------------------------------------------------------- */
  function initHero3DParallax() {
    const heroWrap = document.querySelector('.contact-hero-wrap');
    const heroContainer = document.querySelector('.contact-hero-container');
    if (!heroWrap || !heroContainer) return;

    // Clean up any old floating badges if present in DOM
    const oldBadges = heroWrap.querySelectorAll('.hero-3d-floating-badge');
    oldBadges.forEach(b => b.remove());

    heroContainer.style.transformStyle = 'preserve-3d';
    heroContainer.style.transition = 'transform 0.15s ease-out';

    heroWrap.addEventListener('mousemove', (e) => {
      const rect = heroWrap.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      const tiltX = -ny * 6;
      const tiltY = nx * 7;
      heroContainer.style.transform = `perspective(1100px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(12px)`;
    });

    heroWrap.addEventListener('mouseleave', () => {
      heroContainer.style.transform = '';
    });
  }

  /* --------------------------------------------------------------------------
     3. True Multi-Plane 3D Tilt & Specular Glare on Cards
     -------------------------------------------------------------------------- */
  function initMultiPlane3DCards() {
    const cards = document.querySelectorAll('.contact-section-01, .contact-editorial-card');

    cards.forEach((card) => {
      // Ensure specular glare element exists
      if (!card.querySelector('.card-specular-glare')) {
        const glare = document.createElement('div');
        glare.className = 'card-specular-glare';
        card.appendChild(glare);
      }

      let reqId = null;
      let curX = 0, curY = 0;
      let tgtX = 0, tgtY = 0;

      function updateCardTilt() {
        curX += (tgtX - curX) * 0.12;
        curY += (tgtY - curY) * 0.12;

        const maxTilt = card.classList.contains('contact-section-01') ? 4.5 : 7;
        const rotX = -curY * maxTilt;
        const rotY = curX * maxTilt;

        card.style.transform = `perspective(1200px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-6px)`;

        // Specular Glare follow
        const glare = card.querySelector('.card-specular-glare');
        if (glare) {
          const posX = ((curX + 1) / 2) * 100;
          const posY = ((curY + 1) / 2) * 100;
          glare.style.background = `radial-gradient(circle 380px at ${posX}% ${posY}%, rgba(255, 255, 255, 0.28) 0%, rgba(0, 180, 216, 0.12) 40%, transparent 80%)`;
          glare.style.opacity = '1';
        }

        // Multi-Plane 3D Parallax on internal elements
        const numBadge = card.querySelector('.section-num-badge, .card-num-tag');
        if (numBadge) {
          numBadge.style.transform = `translateZ(26px) translateX(${(curX * 6).toFixed(1)}px)`;
        }

        const title = card.querySelector('.section-title, .card-title');
        if (title) {
          title.style.transform = `translateZ(18px) translateX(${(curX * 4).toFixed(1)}px)`;
        }

        const ctaBtn = card.querySelector('.card-cta-btn, .form-submit-btn');
        if (ctaBtn) {
          ctaBtn.style.transform = `translateZ(24px) scale(1.01)`;
        }

        if (Math.abs(tgtX - curX) > 0.002 || Math.abs(tgtY - curY) > 0.002) {
          reqId = requestAnimationFrame(updateCardTilt);
        } else {
          reqId = null;
        }
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        tgtX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        tgtY = ((e.clientY - rect.top) / rect.height) * 2 - 1;

        if (!reqId) reqId = requestAnimationFrame(updateCardTilt);
      });

      card.addEventListener('mouseleave', () => {
        tgtX = 0;
        tgtY = 0;
        card.style.transform = '';
        const glare = card.querySelector('.card-specular-glare');
        if (glare) glare.style.opacity = '0';

        const numBadge = card.querySelector('.section-num-badge, .card-num-tag');
        if (numBadge) numBadge.style.transform = '';

        const title = card.querySelector('.section-title, .card-title');
        if (title) title.style.transform = '';

        const ctaBtn = card.querySelector('.card-cta-btn, .form-submit-btn');
        if (ctaBtn) ctaBtn.style.transform = '';
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. Concentric 3D Gyroscope Orbital Rings for Tagline
     -------------------------------------------------------------------------- */
  function initTagline3DGyroscope() {
    const taglineBand = document.querySelector('.contact-tagline-band');
    if (!taglineBand) return;

    const icon = taglineBand.querySelector('.tagline-icon');
    if (icon && !taglineBand.querySelector('.tagline-orbital-ring-1')) {
      const gyroWrap = document.createElement('div');
      gyroWrap.className = 'tagline-gyro-wrap';

      const ring1 = document.createElement('span');
      ring1.className = 'tagline-orbital-ring tagline-orbital-ring-1';

      const ring2 = document.createElement('span');
      ring2.className = 'tagline-orbital-ring tagline-orbital-ring-2';

      const ring3 = document.createElement('span');
      ring3.className = 'tagline-orbital-ring tagline-orbital-ring-3';

      icon.parentElement.insertBefore(gyroWrap, icon);
      gyroWrap.appendChild(ring1);
      gyroWrap.appendChild(ring2);
      gyroWrap.appendChild(ring3);
      gyroWrap.appendChild(icon);
    }

    taglineBand.addEventListener('mousemove', (e) => {
      const rect = taglineBand.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;

      taglineBand.style.transform = `perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-5px) scale(1.015)`;
    });

    taglineBand.addEventListener('mouseleave', () => {
      taglineBand.style.transform = '';
    });
  }

  /* --------------------------------------------------------------------------
     5. Interactive 3D Dynamic Feedback on Support Chips
     -------------------------------------------------------------------------- */
  function initInteractive3DChips() {
    const chips = document.querySelectorAll('.support-chip');
    chips.forEach(chip => {
      const label = chip.querySelector('.support-chip-label');
      if (!label) return;

      chip.addEventListener('mouseenter', () => {
        label.style.transform = 'translateZ(10px) translateY(-3px) scale(1.02)';
      });

      chip.addEventListener('mouseleave', () => {
        label.style.transform = '';
      });
    });
  }

})();
