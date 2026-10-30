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

  /* ---------- Page-edge frost ---------- */

  if (!document.querySelector('.page-frost')) {
    const topFrost = document.createElement('div');
    topFrost.className = 'page-frost page-frost--top';
    topFrost.setAttribute('aria-hidden', 'true');

    const bottomFrost = document.createElement('div');
    bottomFrost.className = 'page-frost page-frost--bottom';
    bottomFrost.setAttribute('aria-hidden', 'true');

    document.body.prepend(topFrost);
    document.body.append(bottomFrost);
  }

  /* ---------- Cursor-following home portal glow ---------- */

  document.querySelectorAll('.home-portal').forEach((portal) => {
    portal.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = portal.getBoundingClientRect();
      portal.style.setProperty('--glow-x', `${((event.clientX - rect.left) / rect.width) * 100}%`);
      portal.style.setProperty('--glow-y', `${((event.clientY - rect.top) / rect.height) * 100}%`);
    });
    portal.addEventListener('pointerleave', () => {
      portal.style.setProperty('--glow-x', '50%');
      portal.style.setProperty('--glow-y', '50%');
    });
  });

  /* ---------- Button press feedback ---------- */

  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest('.button, .icon-button, .nav-link, .filter-chip, .sheet-group');
    if (!target) return;
    target.classList.remove('is-pressed');
    void target.offsetWidth;
    target.classList.add('is-pressed');
    window.setTimeout(() => target.classList.remove('is-pressed'), 620);
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
      window.setTimeout(() => stage.classList.remove('is-playing'), 1900);
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

  /* ---------- Software page mini components ---------- */

  document.querySelectorAll('[data-todo-task]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(next));
    });
  });

  document.querySelectorAll('[data-todo-focus]').forEach((button) => {
    button.addEventListener('click', () => {
      const next = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(next));
      const value = button.querySelector('strong');
      if (value) value.textContent = next ? '专注中' : '25:00';
    });
  });

  document.querySelectorAll('[data-note-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      button.closest('.mini-notebar')?.querySelectorAll('[data-note-tab]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
    });
  });

  document.querySelectorAll('[data-note-tone]').forEach((button) => {
    const tones = ['', 'rose', 'blue', 'green'];
    button.addEventListener('click', () => {
      const card = button.closest('.project--note');
      if (!card) return;
      const current = tones.indexOf(card.dataset.tone || '');
      card.dataset.tone = tones[(current + 1) % tones.length];
    });
  });

  document.querySelectorAll('[data-m3-chip]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const selected = chip.classList.contains('is-selected');
      chip.classList.toggle('is-selected', !selected);
      chip.setAttribute('aria-pressed', String(!selected));
    });
  });

  const m3Progress = document.getElementById('m3-progress');
  const setM3Progress = (value) => {
    if (!m3Progress) return;
    const next = Math.max(0, Math.min(100, value));
    m3Progress.setAttribute('aria-valuenow', String(next));
    const bar = m3Progress.querySelector('span');
    if (bar) bar.style.width = `${next}%`;
  };
  let m3Value = 62;
  document.getElementById('m3-add')?.addEventListener('click', () => {
    m3Value = m3Value >= 100 ? 12 : m3Value + 12;
    setM3Progress(m3Value);
  });
  document.getElementById('m3-reset')?.addEventListener('click', () => {
    m3Value = 0;
    setM3Progress(m3Value);
  });

  /* ---------- Mobile TokiNote-style dock ---------- */

  const dock = document.createElement('nav');
  dock.className = 'mobile-dock';
  dock.setAttribute('aria-label', '移动端导航');
  const path = window.location.pathname;
  const dockPage = path === '/' ? 'home' : path.startsWith('/software') ? 'software' : path.startsWith('/garden') ? 'garden' : path.startsWith('/about') ? 'about' : '';
  const dockItems = [
    ['home', '/', '主页', '<path d="m4 10 8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'],
    ['software', '/software/', '软件', '<rect x="4" y="4" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="4" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="4" y="14" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="6" height="6" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.8"/>'],
    ['garden', '/garden/', '探索', '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m15.5 8.5-2.1 5-5 2.1 2.1-5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'],
    ['about', '/about/', '关于', '<circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 20c.6-3.4 3.1-5.2 7-5.2s6.4 1.8 7 5.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>']
  ];
  dock.innerHTML = dockItems.map(([key, href, label, icon]) =>
    `<a href="${href}"${dockPage === key ? ' aria-current="page"' : ''}><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icon}</svg><span>${label}</span></a>`
  ).join('');
  document.body.appendChild(dock);
})();
