(() => {
  document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const block = button.closest('.menu-block');
      const open = !block.classList.contains('is-open');
      document.querySelectorAll('.menu-block.is-open').forEach((item) => {
        if (item !== block) {
          item.classList.remove('is-open');
          item.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
        }
      });
      block.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
  });
})();
