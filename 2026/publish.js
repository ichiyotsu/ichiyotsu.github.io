const REPO = 'ichiyotsu/ichiyotsu.github.io';

export function contentsUrl(path) {
  const clean = String(path || '').replace(/^\/+/, '');
  return `https://api.github.com/repos/${REPO}/contents/${clean.split('/').map(encodeURIComponent).join('/')}`;
}

export function buildContentsPut({ path, message, contentBase64, sha, branch = 'main' }) {
  const body = {
    message: message || 'Update 2026 page',
    content: contentBase64,
    branch
  };
  if (sha) body.sha = sha;
  return {
    method: 'PUT',
    url: contentsUrl(path),
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer TOKEN',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body
  };
}

export function encodeUtf8Base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}
