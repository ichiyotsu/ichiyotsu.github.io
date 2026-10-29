/* =========================================================
   ichiyotsu. — small enhancements, no dependencies
   ========================================================= */

(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const themeKey = 'ichiyotsu-theme';
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

  /* ---------- Toast ---------- */

  let toastEl = null;
  let toastTimer = 0;

  function showToast(message) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }

    toastEl.textContent = message;
    toastEl.classList.remove('is-visible');
    window.clearTimeout(toastTimer);

    window.requestAnimationFrame(() => {
      toastEl.classList.add('is-visible');
    });

    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }

  window.ichiyotsuToast = showToast;

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.opacity = '0';
    document.body.appendChild(helper);
    helper.select();

    let ok = false;
    try { ok = document.execCommand('copy'); } catch (error) { ok = false; }
    helper.remove();
    return ok;
  }

  window.ichiyotsuCopy = copyText;

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;

    const value = button.getAttribute('data-copy') || '';
    if (!value) return;

    const ok = await copyText(value).catch(() => false);
    showToast(ok ? '链接已复制' : '复制失败，请手动选择链接');
  });

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

    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle('is-scrolled', doc.scrollTop > 20);

    // Real-time blur: it deepens slightly as content slides under the bar.
    const blur = 14 + Math.min(12, (doc.scrollTop / 160) * 12);
    root.style.setProperty('--header-blur', `${blur.toFixed(1)}px`);

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

  /* ---------- Desktop dropdowns ---------- */

  document.querySelectorAll('[data-nav-item]').forEach((item) => {
    const link = item.querySelector('.nav-link');
    const dropdown = item.querySelector('.nav-dropdown');
    if (!link || !dropdown) return;

    const setOpen = (open) => {
      link.setAttribute('aria-expanded', String(open));
      item.classList.toggle('is-open', open);
    };

    item.addEventListener('mouseenter', () => setOpen(true));
    item.addEventListener('mouseleave', () => setOpen(false));
    item.addEventListener('focusin', () => setOpen(true));
    item.addEventListener('focusout', (event) => {
      if (!item.contains(event.relatedTarget)) setOpen(false);
    });

    link.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        link.blur();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setOpen(true);
        const first = dropdown.querySelector('a');
        if (first) first.focus();
      }
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && item.contains(document.activeElement)) {
        setOpen(false);
        link.focus();
      }
    });

    dropdown.querySelectorAll('a').forEach((subLink) => {
      subLink.addEventListener('click', () => setOpen(false));
    });
  });

  /* ---------- Mobile navigation sheet ---------- */

  const menuButton = document.getElementById('menu-button');
  const navSheet = document.getElementById('nav-sheet');
  const navClose = document.getElementById('nav-close');
  const sheetViews = navSheet ? Array.from(navSheet.querySelectorAll('[data-sheet-view]')) : [];
  const groupButtons = navSheet ? Array.from(navSheet.querySelectorAll('[data-sheet-group]')) : [];
  let lastGroupButton = null;

  function showSheetView(name, { focus = true } = {}) {
    if (!sheetViews.length) return;

    sheetViews.forEach((view) => {
      view.hidden = view.dataset.sheetView !== name;
    });

    if (focus) {
      const target = name === 'index'
        ? lastGroupButton
        : navSheet.querySelector(`[data-sheet-view="${name}"] [data-sheet-back]`);
      if (target) target.focus({ preventScroll: true });
    }

    const panel = navSheet.querySelector('.nav-sheet__panel');
    if (panel) panel.scrollTop = 0;
  }

  function openSheet() {
    if (!navSheet) return;

    showSheetView('index', { focus: false });

    if (typeof navSheet.showModal === 'function') {
      navSheet.showModal();
    } else {
      navSheet.setAttribute('open', '');
    }

    if (menuButton) {
      menuButton.setAttribute('aria-expanded', 'true');
      menuButton.setAttribute('aria-label', '关闭菜单');
    }

    body.classList.add('sheet-open');
    body.style.overflow = 'hidden';

    window.setTimeout(() => {
      const first = navSheet.querySelector('[data-sheet-view="index"] [data-sheet-group]');
      if (first) first.focus({ preventScroll: true });
    }, 50);
  }

  function closeSheet() {
    if (!navSheet) return;

    if (typeof navSheet.close === 'function' && navSheet.open) {
      navSheet.close();
    } else {
      navSheet.removeAttribute('open');
    }
  }

  if (menuButton) {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.addEventListener('click', openSheet);
  }

  if (navClose) navClose.addEventListener('click', closeSheet);

  if (navSheet) {
    groupButtons.forEach((button) => {
      button.addEventListener('click', () => {
        lastGroupButton = button;
        showSheetView(button.dataset.sheetGroup);
      });
    });

    navSheet.querySelectorAll('[data-sheet-back]').forEach((button) => {
      button.addEventListener('click', () => showSheetView('index'));
    });

    navSheet.addEventListener('close', () => {
      if (menuButton) {
        menuButton.setAttribute('aria-expanded', 'false');
        menuButton.setAttribute('aria-label', '打开菜单');
        menuButton.focus({ preventScroll: true });
      }
      body.classList.remove('sheet-open');
      body.style.overflow = '';
      showSheetView('index', { focus: false });
    });

    navSheet.addEventListener('click', (event) => {
      if (event.target === navSheet) closeSheet();
    });

    navSheet.querySelectorAll('a[href]').forEach((link) => {
      link.addEventListener('click', () => closeSheet());
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

  /* ---------- Design playground ---------- */

  const shapeDemo = document.getElementById('shape-demo');
  if (shapeDemo) {
    shapeDemo.dataset.shape = '0';
    shapeDemo.addEventListener('click', () => {
      const next = (Number(shapeDemo.dataset.shape || 0) + 1) % 3;
      shapeDemo.dataset.shape = String(next);
    });
  }

  const motionDemo = document.getElementById('motion-demo');
  if (motionDemo) {
    const stage = motionDemo.closest('.motion-stage');
    motionDemo.addEventListener('click', () => {
      if (!stage) return;
      stage.classList.remove('is-playing');
      // Restart the transition even if the same button is pressed twice.
      void stage.offsetWidth;
      stage.classList.add('is-playing');
      window.setTimeout(() => stage.classList.remove('is-playing'), 900);
    });
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
