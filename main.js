/* ═══════════════════════════════════════════════
   main.js  —  Portfolio interactions
════════════════════════════════════════════════ */

/* ── Navbar: add .scrolled shadow on scroll ── */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ── Mobile menu toggle ── */
function toggleMenu() {
  const menu = document.getElementById('nav-mobile');
  if (menu) menu.classList.toggle('open');
}

/* ── Hero dot-grid canvas ── */
(function () {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DOT = 1.2;   // dot radius px
  const SPACE = 32;  // grid spacing px
  const COLOR = 'rgba(0,212,184,';

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cols = Math.ceil(canvas.width  / SPACE) + 1;
    const rows = Math.ceil(canvas.height / SPACE) + 1;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Fade out toward the bottom (parallax suggestion)
        const yFrac = (r * SPACE) / canvas.height;
        const alpha = 0.22 * (1 - yFrac * 0.7);
        ctx.beginPath();
        ctx.arc(c * SPACE, r * SPACE, DOT, 0, Math.PI * 2);
        ctx.fillStyle = COLOR + alpha + ')';
        ctx.fill();
      }
    }
  }

  // Scroll: shift canvas up slightly (parallax)
  window.addEventListener('scroll', () => {
    const offset = window.scrollY * 0.25;
    canvas.style.transform = `translateY(${offset}px)`;
    // Fade canvas as user scrolls
    canvas.style.opacity = Math.max(0, 0.45 - window.scrollY / 600);
  }, { passive: true });

  window.addEventListener('resize', resize, { passive: true });
  resize();
})();

/* ── Scroll-reveal: fade sections in on scroll ── */
(function () {
  if (!('IntersectionObserver' in window)) return;

  const els = document.querySelectorAll(
    '.project-card, .update-card, .about-strip-inner, .stat, .proj-section, .proj-figure, .proj-results'
  );

  // Start invisible
  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity .45s ease, transform .45s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Slight stagger per card
        const delay = (entry.target.dataset.delay || 0) + 'ms';
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, parseFloat(delay));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  // Stagger cards in grids
  document.querySelectorAll('.projects-grid .project-card').forEach((el, i) => {
    el.dataset.delay = i * 80;
  });
  document.querySelectorAll('.stat').forEach((el, i) => {
    el.dataset.delay = i * 60;
  });

  els.forEach(el => observer.observe(el));
})();

/* ── Active nav link based on current page ── */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === path);
  });
})();
