/**
 * ============================================================================
 * ETHYRA STORYBOOK & DRAGGABLE OPTICAL SEARCH GLASS ENGINE
 * Tactile 3D Open Landscape Book (1760/1240) with Curled Page-Turns & Optical Loupe
 * Mouse/cursor page turn dragging & optical search glass magnification
 * No extra UI buttons or toolbar pills
 * ============================================================================
 */

(function () {
  'use strict';

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStorybook);
  } else {
    initStorybook();
  }

  function initStorybook() {
    const wrap = document.getElementById('sbWrap');
    const stage = document.getElementById('sbStage');
    const sb3d = document.getElementById('sb3d');
    const book = document.getElementById('sbBook');
    const zoomWrap = document.getElementById('zoomWrap');
    const zoomInner = document.getElementById('zoomInner');
    const loupe = document.getElementById('loupe');
    const loupeLens = document.getElementById('loupeLens');

    if (!wrap || !stage || !sb3d || !book) {
      return;
    }

    const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DIR = 'assets/storybook/';

    const PAGES = [
      { file: 'spread_1.png', title: 'Design. Deliver. Demonstrate.' },
      { file: 'spread_2.png', title: 'Our Perspective' },
      { file: 'spread_3.png', title: 'What We Do' },
      { file: 'spread_4.png', title: 'The 4E Framework' },
      { file: 'spread_5.png', title: 'Why Ethyra?' },
      { file: 'spread_6.png', title: 'Who We Work With' },
      { file: 'spread_7.png', title: 'Our Webinars' },
      { file: 'spread_8.png', title: 'Get in Touch' }
    ];

    PAGES.forEach(p => {
      p.url = DIR + p.file;
    });

    const M = PAGES.length;

    // ------------------------------------------------ Curved Leaf Physics
    const N = 18;          // 18 strips for realistic organic paper curvature
    const SPAN = 0.466;    // Gutter to outer page edge on 1760x1240 canvas (820/1760)
    const BETA = 0.60;     // Peak curl radians of bending arc
    let idx = 0;
    let turn = null;       // { dir: 'next'|'prev', from, to, t }
    let strips = [];

    function el(t, c) {
      const e = document.createElement(t);
      if (c) e.className = c;
      return e;
    }

    function imgEl(i, side) {
      const im = new Image();
      im.className = 'sb-half-img ' + side;
      im.draggable = false;
      im.alt = PAGES[i].title;
      im.src = PAGES[i].url;
      return im;
    }

    function halfEl(pos, i) {
      const d = el('div', 'sb-half ' + pos);
      d.appendChild(imgEl(i, pos));
      d.appendChild(el('div', 'gutter-shade ' + pos));
      return d;
    }

    function buildCurl(dir, from, to) {
      strips = [];
      const c = el('div', 'curl ' + dir);
      c.style.setProperty('--n', N);
      c.style.setProperty('--span', SPAN);
      let host = c;

      for (let i = 0; i < N; i++) {
        const s = el('div', 'strip');
        s.style.setProperty('--i', i);
        const gut = 'calc(var(--bw) * 0.5)';
        const sw = 'calc(var(--bw) * ' + SPAN + ' / ' + N + ')';
        const A = 'calc(-1 * (' + gut + ' + ' + i + ' * ' + sw + '))';
        const B = 'calc(' + (i + 1) + ' * ' + sw + ' - ' + gut + ')';

        const f = el('div', 'face front');
        const b = el('div', 'face back');

        const dress = (target, url, px) => {
          target.style.backgroundImage = 'url(' + url + ')';
          target.style.backgroundPositionX = px;
        };

        dress(f, PAGES[from].url, dir === 'next' ? A : B);
        dress(b, PAGES[to].url, dir === 'next' ? B : A);

        f.appendChild(el('div', 'sh'));
        f.appendChild(el('div', 'gl'));
        b.appendChild(el('div', 'sh'));
        b.appendChild(el('div', 'gl'));

        s.appendChild(f);
        s.appendChild(b);

        if (i === N - 1) s.classList.add('edge');
        host.appendChild(s);
        host = s;
        strips.push(s);
      }
      return c;
    }

    function applyTurn(t) {
      const th = Math.PI * t;
      const beta = BETA * Math.sin(Math.PI * t);
      const D = 180 / Math.PI;
      const tt = th + beta;
      const td = (2 * beta) / N;

      sb3d.style.setProperty('--tt', (tt * D).toFixed(2) + 'deg');
      sb3d.style.setProperty('--td', (td * D).toFixed(3) + 'deg');
      sb3d.style.setProperty('--shade', Math.sin(Math.PI * t).toFixed(3));

      for (let i = 0; i < strips.length; i++) {
        const l1 = Math.abs(Math.cos(tt - i * td));
        const l2 = Math.abs(Math.cos(tt - (i + 1) * td));
        const st = strips[i].style;
        st.setProperty('--lit', l1.toFixed(3));
        st.setProperty('--a1', ((1 - l1) * 0.58).toFixed(3));
        st.setProperty('--a2', ((1 - l2) * 0.58).toFixed(3));
      }
    }

    function paint() {
      book.textContent = '';
      if (!turn) {
        const f = el('div', 'sb-full');
        const im = new Image();
        im.src = PAGES[idx].url;
        im.alt = PAGES[idx].title;
        im.draggable = false;
        f.appendChild(im);
        book.appendChild(f);
        sb3d.style.setProperty('--shade', '0');
      } else {
        const next = turn.dir === 'next';
        book.appendChild(halfEl('left', next ? turn.from : turn.to));
        book.appendChild(halfEl('right', next ? turn.to : turn.from));
        book.appendChild(buildCurl(turn.dir, turn.from, turn.to));
        applyTurn(turn.t);
      }

      const a = el('button', 'sb-zone sb-prev');
      const b = el('button', 'sb-zone sb-next');
      a.setAttribute('aria-label', 'Previous Page');
      b.setAttribute('aria-label', 'Next Page');
      book.appendChild(a);
      book.appendChild(b);

      layout();
      syncZoomLayer();
      placeLoupe();
    }

    function layout() {
      if (!book) return;
      sb3d.style.setProperty('--bw', book.clientWidth + 'px');
    }

    window.addEventListener('resize', layout);

    // ------------------------------------------------ Spring Physics Loop
    let spring = null;

    function animateTo(target, onDone, stiff, damp) {
      spring = {
        kind: 'spring',
        v: 0,
        target: target,
        done: onDone,
        k: stiff || 160,
        c: damp || 24
      };
      kick();
    }

    function tweenTo(target, dur, onDone) {
      spring = {
        kind: 'tween',
        from: turn ? turn.t : 0,
        target: target,
        dur: dur,
        e: 0,
        done: onDone
      };
      kick();
    }

    let raf = null;
    let last = 0;

    function tick(now) {
      raf = null;
      const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
      last = now;

      if (spring && turn) {
        const s = spring;
        if (s.kind === 'tween') {
          s.e += dt;
          const k = Math.min(1, s.e / s.dur);
          turn.t = s.from + (s.target - s.from) * k;
          applyTurn(turn.t);
          if (k >= 1) {
            spring = null;
            if (s.done) s.done();
          }
        } else {
          const x = turn.t - s.target;
          s.v += (-s.k * x - s.c * s.v) * dt;
          turn.t += s.v * dt;
          if (Math.abs(turn.t - s.target) < 0.002 && Math.abs(s.v) < 0.02) {
            turn.t = s.target;
            spring = null;
            applyTurn(turn.t);
            if (s.done) s.done();
          } else {
            applyTurn(turn.t);
          }
        }
      }

      viewSpring();
      const lmoved = loupeEase();

      if ((spring || viewActive || lmoved) && raf === null) {
        raf = requestAnimationFrame(tick);
      }
    }

    function kick() {
      if (raf === null) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    }

    // ------------------------------------------------ 3D Perspective Tilt & Zoom
    const TILT_X = 4.0;
    const TILT_Y = 6.0;
    const view = { rx: 0, ry: 0, z: 1, trx: 0, try_: 0, tz: 1 };
    let viewActive = false;
    let lastZ = 1;

    function applyView() {
      sb3d.style.setProperty('--rx', view.rx.toFixed(2) + 'deg');
      sb3d.style.setProperty('--ry', view.ry.toFixed(2) + 'deg');
      sb3d.style.setProperty('--zoom', view.z.toFixed(3));
      if (view.z !== lastZ) {
        lastZ = view.z;
        placeLoupe();
      }
    }

    function viewSpring() {
      const e = 0.14;
      let moved = false;
      const keys = [
        ['rx', 'trx'],
        ['ry', 'try_'],
        ['z', 'tz']
      ];
      for (const [k, t] of keys) {
        const d = view[t] - view[k];
        if (Math.abs(d) > 0.0006) {
          view[k] += d * e;
          moved = true;
        } else {
          view[k] = view[t];
        }
      }
      if (moved) applyView();
      viewActive = moved;
      return moved;
    }

    function setView(rx, ry, z) {
      view.trx = Math.max(-TILT_X, Math.min(TILT_X, rx));
      view.try_ = Math.max(-TILT_Y, Math.min(TILT_Y, ry));
      view.tz = z || 1;
      viewActive = true;
      kick();
    }

    function tiltTo(cx, cy) {
      if (drag || !book) return;
      const r = book.getBoundingClientRect();
      if (!r.width) return;
      const nx = Math.max(-1, Math.min(1, (cx - (r.left + r.width / 2)) / (r.width * 0.65)));
      const ny = Math.max(-1, Math.min(1, (cy - (r.top + r.height / 2)) / (r.height * 0.9)));
      setView(-ny * TILT_X, nx * TILT_Y, view.tz);
    }

    stage.addEventListener(
      'pointermove',
      e => {
        if (e.pointerType === 'touch') return;
        tiltTo(e.clientX, e.clientY);
      },
      { passive: true }
    );

    stage.addEventListener('pointerleave', () => setView(0, 0, 1));

    // ------------------------------------------------ Page Turn Dragging
    let drag = null;

    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const onBook = e.target.closest('.sb-zone');
      if (!onBook) return;

      e.preventDefault();
      stage.setPointerCapture(e.pointerId);

      const r = book.getBoundingClientRect();
      const dir = (e.clientX - r.left) / r.width > 0.5 ? 'next' : 'prev';
      startTurn(dir, 0);
      drag = {
        dir: dir,
        x0: e.clientX,
        w: r.width,
        moved: 0,
        vel: 0,
        tPrev: performance.now()
      };
    });

    stage.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x0;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      const raw = (drag.dir === 'next' ? -dx : dx) / (drag.w * 0.58);
      const t = Math.max(0, Math.min(1, raw));
      const now = performance.now();
      drag.vel = (t - (turn ? turn.t : 0)) / Math.max(0.001, (now - drag.tPrev) / 1000);
      drag.tPrev = now;
      if (turn) {
        turn.t = t;
        applyTurn(t);
      }
    });

    function endDrag() {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!turn) return;

      if (d.moved < 6) {
        commit();
        return;
      }
      const go = turn.t > 0.38 || d.vel > 1.0;
      if (go) commit();
      else cancel();
    }

    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('dragstart', e => e.preventDefault());
    stage.addEventListener('selectstart', e => e.preventDefault());

    // ------------------------------------------------ Turn Control Actions
    function startTurn(dir, t) {
      spring = null;
      if (turn) {
        idx = turn.to;
        turn = null;
      }
      shoveLoupe(dir);
      const from = idx;
      turn = {
        dir: dir,
        from: from,
        to: dir === 'next' ? (from + 1) % M : (from - 1 + M) % M,
        t: t || 0
      };
      paint();
    }

    function commit() {
      if (!turn) return;
      if (REDUCED) {
        idx = turn.to;
        turn = null;
        paint();
        return;
      }
      animateTo(
        1,
        () => {
          idx = turn.to;
          turn = null;
          paint();
        },
        170,
        26
      );
      kick();
    }

    function cancel() {
      if (!turn) return;
      animateTo(
        0,
        () => {
          turn = null;
          paint();
        },
        150,
        24
      );
      kick();
    }

    function step(dir) {
      if (turn) {
        idx = turn.to;
        turn = null;
      }
      startTurn(dir, 0);
      commit();
    }

    window.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 'next' : 'prev');
    });

    // ------------------------------------------------ Draggable Loupe & Optical Magnification
    const MAG = 2.2;
    let loupeOn = true;
    let lx = null;
    let ly = null;
    let lgrab = null;
    let lTarget = null;

    function loupeSize() {
      if (!book) return 240;
      return Math.round(Math.max(180, Math.min(270, book.clientWidth * 0.24)));
    }

    function bookBox() {
      return { x: 0, y: 0, w: book.clientWidth, h: book.clientHeight };
    }

    function restLoupe() {
      const b = bookBox();
      lx = b.x + b.w * 0.76;
      ly = b.y + b.h * 0.58;
      placeLoupe();
    }

    function syncZoomLayer() {
      if (!zoomInner) return;
      zoomInner.textContent = '';
      for (const c of book.children) {
        if (c.classList.contains('sb-zone')) continue;
        zoomInner.appendChild(c.cloneNode(true));
      }
    }

    function placeLoupe() {
      if (lx === null || !loupe || !zoomWrap || !zoomInner) return;
      const B = bookBox();
      const bw = B.w;
      const bh = B.h;
      if (!bw) return;

      const R = loupeSize() / 2;
      const bez = R * 2 * 0.058;

      loupe.style.setProperty('--lr', R * 2 + 'px');
      loupe.style.transform = 'translate3d(' + (lx - R).toFixed(1) + 'px,' + (ly - R).toFixed(1) + 'px,0)';
      loupe.classList.add('on');

      const z = view.z;
      const cx = bw / 2;
      const cy = bh / 2;
      const x0 = cx + (bw * 0.035 - cx) * z;
      const x1 = cx + (bw * 0.965 - cx) * z;
      const y0 = cy + (bh * 0.081 - cy) * z;
      const y1 = cy + (bh * 0.919 - cy) * z;

      const nx = Math.max(x0, Math.min(lx, x1));
      const ny = Math.max(y0, Math.min(ly, y1));
      const inside =
        lx > x0 && lx < x1 && ly > y0 && ly < y1
          ? Math.min(lx - x0, x1 - lx, ly - y0, y1 - ly)
          : -Math.hypot(lx - nx, ly - ny);

      const k = Math.max(0, Math.min(1, (inside + R * 0.35) / (R * 0.60)));

      zoomWrap.style.opacity = k.toFixed(3);
      if (k <= 0.002) return;

      const r = (R - bez).toFixed(1);
      const mask =
        'radial-gradient(circle ' +
        r +
        'px at ' +
        lx.toFixed(1) +
        'px ' +
        ly.toFixed(1) +
        'px,#000 calc(100% - 1px),transparent 100%)';
      zoomWrap.style.webkitMaskImage = mask;
      zoomWrap.style.maskImage = mask;

      const px = cx + (lx - cx) / z;
      const py = cy + (ly - cy) / z;
      const s = MAG * z;
      zoomInner.style.transform =
        'translate(' + (lx - px * s).toFixed(1) + 'px,' + (ly - py * s).toFixed(1) + 'px) scale(' + s.toFixed(4) + ')';
    }

    function shoveLoupe(dir) {
      if (lx === null || lgrab) return;
      const b = bookBox();
      const nx = (b.w / 2 + (lx - b.x - b.w / 2) / view.z) / b.w;
      const ny = (b.h / 2 + (ly - b.y - b.h / 2) / view.z) / b.h;

      if (nx < 0.02 || nx > 0.98 || ny < 0.06 || ny > 0.94) return;

      lTarget = {
        x: b.x + b.w * (dir === 'next' ? 0.18 : 0.82),
        y: b.y + b.h * 0.58
      };
      kick();
    }

    function loupeEase() {
      if (!lTarget) return false;
      if (lgrab) {
        lTarget = null;
        return false;
      }
      const dx = lTarget.x - lx;
      const dy = lTarget.y - ly;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        lx = lTarget.x;
        ly = lTarget.y;
        lTarget = null;
        placeLoupe();
        return false;
      }
      lx += dx * 0.18;
      ly += dy * 0.18;
      placeLoupe();
      return true;
    }

    loupe.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      lTarget = null;
      lgrab = { cx: e.clientX, cy: e.clientY, lx0: lx, ly0: ly };
      loupe.classList.add('held');
      loupe.setPointerCapture(e.pointerId);
    });

    loupe.addEventListener('pointermove', e => {
      if (!lgrab) return;
      const b = bookBox();
      const R = loupeSize() / 2;
      lx = Math.max(b.x - R * 0.5, Math.min(b.x + b.w + R * 0.5, lgrab.lx0 + (e.clientX - lgrab.cx)));
      ly = Math.max(b.y - R * 0.5, Math.min(b.y + b.h + R * 0.8, lgrab.ly0 + (e.clientY - lgrab.cy)));
      placeLoupe();
    });

    function dropLoupe() {
      lgrab = null;
      loupe.classList.remove('held');
    }

    loupe.addEventListener('pointerup', dropLoupe);
    loupe.addEventListener('pointercancel', dropLoupe);

    window.addEventListener('resize', () => {
      lx = null;
      restLoupe();
    });

    // ------------------------------------------------ Boot sequence
    (async function boot() {
      paint();
      applyView();

      await Promise.all(
        PAGES.map(p => {
          const im = new Image();
          im.src = p.url;
          return im.decode
            ? im.decode().catch(() => {})
            : new Promise(res => {
                im.onload = im.onerror = res;
              });
        })
      );

      restLoupe();

      // Subtle intro curl cue after 600ms
      setTimeout(() => {
        if (!REDUCED) {
          startTurn('next', 0);
          tweenTo(0.12, 0.45, () => {
            tweenTo(0, 0.45, () => {
              turn = null;
              paint();
            });
          });
        }
      }, 600);
    })();
  }
})();
