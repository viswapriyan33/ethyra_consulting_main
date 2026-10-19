(() => {
  if (window.vsMagneticButton) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  // semi-implicit Euler spring (tension / friction), fixed 1/120 s substeps
  const spring = (x, k, c) => ({ x, v: 0, g: x, k, c });
  const stepS = (s, h) => { s.v += (-s.k * (s.x - s.g) - s.c * s.v) * h; s.x += s.v * h; };
  const rest = s => Math.abs(s.v) < .004 && Math.abs(s.x - s.g) < .004;
  const live = new Set(); let raf = 0, last = 0;
  const tick = now => {
    const dt = Math.min(.064, (now - last) / 1000 || .016); last = now;
    for (const b of live) if (!b.update(dt)) live.delete(b);
    raf = live.size ? requestAnimationFrame(tick) : 0;
  };
  const wake = b => { live.add(b); if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  const all = new Set();
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && fine.matches) for (const b of all) b.pull(e.clientX, e.clientY); }, { passive: true });
  addEventListener('mousemove', e => { for (const b of all) b.pull(e.clientX, e.clientY); }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { for (const b of all) b.release(); });
  document.documentElement.addEventListener('mouseleave', () => { for (const b of all) b.release(); });

  function mount(el) {
    if (!el || el.__vsMb) return el ? el.__vsMb : null;
    const num = (k, d) => { const v = parseFloat(el.dataset[k]); return isNaN(v) ? d : v; };
    const body = document.createElement('span'); body.className = 'vs-magnetic-button-body';
    const face = document.createElement('span'); face.className = 'vs-magnetic-button-face';
    const label = document.createElement('span'); label.className = 'vs-magnetic-button-label';
    while (el.firstChild) label.appendChild(el.firstChild);
    face.appendChild(label); body.appendChild(face);
    const flood = document.createElement('span'); flood.className = 'vs-magnetic-button-flood'; flood.setAttribute('aria-hidden', 'true');
    const face2 = face.cloneNode(true); flood.appendChild(face2); body.appendChild(flood);
    const label2 = face2.firstChild;
    body.insertAdjacentHTML('beforeend', '<svg class="vs-magnetic-button-spin" viewBox="0 0 24 24" aria-hidden="true"><circle class="t" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/></svg>');
    const glow = document.createElement('span'); glow.className = 'vs-magnetic-button-glow'; glow.setAttribute('aria-hidden', 'true');
    el.append(glow, body);

    const S = { x: spring(0, 170, 12), y: spring(0, 170, 12), lx: spring(0, 210, 14), ly: spring(0, 210, 14),
      sc: spring(1, 380, 20), fl: spring(0, 170, 24), gl: spring(0, 120, 20) };
    let visible = true, down = false, R = 0;
    new IntersectionObserver(e => { visible = e[0].isIntersecting; if (!visible) api.release(); }).observe(el);
    const inert = () => el.disabled || el.getAttribute('aria-disabled') === 'true' || el.getAttribute('aria-busy') === 'true';

    const placeFlood = (px, py) => {
      const w = body.offsetWidth, h = body.offsetHeight;
      R = Math.hypot(Math.max(px, w - px), Math.max(py, h - py)) + 2;
      flood.style.cssText = `left:${px - R}px;top:${py - R}px;width:${2 * R}px;height:${2 * R}px`;
      Object.assign(face2.style, { left: `${R - px}px`, top: `${R - py}px`, width: `${w}px`, height: `${h}px`, transformOrigin: `${px}px ${py}px` });
    };
    const local = e => {
      const r = body.getBoundingClientRect();
      const cx = (e && typeof e.clientX === 'number') ? e.clientX : (r.left + r.width / 2);
      const cy = (e && typeof e.clientY === 'number') ? e.clientY : (r.top + r.height / 2);
      return [cx - r.left, cy - r.top];
    };

    const api = {
      pull(cx, cy) {
        if (reduce.matches || !visible || inert()) return api.release();
        const strength = num('strength', .4), field = num('field', 70), para = num('parallax', .55);
        const r = el.getBoundingClientRect();
        const mx = r.left + r.width / 2, my = r.top + r.height / 2;
        const edge = Math.hypot(Math.max(r.left - cx, 0, cx - r.right), Math.max(r.top - cy, 0, cy - r.bottom));
        let f = 1 - Math.min(1, edge / field); f = f * f * (3 - 2 * f);
        if (f <= 0 && S.x.g === 0 && S.y.g === 0) return;
        const cap = body.offsetHeight * .5;                                  // soft cap so neighbours never collide
        const dx = cap * Math.tanh((cx - mx) * strength * f / cap), dy = cap * Math.tanh((cy - my) * strength * f / cap);
        const lim = Math.min(body.offsetWidth, body.offsetHeight) * .17;   // label stays inside the shape
        S.x.g = dx; S.y.g = dy; S.lx.g = lim * Math.tanh(dx * para / lim); S.ly.g = lim * Math.tanh(dy * para / lim); S.gl.g = f;
        wake(api);
      },
      release() {
        if (S.x.g === 0 && S.y.g === 0 && S.gl.g === 0 && S.sc.g === 1) return;
        S.x.g = S.y.g = S.lx.g = S.ly.g = S.gl.g = 0; S.sc.g = 1; wake(api);
      },
      update(dt) {
        let moving = false;
        const n = Math.max(1, Math.round(dt * 120)), h = dt / n;
        for (const k in S) { const s = S[k]; if (rest(s)) { s.x = s.g; s.v = 0; continue; } moving = true; for (let i = 0; i < n; i++) stepS(s, h); }
        if (reduce.matches) for (const k in S) { S[k].x = S[k].g; S[k].v = 0; }
        // squash-and-stretch along the velocity of the body
        const jelly = num('jelly', .5), vx = S.x.v, vy = S.y.v, sp = Math.hypot(vx, vy);
        const st = Math.min(.09, sp * .00022 * jelly * 2), ang = Math.atan2(vy, vx) * 57.2958;
        const sc = S.sc.x;
        body.style.transform = `translate3d(${S.x.x.toFixed(2)}px,${S.y.x.toFixed(2)}px,0) rotate(${ang.toFixed(2)}deg) scale(${(sc * (1 + st)).toFixed(4)},${(sc * (1 - st * .7)).toFixed(4)}) rotate(${(-ang).toFixed(2)}deg)`;
        glow.style.transform = `translate3d(${(S.x.x * 1.2).toFixed(2)}px,${(S.y.x * 1.2).toFixed(2)}px,0)`;
        glow.style.opacity = (Math.max(0, S.gl.x) * .85).toFixed(3);
        const lt = `translate3d(${S.lx.x.toFixed(2)}px,${S.ly.x.toFixed(2)}px,0)`;
        label.style.transform = lt; label2.style.transform = lt;
        const f = Math.max(.0005, Math.min(1.08, S.fl.x));
        if (reduce.matches) { flood.style.transform = 'scale(1)'; flood.style.opacity = S.fl.g; face2.style.transform = 'none'; }
        else { flood.style.opacity = ''; flood.style.transform = `scale(${f.toFixed(4)})`; face2.style.transform = `scale(${(1 / f).toFixed(4)})`; }
        return moving;
      },
    };
    const enter = e => { if (inert()) return; el.classList.add('is-hot'); const [px, py] = local(e); if (S.fl.x < .02) placeFlood(px, py); S.fl.g = 1; wake(api); };
    const leave = e => { el.classList.remove('is-hot'); if (S.fl.x > .96) { const [px, py] = local(e); placeFlood(px, py); } S.fl.g = 0; wake(api); };
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' || !e.pointerType) enter(e); });
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse' || !e.pointerType) leave(e); });
    el.addEventListener('mouseenter', enter);
    el.addEventListener('mouseleave', leave);
    el.addEventListener('pointerdown', e => {
      if (inert()) return; down = true; el.classList.add('is-down'); S.sc.g = .94; wake(api);
      if (e.pointerType !== 'mouse') { enter(e); api.pull(e.clientX, e.clientY); try { el.setPointerCapture(e.pointerId); } catch (_) {} }
    });
    el.addEventListener('pointermove', e => { if (down && e.pointerType !== 'mouse') api.pull(e.clientX, e.clientY); });
    const up = e => {
      if (!down) return; down = false; el.classList.remove('is-down'); S.sc.g = 1; S.sc.v += 1.4; wake(api);
      if (e.pointerType !== 'mouse') { api.release(); leave(e); }
    };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !inert()) { el.classList.add('is-down'); S.sc.g = .94; wake(api); } });
    el.addEventListener('keyup', () => { el.classList.remove('is-down'); S.sc.g = 1; wake(api); });
    el.addEventListener('blur', () => { el.classList.remove('is-down'); S.sc.g = 1; wake(api); });
    new MutationObserver(() => { if (inert()) { api.release(); el.classList.remove('is-hot'); if (S.fl.x > .96) placeFlood(body.offsetWidth / 2, body.offsetHeight / 2); S.fl.g = 0; wake(api); } }).observe(el, { attributes: true, attributeFilter: ['aria-busy', 'aria-disabled', 'disabled'] });
    all.add(api); el.__vsMb = api; return api;
  }

  function init() {
    // 1. Mount explicit .vs-magnetic-button elements
    document.querySelectorAll('.vs-magnetic-button').forEach(mount);

    // 2. Navigation items (Home, About Us, Services, Webinar, etc.)
    document.querySelectorAll('.nav-menu a, nav a.nav-link, .wpda-menu > li > a').forEach(el => {
      if (!el.classList.contains('vs-magnetic-button')) {
        el.classList.add('vs-magnetic-button', 'vs-magnetic-button--nav');
        mount(el);
      }
    });

    // 3. CTA buttons across hero, banners, modals, and Elementor widgets
    document.querySelectorAll('.btn-nav-cta, .btn-pill-solid, .btn-pill-outline, .btn-cta-white, .btn-cta-magnetic, .webinar-cta-btn, .btn-register, .gt3_module_button_elementor a').forEach(el => {
      if (!el.classList.contains('vs-magnetic-button')) {
        el.classList.add('vs-magnetic-button');
        if (el.classList.contains('btn-pill-outline')) el.classList.add('vs-magnetic-button--ghost');
        if (el.classList.contains('btn-cta-white')) el.classList.add('vs-magnetic-button--white');
        mount(el);
      }
    });
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  window.vsMagneticButton = { mount, init };
})();
