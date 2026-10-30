(() => {
  const dialog = document.getElementById('contact-dialog');
  const open = document.getElementById('contact-fab');
  const close = document.getElementById('contact-close');
  if (!dialog || !open) return;

  const show = () => {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };
  const hide = () => {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  open.addEventListener('click', show);
  close?.addEventListener('click', hide);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) hide();
  });

  if (window.location.hash === '#contact') {
    window.setTimeout(show, 120);
  }
})();
