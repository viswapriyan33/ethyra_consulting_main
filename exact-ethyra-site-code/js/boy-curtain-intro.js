/**
 * ETHYRA CONSULTING SERVICES — BOY PUSH CURTAIN INTRO ENGINE
 * Character push curtain reveal powered by GSAP.
 */

(function () {
  'use strict';

  console.log('[BoyCurtainIntro] Script loaded');

  let introTimeline = null;
  let audioCtx = null;

  // Initialize Web Audio API for subtle, procedural physical friction & whoosh
  function playPushSwoosh(volume = 0.15) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const bufferSize = audioCtx.sampleRate * 0.45;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = audioCtx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + 0.45);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, audioCtx.currentTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      whiteNoise.start();
    } catch (e) {
      // Audio is non-critical enhancement; fails silently if blocked
    }
  }

  function getElements() {
    return {
      overlay: document.getElementById('boyIntroOverlay'),
      curtain: document.getElementById('boyCurtain'),
      anchor: document.getElementById('boyAnchor'),
      sprite: document.getElementById('boySprite'),
      skipBtn: document.getElementById('boySkipBtn'),
      welcome: document.getElementById('curtainWelcome')
    };
  }

  function buildTimeline() {
    const { overlay, curtain, welcome } = getElements();
    if (!overlay || !curtain) {
      console.warn('[BoyCurtainIntro] Elements missing in buildTimeline', { overlay, curtain });
      return null;
    }

    if (introTimeline) {
      introTimeline.kill();
    }

    const screenW = window.innerWidth;
    const totalDist = screenW + 580; // clears curtain and boy completely past viewport

    introTimeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        console.log('[BoyCurtainIntro] Push sequence complete, fading out overlay');
        gsap.to(overlay, {
          opacity: 0,
          duration: 0.45,
          ease: 'power2.out',
          onComplete: () => {
            overlay.style.display = 'none';
            overlay.style.pointerEvents = 'none';
            document.body.style.overflow = '';
          }
        });
      }
    });

    // Cinematic 10-Second Physical Push Choreography (Total duration = 10.0s):
    // 0.0s - 0.4s (0.4s): Stance setup & initial anticipation
    // 0.4s - 3.2s (2.8s): Initial drive — breaks inertia, pushes into first quadrant (x: 28%)
    // 3.2s - 4.4s (1.2s): Heavy friction phase — digging in with sustained exertion (x: 38%)
    // 4.4s - 7.8s (3.4s): Grand center sweep — smoothly unveiling the 3D hero & headline (x: 78%)
    // 7.8s - 10.0s (2.2s): Mighty final surge — smoothly accelerates completely off-screen (totalDist)
    introTimeline
      .set(curtain, { x: 0 });

    if (welcome) {
      introTimeline.set(welcome, { opacity: 1 });
    }

    introTimeline
      .to({}, { duration: 0.4 })
      .call(() => playPushSwoosh(0.12))
      .to(curtain, {
        x: screenW * 0.28,
        duration: 2.8,
        ease: 'power1.inOut'
      });

    introTimeline
      .call(() => playPushSwoosh(0.16))
      .to(curtain, {
        x: screenW * 0.38,
        duration: 1.2,
        ease: 'sine.inOut'
      })
      .call(() => playPushSwoosh(0.20))
      .to(curtain, {
        x: screenW * 0.78,
        duration: 3.4,
        ease: 'power1.inOut'
      })
      .call(() => playPushSwoosh(0.24))
      .to(curtain, {
        x: totalDist,
        duration: 2.2,
        ease: 'power2.inOut'
      });

    return introTimeline;
  }

  function startIntro() {
    const { overlay, curtain, welcome } = getElements();
    if (!overlay || !curtain) {
      console.warn('[BoyCurtainIntro] Missing overlay or curtain in startIntro');
      return;
    }

    console.log('[BoyCurtainIntro] Starting intro sequence');

    if (introTimeline) {
      introTimeline.kill();
    }
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(overlay);
      gsap.killTweensOf(curtain);
      if (welcome) gsap.killTweensOf(welcome);
      gsap.set(overlay, { opacity: 1, display: 'block' });
      gsap.set(curtain, { x: 0 });
      if (welcome) gsap.set(welcome, { opacity: 1 });
    } else {
      overlay.style.display = 'block';
      overlay.style.opacity = '1';
      if (welcome) welcome.style.opacity = '1';
    }

    overlay.style.pointerEvents = 'auto';

    // Prevent background scrolling while intro is running
    document.body.style.overflow = 'hidden';

    // Wait until GSAP is ready
    if (typeof gsap === 'undefined') {
      console.log('[BoyCurtainIntro] Waiting for GSAP...');
      setTimeout(startIntro, 40);
      return;
    }

    const tl = buildTimeline();
    if (tl) {
      tl.restart();
    }
  }

  function skipIntro() {
    console.log('[BoyCurtainIntro] Skipping intro');
    if (introTimeline) {
      introTimeline.kill();
    }

    const { overlay, curtain } = getElements();
    if (!overlay || !curtain) return;

    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(overlay);
      gsap.killTweensOf(curtain);
      const screenW = window.innerWidth;
      gsap.to(curtain, {
        x: screenW + 550,
        duration: 0.35,
        ease: 'power3.out'
      });
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out',
        onComplete: () => {
          overlay.style.display = 'none';
          overlay.style.pointerEvents = 'none';
          document.body.style.overflow = '';
        }
      });
    } else {
      overlay.style.display = 'none';
      overlay.style.pointerEvents = 'none';
      document.body.style.overflow = '';
    }
  }

  function replayIntro() {
    console.log('[BoyCurtainIntro] Replaying intro');
    window.scrollTo({ top: 0, behavior: 'instant' });
    startIntro();
  }

  // Immediately expose replay, skip, and scrub APIs on window
  window.replayBoyIntro = replayIntro;
  window.skipBoyIntro = skipIntro;
  window.setBoyCurtainProgress = function (p) {
    console.log('[BoyCurtainIntro] Scrubbing progress to:', p);
    const { overlay, curtain, welcome } = getElements();
    if (!overlay || !curtain) return;
    if (introTimeline) {
      introTimeline.kill();
    }
    if (typeof gsap !== 'undefined') {
      gsap.killTweensOf(overlay);
      gsap.killTweensOf(curtain);
      if (welcome) gsap.killTweensOf(welcome);
      gsap.set(overlay, { opacity: 1, display: 'block' });
    } else {
      overlay.style.display = 'block';
      overlay.style.opacity = '1';
    }
    overlay.style.pointerEvents = 'auto';
    const tl = buildTimeline();
    if (tl) {
      tl.pause();
      tl.progress(p);
    }
  };

  function initIntro() {
    console.log('[BoyCurtainIntro] Initializing DOM listeners');
    const { skipBtn } = getElements();

    if (skipBtn) {
      skipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        skipIntro();
      });
    }

    // Attach to any replay buttons on the page
    document.querySelectorAll('.js-replay-intro, #replayIntroBtn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        replayIntro();
      });
    });

    // Keyboard shortcut: Escape to skip
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        skipIntro();
      }
    });

    // Auto-start intro
    startIntro();
  }

  // Bulletproof initialization regardless of script loading timing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();
