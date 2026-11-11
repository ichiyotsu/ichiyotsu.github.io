import { buildContentsPut, encodeUtf8Base64 } from '../publish.js';

const DRAFT = 'ichiyotsu-2026-draft';
const TOKEN = 'ichiyotsu-2026-token';
const frame = document.getElementById('frame');
const statusEl = document.getElementById('status');
let data = null;
let ready = false;

const field = (id) => document.getElementById(id);

async function load() {
  const saved = localStorage.getItem(DRAFT);
  if (saved) {
    try { data = JSON.parse(saved); } catch (error) { data = null; }
  }
  if (!data) data = await fetch('/2026/content.json').then((res) => res.json());
  data.hero ||= {};
  data.projects ||= { items: [] };
  data.about ||= {};
  data.links ||= { items: [] };
  data.projects.items ||= [];
  data.links.items ||= [];
  field('token').value = localStorage.getItem(TOKEN) || '';
  fill();
  preview();
}

function fill() {
  field('hero-visible').checked = data.hero.visible !== false;
  field('kicker').value = data.hero.kicker || '';
  field('name').value = data.hero.name || '';
  field('tagline').value = data.hero.tagline || '';
  field('accent').value = toColor(data.accent);
  field('projects-visible').checked = data.projects.visible !== false;
  field('about-visible').checked = data.about.visible !== false;
  field('about-title').value = data.about.title || '';
  field('about-body').value = data.about.body || '';
  field('links-visible').checked = data.links.visible !== false;
  field('footer').value = data.footer || '';
  drawProjects();
  drawLinks();
}

function read() {
  data.accent = field('accent').value;
  data.hero.visible = field('hero-visible').checked;
  data.hero.kicker = field('kicker').value;
  data.hero.name = field('name').value;
  data.hero.tagline = field('tagline').value;
  data.projects.visible = field('projects-visible').checked;
  data.about.visible = field('about-visible').checked;
  data.about.title = field('about-title').value;
  data.about.body = field('about-body').value;
  data.links.visible = field('links-visible').checked;
  data.footer = field('footer').value;
  [...field('projects').querySelectorAll('.card')].forEach((card, index) => {
    const item = data.projects.items[index];
    item.title = card.querySelector('[data-f="title"]').value;
    item.line = card.querySelector('[data-f="line"]').value;
    item.href = card.querySelector('[data-f="href"]').value;
    item.year = card.querySelector('[data-f="year"]').value;
    item.tags = card.querySelector('[data-f="tags"]').value;
    item.image = card.querySelector('[data-f="image"]').value;
  });
  [...field('links').querySelectorAll('.card')].forEach((card, index) => {
    data.links.items[index].label = card.querySelector('[data-f="label"]').value;
    data.links.items[index].href = card.querySelector('[data-f="href"]').value;
  });
}

function drawProjects() {
  const box = field('projects');
  box.innerHTML = data.projects.items.map((item, index) => `
    <div class="card" data-index="${index}">
      <div class="row">
        <strong>${index + 1}</strong>
        <button type="button" data-act="up">上移</button>
        <button type="button" data-act="down">下移</button>
        <button class="danger" type="button" data-act="remove">删除</button>
      </div>
      <label>标题<input data-f="title" value="${esc(item.title)}"></label>
      <label>一行说明<input data-f="line" value="${esc(item.line)}"></label>
      <label>链接<input data-f="href" value="${esc(item.href)}"></label>
      <label>年份<input data-f="year" value="${esc(item.year)}"></label>
      <label>标签<input data-f="tags" value="${esc(item.tags)}"></label>
      <label>图片地址<input data-f="image" value="${esc(item.image)}"></label>
      <label class="file">上传图片<input data-act="file" type="file" accept="image/*"></label>
    </div>`).join('');
}

function drawLinks() {
  field('links').innerHTML = data.links.items.map((item) => `
    <div class="card">
      <label>名称<input data-f="label" value="${esc(item.label)}"></label>
      <label>地址<input data-f="href" value="${esc(item.href)}"></label>
      <button class="danger" type="button" data-act="remove-link">删除</button>
    </div>`).join('');
}

function preview() {
  read();
  localStorage.setItem(DRAFT, JSON.stringify(data));
  if (ready) frame.contentWindow.postMessage({ type: 'ichiyotsu-2026', content: data }, location.origin);
}

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = `status ${kind || ''}`;
}

field('editor').addEventListener('input', preview);
field('projects').addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  read();
  const index = Number(button.closest('.card').dataset.index);
  if (button.dataset.act === 'up') move(index, -1);
  if (button.dataset.act === 'down') move(index, 1);
  if (button.dataset.act === 'remove') data.projects.items.splice(index, 1);
  drawProjects();
  preview();
});
field('projects').addEventListener('change', async (event) => {
  if (event.target.dataset.act !== 'file' || !event.target.files[0]) return;
  const file = event.target.files[0];
  const index = Number(event.target.closest('.card').dataset.index);
  read();
  data.projects.items[index].image = await fileToData(file);
  data.projects.items[index].uploadName = file.name;
  drawProjects();
  preview();
});
field('links').addEventListener('click', (event) => {
  if (event.target.dataset.act !== 'remove-link') return;
  read();
  const cards = [...field('links').querySelectorAll('.card')];
  data.links.items.splice(cards.indexOf(event.target.closest('.card')), 1);
  drawLinks();
  preview();
});
field('add-project').addEventListener('click', () => {
  read();
  data.projects.items.push({ title: '新作品', line: '介绍还没写。', href: '/tokipage/', year: '2026', tags: '', image: '' });
  drawProjects();
  preview();
});
field('add-link').addEventListener('click', () => {
  read();
  data.links.items.push({ label: '链接', href: 'https://' });
  drawLinks();
  preview();
});
field('download').addEventListener('click', () => {
  read();
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'content.json';
  a.click();
  URL.revokeObjectURL(url);
});
field('import').addEventListener('click', () => field('import-file').click());
field('import-file').addEventListener('change', async () => {
  const file = field('import-file').files[0];
  if (!file) return;
  data = JSON.parse(await file.text());
  fill();
  preview();
  setStatus('已导入，尚未发布。', 'ok');
});
field('forget').addEventListener('click', () => {
  localStorage.removeItem(TOKEN);
  field('token').value = '';
  setStatus('已忘记令牌。', 'ok');
});
field('token').addEventListener('change', () => {
  const value = field('token').value.trim();
  if (value) localStorage.setItem(TOKEN, value);
  else localStorage.removeItem(TOKEN);
});
field('theme').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  frame.contentWindow.postMessage({ type: 'ichiyotsu-2026-theme', theme: next }, location.origin);
  field('theme').textContent = next === 'dark' ? '预览浅色' : '预览深色';
});
field('publish').addEventListener('click', () => publish().catch((error) => setStatus(error.message || '发布失败', 'bad')));

function move(index, dir) {
  const next = index + dir;
  if (next < 0 || next >= data.projects.items.length) return;
  const [item] = data.projects.items.splice(index, 1);
  data.projects.items.splice(next, 0, item);
}

async function publish() {
  read();
  const token = field('token').value.trim();
  if (!token) throw new Error('先粘贴令牌。没有令牌可以用下载 JSON。');
  setStatus('正在发布…', '');
  const copy = structuredClone(data);
  for (const item of copy.projects.items) {
    if (String(item.image || '').startsWith('data:')) {
      const uploaded = await uploadDataImage(token, item.image, item.uploadName || 'image.png');
      item.image = uploaded;
    }
    delete item.uploadName;
  }
  const json = `${JSON.stringify(copy, null, 2)}\n`;
  await putFile(token, '2026/content.json', encodeUtf8Base64(json), 'Update 2026 page');
  data = copy;
  localStorage.setItem(DRAFT, JSON.stringify(data));
  fill();
  preview();
  setStatus('已提交到 main。GitHub Pages 大约一分钟后更新。', 'ok');
}

async function uploadDataImage(token, dataUrl, name) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error('图片格式无法上传。');
  const ext = match[1].includes('png') ? 'png' : match[1].includes('webp') ? 'webp' : 'jpg';
  const safe = name.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 40) || 'image';
  const path = `2026/assets/${safe}-${Date.now()}.${ext}`;
  await putFile(token, path, match[2], 'Add 2026 image');
  return `/${path}`;
}

async function putFile(token, path, contentBase64, message) {
  const sha = await getSha(token, path);
  const request = buildContentsPut({ path, message, contentBase64, sha, branch: 'main' });
  request.headers.Authorization = `Bearer ${token}`;
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(request.body)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub ${response.status}：${detail.slice(0, 180)}`);
  }
}

async function getSha(token, path) {
  const response = await fetch(buildContentsPut({ path, contentBase64: '', message: '' }).url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (response.status === 404) return '';
  if (!response.ok) throw new Error(`读取 ${path} 失败（${response.status}）`);
  const json = await response.json();
  return json.sha || '';
}

window.addEventListener('message', (event) => {
  if (event.origin !== location.origin) return;
  if (event.data?.type === 'ichiyotsu-2026-ready') {
    ready = true;
    preview();
  }
});

function fileToData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('读取图片失败'));
    reader.readAsDataURL(file);
  });
}

function toColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#b33613';
}

function esc(value) {
  return String(value ?? '').replace(/[&"]/g, (ch) => (ch === '&' ? '&amp;' : '&quot;'));
}

load();
