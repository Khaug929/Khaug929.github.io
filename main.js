/* ═══════════════════════════════════════════════
   main.js — Portfolio interactions (orange/charcoal)
════════════════════════════════════════════════ */

/* ── Navbar scroll state ── */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ── Mobile hamburger menu ── */
function toggleMenu() {
  const menu = document.getElementById('nav-mobile');
  if (!menu) return;
  const isOpen = menu.classList.toggle('open');
  const btn = document.querySelector('.nav-toggle');
  if (btn) btn.setAttribute('aria-expanded', isOpen);
}

/* ── Mobile projects category sub-menu ── */
function toggleMobileCat() {
  const sub = document.getElementById('mobile-cat-menu');
  if (sub) sub.classList.toggle('open');
}

/* ── Close mobile menu when clicking outside ── */
document.addEventListener('click', (e) => {
  const mobile = document.getElementById('nav-mobile');
  const toggle = document.querySelector('.nav-toggle');
  if (mobile && mobile.classList.contains('open')) {
    if (!mobile.contains(e.target) && !toggle.contains(e.target)) {
      mobile.classList.remove('open');
    }
  }
});

/* ── Dropdown: close when focus leaves (keyboard accessibility) ── */
document.querySelectorAll('.dropdown').forEach(dd => {
  dd.addEventListener('focusout', (e) => {
    if (!dd.contains(e.relatedTarget)) {
      const menu = dd.querySelector('.dropdown-menu');
      if (menu) {
        menu.style.opacity = '';
        menu.style.visibility = '';
      }
    }
  });
});

/* ── Active nav link highlighting ── */
(function () {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkPage = href.split('?')[0].split('/').pop();
    link.classList.toggle('active', linkPage === page);
  });
})();

/* ── Scroll-reveal animations ── */
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const targets = document.querySelectorAll(
    '.project-card, .update-card, .focus-item, .hero-summary, .proj-section, .proj-figure, .proj-results'
  );

  targets.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity .4s ease, transform .4s ease';
  });

  /* stagger cards in grids */
  document.querySelectorAll('.projects-grid .project-card').forEach((el, i) => {
    el.dataset.stagger = i * 75;
  });
  document.querySelectorAll('.focus-item').forEach((el, i) => {
    el.dataset.stagger = i * 50;
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const delay = parseInt(entry.target.dataset.stagger || 0);
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, delay);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  targets.forEach(el => observer.observe(el));
})();

/* ── Project filtering by URL category param (used on projects.html) ──
   When a dropdown link like projects.html?cat=mechanical is clicked,
   this script reads the param and shows only matching cards.         */
(function () {
  if (!window.location.search) return;
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('cat');
  if (!cat) return;

  /* Highlight the matching filter button if the page has them */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === cat);
  });

  /* Hide cards that don't match */
  document.querySelectorAll('.project-card').forEach(card => {
    const cardCat = (card.dataset.category || '').toLowerCase();
    const match = catMatch(cardCat, cat);
    card.style.display = match ? '' : 'none';
  });

  function catMatch(cardCat, filterCat) {
    if (filterCat === 'all' || !filterCat) return true;
    return cardCat === filterCat.toLowerCase();
  }
})();