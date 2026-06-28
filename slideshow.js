/* ═══════════════════════════════════════════════
   slideshow.js  —  Homepage image slideshow
   No dependencies. Drop in alongside main.js.

   CONFIGURATION — change these values at the top:
     INTERVAL  how long each slide shows (ms)
     AUTOPLAY  set false to disable auto-advance
════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Configuration ── */
  const INTERVAL  = 5000;   /* ms per slide (5 seconds) */
  const AUTOPLAY  = true;   /* set false to disable auto-rotation */

  /* ── Element refs ── */
  const section   = document.getElementById('slideshow');
  if (!section) return; /* bail if not on homepage */

  const track     = document.getElementById('ss-track');
  const slides    = Array.from(track.querySelectorAll('.ss-slide'));
  const dotsWrap  = document.getElementById('ss-dots');
  const prevBtn   = document.getElementById('ss-prev');
  const nextBtn   = document.getElementById('ss-next');
  const fsBtn     = document.getElementById('ss-fullscreen-btn');
  const progBar   = document.getElementById('ss-progress-bar');
  const lightbox  = document.getElementById('ss-lightbox');
  const lbImg     = document.getElementById('ss-lb-img');
  const lbClose   = document.getElementById('ss-lb-close');
  const lbPrev    = document.getElementById('ss-lb-prev');
  const lbNext    = document.getElementById('ss-lb-next');
  const lbCounter = document.getElementById('ss-lb-counter');

  if (!slides.length) return;

  /* ── State ── */
  let current    = 0;
  let timer      = null;
  let isRunning  = AUTOPLAY;
  let lbOpen     = false;

  /* ═══════════════════════════════════════════
     BLUR BACKGROUND SETUP
     Copy each slide's image src into its .ss-bg-blur
     as a background-image so the blurred fill matches.
  ══════════════════════════════════════════════ */
  slides.forEach(slide => {
    const img  = slide.querySelector('.ss-img');
    const blur = slide.querySelector('.ss-bg-blur');
    if (!img || !blur) return;

    function applyBlur() {
      blur.style.backgroundImage = `url('${img.src}')`;
    }

    if (img.complete && img.naturalWidth) {
      applyBlur();
    } else {
      img.addEventListener('load', applyBlur);
      img.addEventListener('error', () => {
        /* If image fails, hide the slide gracefully */
        slide.style.display = 'none';
      });
    }
  });

  /* ═══════════════════════════════════════════
     DOT INDICATORS
     Built dynamically so adding/removing slides
     in HTML automatically updates the dots.
  ══════════════════════════════════════════════ */
  const dots = slides.map((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'ss-dot' + (i === 0 ? ' ss-dot-active' : '');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
    return dot;
  });

  /* ═══════════════════════════════════════════
     CORE: go to a specific slide index
  ══════════════════════════════════════════════ */
  function goTo(index, direction) {
    if (index === current) return;

    /* Wrap around */
    const total = slides.length;
    index = ((index % total) + total) % total;

    /* Swap classes */
    slides[current].classList.remove('ss-active');
    slides[current].classList.add('ss-exit');
    slides[current].setAttribute('aria-hidden', 'true');

    /* Clean up exit class after transition */
    const leaving = slides[current];
    setTimeout(() => leaving.classList.remove('ss-exit'), 700);

    current = index;
    slides[current].classList.add('ss-active');
    slides[current].setAttribute('aria-hidden', 'false');

    /* Update dots */
    dots.forEach((d, i) => d.classList.toggle('ss-dot-active', i === current));

    /* Restart progress bar */
    restartProgress();
  }

  function prev() { goTo(current - 1); }
  function next() { goTo(current + 1); }

  /* ═══════════════════════════════════════════
     PROGRESS BAR
  ══════════════════════════════════════════════ */
  function restartProgress() {
    if (!progBar) return;
    /* Reset instantly */
    progBar.style.transition = 'none';
    progBar.style.width = '0%';
    /* Force reflow */
    void progBar.offsetWidth;
    /* Animate to 100% over INTERVAL */
    progBar.style.transition = `width ${INTERVAL}ms linear`;
    progBar.style.width = '100%';
  }

  /* ═══════════════════════════════════════════
     AUTO-ADVANCE TIMER
  ══════════════════════════════════════════════ */
  function startTimer() {
    if (!AUTOPLAY || !isRunning) return;
    clearInterval(timer);
    timer = setInterval(next, INTERVAL);
  }

  function stopTimer() {
    clearInterval(timer);
    timer = null;
    /* Freeze progress bar at current position */
    if (progBar) {
      const computed = getComputedStyle(progBar).width;
      const parentW  = progBar.parentElement.offsetWidth;
      const pct      = (parseFloat(computed) / parentW * 100).toFixed(1);
      progBar.style.transition = 'none';
      progBar.style.width = pct + '%';
    }
  }

  /* Pause on hover / focus inside */
  section.addEventListener('mouseenter', stopTimer);
  section.addEventListener('mouseleave', () => { if (isRunning && !lbOpen) startTimer(); });
  section.addEventListener('focusin',    stopTimer);
  section.addEventListener('focusout',   (e) => {
    if (!section.contains(e.relatedTarget) && isRunning && !lbOpen) startTimer();
  });

  /* ═══════════════════════════════════════════
     ARROW BUTTONS
  ══════════════════════════════════════════════ */
  prevBtn.addEventListener('click', () => { stopTimer(); prev(); startTimer(); });
  nextBtn.addEventListener('click', () => { stopTimer(); next(); startTimer(); });

  /* ═══════════════════════════════════════════
     KEYBOARD NAVIGATION
  ══════════════════════════════════════════════ */
  document.addEventListener('keydown', (e) => {
    if (lbOpen) {
      if (e.key === 'ArrowLeft')  { e.preventDefault(); lbNavigate(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); lbNavigate(1); }
      if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); }
      return;
    }
    /* Only intercept arrow keys when slideshow is in viewport */
    const rect = section.getBoundingClientRect();
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (!inView) return;

    if (e.key === 'ArrowLeft')  { e.preventDefault(); stopTimer(); prev(); startTimer(); }
    if (e.key === 'ArrowRight') { e.preventDefault(); stopTimer(); next(); startTimer(); }
  });

  /* ═══════════════════════════════════════════
     TOUCH / SWIPE SUPPORT
  ══════════════════════════════════════════════ */
  let touchStartX = null;
  let touchStartY = null;

  section.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  section.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    /* Only trigger if horizontal swipe is dominant (not a scroll) */
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      stopTimer();
      if (dx < 0) next(); else prev();
      startTimer();
    }
    touchStartX = null;
    touchStartY = null;
  }, { passive: true });

  /* ═══════════════════════════════════════════
     DOUBLE-CLICK to open lightbox
  ══════════════════════════════════════════════ */
  section.addEventListener('dblclick', openLightbox);

  /* ═══════════════════════════════════════════
     FULLSCREEN LIGHTBOX
  ══════════════════════════════════════════════ */
  function getActiveSrc() {
    const img = slides[current].querySelector('.ss-img');
    return img ? img.src : '';
  }

  function updateLbCounter() {
    if (lbCounter) lbCounter.textContent = `${current + 1} / ${slides.length}`;
  }

  function openLightbox() {
    lbImg.src = getActiveSrc();
    lightbox.removeAttribute('hidden');
    /* Force reflow before adding open class for transition */
    void lightbox.offsetWidth;
    lightbox.classList.add('ss-lb-open');
    lbOpen = true;
    stopTimer();
    updateLbCounter();
    /* Trap focus inside lightbox */
    lbClose.focus();
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('ss-lb-open');
    lbOpen = false;
    document.body.style.overflow = '';
    setTimeout(() => {
      lightbox.setAttribute('hidden', '');
      lbImg.src = '';
    }, 260);
    if (isRunning) startTimer();
    /* Return focus to fullscreen button */
    fsBtn.focus();
  }

  function lbNavigate(dir) {
    /* Fade out */
    lbImg.classList.add('ss-lb-fade');
    setTimeout(() => {
      goTo(current + dir);
      lbImg.src = getActiveSrc();
      updateLbCounter();
      lbImg.classList.remove('ss-lb-fade');
    }, 200);
  }

  /* Buttons */
  fsBtn.addEventListener('click', openLightbox);
  lbClose.addEventListener('click', closeLightbox);
  lbPrev.addEventListener('click', () => lbNavigate(-1));
  lbNext.addEventListener('click', () => lbNavigate(1));

  /* Click outside image to close */
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target === lightbox.querySelector('.ss-lb-img-wrap')) {
      closeLightbox();
    }
  });

  /* Lightbox touch swipe */
  let lbTouchX = null;
  lightbox.addEventListener('touchstart', (e) => {
    lbTouchX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (lbTouchX === null) return;
    const dx = e.changedTouches[0].clientX - lbTouchX;
    if (Math.abs(dx) > 40) lbNavigate(dx < 0 ? 1 : -1);
    lbTouchX = null;
  }, { passive: true });

  /* ═══════════════════════════════════════════
     INIT — show first slide and start timer
  ══════════════════════════════════════════════ */
  slides[0].classList.add('ss-active');
  slides[0].setAttribute('aria-hidden', 'false');
  if (AUTOPLAY) {
    restartProgress();
    startTimer();
  }

})();
