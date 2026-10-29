/* =========================================================
   Tokisakyo — small enhancements, no dependencies
   ========================================================= */

(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const themeKey = 'tokisakyo-theme';
  const themeToggle = document.getElementById('theme-toggle');
  const header = document.querySelector('.site-header');
  const progressBar = document.getElementById('page-progress-bar');

  const safeStorage = {
    get(key) {
      try { return window.localStorage.getItem(key); } catch (error) { return null; }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, value); } catch (error) {}
    }
  };

  /* ---------- Theme ---------- */

  const currentTheme = () => (root.dataset.theme === 'dark' ? 'dark' : 'light');

  function syncThemeButton(theme) {
    if (!themeToggle) return;
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-label', isDark ? '切换到浅色模式' : '切换到深色模式');
    themeToggle.setAttribute('aria-pressed', String(isDark));
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    safeStorage.set(themeKey, theme);
    syncThemeButton(theme);

    const meta = document.getElementById('theme-color');
    if (meta) meta.content = theme === 'dark' ? '#151210' : '#FDF8F2';
  }

  function toggleTheme(event) {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    const update = () => applyTheme(next);

    if (!document.startViewTransition || reduceMotion.matches) {
      update();
      return;
    }

    const x = event && event.clientX ? event.clientX : window.innerWidth - 48;
    const y = event && event.clientY ? event.clientY : 32;
    root.style.setProperty('--vt-x', `${x}px`);
    root.style.setProperty('--vt-y', `${y}px`);

    try {
      document.startViewTransition(update);
    } catch (error) {
      update();
    }
  }

  syncThemeButton(currentTheme());

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemTheme = (event) => {
    // Only follow the OS when the visitor has not made an explicit choice.
    if (safeStorage.get(themeKey)) return;
    const theme = event.matches ? 'dark' : 'light';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    syncThemeButton(theme);
    const meta = document.getElementById('theme-color');
    if (meta) meta.content = theme === 'dark' ? '#151210' : '#FDF8F2';
  };

  if (typeof systemTheme.addEventListener === 'function') {
    systemTheme.addEventListener('change', handleSystemTheme);
  } else if (typeof systemTheme.addListener === 'function') {
    systemTheme.addListener(handleSystemTheme);
  }

  /* ---------- Scroll progress + app bar state ---------- */

  let scrollQueued = false;

  function updateScrollUI() {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    const progress = max > 0 ? Math.min(1, doc.scrollTop / max) : 0;

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    if (header) {
      header.classList.toggle('is-scrolled', doc.scrollTop > 20);
    }

    updateActiveSection();
    scrollQueued = false;
  }

  function queueScrollUpdate() {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollUI);
  }

  window.addEventListener('scroll', queueScrollUpdate, { passive: true });
  window.addEventListener('resize', queueScrollUpdate);
  window.requestAnimationFrame(updateScrollUI);

  /* ---------- Mobile navigation sheet ---------- */

  const menuButton = document.getElementById('menu-button');
  const navSheet = document.getElementById('nav-sheet');
  const navClose = document.getElementById('nav-close');

  function openSheet() {
    if (!navSheet) return;

    if (typeof navSheet.showModal === 'function') {
      navSheet.showModal();
    } else {
      navSheet.setAttribute('open', '');
    }

    if (menuButton) menuButton.setAttribute('aria-expanded', 'true');
    body.classList.add('sheet-open');
    body.style.overflow = 'hidden';
  }

  function closeSheet() {
    if (!navSheet) return;

    if (typeof navSheet.close === 'function' && navSheet.open) {
      navSheet.close();
    } else {
      navSheet.removeAttribute('open');
    }

    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    body.classList.remove('sheet-open');
    body.style.overflow = '';
  }

  if (menuButton) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', openSheet);
  }

  if (navClose) {
    navClose.addEventListener('click', closeSheet);
  }

  if (navSheet) {
    navSheet.addEventListener('close', () => {
      if (menuButton) {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.focus({ preventScroll: true });
      }
      body.classList.remove('sheet-open');
      body.style.overflow = '';
    });

    navSheet.addEventListener('click', (event) => {
      if (event.target === navSheet) closeSheet();
    });

    navSheet.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => {
        closeSheet();
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */

  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));

  if (revealItems.length) {
    if (!('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, {
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.06
      });

      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  /* ---------- Active section in the top bar ---------- */

  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const sections = navLinks
    .map((link) => document.getElementById(link.dataset.nav))
    .filter(Boolean);

  function setActiveSection(id) {
    navLinks.forEach((link) => {
      const active = link.dataset.nav === id;
      link.classList.toggle('is-active', active);
      if (active) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  function updateActiveSection() {
    if (!sections.length) return;

    const marker = window.scrollY + window.innerHeight * 0.38;
    let activeId = '';

    sections.forEach((section) => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= marker) activeId = section.id;
    });

    // At the very top the hero owns the stage; clear the nav pills.
    if (window.scrollY < window.innerHeight * 0.35) activeId = '';

    setActiveSection(activeId);
  }

  /* ---------- Subtle pointer parallax in the hero ---------- */

  const heroArt = document.querySelector('.hero__art');

  if (heroArt && finePointer.matches && !reduceMotion.matches) {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;

    const renderParallax = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      heroArt.style.setProperty('--mx', currentX.toFixed(3));
      heroArt.style.setProperty('--my', currentY.toFixed(3));

      if (Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        raf = window.requestAnimationFrame(renderParallax);
      } else {
        raf = 0;
      }
    };

    const startParallax = () => {
      if (!raf) raf = window.requestAnimationFrame(renderParallax);
    };

    heroArt.addEventListener('pointermove', (event) => {
      const rect = heroArt.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width - 0.5;
      targetY = (event.clientY - rect.top) / rect.height - 0.5;
      startParallax();
    }, { passive: true });

    heroArt.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      startParallax();
    });
  }

  /* ---------- Year ---------- */

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  /* ---------- Start the hero intro ---------- */

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => body.classList.add('is-loaded'));
  });
})();
