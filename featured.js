/* ═══════════════════════════════════════════════
   featured.js  —  Dynamic featured projects
   Loaded only on index.html (root homepage).

   WHAT IT DOES
   ────────────
   1. Fetches projects/index.html as text
   2. Parses it into an in-memory document
   3. Finds every <article data-featured="true">
   4. Sorts them newest-first (same rule as the board)
   5. Rewrites all src/href paths from projects/-relative
      to root-relative (adds "projects/" prefix)
   6. Marks the first card .featured for the wide layout
   7. Replaces the skeleton grid with the real cards

   TO FEATURE A PROJECT
   ────────────────────
   Open projects/index.html.
   Add  data-featured="true"  to the <article> tag.
   That's it — the homepage updates on next load.

   TO UNFEATURE A PROJECT
   ──────────────────────
   Remove data-featured="true" (or change to "false").
════════════════════════════════════════════════ */
(function () {
  'use strict';

  const grid      = document.getElementById('featured-grid');
  const fallback  = document.getElementById('feat-fallback');

  /* Only run on the homepage */
  if (!grid) return;

  /* ── Path to the projects board, relative to index.html ── */
  const PROJECTS_URL = 'projects/';

  /* ═══════════════════════════════════════════
     FETCH & PARSE
  ══════════════════════════════════════════════ */
  fetch(PROJECTS_URL, { cache: 'no-cache' })
    .then(res => {
      if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
      return res.text();
    })
    .then(html => {
      /* Parse the fetched HTML into a detached document */
      const parser   = new DOMParser();
      const doc      = parser.parseFromString(html, 'text/html');

      /* Collect only featured cards */
      const featured = Array.from(
        doc.querySelectorAll('article.project-card[data-featured="true"]')
      );

      if (!featured.length) {
        showFallback();
        return;
      }

      /* ── Sort: newest first, then A→Z by title ── */
      featured.sort((a, b) => {
        const da = dateVal(a), db = dateVal(b);
        if (db !== da) return db - da;
        return (a.dataset.title || '').localeCompare(b.dataset.title || '');
      });

      /* ── Rewrite paths ── */
      featured.forEach(card => rewritePaths(card, PROJECTS_URL));

      /* ── First card gets the wide "featured" layout ── */
      featured[0].classList.add('featured');

      /* ── Inject into grid ── */
      grid.innerHTML = '';
      featured.forEach(card => {
        /* Downgrade h2 → h3 inside card titles for correct heading hierarchy */
        card.querySelectorAll('h2.card-title').forEach(h => {
          const h3 = document.createElement('h3');
          h3.className = h.className;
          h3.innerHTML = h.innerHTML;
          h.replaceWith(h3);
        });
        grid.appendChild(card);
      });
    })
    .catch(err => {
      console.warn('[featured.js] Could not load projects page:', err);
      showFallback();
    });

  /* ═══════════════════════════════════════════
     PATH REWRITING
     Cards authored in projects/index.html use
     paths relative to projects/:
       href="propulsion/vulkan.html"
       src="images/propulsion/vulkan-thumb.jpg"
     From the homepage (root) these need:
       href="projects/propulsion/vulkan.html"
       src="projects/images/propulsion/vulkan-thumb.jpg"
     We prefix any relative path that doesn't
     start with http / https / # / / or data:
  ══════════════════════════════════════════════ */
  function rewritePaths(card, base) {
    /* <a href="..."> */
    card.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href');
      if (isRelative(h)) a.setAttribute('href', base + h);
    });

    /* <img src="..."> */
    card.querySelectorAll('img[src]').forEach(img => {
      const s = img.getAttribute('src');
      if (isRelative(s)) img.setAttribute('src', base + s);
    });
  }

  function isRelative(url) {
    if (!url) return false;
    return !url.startsWith('http') &&
           !url.startsWith('//') &&
           !url.startsWith('/') &&
           !url.startsWith('#') &&
           !url.startsWith('data:');
  }

  /* ═══════════════════════════════════════════
     DATE SORT HELPER
  ══════════════════════════════════════════════ */
  function dateVal(card) {
    const d = (card.dataset.date || '').replace('-', '');
    return parseInt(d, 10) || 0;
  }

  /* ═══════════════════════════════════════════
     FALLBACK
  ══════════════════════════════════════════════ */
  function showFallback() {
    grid.hidden = true;
    if (fallback) fallback.hidden = false;
  }

})();
