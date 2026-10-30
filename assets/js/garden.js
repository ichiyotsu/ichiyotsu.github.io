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
  const newIssueUrl = `https://github.com/${repository}/issues/new`;
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

  const isEnglish = () => document.documentElement.lang === 'en';
  const unit = (zh, en) => (isEnglish() ? en : zh);

  let discussions = [];
  let activeSection = 'all';
  let splitPercent = 30;
  let searchQuery = '';

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

  /* ---------- Small local state (likes / views) ---------- */

  const store = {
    get(key, fallback = null) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
      } catch (error) {
        return fallback;
      }
    },
    set(key, value) {
      try { window.localStorage.setItem(key, String(value)); } catch (error) { /* private mode */ }
    }
  };

  const storageKey = (kind, id) => `ichiyotsu-garden-${kind}-${id}`;

  let pageViews = Number(store.get('ichiyotsu-garden-page-views', '0')) || 0;
  pageViews += 1;
  store.set('ichiyotsu-garden-page-views', pageViews);

  const itemKey = (item) => String(item?.id ?? item?.number ?? item?.url ?? '');

  const isLiked = (id) => store.get(storageKey('liked', id), '0') === '1';
  const postViews = (id) => Number(store.get(storageKey('views', id), '0')) || 0;
  const bumpPostViews = (id) => {
    const next = postViews(id) + 1;
    store.set(storageKey('views', id), next);
    return next;
  };

  function toggleLike(id) {
    const next = !isLiked(id);
    store.set(storageKey('liked', id), next ? '1' : '0');
    const item = discussions.find((entry) => itemKey(entry) === id);
    document.querySelectorAll(`[data-like-id="${CSS.escape(id)}"]`).forEach((button) => {
      button.classList.toggle('is-liked', next);
      button.setAttribute('aria-pressed', String(next));
      const number = button.querySelector('[data-like-count]');
      if (number) number.textContent = `${(Number(item?.upvotes) || 0) + (next ? 1 : 0)} ${unit('点赞', 'likes')}`;
    });
    const modalLike = document.getElementById('discussion-like');
    if (modalLike && discussionDialog?.open) {
      const count = (Number(item?.upvotes) || 0) + (next ? 1 : 0);
      modalLike.classList.toggle('is-liked', next);
      modalLike.setAttribute('aria-pressed', String(next));
      const number = modalLike.querySelector('[data-like-count]');
      if (number) number.textContent = `${count} ${unit('点赞', 'likes')}`;
    }
    toast(next ? '已在本机点赞' : '已取消本机点赞');
  }

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
    const topics = items.length;
    const questions = items.filter((item) => {
      const slug = item.category?.slug || '';
      return slug === 'q-a' || /问答|Q&A/i.test(item.category?.name || '');
    }).length;
    const comments = items.reduce((sum, item) => sum + (Number(item.comments) || 0), 0);

    const values = {
      'stat-topics': topics,
      'stat-questions': questions,
      'stat-views': pageViews,
      'stat-comments': comments
    };

    Object.entries(values).forEach(([id, value]) => {
      const node = document.getElementById(id);
      if (node) node.textContent = new Intl.NumberFormat('zh-CN').format(value);
    });
  }

  function makeCard(item, index) {
    const article = document.createElement('article');
    article.className = 'garden-card';
    const key = itemKey(item);
    article.dataset.id = key;
    article.style.cursor = 'pointer';

    const meta = document.createElement('div');
    meta.className = 'garden-card__meta';
    const author = document.createElement('span');
    author.className = 'garden-author-name';
    author.textContent = `@${item.author?.login || 'github'}`;
    const time = document.createElement('time');
    time.dateTime = item.updatedAt || item.createdAt || '';
    time.textContent = formatDate(item.updatedAt || item.createdAt);
    const category = document.createElement('span');
    category.className = 'garden-category';
    category.textContent = categoryLabel(item.category);
    meta.append(author, time, category);

    const title = document.createElement('h3');
    const titleLink = document.createElement('a');
    titleLink.href = item.url;
    titleLink.dataset.discussionIndex = String(index);
    titleLink.setAttribute('aria-label', `${item.title}，在站内查看`);
    titleLink.textContent = item.title;
    title.appendChild(titleLink);

    const excerpt = document.createElement('p');
    excerpt.className = 'garden-excerpt';
    excerpt.textContent = item.excerpt || '';

    let media = null;
    const image = item.image || item.images?.[0] || item.body?.match(/!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/)?.[1];
    if (image) {
      media = document.createElement('div');
      media.className = 'garden-card__media';
      const img = document.createElement('img');
      img.src = image;
      img.alt = '';
      img.loading = 'lazy';
      media.appendChild(img);
    }

    const actions = document.createElement('div');
    actions.className = 'garden-actions';

    const views = document.createElement('span');
    views.className = 'garden-action garden-action--views';
    views.setAttribute('aria-label', `${postViews(key)} 次站内浏览`);
    views.title = '站内浏览，保存在本机';
    views.append(makeIcon('i-eye'));
    const viewCount = document.createElement('span');
    viewCount.dataset.viewCount = key;
    viewCount.textContent = `${postViews(key)} ${unit('浏览', 'views')}`;
    views.appendChild(viewCount);

    const liked = isLiked(key);
    const like = document.createElement('button');
    like.type = 'button';
    like.className = `garden-action${liked ? ' is-liked' : ''}`;
    like.dataset.likeId = key;
    like.setAttribute('aria-pressed', String(liked));
    like.title = '站内点赞，保存在本机';
    like.append(makeIcon('i-heart'));
    const likeCount = document.createElement('span');
    likeCount.dataset.likeCount = '';
    likeCount.textContent = `${(Number(item.upvotes) || 0) + (liked ? 1 : 0)} ${unit('点赞', 'likes')}`;
    like.appendChild(likeCount);
    like.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleLike(key);
      const nextLiked = isLiked(key);
      likeCount.textContent = `${(Number(item.upvotes) || 0) + (nextLiked ? 1 : 0)} ${unit('点赞', 'likes')}`;
    });

    const comments = document.createElement('button');
    comments.type = 'button';
    comments.className = 'garden-action';
    comments.dataset.discussionIndex = String(index);
    comments.setAttribute('aria-label', `${item.comments || 0} 评论，在站内查看`);
    comments.append(makeIcon('i-comment'), document.createTextNode(`${item.comments || 0} ${unit('评论', 'comments')}`));
    comments.addEventListener('click', (event) => {
      event.stopPropagation();
      openDiscussion(index);
    });

    actions.append(views, like, comments);

    titleLink.addEventListener('click', (event) => {
      event.preventDefault();
      openDiscussion(index);
    });
    article.addEventListener('click', (event) => {
      if (event.target.closest('button, a')) return;
      openDiscussion(index);
    });

    article.append(meta, title, excerpt);
    if (media) article.appendChild(media);
    article.appendChild(actions);
    return article;
  }

  const sectionLabel = (section) => {
    const labels = {
      all: ['全部', 'All'],
      announcements: ['更新公告', 'Announcements'],
      general: ['软件讨论', 'Software talk']
    };
    const pair = labels[section] || labels.all;
    return isEnglish() ? pair[1] : pair[0];
  };

  const inSection = (item, section) => {
    const slug = item.category?.slug || 'general';
    if (section === 'announcements') return slug === 'announcements';
    if (section === 'general') return slug !== 'announcements';
    return true;
  };

  function updateSectionUI() {
    const current = document.getElementById('section-current');
    if (current) current.textContent = sectionLabel(activeSection);
    const title = document.getElementById('feed-title');
    if (title) title.textContent = sectionLabel(activeSection);
    document.querySelectorAll('.explore-select__option').forEach((option) => {
      const selected = option.dataset.section === activeSection;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-selected', String(selected));
    });
  }

  function renderPinned() {
    const card = document.getElementById('pinned-card');
    if (!card) return;
    const pinned = discussions.find((item) => (item.category?.slug || '') === 'announcements');
    if (!pinned) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    document.getElementById('pinned-title').textContent = pinned.title;
    document.getElementById('pinned-excerpt').textContent = pinned.excerpt || '';
    document.getElementById('pinned-meta').textContent = `@${pinned.author?.login || 'github'} · ${unit('置顶', 'Pinned')}`;
    const link = document.getElementById('pinned-link');
    link.href = pinned.url || discussionsUrl;
    link.onclick = (event) => {
      event.preventDefault();
      openDiscussion(pinned.__index);
    };
  }

  function renderBoard() {
    if (!list) return;

    const query = searchQuery.trim().toLowerCase();
    const visible = discussions.filter((item) => {
      if (!inSection(item, activeSection)) return false;
      if (!query) return true;
      return `${item.title} ${item.excerpt}`.toLowerCase().includes(query);
    });

    const count = document.getElementById('feed-count');
    if (count) count.textContent = `${visible.length} ${unit('条', 'posts')}`;

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
    empty.append('暂时没有取回探索的数据。');
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
      renderPinned();
      updateSectionUI();
      renderBoard();
      if (!quiet && discussions.length) toast('探索已更新');
    } catch (error) {
      console.error('Garden sync data could not be loaded:', error);
      renderError();
    } finally {
      if (refresh) refresh.classList.remove('is-spinning');
    }
  }

  const refresh = document.getElementById('garden-refresh');
  if (refresh) refresh.addEventListener('click', () => window.location.reload());

  const searchInput = document.getElementById('explore-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value;
      renderBoard();
    });
  }

  const sectionToggle = document.getElementById('section-toggle');
  const sectionMenu = document.getElementById('section-menu');
  if (sectionToggle && sectionMenu) {
    const closeMenu = () => {
      sectionMenu.hidden = true;
      sectionToggle.setAttribute('aria-expanded', 'false');
    };
    sectionToggle.addEventListener('click', () => {
      const open = sectionMenu.hidden;
      sectionMenu.hidden = !open;
      sectionToggle.setAttribute('aria-expanded', String(open));
    });
    sectionMenu.querySelectorAll('.explore-select__option').forEach((option) => {
      option.addEventListener('click', () => {
        activeSection = option.dataset.section || 'all';
        updateSectionUI();
        renderBoard();
        closeMenu();
      });
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#section-select')) closeMenu();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
  }

  const columns = document.getElementById('explore-columns');
  const divider = document.getElementById('explore-divider');
  if (columns && divider) {
    const setSplit = (value) => {
      splitPercent = Math.min(40, Math.max(20, Math.round(value)));
      columns.style.setProperty('--split', splitPercent);
      divider.setAttribute('aria-valuenow', String(splitPercent));
    };
    divider.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      divider.setPointerCapture(event.pointerId);
      divider.classList.add('is-dragging');
      const move = (moveEvent) => {
        const rect = columns.getBoundingClientRect();
        setSplit(((moveEvent.clientX - rect.left) / rect.width) * 100);
      };
      const up = () => {
        divider.classList.remove('is-dragging');
        divider.removeEventListener('pointermove', move);
        divider.removeEventListener('pointerup', up);
        divider.removeEventListener('pointercancel', up);
      };
      divider.addEventListener('pointermove', move);
      divider.addEventListener('pointerup', up);
      divider.addEventListener('pointercancel', up);
    });
    divider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); setSplit(splitPercent - 1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setSplit(splitPercent + 1); }
      if (event.key === 'Home') { event.preventDefault(); setSplit(20); }
      if (event.key === 'End') { event.preventDefault(); setSplit(40); }
    });
    setSplit(30);
  }

  document.addEventListener('ichiyotsu:lang', () => {
    updateSectionUI();
    renderPinned();
    renderBoard();
  });

  loadBoard({ quiet: true });

  // Keep an open tab fresh; the Actions workflow uses the same 120 minute cadence.
  window.setInterval(() => loadBoard({ quiet: true }), 120 * 60 * 1000);

  /* ---------- Composer ---------- */

  const composer = document.getElementById('composer');
  const markdownToggle = document.getElementById('markdown-toggle');
  const textarea = document.getElementById('post-body');
  const richEditor = document.getElementById('rich-editor');
  const preview = document.getElementById('post-preview');
  const previewMode = document.getElementById('preview-mode');
  const titleInput = document.getElementById('post-title');
  const categorySelect = document.getElementById('post-category');
  const publishButton = document.getElementById('publish-post');

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
  const discussionLike = document.getElementById('discussion-like');
  const discussionReply = document.getElementById('discussion-reply');
  const discussionViews = document.getElementById('discussion-views');
  const discussionCommentsStat = document.getElementById('discussion-comments-stat');
  const discussionCommentToggle = document.getElementById('discussion-comment-toggle');
  const discussionPanel = discussionDialog?.querySelector('.discussion-dialog__panel');
  const replyBody = document.getElementById('reply-body');
  let activeDiscussion = null;

  function openDiscussion(index) {
    const item = discussions[index];
    if (!item || !discussionDialog) return;

    discussionCategory.textContent = categoryLabel(item.category);
    discussionTitle.textContent = item.title;

    discussionMeta.replaceChildren();
    const author = document.createElement('span');
    author.textContent = `@${item.author?.login || 'github'}`;
    const time = document.createElement('span');
    time.textContent = formatDate(item.updatedAt || item.createdAt);
    discussionMeta.append(author, time);

    const key = itemKey(item);
    const views = bumpPostViews(key);
    const viewsNode = document.querySelector(`[data-view-count="${CSS.escape(key)}"]`);
    if (viewsNode) viewsNode.textContent = `${postViews(key)} ${unit('浏览', 'views')}`;
    if (discussionViews) discussionViews.textContent = `${views} ${unit('浏览', 'views')}`;
    if (discussionCommentsStat) discussionCommentsStat.textContent = `${item.comments || 0} ${unit('评论', 'comments')}`;

    if (discussionLike) {
      const liked = isLiked(itemKey(item));
      discussionLike.classList.toggle('is-liked', liked);
      discussionLike.setAttribute('aria-pressed', String(liked));
      const number = discussionLike.querySelector('[data-like-count]');
      if (number) number.textContent = `${(Number(item.upvotes) || 0) + (liked ? 1 : 0)} ${unit('点赞', 'likes')}`;
    }

    discussionBody.innerHTML = parseMarkdown(item.body || item.excerpt || '');
    const items = Array.isArray(item.commentItems) ? item.commentItems : [];
    discussionCommentCount.textContent = String(item.comments || items.length || 0);
    if (discussionCommentsStat) discussionCommentsStat.textContent = `${item.comments || 0} ${unit('评论', 'comments')}`;
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
        row.append(content);
        discussionCommentList.appendChild(row);
      });
    }

    discussionGithub.href = item.url;
    discussionCopy.setAttribute('data-copy', item.url);
    discussionDialog.setAttribute('data-open-id', itemKey(item));
    discussionDialog.classList.remove('is-replying');
    if (discussionReply) discussionReply.hidden = true;
    activeDiscussion = item;

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
  if (discussionCommentToggle) {
    discussionCommentToggle.addEventListener('click', () => {
      const open = discussionDialog?.classList.toggle('is-replying');
      if (discussionReply) discussionReply.hidden = !open;
      if (open) window.setTimeout(() => replyBody?.focus(), 60);
    });
  }

  if (discussionReply) {
    discussionReply.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = replyBody?.value.trim();
      if (!text) { toast('先写一点内容再回复。'); replyBody?.focus(); return; }
      if (activeDiscussion) window.open(activeDiscussion.url, '_blank', 'noopener');
      copyText(text).then((copied) => {
        toast(copied ? '评论已复制，粘贴到 GitHub 回复框。' : '已打开 GitHub，请手动粘贴评论。');
      });
    });
  }
  if (discussionLike) {
    discussionLike.addEventListener('click', () => {
      const open = discussionDialog?.getAttribute('data-open-id');
      if (open) toggleLike(open);
    });
  }
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
      composer.classList.remove('is-markdown');
      richEditor.hidden = false;
      textarea.hidden = true;
      if (previewMode) previewMode.textContent = '富文本';
      return;
    }

    composer.classList.remove('is-rich');
    composer.classList.add('is-markdown');
    richEditor.hidden = true;
    textarea.hidden = false;
    preview.innerHTML = parseMarkdown(textarea.value);
    if (previewMode) previewMode.textContent = 'Markdown 预览';
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

      const publishType = categorySelect ? categorySelect.value : 'discussion-general';
      const isIssue = publishType.startsWith('issue-');
      const url = new URL(isIssue ? newIssueUrl : newDiscussionUrl);
      url.searchParams.set('title', title);
      url.searchParams.set('body', markdown);
      if (isIssue) {
        url.searchParams.set('labels', publishType === 'issue-bug' ? 'bug' : 'enhancement');
      } else {
        url.searchParams.set('category', publishType.replace('discussion-', '') || 'general');
      }

      const canPrefill = url.href.length < 7000;
      window.open(canPrefill ? url.href : (isIssue ? newIssueUrl : `${newDiscussionUrl}?category=general`), '_blank', 'noopener');

      const copied = await copyText(markdown).catch(() => false);
      toast(copied ? '已打开 GitHub；正文已复制，可直接粘贴' : '已打开 GitHub，请登录后发布');
    });
  }

  updatePreview();
})();
