/* ═══════════════════════════════════════════════
   projects.js  —  Board filter, search, sort, group
   Loaded only on projects/index.html.
   No dependencies.

   DATA FLOW
   ─────────
   On load: collect all .project-card articles →
     sort by date desc, then title A→Z →
     group by data-category →
     render into .pb-board with group headers

   On filter chip click: hide non-matching cards,
     hide group headers (show flat list instead)

   On search input: additionally scrub data-summary,
     highlight matched text inside card titles + descs,
     hide non-matching cards

   On URL ?cat=slug: pre-activate matching chip on load
════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Refs ── */
  const main       = document.getElementById('pb-main');
  const container  = main.querySelector('.container');
  const searchInput= document.getElementById('pb-search');
  const clearBtn   = document.getElementById('pb-search-clear');
  const filtersEl  = document.getElementById('pb-filters');
  const countEl    = document.getElementById('pb-count');
  const emptyEl    = document.getElementById('pb-empty');
  const emptyTerm  = document.getElementById('pb-empty-term');
  const emptyReset = document.getElementById('pb-empty-reset');

  /* ═══════════════════════════════════════════
     STEP 1 — COLLECT & SORT CARDS
     Read all project-card articles before DOM is
     restructured, strip them from the container,
     then reinsert in sorted order.
  ══════════════════════════════════════════════ */
  const rawCards = Array.from(
    container.querySelectorAll('article.project-card')
  );

  /* Parse data-date: "2024-09" → comparable number 202409
     Fallback to 0 if missing so undated cards sort last.  */
  function dateVal(card) {
    const d = (card.dataset.date || '').replace('-', '');
    return parseInt(d, 10) || 0;
  }

  /* Sort: date descending, then title A→Z as tiebreak */
  rawCards.sort((a, b) => {
    const dateDiff = dateVal(b) - dateVal(a);
    if (dateDiff !== 0) return dateDiff;
    return (a.dataset.title || '').localeCompare(b.dataset.title || '');
  });

  /* Remove all original cards from the container — we will re-add via board */
  rawCards.forEach(c => c.remove());

  /* ═══════════════════════════════════════════
     STEP 2 — GROUP BY CATEGORY
     Build a Map: category → [cards in sort order]
     Category order = first-seen order in sorted list
     (i.e. the category with the most recent project
      appears first — a natural recency ordering).
  ══════════════════════════════════════════════ */
  const groups = new Map(); /* key: category slug, value: [card, …] */

  rawCards.forEach(card => {
    const cat = (card.dataset.category || 'uncategorised').toLowerCase();
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(card);
  });

  /* ═══════════════════════════════════════════
     STEP 3 — BUILD THE BOARD DOM
     Create .pb-board grid, insert group headers
     and cards inside .pb-group wrappers.
  ══════════════════════════════════════════════ */
  const board = document.createElement('div');
  board.className = 'pb-board';
  board.id = 'pb-board';

  /* Store references for quick access */
  const groupHeaderEls = []; /* {el, cat} */

  groups.forEach((cards, cat) => {
    /* Group wrapper (display:contents — no visual box) */
    const group = document.createElement('div');
    group.className = 'pb-group';
    group.dataset.groupCat = cat;

    /* Group header row */
    const header = document.createElement('div');
    header.className = 'pb-group-header';
    header.dataset.groupHeader = cat;

    const label = document.createElement('span');
    label.className = 'pb-group-label';
    label.textContent = capitalise(cat);

    const count = document.createElement('span');
    count.className = 'pb-group-count';
    count.textContent = `${cards.length} project${cards.length !== 1 ? 's' : ''}`;

    const rule = document.createElement('div');
    rule.className = 'pb-group-rule';

    header.append(label, count, rule);
    group.appendChild(header);
    groupHeaderEls.push({ el: header, cat });

    /* Cards */
    cards.forEach(card => group.appendChild(card));
    board.appendChild(group);
  });

  container.appendChild(board);

  /* ═══════════════════════════════════════════
     STEP 4 — STATE
  ══════════════════════════════════════════════ */
  let activeFilter = 'all';
  let searchQuery  = '';

  /* ═══════════════════════════════════════════
     STEP 5 — APPLY FILTERS + SEARCH
     Called any time filter or search changes.
  ══════════════════════════════════════════════ */
  function applyFilters() {
    const q     = searchQuery.toLowerCase().trim();
    const isSearch = q.length > 0;
    const isCat    = activeFilter !== 'all';

    let visibleCount = 0;

    rawCards.forEach(card => {
      /* ── Category test ── */
      const cardCat = (card.dataset.category || '').toLowerCase();
      const catPass = !isCat || cardCat === activeFilter;

      /* ── Search test (scrubs data-summary) ── */
      const summary = (card.dataset.summary || '').toLowerCase();
      const searchPass = !isSearch || summary.includes(q);

      const visible = catPass && searchPass;
      card.hidden = !visible;
      if (visible) visibleCount++;

      /* ── Highlight matched text in title + desc ── */
      highlightCard(card, isSearch ? q : '');
    });

    /* ── Group headers ──
       Show headers only when showing all categories with no search.
       Hide them during filtered/searched views for a flat board feel. */
    const showHeaders = !isCat && !isSearch;
    groupHeaderEls.forEach(({ el, cat }) => {
      /* Also hide a group header if every card in that group is hidden */
      const groupVisible = !isCat || cat === activeFilter;
      el.hidden = !showHeaders || !groupVisible;
    });

    /* ── Count ── */
    const total = rawCards.length;
    if (visibleCount === total) {
      countEl.textContent = `${total} project${total !== 1 ? 's' : ''}`;
    } else {
      countEl.textContent = `${visibleCount} of ${total}`;
    }

    /* ── Empty state ── */
    const isEmpty = visibleCount === 0;
    emptyEl.hidden = !isEmpty;
    board.hidden   = isEmpty;
    if (isEmpty) {
      emptyTerm.textContent =
        isSearch && isCat ? `"${q}" in ${capitalise(activeFilter)}`
        : isSearch         ? `"${q}"`
        :                    capitalise(activeFilter);
    }
  }

  /* ═══════════════════════════════════════════
     HIGHLIGHT — wrap matched chars in <mark>
     Only runs on .card-title a and .card-desc.
     Stores original innerHTML on first call so
     it can be restored when query is cleared.
  ══════════════════════════════════════════════ */
  function highlightCard(card, q) {
    const targets = [
      card.querySelector('.card-title a'),
      card.querySelector('.card-desc'),
    ];
    targets.forEach(el => {
      if (!el) return;
      /* Save original text content once */
      if (!el.dataset.origText) {
        el.dataset.origText = el.textContent;
        el.dataset.origHtml = el.innerHTML;
      }
      if (!q) {
        /* Restore original */
        el.innerHTML = el.dataset.origHtml;
        return;
      }
      /* Escape regex special chars in query */
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`(${escaped})`, 'gi');
      /* Operate on plain text to avoid breaking HTML tags */
      el.innerHTML = el.dataset.origText.replace(
        re,
        '<mark class="pb-match">$1</mark>'
      );
    });
  }

  /* ═══════════════════════════════════════════
     CHIP FILTER CLICKS
  ══════════════════════════════════════════════ */
  filtersEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.pb-chip');
    if (!chip) return;

    activeFilter = chip.dataset.cat;

    /* Update active chip */
    filtersEl.querySelectorAll('.pb-chip').forEach(c =>
      c.classList.toggle('pb-chip-active', c === chip)
    );

    /* Sync URL param without reloading */
    const url = new URL(window.location.href);
    if (activeFilter === 'all') {
      url.searchParams.delete('cat');
    } else {
      url.searchParams.set('cat', activeFilter);
    }
    history.replaceState(null, '', url.toString());

    applyFilters();
  });

  /* ═══════════════════════════════════════════
     SEARCH INPUT
  ══════════════════════════════════════════════ */
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      searchQuery = searchInput.value;
      clearBtn.hidden = searchQuery.length === 0;
      applyFilters();
    }, 160); /* 160ms debounce — fast but not every keystroke */
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.hidden = true;
    searchInput.focus();
    applyFilters();
  });

  /* ── Empty state reset button ── */
  emptyReset.addEventListener('click', () => {
    /* Clear both filter and search */
    activeFilter = 'all';
    searchQuery  = '';
    searchInput.value = '';
    clearBtn.hidden = true;
    filtersEl.querySelectorAll('.pb-chip').forEach(c =>
      c.classList.toggle('pb-chip-active', c.dataset.cat === 'all')
    );
    const url = new URL(window.location.href);
    url.searchParams.delete('cat');
    history.replaceState(null, '', url.toString());
    applyFilters();
  });

  /* ═══════════════════════════════════════════
     URL ?cat= PARAM ON LOAD
     Pre-selects a filter chip if the page was
     opened via a navbar dropdown link like
     /projects/?cat=propulsion
  ══════════════════════════════════════════════ */
  (function readUrlParam() {
    const params = new URLSearchParams(window.location.search);
    const cat    = (params.get('cat') || '').toLowerCase();
    if (!cat) return;

    const matchingChip = filtersEl.querySelector(`[data-cat="${cat}"]`);
    if (!matchingChip) return;

    activeFilter = cat;
    filtersEl.querySelectorAll('.pb-chip').forEach(c =>
      c.classList.toggle('pb-chip-active', c === matchingChip)
    );
  })();

  /* ═══════════════════════════════════════════
     INIT — run first render
  ══════════════════════════════════════════════ */
  applyFilters();

  /* ── Utility ── */
  function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

})();
