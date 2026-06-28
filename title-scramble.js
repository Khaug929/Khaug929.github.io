/* ═══════════════════════════════════════════════
   title-scramble.js  —  Matrix-style name reveal
   Drop-in module. No dependencies.

   WHAT IT DOES
   ─────────────
   On page load the hero name cycles through random
   characters before each real letter locks in, left
   to right, giving a matrix / data-decryption feel.
   The <br> between first and last name is preserved.

   CONFIGURATION  (edit the block below)
   ──────────────
   DURATION   total ms for the full reveal
   HOLD_MS    pause on the final letters before
              the effect is considered "done"
   CHARS      pool of characters used for scrambling
   ACCENT_P   0–1 probability a scramble frame shows
              an orange accent character instead of
              a neutral one (adds colour flicker)
════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Configuration ── */
  const DURATION = 2700;   /* ms — total reveal time              */
  const HOLD_MS  = 120;    /* ms — pause showing completed letter  */
  const CHARS    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!$%&';
  const ACCENT_P = 0.25;   /* fraction of scramble frames go orange */

  /* ── Target element ── */
  const el = document.querySelector('.hero-name');
  if (!el) return;

  /* Respect prefers-reduced-motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ═══════════════════════════════════════════
     PARSE: extract text nodes, preserve <br>
     We walk the childNodes of .hero-name so the
     <br> tag is kept in place throughout.
  ══════════════════════════════════════════════ */

  /* Build a flat list of characters with their node refs */
  const chars = [];  /* { node, index, real } */

  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      /* Split text into individual char spans */
      const text = node.textContent;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (ch === ' ') {
          /* Preserve spaces as non-animated spans */
          const sp = document.createElement('span');
          sp.textContent = ' ';
          sp.style.display = 'inline';
          frag.appendChild(sp);
        } else {
          const span = document.createElement('span');
          span.className = 'hs-char';
          span.textContent = ch;
          span.dataset.real = ch;
          span.setAttribute('aria-hidden', 'true');
          frag.appendChild(span);
          chars.push(span);
        }
      }
      node.replaceWith(frag);
    }
    /* <br> nodes are left untouched */
  });

  /* Screen-reader gets the real text from aria-label on the h1 */
  el.setAttribute('aria-label', el.textContent);

  /* ═══════════════════════════════════════════
     SCRAMBLE LOOP
     Each character has a "reveal time" staggered
     across DURATION. Until its reveal time it shows
     a random char; after, it locks to the real char.
  ══════════════════════════════════════════════ */
  const total    = chars.length;
  const start    = performance.now();

  /* Stagger: char i reveals at this timestamp */
  function revealTime(i) {
    /* Ease-out curve: earlier chars reveal faster */
    const t = i / (total - 1 || 1);
    return DURATION * (1 - Math.pow(1 - t, 1.6));
  }

  const revealTimes = chars.map((_, i) => revealTime(i));
  let   allDone     = false;

  function rand(str) {
    return str[Math.floor(Math.random() * str.length)];
  }

  function tick(now) {
    if (allDone) return;
    const elapsed = now - start;
    let   done    = 0;

    chars.forEach((span, i) => {
      const real = span.dataset.real;

      if (elapsed >= revealTimes[i] + HOLD_MS) {
        /* Fully locked */
        span.textContent = real;
        span.style.color  = '';
        span.classList.remove('hs-scrambling');
        done++;
      } else if (elapsed >= revealTimes[i]) {
        /* Hold frame — show real char in accent colour briefly */
        span.textContent = real;
        span.style.color  = 'var(--accent)';
        span.classList.remove('hs-scrambling');
      } else {
        /* Still scrambling */
        span.classList.add('hs-scrambling');
        const useAccent = Math.random() < ACCENT_P;
        span.textContent = rand(CHARS);
        span.style.color  = useAccent ? 'var(--accent)' : '';
      }
    });

    if (done === total) {
      allDone = true;
      /* Clean up all inline styles — let CSS take over */
      chars.forEach(span => {
        span.style.color = '';
        span.classList.remove('hs-scrambling');
      });
      return;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

})();
