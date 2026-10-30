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
  const authDialog = document.getElementById('github-auth-dialog');
  const authStatus = document.getElementById('github-auth-status');
  const authTokenInput = document.getElementById('github-token');
  const authLabel = document.getElementById('github-auth-label');
  const authSignout = document.getElementById('github-signout');
  const replyAuthHint = document.getElementById('reply-auth-hint');

  const GITHUB_TOKEN_KEY = 'ichiyotsu-github-token';
  const GITHUB_USER_KEY = 'ichiyotsu-github-user';
  const githubOwner = 'ichiyotsu';
  const githubRepo = 'ichiyotsu.github.io';
  const githubCategoryNames = { announcements: 'Announcements', general: 'General', ideas: 'Ideas', 'q-a': 'Q&A' };
  let githubToken = '';
  let githubUser = '';
  let repoMetaCache = null;
  try {
    githubToken = window.sessionStorage.getItem(GITHUB_TOKEN_KEY) || '';
    githubUser = window.sessionStorage.getItem(GITHUB_USER_KEY) || '';
  } catch (error) { /* sessionStorage unavailable */ }

  const authHeaders = () => ({ Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' });

  async function githubRest(path) {
    const response = await fetch(`https://api.github.com${path}`, { headers: authHeaders(), cache: 'no-store' });
    if (!response.ok) throw new Error(response.status === 401 ? 'Token 无效或已过期' : `GitHub ${response.status}`);
    return response.json();
  }

  async function githubGraphql(query, variables = {}) {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || `GitHub ${response.status}`);
    if (payload.errors?.length) throw new Error(payload.errors[0].message || 'GitHub GraphQL 出错');
    return payload.data;
  }

  async function getRepoMeta() {
    if (repoMetaCache) return repoMetaCache;
    const data = await githubGraphql(
      `query($owner:String!,$name:String!){repository(owner:$owner,name:$name){id discussionCategories(first:20){nodes{id name}}}}`,
      { owner: githubOwner, name: githubRepo }
    );
    const repo = data.repository;
    repoMetaCache = {
      id: repo.id,
      categories: new Map(repo.discussionCategories.nodes.map((category) => [category.name.toLowerCase(), category.id]))
    };
    return repoMetaCache;
  }

  async function createDiscussion({ title, body, category }) {
    const meta = await getRepoMeta();
    const categoryName = githubCategoryNames[category] || 'General';
    const categoryId = meta.categories.get(categoryName.toLowerCase());
    if (!categoryId) throw new Error(`找不到 ${categoryName} 分区`);
    const data = await githubGraphql(
      `mutation($repositoryId:ID!,$categoryId:ID!,$title:String!,$body:String!){createDiscussion(input:{repositoryId:$repositoryId,categoryId:$categoryId,title:$title,body:$body}){discussion{number url title}}}`,
      { repositoryId: meta.id, categoryId, title, body }
    );
    return data.createDiscussion.discussion;
  }

  async function addDiscussionComment(number, body) {
    const data = await githubGraphql(
      `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){discussion(number:$number){id}}}`,
      { owner: githubOwner, name: githubRepo, number }
    );
    const discussionId = data.repository.discussion?.id;
    if (!discussionId) throw new Error('找不到这条讨论');
    const result = await githubGraphql(
      `mutation($discussionId:ID!,$body:String!){addDiscussionComment(input:{discussionId:$discussionId,body:$body}){comment{url}}}`,
      { discussionId, body }
    );
    return result.addDiscussionComment.comment;
  }

  function updateAuthUI() {
    if (authLabel) authLabel.textContent = githubUser ? `@${githubUser}` : (isEnglish() ? 'Sign in with GitHub' : 'GitHub 登录');
    if (authSignout) authSignout.hidden = !githubUser;
    if (replyAuthHint) replyAuthHint.textContent = githubUser ? (isEnglish() ? `Posting as @${githubUser}` : `以 @${githubUser} 身份发布`) : (isEnglish() ? 'Sign in to GitHub first' : '需要先登录 GitHub');
    document.querySelectorAll('[data-requires-auth]').forEach((node) => {
      node.classList.toggle('is-authed', Boolean(githubUser));
    });
  }

  function openAuthDialog() {
    if (!authDialog) return;
    if (authStatus) authStatus.textContent = '';
    if (typeof authDialog.showModal === 'function') authDialog.showModal();
    else authDialog.setAttribute('open', '');
    window.setTimeout(() => authTokenInput?.focus(), 80);
  }

  const authClose = document.getElementById('github-auth-close');
  const authSave = document.getElementById('github-token-save');
  const authTrigger = document.getElementById('github-signin');
  if (authTrigger) authTrigger.addEventListener('click', openAuthDialog);
  if (authClose) authClose.addEventListener('click', () => authDialog?.close());
  if (authDialog) {
    authDialog.addEventListener('click', (event) => {
      if (event.target === authDialog) authDialog.close();
    });
  }
  if (authSave) {
    authSave.addEventListener('click', async () => {
      const token = authTokenInput?.value.trim() || '';
      if (!token) { if (authStatus) authStatus.textContent = '先粘贴一个 GitHub token。'; return; }
      if (authStatus) authStatus.textContent = '正在验证…';
      authSave.disabled = true;
      try {
        const response = await fetch('https://api.github.com/user', { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } });
        if (!response.ok) throw new Error(response.status === 401 ? 'Token 无效或已过期' : `GitHub ${response.status}`);
        const user = await response.json();
        githubToken = token;
        githubUser = user.login || 'github';
        try {
          window.sessionStorage.setItem(GITHUB_TOKEN_KEY, githubToken);
          window.sessionStorage.setItem(GITHUB_USER_KEY, githubUser);
        } catch (error) { /* sessionStorage unavailable */ }
        updateAuthUI();
        if (authStatus) authStatus.textContent = `已登录 @${githubUser}`;
        authDialog?.close();
        toast(`已登录 GitHub：@${githubUser}`);
      } catch (error) {
        if (authStatus) authStatus.textContent = `登录失败：${error.message}`;
      } finally {
        authSave.disabled = false;
      }
    });
  }
  if (authSignout) {
    authSignout.addEventListener('click', () => {
      githubToken = '';
      githubUser = '';
      repoMetaCache = null;
      try {
        window.sessionStorage.removeItem(GITHUB_TOKEN_KEY);
        window.sessionStorage.removeItem(GITHUB_USER_KEY);
      } catch (error) { /* sessionStorage unavailable */ }
      updateAuthUI();
      toast('已退出 GitHub');
    });
  }


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
  updateAuthUI();

  let discussions = [];
  let activeSection = 'general';
  let splitPercent = 30;
  let searchQuery = '';

  const CATEGORY_LABELS = {
    general: ['讨论', 'General'],
    announcements: ['公告', 'Announcements'],
    'q-a': ['问答', 'Q&A'],
    ideas: ['想法', 'Ideas'],
    polls: ['投票', 'Poll'],
    'show-and-tell': ['展示', 'Show and tell']
  };

  const categoryLabel = (category) => {
    const pair = CATEGORY_LABELS[category?.slug] || null;
    if (pair) return isEnglish() ? pair[1] : pair[0];
    return category?.name || (isEnglish() ? 'General' : '讨论');
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
    meta.append(author, time);

    const category = document.createElement('span');
    category.className = 'garden-card__category';
    category.textContent = `#${categoryLabel(item.category)}`;

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
    const viewCount = document.createElement('strong');
    viewCount.dataset.viewCount = key;
    viewCount.textContent = String(postViews(key));
    const viewLabel = document.createElement('span');
    viewLabel.textContent = unit('浏览', 'views');
    views.append(viewCount, viewLabel);

    const liked = isLiked(key);
    const like = document.createElement('button');
    like.type = 'button';
    like.className = `garden-action${liked ? ' is-liked' : ''}`;
    like.dataset.likeId = key;
    like.setAttribute('aria-pressed', String(liked));
    like.title = '站内点赞，保存在本机';
    const likeCount = document.createElement('strong');
    likeCount.dataset.likeCount = '';
    likeCount.textContent = String((Number(item.upvotes) || 0) + (liked ? 1 : 0));
    const likeLabel = document.createElement('span');
    likeLabel.textContent = unit('点赞', 'likes');
    like.append(likeCount, likeLabel);
    like.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleLike(key);
      const nextLiked = isLiked(key);
      likeCount.textContent = String((Number(item.upvotes) || 0) + (nextLiked ? 1 : 0));
    });

    const comments = document.createElement('button');
    comments.type = 'button';
    comments.className = 'garden-action';
    comments.dataset.discussionIndex = String(index);
    comments.setAttribute('aria-label', `${item.comments || 0} 评论，在站内查看`);
    const commentCount = document.createElement('strong');
    commentCount.textContent = String(item.comments || 0);
    const commentLabel = document.createElement('span');
    commentLabel.textContent = unit('评论', 'comments');
    comments.append(commentCount, commentLabel);
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

    article.append(meta, category, title, excerpt);
    if (media) article.appendChild(media);
    article.appendChild(actions);
    return article;
  }

  const sectionLabel = (section) => {
    const labels = {
      announcements: ['更新公告', 'Announcements'],
      general: ['说点什么', 'General'],
      ideas: ['设计建议', 'Ideas'],
      'q-a': ['社区问答', 'Q&A']
    };
    const pair = labels[section] || labels.general;
    return isEnglish() ? pair[1] : pair[0];
  };

  const inSection = (item, section) => (item.category?.slug || 'general') === section;

  function updateSectionUI() {
    const current = document.getElementById('section-current');
    if (current) current.textContent = sectionLabel(activeSection);
    document.querySelectorAll('.explore-select__option[data-section]').forEach((option) => {
      const selected = option.dataset.section === activeSection;
      option.classList.toggle('is-selected', selected);
      option.setAttribute('aria-selected', String(selected));
    });
  }

  function renderPinned() {
    const target = document.getElementById('pinned-list');
    if (!target) return;
    const pinned = discussions
      .filter((item) => (item.category?.slug || '') === 'announcements')
      .slice(0, 5);
    target.replaceChildren();
    if (!pinned.length) {
      const empty = document.createElement('p');
      empty.className = 'explore-pinned__empty';
      empty.textContent = unit('还没有置顶公告。', 'No pinned announcements yet.');
      target.appendChild(empty);
      return;
    }
    pinned.forEach((item) => {
      const row = document.createElement('a');
      row.className = 'explore-pinned__item';
      row.href = item.url || discussionsUrl;
      row.target = '_blank';
      row.rel = 'noopener noreferrer';
      row.addEventListener('click', (event) => {
        event.preventDefault();
        openDiscussion(item.__index);
      });
      const tag = document.createElement('span');
      tag.className = 'explore-pinned__tag';
      tag.textContent = unit('#公告', '#Announcements');
      const title = document.createElement('strong');
      title.textContent = item.title;
      const time = document.createElement('small');
      time.textContent = formatDate(item.updatedAt || item.createdAt);
      row.append(tag, title, time);
      target.appendChild(row);
    });
  }

  function renderBoard() {
    if (!list) return;

    const query = searchQuery.trim().toLowerCase();
    const visible = discussions.filter((item) => {
      if (!inSection(item, activeSection)) return false;
      if (!query) return true;
      return `${item.title} ${item.excerpt}`.toLowerCase().includes(query);
    });

    list.replaceChildren();
    list.setAttribute('aria-busy', 'false');

    if (!visible.length) {
      const empty = document.createElement('p');
      empty.className = 'garden-empty';
      empty.append(unit('这个分类里还没有帖子。', 'No posts in this section yet.'));
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
    updateAuthUI();
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
  const categoryToggle = document.getElementById('post-category-toggle');
  const categoryMenu = document.getElementById('post-category-menu');
  const postCategoryLabel = document.getElementById('post-category-label');
  const publishButton = document.getElementById('publish-post');
  const saveDraftButton = document.getElementById('save-draft');
  const DRAFT_KEY = 'ichiyotsu-explore-draft';

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

    discussionCategory.textContent = `#${categoryLabel(item.category)}`;
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
    if (viewsNode) viewsNode.textContent = String(postViews(key));
    if (discussionViews) discussionViews.innerHTML = `<strong>${views}</strong><span>${unit('浏览', 'views')}</span>`;
    if (discussionCommentsStat) discussionCommentsStat.innerHTML = `<strong>${item.comments || 0}</strong><span>${unit('评论', 'comments')}</span>`;

    if (discussionLike) {
      const liked = isLiked(itemKey(item));
      discussionLike.classList.toggle('is-liked', liked);
      discussionLike.setAttribute('aria-pressed', String(liked));
      const number = discussionLike.querySelector('[data-like-count]');
      if (number) number.textContent = String((Number(item.upvotes) || 0) + (liked ? 1 : 0));
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
      empty.textContent = '还没有评论。登录 GitHub 后写下第一条。';
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

    if (!discussionDialog.open) {
      if (typeof discussionDialog.showModal === 'function') {
        discussionDialog.showModal();
      } else {
        discussionDialog.setAttribute('open', '');
      }
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
    discussionReply.addEventListener('submit', async (event) => {
      event.preventDefault();
      const text = replyBody?.value.trim();
      if (!text) { toast('先写一点内容再回复。'); replyBody?.focus(); return; }
      if (!githubToken) { openAuthDialog(); toast('先登录 GitHub 才能发布评论。'); return; }
      if (!activeDiscussion?.number) { toast('这条讨论暂时不能回复。'); return; }
      const submit = discussionReply.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        const comment = await addDiscussionComment(activeDiscussion.number, text);
        activeDiscussion.commentItems = Array.isArray(activeDiscussion.commentItems) ? activeDiscussion.commentItems : [];
        activeDiscussion.commentItems.push({ author: { login: githubUser }, createdAt: new Date().toISOString(), body: text });
        activeDiscussion.comments = (Number(activeDiscussion.comments) || 0) + 1;
        replyBody.value = '';
        openDiscussion(activeDiscussion.__index);
        toast('评论已发布到 GitHub');
      } catch (error) {
        toast(`评论发布失败：${error.message}`);
      } finally {
        if (submit) submit.disabled = false;
      }
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
    restoreDraft();
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

  const setPostCategory = (value) => {
    if (!categorySelect) return;
    categorySelect.value = value;
    const option = categoryMenu?.querySelector(`[data-category="${CSS.escape(value)}"]`);
    if (postCategoryLabel) postCategoryLabel.textContent = option?.querySelector('span')?.textContent || '说点什么';
    categoryMenu?.querySelectorAll('[data-category]').forEach((node) => {
      const active = node.dataset.category === value;
      node.classList.toggle('is-selected', active);
      node.setAttribute('aria-selected', String(active));
    });
  };

  if (categoryToggle && categoryMenu) {
    const closeCategory = () => {
      categoryMenu.hidden = true;
      categoryToggle.setAttribute('aria-expanded', 'false');
    };
    categoryToggle.addEventListener('click', () => {
      const open = categoryMenu.hidden;
      categoryMenu.hidden = !open;
      categoryToggle.setAttribute('aria-expanded', String(open));
    });
    categoryMenu.querySelectorAll('[data-category]').forEach((option) => {
      option.addEventListener('click', () => {
        setPostCategory(option.dataset.category || 'general');
        closeCategory();
      });
    });
    document.addEventListener('click', (event) => {
      if (!event.target.closest('#compose-type')) closeCategory();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCategory();
    });
  }
  setPostCategory('general');

  function saveDraft() {
    const draft = {
      title: titleInput?.value || '',
      category: categorySelect?.value || 'general',
      markdown: textarea.value,
      rich: richEditor.innerHTML,
      richMode: isRich(),
      savedAt: new Date().toISOString()
    };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      toast('草稿已保存');
    } catch (error) {
      toast('草稿保存失败');
    }
  }

  function restoreDraft() {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (!draft || (!draft.title && !draft.markdown && !draft.rich)) return;
      if (titleInput && !titleInput.value) titleInput.value = draft.title || '';
      if (draft.category) setPostCategory(draft.category);
      if (draft.richMode) {
        markdownToggle.checked = false;
        richEditor.innerHTML = draft.rich || '';
      } else {
        markdownToggle.checked = true;
        textarea.value = draft.markdown || '';
      }
      updatePreview();
      toast('已恢复上次草稿');
    } catch (error) { /* ignore broken draft */ }
  }

  if (saveDraftButton) saveDraftButton.addEventListener('click', saveDraft);

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

      if (!githubToken) {
        toast('先登录 GitHub 才能直接发布。');
        openAuthDialog();
        return;
      }

      const category = categorySelect?.value || 'general';
      const original = publishButton.innerHTML;
      publishButton.disabled = true;
      publishButton.textContent = '发布中…';
      try {
        const discussion = await createDiscussion({ title, body: markdown, category });
        try { window.localStorage.removeItem(DRAFT_KEY); } catch (error) { /* ignore */ }
        const created = {
          number: discussion.number,
          title,
          body: markdown,
          excerpt: markdown.replace(/[#>*_`\[\]]/g, '').slice(0, 160),
          url: discussion.url,
          category: { slug: category, name: githubCategoryNames[category] || 'General' },
          author: { login: githubUser || 'github' },
          comments: 0,
          upvotes: 0,
          createdAt: new Date().toISOString()
        };
        discussions = [created, ...discussions].map((item, index) => ({ ...item, __index: index }));
        renderStats(discussions);
        renderPinned();
        renderBoard();
        toast(`已发布到 GitHub：${discussion.title}`);
        closeCompose();
      } catch (error) {
        toast(`发布失败：${error.message}`);
      } finally {
        publishButton.disabled = false;
        publishButton.innerHTML = original;
      }
    });
  }

  updatePreview();
})();
