/**
 * Dropping Cards Stack — GSAP 3.12.5 Interactive Component
 * Architecture:
 * - 3 landscape service cards peeking out down-right with scale steps
 * - Physics: y +125%, x -2 offsets, rotate -7° drop over 0.55s power3.in
 * - Re-insertion from back with rotate +5° over 0.9s expo.out
 * - Drag/touch throw physics (>25% card height drops, else elastic snap back)
 * - Auto-rotation with viewport & hover detection
 * - Palette switcher (Brand Color-Block vs Pristine White Deck)
 */

(function () {
  'use strict';

  function initDroppingCards() {
    const deck = document.querySelector('.methodology-section .stack__deck');
    if (!deck) return;

    const cards = Array.from(deck.querySelectorAll('.stack__card'));
    const prevBtn = document.querySelector('.methodology-section .stack__btn--prev');
    const nextBtn = document.querySelector('.methodology-section .stack__btn--next');
    const dots = Array.from(document.querySelectorAll('.methodology-section .stack__dot'));
    const themeColorBlockBtn = document.getElementById('themeColorBlock');
    const themeImageCardsBtn = document.getElementById('themeImageCards');

    if (!cards.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const autoplayIntervalSec = 3.6;

    let isBusy = false;
    let autoplayTimer = null;
    let isHovered = false;
    let isInViewport = true;
    let activeIndex = 0;

    // Deck ordering array: [0 = front, 1 = middle, 2 = back]
    let deckOrder = [...cards];

    function getOffset() {
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--stack-offset');
      const val = parseFloat(raw);
      return isNaN(val) ? 20 : val;
    }

    function getSlotProps(slotIndex) {
      const offset = getOffset();
      return {
        x: slotIndex * offset,
        y: slotIndex * offset,
        scale: 1 - slotIndex * 0.015,
        rotation: 0
      };
    }

    function updateDots() {
      if (!dots.length) return;
      // Get data-index from the front card
      const frontCard = deckOrder[0];
      const idx = parseInt(frontCard.getAttribute('data-index') || '0', 10);
      dots.forEach((dot, i) => {
        dot.classList.toggle('stack__dot--active', i === idx);
      });
    }

    // Set initial layout
    function layoutDeck(immediate) {
      deckOrder.forEach((card, slot) => {
        const props = getSlotProps(slot);
        const z = deckOrder.length - slot;

        if (immediate || prefersReducedMotion.matches || typeof gsap === 'undefined') {
          if (typeof gsap !== 'undefined') {
            gsap.set(card, {
              x: props.x,
              y: props.y,
              scale: props.scale,
              rotation: 0,
              zIndex: z,
              clearProps: 'transformOrigin'
            });
          } else {
            card.style.transform = `translate(${props.x}px, ${props.y}px) scale(${props.scale})`;
            card.style.zIndex = z;
          }
        } else {
          gsap.to(card, {
            x: props.x,
            y: props.y,
            scale: props.scale,
            rotation: 0,
            duration: 0.65,
            ease: 'expo.out',
            zIndex: z
          });
        }
      });
      updateDots();
    }

    layoutDeck(true);

    // ==========================================
    // NEXT: Front card drops down & loops behind
    // ==========================================
    function goNext() {
      if (isBusy || deckOrder.length < 2) return;
      isBusy = true;

      const front = deckOrder[0];
      const middleCards = deckOrder.slice(1);
      const backSlot = deckOrder.length - 1;
      const cardHeight = front.offsetHeight;
      const offset = getOffset();

      if (prefersReducedMotion.matches || typeof gsap === 'undefined') {
        deckOrder.push(deckOrder.shift());
        layoutDeck(true);
        isBusy = false;
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          deckOrder.push(deckOrder.shift());
          layoutDeck(true);
          isBusy = false;
        }
      });

      // 1. Front card drops straight down
      tl.to(front, {
        y: cardHeight * 1.25,
        x: -offset * 2,
        rotation: -7,
        duration: 0.52,
        ease: 'power3.in'
      }, 0);

      // 2. Middle cards step forward with slight stagger
      middleCards.forEach((card, i) => {
        const nextSlot = i;
        const targetProps = getSlotProps(nextSlot);
        tl.to(card, {
          x: targetProps.x,
          y: targetProps.y,
          scale: targetProps.scale,
          rotation: 0,
          duration: 0.78,
          ease: 'expo.out'
        }, 0.16 + i * 0.05);

        tl.set(card, { zIndex: deckOrder.length - nextSlot }, 0.18 + i * 0.05);
      });

      // 3. Reveal next front card text elements
      const newFront = middleCards[0];
      if (newFront) {
        const textElements = newFront.querySelectorAll('.stack__title, .stack__list li, .stack__desc');
        if (textElements.length) {
          tl.fromTo(textElements,
            { y: 10, opacity: 0.2 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', stagger: 0.04 },
            0.32
          );
        }
      }

      // 4. Dropped card sets z-index=1, ascends into the back slot
      const backProps = getSlotProps(backSlot);
      tl.set(front, {
        zIndex: 1,
        y: cardHeight * 0.35,
        x: backProps.x + offset * 1.8,
        scale: backProps.scale,
        rotation: 5
      }, 0.52);

      tl.to(front, {
        x: backProps.x,
        y: backProps.y,
        rotation: 0,
        duration: 0.88,
        ease: 'expo.out'
      }, 0.52);
    }

    // ==========================================
    // PREV: Reverse animation
    // ==========================================
    function goPrev() {
      if (isBusy || deckOrder.length < 2) return;
      isBusy = true;

      const back = deckOrder[deckOrder.length - 1];
      const cardHeight = back.offsetHeight;
      const offset = getOffset();

      if (prefersReducedMotion.matches || typeof gsap === 'undefined') {
        deckOrder.unshift(deckOrder.pop());
        layoutDeck(true);
        isBusy = false;
        return;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          deckOrder.unshift(deckOrder.pop());
          layoutDeck(true);
          isBusy = false;
        }
      });

      // Shift front cards back one slot
      deckOrder.slice(0, -1).forEach((card, i) => {
        const nextSlot = i + 1;
        const targetProps = getSlotProps(nextSlot);
        tl.to(card, {
          x: targetProps.x,
          y: targetProps.y,
          scale: targetProps.scale,
          rotation: 0,
          duration: 0.65,
          ease: 'expo.out'
        }, 0.1);
        tl.set(card, { zIndex: deckOrder.length - nextSlot }, 0.1);
      });

      // Bring back card around and drop into front
      tl.set(back, { zIndex: deckOrder.length + 2 }, 0);
      tl.fromTo(back,
        {
          x: -offset * 2,
          y: cardHeight * 1.25,
          rotation: -8,
          scale: 1.02
        },
        {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.75,
          ease: 'expo.out'
        },
        0.12
      );
    }

    // Controls
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        resetAutoplay();
        goNext();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        resetAutoplay();
        goPrev();
      });
    }

    // Dots Click
    dots.forEach((dot, targetIdx) => {
      dot.addEventListener('click', () => {
        resetAutoplay();
        const currentFrontIdx = parseInt(deckOrder[0].getAttribute('data-index') || '0', 10);
        if (targetIdx === currentFrontIdx) return;
        goNext();
      });
    });

    // ==========================================
    // Touch & Pointer Drag / Flick Detection
    // ==========================================
    let isDragging = false;
    let startY = 0;
    let startX = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocityY = 0;

    function onPointerDown(e) {
      if (isBusy || e.button !== 0) return;
      const front = deckOrder[0];
      if (!front) return;

      isDragging = true;
      startY = e.clientY;
      startX = e.clientX;
      lastY = e.clientY;
      lastTime = performance.now();
      velocityY = 0;

      deck.setPointerCapture(e.pointerId);
      resetAutoplay();
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const front = deckOrder[0];
      const dy = Math.max(0, e.clientY - startY);
      const dx = (e.clientX - startX) * 0.35;
      const now = performance.now();
      const dt = now - lastTime;
      if (dt > 0) {
        velocityY = (e.clientY - lastY) / dt;
      }
      lastY = e.clientY;
      lastTime = now;

      if (typeof gsap !== 'undefined') {
        gsap.set(front, {
          y: dy,
          x: dx,
          rotation: (dx / 35) + (dy / 50) * -1
        });
      }
    }

    function onPointerUp(e) {
      if (!isDragging) return;
      isDragging = false;
      const front = deckOrder[0];
      if (!front) return;

      try {
        deck.releasePointerCapture(e.pointerId);
      } catch (err) {}

      const dy = e.clientY - startY;
      const cardHeight = front.offsetHeight;

      if (dy > cardHeight * 0.25 || velocityY > 0.45) {
        goNext();
      } else {
        if (typeof gsap !== 'undefined') {
          gsap.to(front, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.65)'
          });
        }
      }
    }

    deck.addEventListener('pointerdown', onPointerDown);
    deck.addEventListener('pointermove', onPointerMove);
    deck.addEventListener('pointerup', onPointerUp);
    deck.addEventListener('pointercancel', onPointerUp);

    // ==========================================
    // Autoplay Timer
    // ==========================================
    function startAutoplay() {
      if (autoplayTimer || prefersReducedMotion.matches) return;
      autoplayTimer = setInterval(() => {
        if (!isHovered && isInViewport && !isBusy && !isDragging) {
          goNext();
        }
      }, autoplayIntervalSec * 1000);
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    deck.addEventListener('mouseenter', () => { isHovered = true; });
    deck.addEventListener('mouseleave', () => { isHovered = false; });

    // Viewport Visibility Observer
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isInViewport = entry.isIntersecting;
        });
      }, { threshold: 0.2 });
      observer.observe(deck);
    }

    startAutoplay();

    // ==========================================
    // Keyboard Navigation
    // ==========================================
    window.addEventListener('keydown', (e) => {
      if (!isInViewport) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        resetAutoplay();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        resetAutoplay();
        goPrev();
      }
    });

    // ==========================================
    // Palette Switcher: Color-Block vs Pristine White
    // ==========================================
    const originalStyles = cards.map(c => c.getAttribute('style') || '');

    function applyPristineWhite() {
      cards.forEach(card => {
        card.setAttribute('style',
          '--c:#ffffff; --ink:#002c8b; --accent:#009ae0; --badge-bg:#e0f2fe; --badge-color:#002c8b; --num-color:rgba(0,44,139,0.08); --desc-color:#475569; border: 1px solid rgba(0, 44, 139, 0.1); box-shadow: 0 25px 50px -12px rgba(0, 44, 139, 0.14), 0 8px 20px -6px rgba(0, 0, 0, 0.05);'
        );
      });
      if (themeImageCardsBtn && themeColorBlockBtn) {
        themeImageCardsBtn.classList.add('stack__theme-btn--active');
        themeColorBlockBtn.classList.remove('stack__theme-btn--active');
      }
      layoutDeck(false);
    }

    function applyBrandColorBlock() {
      cards.forEach((card, i) => {
        card.setAttribute('style', originalStyles[i]);
      });
      if (themeImageCardsBtn && themeColorBlockBtn) {
        themeColorBlockBtn.classList.add('stack__theme-btn--active');
        themeImageCardsBtn.classList.remove('stack__theme-btn--active');
      }
      layoutDeck(false);
    }

    if (themeImageCardsBtn) {
      themeImageCardsBtn.addEventListener('click', applyPristineWhite);
    }

    if (themeColorBlockBtn) {
      themeColorBlockBtn.addEventListener('click', applyBrandColorBlock);
    }
  }

  /**
   * Section 02: Our Perspective — Vertical Scroll-Driven Dropping Cards
   * 3 Cards: Dark Blue (#002c8b), White (#ffffff), Sky Blue (#009ae0)
   * Strictly vertical scroll transitions (no horizontal offset)
   */
  function initPerspectiveScrollCards() {
    const track = document.querySelector('.perspective-scroll-track');
    const deck = document.getElementById('perspectiveDeck');
    if (!track || !deck) return;

    const cards = Array.from(deck.querySelectorAll('.perspective-card-stack'));
    if (!cards.length) return;

    const dots = Array.from(document.querySelectorAll('.perspective-dot'));
    const prevBtn = document.querySelector('.perspective-prev-btn');
    const nextBtn = document.querySelector('.perspective-next-btn');
    const themeColorBlockBtn = document.getElementById('perspThemeColorBlock');
    const themeWhiteDeckBtn = document.getElementById('perspThemeWhiteDeck');

    let activeIndex = 0;
    let isClickScrolling = false;

    // Cache original styles for theme switching
    const originalStyles = cards.map(c => c.getAttribute('style') || '');

    function updateDots(idx) {
      if (dots.length) {
        dots.forEach((dot, i) => {
          dot.classList.toggle('stack__dot--active', i === idx);
        });
      }
    }

    function setCardTransform(card, x, y, scale, rot, zIndex, opacity) {
      if (typeof gsap !== 'undefined') {
        gsap.set(card, {
          x: x,
          y: y,
          scale: scale,
          rotation: rot,
          zIndex: zIndex,
          opacity: opacity,
          overwrite: 'auto'
        });
      } else {
        card.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${rot}deg)`;
        card.style.zIndex = zIndex;
        card.style.opacity = opacity;
      }
    }

    // Scroll progress handler
    function onScroll() {
      if (isClickScrolling) return;

      const rect = track.getBoundingClientRect();
      const windowH = window.innerHeight;
      const totalScroll = track.offsetHeight - windowH;

      if (totalScroll <= 0) {
        // Fallback layout
        cards.forEach((card, i) => {
          setCardTransform(card, 0, i * 20, 1 - i * 0.02, 0, cards.length - i, 1);
        });
        return;
      }

      // Progress from 0 (track top enters top of screen) to 1 (track bottom hits bottom)
      const scrolled = -rect.top;
      const progress = Math.min(1, Math.max(0, scrolled / totalScroll));

      const cardHeight = cards[0].offsetHeight || 380;
      const offset = 22;

      if (progress < 0.32) {
        // Phase 1: Card 0 (Dark Blue) is front
        activeIndex = 0;
        setCardTransform(cards[0], 0, 0, 1, 0, 5, 1);
        setCardTransform(cards[1], 0, offset, 0.98, 0, 4, 0.96);
        setCardTransform(cards[2], 0, offset * 2, 0.96, 0, 3, 0.92);
      } else if (progress >= 0.32 && progress < 0.48) {
        // Transition 0 -> 1: Card 0 drops vertically, Card 1 steps forward
        const t = (progress - 0.32) / 0.16; // 0 to 1
        activeIndex = t > 0.5 ? 1 : 0;

        // Card 0 drops straight down vertically
        const y0 = t * (cardHeight * 1.35);
        const rot0 = t * -4;
        const scale0 = 1 - t * 0.04;
        const op0 = 1 - t * 0.45;
        setCardTransform(cards[0], 0, y0, scale0, rot0, 5, op0);

        // Card 1 steps up to slot 0
        const y1 = offset * (1 - t);
        const scale1 = 0.98 + 0.02 * t;
        const op1 = 0.96 + 0.04 * t;
        setCardTransform(cards[1], 0, y1, scale1, 0, 4, op1);

        // Card 2 steps from slot 2 to slot 1
        const y2 = offset * 2 - offset * t;
        const scale2 = 0.96 + 0.02 * t;
        const op2 = 0.92 + 0.04 * t;
        setCardTransform(cards[2], 0, y2, scale2, 0, 3, op2);
      } else if (progress >= 0.48 && progress < 0.68) {
        // Phase 2: Card 1 (White) is front, Card 0 in back, Card 2 is mid
        activeIndex = 1;
        setCardTransform(cards[1], 0, 0, 1, 0, 5, 1);
        setCardTransform(cards[2], 0, offset, 0.98, 0, 4, 0.96);
        setCardTransform(cards[0], 0, offset * 2, 0.96, 0, 2, 0.7);
      } else if (progress >= 0.68 && progress < 0.84) {
        // Transition 1 -> 2: Card 1 drops vertically, Card 2 steps forward
        const t = (progress - 0.68) / 0.16; // 0 to 1
        activeIndex = t > 0.5 ? 2 : 1;

        // Card 1 drops straight down vertically
        const y1 = t * (cardHeight * 1.35);
        const rot1 = t * -4;
        const scale1 = 1 - t * 0.04;
        const op1 = 1 - t * 0.45;
        setCardTransform(cards[1], 0, y1, scale1, rot1, 5, op1);

        // Card 2 steps forward to slot 0
        const y2 = offset * (1 - t);
        const scale2 = 0.98 + 0.02 * t;
        const op2 = 0.96 + 0.04 * t;
        setCardTransform(cards[2], 0, y2, scale2, 0, 4, op2);

        // Card 0 remains in back
        setCardTransform(cards[0], 0, offset * 2, 0.96, 0, 2, 0.6);
      } else {
        // Phase 3: Card 2 (Sky Blue) is front
        activeIndex = 2;
        setCardTransform(cards[2], 0, 0, 1, 0, 5, 1);
        setCardTransform(cards[1], 0, offset * 2, 0.96, 0, 2, 0.6);
        setCardTransform(cards[0], 0, offset * 2.5, 0.94, 0, 1, 0.5);
      }

      updateDots(activeIndex);
    }

    // Smooth scroll to card index
    function scrollToCardIndex(index) {
      isClickScrolling = true;
      const rect = track.getBoundingClientRect();
      const totalScroll = track.offsetHeight - window.innerHeight;
      const targetP = index === 0 ? 0.12 : (index === 1 ? 0.55 : 0.92);
      const targetY = window.scrollY + rect.top + totalScroll * targetP;

      window.scrollTo({
        top: targetY,
        behavior: 'smooth'
      });

      activeIndex = index;
      updateDots(activeIndex);

      setTimeout(() => {
        isClickScrolling = false;
        onScroll();
      }, 700);
    }

    // Dot navigation
    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const targetIdx = parseInt(dot.getAttribute('data-goto') || '0', 10);
        scrollToCardIndex(targetIdx);
      });
    });

    // Next / Prev button navigation
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const nextIdx = (activeIndex + 1) % cards.length;
        scrollToCardIndex(nextIdx);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const prevIdx = (activeIndex - 1 + cards.length) % cards.length;
        scrollToCardIndex(prevIdx);
      });
    }

    // Touch / Pointer Drag on active card
    let startY = 0;
    let isDragging = false;

    deck.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      startY = e.clientY;
      isDragging = true;
      try { deck.setPointerCapture(e.pointerId); } catch(err) {}
    });

    deck.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const dy = e.clientY - startY;
      const frontCard = cards[activeIndex];
      if (frontCard && dy > 0) {
        // Strictly vertical dragging downwards
        if (typeof gsap !== 'undefined') {
          gsap.set(frontCard, { y: dy, rotation: (dy / 45) * -1 });
        }
      }
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      try { deck.releasePointerCapture(e.pointerId); } catch(err) {}
      const dy = e.clientY - startY;
      const cardHeight = cards[0].offsetHeight || 380;

      if (dy > cardHeight * 0.25) {
        scrollToCardIndex((activeIndex + 1) % cards.length);
      } else {
        onScroll();
      }
    }

    deck.addEventListener('pointerup', endDrag);
    deck.addEventListener('pointercancel', endDrag);

    // Theme toggles
    function applyPristineWhite() {
      cards.forEach(card => {
        card.setAttribute('style',
          '--c:#ffffff; --ink:#002c8b; --accent:#009ae0; --badge-bg:#e0f2fe; --badge-color:#002c8b; --num-color:rgba(0,44,139,0.08); --desc-color:#475569; border: 1.5px solid rgba(0, 44, 139, 0.12); box-shadow: 0 28px 60px -15px rgba(0, 44, 139, 0.14), 0 8px 20px -6px rgba(0, 0, 0, 0.05);'
        );
      });
      if (themeWhiteDeckBtn && themeColorBlockBtn) {
        themeWhiteDeckBtn.classList.add('stack__theme-btn--active');
        themeColorBlockBtn.classList.remove('stack__theme-btn--active');
      }
      onScroll();
    }

    function applyBrandColorBlock() {
      cards.forEach((card, i) => {
        card.setAttribute('style', originalStyles[i]);
      });
      if (themeWhiteDeckBtn && themeColorBlockBtn) {
        themeColorBlockBtn.classList.add('stack__theme-btn--active');
        themeWhiteDeckBtn.classList.remove('stack__theme-btn--active');
      }
      onScroll();
    }

    if (themeWhiteDeckBtn) themeWhiteDeckBtn.addEventListener('click', applyPristineWhite);
    if (themeColorBlockBtn) themeColorBlockBtn.addEventListener('click', applyBrandColorBlock);

    // Scroll listener on window
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial render
    onScroll();
  }

  function initAllDecks() {
    initDroppingCards();
    initPerspectiveScrollCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllDecks);
  } else {
    initAllDecks();
  }
})();

