(() => {
  const dialog = document.getElementById('contact-dialog');
  const open = document.getElementById('contact-fab');
  const close = document.getElementById('contact-close');

  const show = () => {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  };
  const hide = () => {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  };

  if (dialog && open) {
    open.addEventListener('click', show);
    close?.addEventListener('click', hide);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) hide();
    });
    if (window.location.hash === '#contact') window.setTimeout(show, 120);
  }

  const updated = document.getElementById('about-updated');
  const sha = document.getElementById('about-sha');
  if (!updated) return;

  const formatStamp = (date) => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date);
    const pick = (type) => parts.find((part) => part.type === type)?.value || '';
    return `${pick('year')}.${pick('month')}.${pick('day')} ${pick('hour')}:${pick('minute')}`;
  };

  const useDocumentTime = () => {
    const parsed = new Date(document.lastModified);
    updated.textContent = Number.isNaN(parsed.getTime()) ? '—' : formatStamp(parsed);
    if (sha && sha.textContent === '…') sha.textContent = '—';
  };

  fetch('https://api.github.com/repos/ichiyotsu/ichiyotsu.github.io/commits?per_page=1')
    .then((response) => {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then((commits) => {
      const commit = Array.isArray(commits) ? commits[0] : null;
      const iso = commit?.commit?.committer?.date || commit?.commit?.author?.date;
      const when = iso ? new Date(iso) : null;
      if (!when || Number.isNaN(when.getTime())) throw new Error('date');
      updated.textContent = formatStamp(when);
      if (sha) sha.textContent = String(commit.sha || '').slice(0, 7) || '—';
    })
    .catch(useDocumentTime);
})();
