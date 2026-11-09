export function renderPage(root, data) {
  const accent = data.accent || '#b33613';
  document.documentElement.style.setProperty('--md-sys-color-primary', accent);
  const hero = data.hero || {};
  const projects = data.projects || { items: [] };
  const about = data.about || {};
  const links = data.links || { items: [] };
  const letters = [...String(hero.name || '')].map((ch, i) => `<span style="--i:${i}">${escapeHtml(ch)}</span>`).join('');

  const works = (projects.items || []).map((item, i) => {
    const media = item.image
      ? `<img src="${escapeAttr(item.image)}" alt="" width="1200" height="900" loading="lazy">`
      : `<div class="empty">暂无图片</div>`;
    const external = /^https?:/.test(item.href || '');
    return `<a class="work" style="--i:${i}" href="${escapeAttr(item.href || '#')}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>
      <figure>${media}</figure>
      <h2>${escapeHtml(item.title || '')}</h2>
      <p>${escapeHtml(item.line || '')}</p>
      <p class="meta">${escapeHtml([item.year, item.tags].filter(Boolean).join('  ·  '))}</p>
    </a>`;
  }).join('');

  const linkItems = (links.items || []).map((item) => {
    const external = /^https?:/.test(item.href || '');
    return `<li><a href="${escapeAttr(item.href || '#')}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(item.label || '')}</a></li>`;
  }).join('');

  root.innerHTML = `
    <header class="bar">
      <a href="/2026/">${escapeHtml(hero.name || 'ichiyotsu')}</a>
      <nav aria-label="页内">
        ${projects.visible !== false ? '<a href="#works">作品</a>' : ''}
        ${about.visible !== false ? '<a href="#about">关于</a>' : ''}
        ${links.visible !== false ? '<a href="#links">链接</a>' : ''}
        <button class="theme-btn" id="theme-btn" type="button" aria-label="切换主题">
          <svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M21 12a9 9 0 1 1-9-9 1 1 0 0 0 9 9"/></svg>
          <svg class="sun" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></svg>
        </button>
      </nav>
    </header>
    ${hero.visible === false ? '' : `<section class="hero">
      <p class="kicker">${escapeHtml(hero.kicker || '')}</p>
      <h1>${letters}</h1>
      <p class="tagline">${escapeHtml(hero.tagline || '')}</p>
    </section>`}
    ${projects.visible === false ? '' : `<section class="works" id="works">${works}</section>`}
    ${about.visible === false ? '' : `<section class="about" id="about"><h2>${escapeHtml(about.title || '关于')}</h2><p>${escapeHtml(about.body || '')}</p></section>`}
    ${links.visible === false ? '' : `<section class="links" id="links"><h2>链接</h2><ul>${linkItems}</ul></section>`}
    <footer class="foot"><span>© <span id="year"></span> ${escapeHtml(data.footer || '')}</span><a href="/2026/edit/">编辑</a></footer>
  `;
  const year = root.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  bindTheme(root);
}

function bindTheme(root) {
  const button = root.querySelector('#theme-btn');
  if (!button) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const current = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const paint = (next) => {
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    try { localStorage.setItem('ichiyotsu-theme', next); } catch (error) {}
    button.setAttribute('aria-label', next === 'dark' ? '切换到浅色模式' : '切换到深色模式');
  };
  paint(current());
  button.addEventListener('click', (event) => {
    const next = current() === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduce.matches) { paint(next); return; }
    document.documentElement.style.setProperty('--vt-x', `${event.clientX}px`);
    document.documentElement.style.setProperty('--vt-y', `${event.clientY}px`);
    try { document.startViewTransition(() => paint(next)); }
    catch (error) { paint(next); }
  });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}
