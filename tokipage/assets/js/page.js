(() => {
  const ids = ['home', 'software', 'explore', 'about'];
  const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
  const nav = document.querySelector('.desktop-nav');
  if (!sections.length || !nav) return;

  let current = '';
  const mark = (id) => {
    if (!id || id === current) return;
    current = id;
    nav.dispatchEvent(new CustomEvent('ichiyotsu:section', { detail: { id } }));
  };

  const fromHash = () => {
    const id = location.hash.replace('#', '');
    if (ids.includes(id)) mark(id);
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) mark(visible.target.id);
  }, { rootMargin: '-18% 0px -52% 0px', threshold: [0.15, 0.35, 0.6] });

  sections.forEach((section) => observer.observe(section));
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();

(() => {
  // Release notes can set the platform with one line: 平台: Android 15+ / Windows 10+ (or Platform:). Slashes display as spaces.
  const hour = 60 * 60 * 1000;
  const platformLine = /^(平台|Platform)\s*[:：]\s*(.+)$/im;
  const apply = (row, data) => {
    const version = row.querySelector('.plan-ver');
    const platform = row.querySelector('.plan-plat');
    if (version && data.version) version.textContent = data.version;
    if (platform && data.platform) platform.textContent = data.platform;
    if (data.url && row.matches('a')) row.href = data.url;
  };
  document.querySelectorAll('.plan-row[data-repo]').forEach((row) => {
    const repo = row.getAttribute('data-repo');
    if (!repo) return;
    const key = `tokipage-release:${repo}`;
    try {
      const cached = JSON.parse(localStorage.getItem(key) || 'null');
      if (cached && Date.now() - cached.at < hour) {
        apply(row, cached);
        return;
      }
    } catch (error) {}
    fetch(`https://api.github.com/repos/${encodeURI(repo)}/releases/latest`)
      .then((response) => (response.ok ? response.json() : null))
      .then((release) => {
        if (!release) return;
        const version = String(release.tag_name || '').replace(/^[vV]/, '');
        if (!version) return;
        const found = String(release.body || '').match(platformLine);
        const data = {
          at: Date.now(),
          version,
          platform: found ? found[2].trim().split(' / ').join(' ') : '',
          url: release.html_url || ''
        };
        apply(row, data);
        localStorage.setItem(key, JSON.stringify(data));
      })
      .catch(() => {});
  });
})();
