/* ═══════════════════════════════════════════════
   slideshow.js  —  Infinite horizontal carousel
   No dependencies. Works with slideshow.css.

   HOW THE LOOP WORKS
   ──────────────────
   JS clones every slide and appends them to both
   ends of the track:

     [clone of last]  [slide1] [slide2] … [slideN]  [clone of first]

   When the user reaches the clone-of-first at the
   right end, JS silently (no transition) teleports
   the track back to the real first slide. The clone
   exists just long enough to make the transition
   look continuous. Same trick works backwards.

   CONFIGURATION
   ─────────────
   INTERVAL   auto-advance delay in ms (default 4s)
   AUTOPLAY   set false to disable auto-advance
════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Config ── */
  const INTERVAL = 4000;
  const AUTOPLAY = true;

  /* ── Refs ── */
  const section  = document.getElementById('slideshow');
  if (!section) return;

  const track    = document.getElementById('ss-track');
  const dotsWrap = document.getElementById('ss-dots');
  const prevBtn  = document.getElementById('ss-prev');
  const nextBtn  = document.getElementById('ss-next');
  const fsBtn    = document.getElementById('ss-fullscreen-btn');
  const progBar  = document.getElementById('ss-progress-bar');
  const lightbox = document.getElementById('ss-lightbox');
  const lbImg    = document.getElementById('ss-lb-img');
  const lbClose  = document.getElementById('ss-lb-close');
  const lbPrev   = document.getElementById('ss-lb-prev');
  const lbNext   = document.getElementById('ss-lb-next');
  const lbCounter= document.getElementById('ss-lb-counter');

  /* Collect original slides before cloning */
  const origSlides = Array.from(track.querySelectorAll('.ss-slide'));
  const total = origSlides.length;
  if (total < 2) return; /* nothing to carousel with 1 image */

  /* ═══════════════════════════════════════════
     CLONE SLIDES FOR SEAMLESS LOOP
     Prepend clones of the last N slides,
     append clones of the first N slides.
     N = min(total, 3) gives enough buffer for
     the peek effect on either side.
  ══════════════════════════════════════════════ */
  const buffer = Math.min(total, 3);

  /* Clones at the END (copies of first slides) */
  for (let i = 0; i < buffer; i++) {
    const clone = origSlides[i].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.dataset.clone = 'end';
    track.appendChild(clone);
  }

  /* Clones at the START (copies of last slides in correct order: S3 S4 S5)
     Build a fragment so order is preserved — prepend reverses if done one at a time */
  const startFrag = document.createDocumentFragment();
  for (let i = total - buffer; i < total; i++) {
    const clone = origSlides[i].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.dataset.clone = 'start';
    startFrag.appendChild(clone);
  }
  track.insertBefore(startFrag, track.firstChild);

  /* All slides including clones */
  const allSlides = Array.from(track.querySelectorAll('.ss-slide'));

  /* The "real" index in allSlides where original slides start */
  const offset = buffer;

  /* ═══════════════════════════════════════════
     STATE
  ══════════════════════════════════════════════ */
  /* virtualIdx: position in the REAL slides (0 … total-1) */
  let virtualIdx = 0;
  /* trackIdx:   position in allSlides (offset … offset+total-1) */
  let trackIdx   = offset;
  let timer      = null;
  let isRunning  = AUTOPLAY;
  let isAnimating = false;
  let lbOpen     = false;

  /* ═══════════════════════════════════════════
     SLIDE WIDTH CALCULATION
     Each slide is --ss-slide-w wide (CSS var).
     JS reads the computed pixel value after layout.
  ══════════════════════════════════════════════ */
  let slideW  = 0; /* width of one slide in px */
  let gapW    = 0; /* gap between slides in px */
  let viewW   = 0; /* viewport width */

  function measureSizes() {
    viewW   = section.offsetWidth;
    const firstSlide = allSlides[0];
    slideW  = firstSlide.offsetWidth;
    /* gap: computed from CSS custom property */
    const style = getComputedStyle(document.documentElement);
    gapW = parseFloat(style.getPropertyValue('--ss-gap')) || 16;
  }

  /* ═══════════════════════════════════════════
     TRANSLATE: move track so trackIdx slide is centred
  ══════════════════════════════════════════════ */
  function getTranslateForIndex(idx) {
    /* Centre position: left edge of slide idx should be at
       (viewW - slideW) / 2  from the track's left edge       */
    const centreOffset = (viewW - slideW) / 2;
    return -(idx * (slideW + gapW)) + centreOffset;
  }

  function applyTranslate(x, animate) {
    track.style.transition = animate
      ? `transform ${getComputedStyle(document.documentElement).getPropertyValue('--ss-speed') || '520ms'} ${getComputedStyle(document.documentElement).getPropertyValue('--ss-ease') || 'cubic-bezier(.4,0,.2,1)'}`
      : 'none';
    track.style.transform = `translateX(${x}px)`;
  }

  /* Mark the active slide for the dim/scale CSS */
  function updateActiveClass() {
    allSlides.forEach((s, i) => s.classList.toggle('ss-active', i === trackIdx));
  }

  /* ═══════════════════════════════════════════
     DOT INDICATORS
  ══════════════════════════════════════════════ */
  const dots = origSlides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'ss-dot' + (i === 0 ? ' ss-dot-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to image ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  function updateDots() {
    dots.forEach((d, i) => d.classList.toggle('ss-dot-active', i === virtualIdx));
  }

  /* ═══════════════════════════════════════════
     CORE: go to a real (virtual) slide index
  ══════════════════════════════════════════════ */
  function goTo(newVirtual, skipAnimation) {
    if (isAnimating && !skipAnimation) return;

    /* Map virtual → track index */
    const newTrack = newVirtual + offset;

    isAnimating = true;
    virtualIdx  = newVirtual;
    trackIdx    = newTrack;

    updateActiveClass();
    updateDots();
    applyTranslate(getTranslateForIndex(trackIdx), !skipAnimation);
    restartProgress();
  }

  /* After an animated transition, check if we landed on a clone
     and if so, silently jump to the real equivalent position.   */
  function onTransitionEnd() {
    isAnimating = false;

    /* Landed on an END clone (trackIdx >= offset + total) */
    if (trackIdx >= offset + total) {
      /* How many steps past the end? */
      const overshoot = trackIdx - (offset + total);
      const realTrack = offset + overshoot;
      virtualIdx = overshoot;
      trackIdx   = realTrack;
      applyTranslate(getTranslateForIndex(trackIdx), false);
      updateActiveClass();
      updateDots();
      return;
    }

    /* Landed on a START clone (trackIdx < offset) */
    if (trackIdx < offset) {
      const undershoot = offset - trackIdx;
      const realTrack  = offset + total - undershoot;
      virtualIdx = total - undershoot;
      trackIdx   = realTrack;
      applyTranslate(getTranslateForIndex(trackIdx), false);
      updateActiveClass();
      updateDots();
      return;
    }
  }

  track.addEventListener('transitionend', onTransitionEnd);

  /* ═══════════════════════════════════════════
     STEP: advance by ±1 in track space
     (not virtual space — so we slide into clones
      naturally and then jump back)
  ══════════════════════════════════════════════ */
  function step(dir) {
    if (isAnimating) return;
    isAnimating = true;

    trackIdx  += dir;
    /* Wrap virtualIdx for dot display */
    virtualIdx = ((virtualIdx + dir) % total + total) % total;

    updateActiveClass();
    updateDots();
    applyTranslate(getTranslateForIndex(trackIdx), true);
    restartProgress();
  }

  /* ═══════════════════════════════════════════
     PROGRESS BAR
  ══════════════════════════════════════════════ */
  function restartProgress() {
    if (!progBar) return;
    progBar.style.transition = 'none';
    progBar.style.width = '0%';
    void progBar.offsetWidth;
    progBar.style.transition = `width ${INTERVAL}ms linear`;
    progBar.style.width = '100%';
  }

  function freezeProgress() {
    if (!progBar) return;
    const w = getComputedStyle(progBar).width;
    const pw = progBar.parentElement.offsetWidth;
    progBar.style.transition = 'none';
    progBar.style.width = (parseFloat(w) / pw * 100).toFixed(1) + '%';
  }

  /* ═══════════════════════════════════════════
     AUTO-ADVANCE
  ══════════════════════════════════════════════ */
  function startTimer() {
    if (!AUTOPLAY || !isRunning || lbOpen) return;
    clearInterval(timer);
    timer = setInterval(() => step(1), INTERVAL);
  }
  function stopTimer() {
    clearInterval(timer);
    timer = null;
    freezeProgress();
  }

  section.addEventListener('mouseenter', stopTimer);
  section.addEventListener('mouseleave', () => { if (isRunning && !lbOpen) startTimer(); });
  section.addEventListener('focusin',    stopTimer);
  section.addEventListener('focusout', (e) => {
    if (!section.contains(e.relatedTarget) && isRunning && !lbOpen) startTimer();
  });

  /* ═══════════════════════════════════════════
     ARROW BUTTONS
  ══════════════════════════════════════════════ */
  prevBtn.addEventListener('click', () => { stopTimer(); step(-1); startTimer(); });
  nextBtn.addEventListener('click', () => { stopTimer(); step(1);  startTimer(); });

  /* ═══════════════════════════════════════════
     KEYBOARD
  ══════════════════════════════════════════════ */
  document.addEventListener('keydown', (e) => {
    if (lbOpen) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); lbNavigate(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); lbNavigate(1);  }
      if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
      return;
    }
    const rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); stopTimer(); step(-1); startTimer(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stopTimer(); step(1);  startTimer(); }
    }
  });

  /* ═══════════════════════════════════════════
     TOUCH / SWIPE
  ══════════════════════════════════════════════ */
  let tx0 = null, ty0 = null;
  section.addEventListener('touchstart', (e) => {
    tx0 = e.touches[0].clientX;
    ty0 = e.touches[0].clientY;
  }, { passive: true });
  section.addEventListener('touchend', (e) => {
    if (tx0 === null) return;
    const dx = e.changedTouches[0].clientX - tx0;
    const dy = e.changedTouches[0].clientY - ty0;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36) {
      stopTimer();
      step(dx < 0 ? 1 : -1);
      startTimer();
    }
    tx0 = ty0 = null;
  }, { passive: true });

  /* ═══════════════════════════════════════════
     LIGHTBOX
  ══════════════════════════════════════════════ */
  function getActiveSrc() {
    /* virtualIdx always points to a real original slide */
    return origSlides[virtualIdx].querySelector('.ss-img').src;
  }
  function updateLbCounter() {
    if (lbCounter) lbCounter.textContent = `${virtualIdx + 1} / ${total}`;
  }
  function openLightbox() {
    lbImg.src = getActiveSrc();
    lightbox.removeAttribute('hidden');
    void lightbox.offsetWidth;
    lightbox.classList.add('ss-lb-open');
    lbOpen = true;
    stopTimer();
    updateLbCounter();
    lbClose.focus();
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('ss-lb-open');
    lbOpen = false;
    document.body.style.overflow = '';
    setTimeout(() => { lightbox.setAttribute('hidden', ''); lbImg.src = ''; }, 260);
    if (isRunning) startTimer();
    fsBtn.focus();
  }
  function lbNavigate(dir) {
    lbImg.classList.add('ss-lb-fade');
    setTimeout(() => {
      virtualIdx = ((virtualIdx + dir) % total + total) % total;
      lbImg.src = getActiveSrc();
      updateLbCounter();
      updateDots();
      lbImg.classList.remove('ss-lb-fade');
    }, 180);
  }

  fsBtn.addEventListener('click', openLightbox);
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => lbNavigate(-1));
  lbNext.addEventListener('click', () => lbNavigate(1));
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('ss-lb-img-wrap')) closeLightbox();
  });

  let lbTx = null;
  lightbox.addEventListener('touchstart', (e) => { lbTx = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (lbTx === null) return;
    const dx = e.changedTouches[0].clientX - lbTx;
    if (Math.abs(dx) > 36) lbNavigate(dx < 0 ? 1 : -1);
    lbTx = null;
  }, { passive: true });

  /* ═══════════════════════════════════════════
     RESIZE HANDLER
     Recalculate pixel positions if window resizes.
  ══════════════════════════════════════════════ */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      measureSizes();
      applyTranslate(getTranslateForIndex(trackIdx), false);
    }, 120);
  }, { passive: true });

  /* ═══════════════════════════════════════════
     INIT
     Wait for images to have layout so offsetWidth
     is accurate, then position the track.
  ══════════════════════════════════════════════ */
  function init() {
    measureSizes();
    updateActiveClass();
    applyTranslate(getTranslateForIndex(trackIdx), false);
    if (AUTOPLAY) {
      restartProgress();
      startTimer();
    }
  }

  /* If layout is ready, init immediately; otherwise wait for load */
  if (allSlides[0].offsetWidth > 0) {
    init();
  } else {
    window.addEventListener('load', init, { once: true });
  }

})();
