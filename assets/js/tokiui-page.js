(() => {
  const dock = document.querySelector('.tokiui-demo-dock');
  if (dock) {
    dock.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-tk-item]');
      if (!button) return;
      dock.querySelectorAll('button').forEach((item) => item.classList.toggle('is-active', item === button));
    });
  }

  const press = document.querySelector('[data-tk-press]');
  if (press) {
    press.addEventListener('pointerdown', () => press.classList.add('is-pressed'));
    const release = () => press.classList.remove('is-pressed');
    press.addEventListener('pointerup', release);
    press.addEventListener('pointerleave', release);
    press.addEventListener('pointercancel', release);
  }

  document.querySelectorAll('.tokiui-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const next = !toggle.classList.contains('is-on');
      toggle.classList.toggle('is-on', next);
      toggle.setAttribute('aria-checked', String(next));
    });
  });

  document.querySelectorAll('.tokiui-chip-row').forEach((row) => {
    row.addEventListener('click', (event) => {
      const chip = event.target.closest('.tokiui-chip');
      if (!chip) return;
      row.querySelectorAll('.tokiui-chip').forEach((item) => item.classList.toggle('is-active', item === chip));
    });
  });
})();
