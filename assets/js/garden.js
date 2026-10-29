/* =========================================================
   Garden — GitHub Discussions board + Markdown composer
   ========================================================= */

(() => {
  'use strict';

  const list = document.getElementById('garden-list');
  if (!list) return;

  const repository = 'ichiyotsu/ichiyotsu.github.io';
  const discussionsUrl = `https://github.com/${repository}/discussions`;
  const newDiscussionUrl = `${discussionsUrl}/new`;
  const dataUrl = '/garden/data/discussions.json';
  const discussionDialog = document.getElementById('discussion-dialog');
  const composeDialog = document.getElementById('compose-dialog');

  const toast = (message) => {
    if (window.ichiyotsuToast) window.ichiyotsuToast(message);
  };

  const copyText = async (text) => {
    if (window.ichiyotsuCopy) return window.ichiyotsuCopy(text);
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  };

  let discussions = [];
  let activeCategory = 'all';

  const CATEGORY_LABELS = {
    general: '讨论',
    announcements: '公告',
    'q-a': '问答',
    ideas: '想法',
    polls: '投票',
    'show-and-tell': '展示'
  };

  const categoryLabel = (category) => {
    if (!category) return '讨论';
    return CATEGORY_LABELS[category.slug] || category.name || '讨论';
  };

  /* ---------- Board ---------- */

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const diff = Date.now() - date.getTime();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    if (diff < hour) return '刚刚';
    if (diff < day) return `${Math.floor(diff / hour)} 小时前`;
    if (diff < 30 * day) return `${Math.floor(diff / day)} 天前`;

    return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric' }).format(date);
  }

  function makeIcon(id) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#${id}`);
    svg.appendChild(use);
    return svg;
  }

  function renderStats(items) {
    const target = document.getElementById('garden-stats');
    if (!target) return;

    const counts = items.reduce((acc, item) => {
      acc.comments += Number(item.comments) || 0;
      acc.upvotes += Number(item.upvotes) || 0;
      return acc;
    }, { comments: 0, upvotes: 0 });

    const values = [items.length, counts.comments, counts.upvotes];
    target.querySelectorAll('strong').forEach((node, index) => {
      node.textContent = new Intl.NumberFormat('zh-CN').format(values[index] || 0);
    });
  }

  function renderFilters(items) {
    const target = document.getElementById('garden-filters');
    if (!target) return;

    const categories = new Map();
    items.forEach((item) => {
      const slug = item.category?.slug || 'general';
      const name = categoryLabel(item.category);
      if (!categories.has(slug)) categories.set(slug, name);
    });

    target.replaceChildren();

    const all = document.createElement('button');
    all.type = 'button';
    all.className = 'filter-chip is-active';
    all.dataset.category = 'all';
    all.textContent = '全部';
    target.appendChild(all);

    categories.forEach((name, slug) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'filter-chip';
      button.dataset.category = slug;
      button.textContent = name;
      target.appendChild(button);
    });

    target.querySelectorAll('.filter-chip').forEach((button) => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.category;
        target.querySelectorAll('.filter-chip').forEach((item) => {
          item.classList.toggle('is-active', item === button);
        });
        renderBoard();
      });
    });
  }

  function makeCard(item, index) {
    const article = document.createElement('article');
    article.className = 'garden-card';

    const meta = document.createElement('div');
    meta.className = 'garden-card__meta';
    const category = document.createElement('span');
    category.className = 'garden-category';
    category.textContent = categoryLabel(item.category);
    const time = document.createElement('time');
    time.dateTime = item.updatedAt || item.createdAt || '';
    time.textContent = formatDate(item.updatedAt || item.createdAt);
    meta.append(category, time);

    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = item.url;
    titleLink.dataset.discussionIndex = String(index);
    titleLink.setAttribute('aria-label', `${item.title}，在站内查看`);
    titleLink.textContent = item.title;
    titleLink.appendChild(makeIcon('i-arrow-up-right'));
    title.appendChild(titleLink);

    const excerpt = document.createElement('p');
    excerpt.className = 'garden-excerpt';
    excerpt.textContent = item.excerpt || '';

    const author = document.createElement('div');
    author.className = 'garden-author';
    const avatar = document.createElement('img');
    avatar.src = item.author?.avatarUrl || `https://github.com/${item.author?.login || 'github'}.png?size=48`;
    avatar.alt = '';
    avatar.width = 24;
    avatar.height = 24;
    avatar.loading = 'lazy';
    const authorName = document.createElement('span');
    authorName.textContent = `@${item.author?.login || 'github'}`;
    author.append(avatar, authorName);

    const actions = document.createElement('div');
    actions.className = 'garden-actions';

    const upvote = document.createElement('a');
    upvote.className = 'garden-action';
    upvote.href = item.url;
    upvote.target = '_blank';
    upvote.rel = 'noopener noreferrer';
    upvote.setAttribute('aria-label', `去 GitHub 点赞，当前 ${item.upvotes || 0} 个赞`);
    upvote.append(makeIcon('i-arrow-up'), document.createTextNode(String(item.upvotes || 0)));

    const comments = document.createElement('a');
    comments.className = 'garden-action';
    comments.href = item.url;
    comments.target = '_blank';
    comments.rel = 'noopener noreferrer';
    comments.dataset.discussionIndex = String(index);
    comments.setAttribute('aria-label', `在站内查看 ${item.comments || 0} 条评论`);
    comments.append(makeIcon('i-comment'), document.createTextNode(String(item.comments || 0)));

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'garden-action garden-action--copy';
    copy.setAttribute('data-copy', item.url);
    copy.setAttribute('aria-label', '复制讨论链接');
    copy.append(makeIcon('i-copy'), document.createTextNode('复制'));
    actions.append(upvote, comments, copy);

    titleLink.addEventListener('click', (event) => {
      event.preventDefault();
      openDiscussion(index);
    });
    comments.addEventListener('click', (event) => {
      event.preventDefault();
      openDiscussion(index);
    });

    article.append(meta, title, excerpt, author, actions);
    return article;
  }

  function renderBoard() {
    if (!list) return;

    const visible = activeCategory === 'all'
      ? discussions
      : discussions.filter((item) => (item.category?.slug || 'general') === activeCategory);

    list.replaceChildren();
    list.setAttribute('aria-busy', 'false');

    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'garden-empty';
      empty.append('这个分类里还没有讨论。');
      const link = document.createElement('a');
      link.href = discussionsUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '去 GitHub 发起第一条 ↗';
      empty.append(' ', link);
      list.appendChild(empty);
      return;
    }

    visible.forEach((item) => list.appendChild(makeCard(item, item.__index)));
    list.setAttribute('aria-busy', 'false');
  }

  function renderError() {
    if (!list) return;
    list.replaceChildren();
    const empty = document.createElement('p');
    empty.className = 'garden-empty';
    empty.append('暂时没有取回花园的数据。');
    const link = document.createElement('a');
    link.href = discussionsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = '直接去 GitHub Discussions ↗';
    empty.append(' ', link);
    list.appendChild(empty);
    list.setAttribute('aria-busy', 'false');
  }

  async function loadBoard({ quiet = false } = {}) {
    const refresh = document.getElementById('garden-refresh');
    if (refresh) refresh.classList.add('is-spinning');

    try {
      const response = await fetch(`${dataUrl}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      discussions = Array.isArray(payload.discussions) ? payload.discussions.map((item, index) => ({ ...item, __index: index })) : [];
      renderStats(discussions);
      renderFilters(discussions);
      renderBoard();
      if (!quiet && discussions.length) toast('花园已更新');
    } catch (error) {
      console.error('Garden sync data could not be loaded:', error);
      renderError();
    } finally {
      if (refresh) refresh.classList.remove('is-spinning');
    }
  }

  const refresh = document.getElementById('garden-refresh');
  if (refresh) refresh.addEventListener('click', () => loadBoard());
  loadBoard({ quiet: true });

  /* ---------- Composer ---------- */

  const composer = document.getElementById('composer');
  const markdownToggle = document.getElementById('markdown-toggle');
  const textarea = document.getElementById('post-body');
  const richEditor = document.getElementById('rich-editor');
  const preview = document.getElementById('post-preview');
  const previewMode = document.getElementById('preview-mode');
  const titleInput = document.getElementById('post-title');
  const categorySelect = document.getElementById('post-category');
  const count = document.getElementById('post-count');
  const publishButton = document.getElementById('publish-post');
  const copyButton = document.getElementById('copy-post');

  if (!composer || !markdownToggle || !textarea || !richEditor || !preview) return;

  richEditor.dataset.placeholder = '关掉 Markdown 后，可以在这里直接用工具栏排版…';

  const turndown = new window.TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**'
  });

  turndown.addRule('alignment', {
    filter: (node) => node.nodeName === 'DIV' && node.getAttribute('align'),
    replacement: (content, node) => {
      const align = node.getAttribute('align');
      return `\n\n<div align="${align}">\n\n${content.trim()}\n\n</div>\n\n`;
    }
  });

  turndown.addRule('strike', {
    filter: ['del', 's', 'strike'],
    replacement: (content) => `~~${content}~~`
  });

  turndown.addRule('big', {
    filter: 'big',
    replacement: (content) => `<big>${content}</big>`
  });

  turndown.addRule('small', {
    filter: 'small',
    replacement: (content) => `<small>${content}</small>`
  });

  turndown.addRule('fontSize', {
    filter: (node) => node.nodeName === 'FONT' && node.getAttribute('size'),
    replacement: (content, node) => {
      const size = Number(node.getAttribute('size')) || 3;
      return size >= 4 ? `<big>${content}</big>` : `<small>${content}</small>`;
    }
  });

  if (window.DOMPurify) {
    window.DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  const isRich = () => !markdownToggle.checked;

  function parseMarkdown(text) {
    if (!window.marked) return text ? `<p>${text.replace(/</g, '&lt;')}</p>` : '';
    const html = window.marked.parse(text, { gfm: true, breaks: true });
    return window.DOMPurify
      ? window.DOMPurify.sanitize(html, { ADD_ATTR: ['align', 'target', 'rel'] })
      : html;
  }

  function currentMarkdown() {
    if (isRich()) {
      return turndown.turndown(richEditor.innerHTML).trim();
    }
    return textarea.value.trim();
  }


  /* ---------- In-page discussion view ---------- */

  const discussionTitle = document.getElementById('discussion-dialog-title');
  const discussionCategory = document.getElementById('discussion-category');
  const discussionMeta = document.getElementById('discussion-meta');
  const discussionBody = document.getElementById('discussion-body');
  const discussionCommentCount = document.getElementById('discussion-comment-count');
  const discussionCommentList = document.getElementById('discussion-comment-list');
  const discussionGithub = document.getElementById('discussion-github');
  const discussionCopy = document.getElementById('discussion-copy');
  const discussionClose = document.getElementById('discussion-close');

  function openDiscussion(index) {
    const item = discussions[index];
    if (!item || !discussionDialog) return;

    discussionCategory.textContent = categoryLabel(item.category);
    discussionTitle.textContent = item.title;

    discussionMeta.replaceChildren();
    if (item.author?.avatarUrl) {
      const avatar = document.createElement('img');
      avatar.src = item.author.avatarUrl;
      avatar.alt = '';
      avatar.width = 22;
      avatar.height = 22;
      discussionMeta.appendChild(avatar);
    }
    const author = document.createElement('span');
    author.textContent = `@${item.author?.login || 'github'}`;
    const time = document.createElement('span');
    time.textContent = formatDate(item.updatedAt || item.createdAt);
    const upvotes = document.createElement('span');
    upvotes.textContent = `${item.upvotes || 0} 个赞`;
    discussionMeta.append(author, time, upvotes);

    discussionBody.innerHTML = parseMarkdown(item.body || item.excerpt || '');
    const items = Array.isArray(item.commentItems) ? item.commentItems : [];
    discussionCommentCount.textContent = String(item.comments || items.length || 0);
    discussionCommentList.replaceChildren();

    if (!items.length) {
      const empty = document.createElement('p');
      empty.className = 'garden-empty';
      empty.style.border = '0';
      empty.style.padding = '1rem 0';
      empty.textContent = '还没有评论。去 GitHub 写下第一条。';
      discussionCommentList.appendChild(empty);
    } else {
      items.forEach((comment) => {
        const row = document.createElement('div');
        row.className = 'discussion-comment';

        const avatar = document.createElement('img');
        avatar.src = comment.author?.avatarUrl || `https://github.com/${comment.author?.login || 'github'}.png?size=48`;
        avatar.alt = '';
        avatar.width = 28;
        avatar.height = 28;
        avatar.loading = 'lazy';

        const content = document.createElement('div');
        const head = document.createElement('div');
        head.className = 'discussion-comment__head';
        const name = document.createElement('strong');
        name.textContent = `@${comment.author?.login || 'github'}`;
        const when = document.createElement('span');
        when.textContent = formatDate(comment.createdAt);
        head.append(name, when);

        const body = document.createElement('div');
        body.className = 'discussion-comment__body markdown-body';
        body.innerHTML = parseMarkdown(comment.body || '');

        content.append(head, body);
        row.append(avatar, content);
        discussionCommentList.appendChild(row);
      });
    }

    discussionGithub.href = item.url;
    discussionCopy.setAttribute('data-copy', item.url);

    if (typeof discussionDialog.showModal === 'function') {
      discussionDialog.showModal();
    } else {
      discussionDialog.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeDiscussion() {
    if (!discussionDialog) return;
    if (typeof discussionDialog.close === 'function' && discussionDialog.open) discussionDialog.close();
    else discussionDialog.removeAttribute('open');
    document.body.style.overflow = '';
  }

  if (discussionClose) discussionClose.addEventListener('click', closeDiscussion);
  if (discussionDialog) {
    discussionDialog.addEventListener('close', () => { document.body.style.overflow = ''; });
    discussionDialog.addEventListener('click', (event) => {
      if (event.target === discussionDialog) closeDiscussion();
    });
  }

  /* ---------- Compose dialog & FAB ---------- */

  const composeFab = document.getElementById('compose-fab');
  const composeClose = document.getElementById('compose-close');

  function openCompose() {
    if (!composeDialog) return;
    if (typeof composeDialog.showModal === 'function') composeDialog.showModal();
    else composeDialog.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => { if (titleInput) titleInput.focus({ preventScroll: true }); }, 80);
  }

  function closeCompose() {
    if (!composeDialog) return;
    if (typeof composeDialog.close === 'function' && composeDialog.open) composeDialog.close();
    else composeDialog.removeAttribute('open');
    document.body.style.overflow = '';
  }

  if (composeFab) composeFab.addEventListener('click', openCompose);
  if (composeClose) composeClose.addEventListener('click', closeCompose);
  if (composeDialog) {
    composeDialog.addEventListener('close', () => { document.body.style.overflow = ''; });
    composeDialog.addEventListener('click', (event) => {
      if (event.target === composeDialog) closeCompose();
    });
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('a[href="/garden/?compose=1"]');
    if (!trigger || !composeDialog) return;
    if (window.location.pathname.replace(/\/$/, '') !== '/garden') return;
    event.preventDefault();
    openCompose();
  });

  if (new URLSearchParams(window.location.search).get('compose') === '1') {
    window.setTimeout(() => {
      openCompose();
      const url = new URL(window.location.href);
      url.searchParams.delete('compose');
      window.history.replaceState({}, '', url.pathname + url.search + url.hash);
    }, 150);
  }

  function updatePreview() {
    if (isRich()) {
      composer.classList.add('is-rich');
      richEditor.hidden = false;
      textarea.hidden = true;
      if (previewMode) previewMode.textContent = '富文本';
      updateCount();
      return;
    }

    composer.classList.remove('is-rich');
    richEditor.hidden = true;
    textarea.hidden = false;
    preview.innerHTML = parseMarkdown(textarea.value);
    if (previewMode) previewMode.textContent = 'Markdown 预览';
    updateCount();
  }

  function updateCount() {
    if (!count) return;
    const length = currentMarkdown().length;
    count.textContent = `${length} 字`;
  }

  function syncMode() {
    if (isRich()) {
      const html = parseMarkdown(textarea.value);
      richEditor.innerHTML = html;
      updatePreview();
      richEditor.focus();
    } else {
      const markdown = turndown.turndown(richEditor.innerHTML).trim();
      if (markdown) textarea.value = markdown;
      updatePreview();
      textarea.focus();
    }
  }

  markdownToggle.addEventListener('change', syncMode);
  textarea.addEventListener('input', updatePreview);
  richEditor.addEventListener('input', updateCount);

  function insertMarkdown(before, after = '', placeholder = '文字') {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || placeholder;
    const replacement = `${before}${selected}${after}`;
    textarea.setRangeText(replacement, start, end, 'end');
    textarea.focus();
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = start + before.length + selected.length;
    updatePreview();
  }

  function insertBlock(prefix) {
    const start = textarea.selectionStart;
    const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
    textarea.setRangeText(prefix, lineStart, lineStart, 'end');
    textarea.focus();
    updatePreview();
  }

  function wrapSelection(tag) {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const wrapper = document.createElement(tag);
    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);
    selection.removeAllRanges();
    const next = document.createRange();
    next.selectNodeContents(wrapper);
    selection.addRange(next);
    updateCount();
  }

  function runRichAction(action) {
    richEditor.focus();
    const command = {
      bold: 'bold',
      italic: 'italic',
      strike: 'strikeThrough',
      'align-left': 'justifyLeft',
      'align-center': 'justifyCenter',
      'align-right': 'justifyRight',
      list: 'insertUnorderedList'
    }[action];

    if (command) {
      document.execCommand(command, false, null);
    } else if (action === 'h2') {
      document.execCommand('formatBlock', false, '<h2>');
    } else if (action === 'quote') {
      document.execCommand('formatBlock', false, '<blockquote>');
    } else if (action === 'link') {
      const url = window.prompt('链接地址');
      if (url) document.execCommand('createLink', false, url);
    } else if (action === 'big') {
      wrapSelection('big');
    } else if (action === 'small') {
      wrapSelection('small');
    }

    updateCount();
  }

  function runMarkdownAction(action) {
    if (action === 'bold') insertMarkdown('**', '**', '粗体');
    else if (action === 'italic') insertMarkdown('*', '*', '斜体');
    else if (action === 'strike') insertMarkdown('~~', '~~', '删除线');
    else if (action === 'h2') insertBlock('## ');
    else if (action === 'quote') insertBlock('> ');
    else if (action === 'list') insertBlock('- ');
    else if (action === 'link') insertMarkdown('[', '](https://)', '链接文字');
    else if (action === 'big') insertMarkdown('<big>', '</big>', '大字');
    else if (action === 'small') insertMarkdown('<small>', '</small>', '小字');
    else if (action.startsWith('align-')) {
      const align = action.replace('align-', '');
      insertMarkdown(`<div align="${align}">\n\n`, '\n\n</div>', '对齐的文字');
    }
  }

  document.querySelectorAll('.editor-toolbar [data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (isRich()) runRichAction(button.dataset.action);
      else runMarkdownAction(button.dataset.action);
    });
  });

  if (copyButton) {
    copyButton.addEventListener('click', async () => {
      const markdown = currentMarkdown();
      if (!markdown) {
        toast('先写点什么再复制');
        return;
      }
      const ok = await copyText(markdown).catch(() => false);
      toast(ok ? 'Markdown 已复制' : '复制失败，请手动选择文本');
    });
  }

  if (publishButton) {
    publishButton.addEventListener('click', async () => {
      const title = titleInput ? titleInput.value.trim() : '';
      const markdown = currentMarkdown();

      if (!title) {
        toast('先给帖子起个标题');
        if (titleInput) titleInput.focus();
        return;
      }

      if (!markdown) {
        toast('正文还是空的');
        return;
      }

      const category = categorySelect ? categorySelect.value : 'general';
      const url = new URL(newDiscussionUrl);
      url.searchParams.set('category', category);
      url.searchParams.set('title', title);
      url.searchParams.set('body', markdown);

      const canPrefill = url.href.length < 7000;
      window.open(canPrefill ? url.href : `${newDiscussionUrl}?category=${encodeURIComponent(category)}`, '_blank', 'noopener');

      const copied = await copyText(markdown).catch(() => false);
      toast(copied ? '已打开 GitHub；正文已复制，可直接粘贴' : '已打开 GitHub，请登录后发布');
    });
  }

  updatePreview();
})();
