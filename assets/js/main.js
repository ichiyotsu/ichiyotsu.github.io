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
    const menuLayer = document.createElement('div');
    menuLayer.className = 'mobile-menu-layer';
    menuLayer.hidden = true;
    menuLayer.innerHTML = `
      <button class="mobile-menu-close" type="button" aria-label="关闭菜单"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/></svg></button>
      <div class="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="mobile-menu-head">
          <h2>Menu</h2>
        </div>
        <nav class="mobile-menu-links" aria-label="站点菜单">
          <a href="/"${window.location.pathname === '/' ? ' aria-current="page"' : ''}>主页</a>
          <a href="/software/"${window.location.pathname.startsWith('/software') ? ' aria-current="page"' : ''}>软件</a>
          <a href="/garden/"${window.location.pathname.startsWith('/garden') ? ' aria-current="page"' : ''}>探索</a>
          <a href="/about/"${window.location.pathname.startsWith('/about') ? ' aria-current="page"' : ''}>关于</a>
        </nav>
      </div>`;
    document.body.appendChild(menuLayer);
    const menuClose = menuLayer.querySelector('.mobile-menu-close');
    const setMenuOpen = (open) => {
      menuLayer.hidden = !open;
      document.body.classList.toggle('is-menu-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      if (open) window.setTimeout(() => menuClose.focus({ preventScroll: true }), 40);
    };
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '打开菜单');
    menuButton.setAttribute('aria-haspopup', 'dialog');
    menuButton.setAttribute('aria-controls', 'mobile-menu');
    menuLayer.querySelector('.mobile-menu-panel').id = 'mobile-menu';
    menuButton.addEventListener('click', () => setMenuOpen(menuLayer.hidden));
    menuClose.addEventListener('click', () => setMenuOpen(false));
    menuLayer.addEventListener('click', (event) => { if (event.target === menuLayer) setMenuOpen(false); });
    menuLayer.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menuLayer.hidden) setMenuOpen(false);
    });
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

  /* ---------- Site-wide search (YesIcon / Meteor icons) ---------- */

  const meteor = {
    search: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2 5h14M9 2v3m4 0q-2 8-9 11m2-7q2 4 6 6m1 7l5-11l5 11m-1.37-3h-7.26"/>',
    searchIcon: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="10" cy="10" r="7"/><path d="m21 21l-6.05-6.05"/></g>',
    close: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/>'
  };

  const searchIndex = [
    { title: 'TokiPage 主页', group: '页面', url: '/', text: '欢迎来到 TokiPage 首页 入口 软件 探索 关于', keywords: 'home tokipage 主页' },
    { title: '软件', group: '页面', url: '/software/', text: '作品 设计 TokiUI 制作中 TokiHarness', keywords: 'software app 软件 作品' },
    { title: '探索', group: '页面', url: '/garden/', text: 'GitHub Discussions 更新公告 说点什么 设计建议 社区问答', keywords: 'explore garden discussion 探索 讨论' },
    { title: 'TokiUI Design', group: '设计', url: '/tokiui/', text: 'Material Design3 Expressive 底栏 交互 磨砂玻璃 通用设计语言', keywords: 'tokiui design md3e material expressive 设计' },
    { title: 'TokiTodo', group: '软件', url: '/software/tokitodo/', text: '待办 专注计时 手机锁 统计 APK 下载', keywords: 'todo 待办 专注 计时 tokitodo' },
    { title: 'Luna', group: '软件', url: '/software/luna/', text: '悬浮胶囊浏览器 APK 下载', keywords: 'luna browser 浏览器' },
    { title: 'TokiNote', group: '软件', url: '/software/tokinote/', text: '本地笔记软件 备份 底栏 APK 下载', keywords: 'note 笔记 tokinote 本地' },
    { title: 'TokiFonts', group: '软件', url: '/software/tokifonts/', text: '字体资源库 OneUI 教程 字体', keywords: 'font 字体 tokifonts' },
    { title: '作品', group: '软件', url: '/software/#work', text: 'TokiTodo Luna TokiNote TokiFonts 四个作品', keywords: 'work 作品 app' },
    { title: 'TokiUI 介绍', group: '设计', url: '/software/#design', text: 'Material Design3 Expressive TokiUI 设计语言 通用标准', keywords: 'tokiui design 设计 md3e' },
    { title: '正在制作 / TokiHarness', group: '软件', url: '/software/#making', text: 'DSH 手机版 二创 TokiHarness 正在制作', keywords: 'making toki harness dsh 制作中' },
    { title: '关于', group: '页面', url: '/about/', text: '关于本站 联系 GitHub 设计 字体', keywords: 'about 关于 contact 联系' },
    { title: '更新公告', group: '探索', url: '/garden/', text: 'GitHub Discussions 更新公告 Announcements', keywords: 'announcement 公告 更新' },
    { title: '设计建议', group: '探索', url: '/garden/', text: 'Ideas 设计建议 讨论', keywords: 'ideas 建议 设计' },
    { title: '社区问答', group: '探索', url: '/garden/', text: 'Q&A 社区问答 提问 回答', keywords: 'q&a qa 问答 社区' }
  ];

  const brandEl = document.querySelector('.site-header .brand');
  if (brandEl && !document.querySelector('.site-search-toggle')) {
    const searchButton = document.createElement('button');
    searchButton.className = 'icon-button site-search-toggle';
    searchButton.type = 'button';
    searchButton.setAttribute('aria-label', '搜索全站');
    searchButton.setAttribute('aria-expanded', 'false');
    searchButton.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${meteor.searchIcon}</svg>`;
    brandEl.insertAdjacentElement('afterend', searchButton);

    const layer = document.createElement('div');
    layer.className = 'site-search-layer';
    layer.hidden = true;
    layer.innerHTML = `
      <div class="site-search-panel" role="dialog" aria-modal="true" aria-label="搜索全站">
        <h2 class="site-search-heading">Search</h2>
        <div class="site-search-field">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${meteor.searchIcon}</svg>
          <input id="site-search-input" type="search" placeholder="搜索 TokiPage…" autocomplete="off" spellcheck="false" aria-label="搜索全站">
          <button class="site-search-close" type="button" aria-label="关闭搜索"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${meteor.close}</svg></button>
        </div>
        <div class="site-search-results" id="site-search-results" role="region" aria-label="搜索建议"></div>
      </div>`;
    document.body.appendChild(layer);
    const input = layer.querySelector('#site-search-input');
    const results = layer.querySelector('#site-search-results');
    const close = layer.querySelector('.site-search-close');
    let activeIndex = -1;

    const setSearchOpen = (open) => {
      layer.hidden = !open;
      document.body.classList.toggle('is-searching', open);
      searchButton.setAttribute('aria-expanded', String(open));
      if (open) {
        activeIndex = -1;
        input.value = '';
        renderResults('');
        window.setTimeout(() => input.focus({ preventScroll: true }), 40);
      }
    };

    const makeRow = (item, index) => {
      const row = document.createElement('a');
      row.className = 'site-search-result';
      row.href = item.url;
      row.dataset.index = String(index);
      row.innerHTML = `<span class="site-search-result__group">${item.group}</span><strong>${item.title}</strong><small>${item.text}</small>`;
      row.addEventListener('click', () => setSearchOpen(false));
      return row;
    };

    const renderResults = (query) => {
      const q = query.trim().toLowerCase();
      results.replaceChildren();
      if (!q) {
        const hint = document.createElement('div');
        hint.className = 'site-search-suggest';
        hint.innerHTML = '<span>试试</span>';
        ['TokiUI', 'TokiNote', '更新公告', '下载'].forEach((word) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.textContent = word;
          chip.addEventListener('click', () => { input.value = word; renderResults(word); input.focus(); });
          hint.appendChild(chip);
        });
        results.appendChild(hint);
      }
      const list = q
        ? searchIndex.filter((item) => `${item.title} ${item.text} ${item.keywords}`.toLowerCase().includes(q)).slice(0, 8)
        : searchIndex.slice(0, 5);
      if (q && !list.length) {
        const empty = document.createElement('p');
        empty.className = 'site-search-empty';
        empty.textContent = '没有找到相关内容。';
        results.appendChild(empty);
      }
      list.forEach((item, index) => results.appendChild(makeRow(item, index)));
      activeIndex = -1;
    };

    const moveActive = (direction) => {
      const rows = [...results.querySelectorAll('.site-search-result')];
      if (!rows.length) return;
      activeIndex = (activeIndex + direction + rows.length) % rows.length;
      rows.forEach((row, index) => row.classList.toggle('is-active', index === activeIndex));
      rows[activeIndex].scrollIntoView({ block: 'nearest' });
    };

    searchButton.addEventListener('click', () => setSearchOpen(layer.hidden));
    close.addEventListener('click', () => setSearchOpen(false));
    layer.addEventListener('click', (event) => { if (event.target === layer) setSearchOpen(false); });
    input.addEventListener('input', () => renderResults(input.value));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { setSearchOpen(false); searchButton.focus(); }
      if (event.key === 'ArrowDown') { event.preventDefault(); moveActive(1); }
      if (event.key === 'ArrowUp') { event.preventDefault(); moveActive(-1); }
      if (event.key === 'Enter') {
        const rows = [...results.querySelectorAll('.site-search-result')];
        if (rows[activeIndex]) rows[activeIndex].click();
        else if (rows[0]) rows[0].click();
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !layer.hidden) { setSearchOpen(false); searchButton.focus(); }
    });
  }
})();
