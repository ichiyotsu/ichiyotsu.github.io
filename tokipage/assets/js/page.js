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
