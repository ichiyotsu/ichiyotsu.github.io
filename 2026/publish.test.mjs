import assert from 'node:assert/strict';
import { buildContentsPut, contentsUrl } from './publish.js';

const update = buildContentsPut({
  path: '2026/content.json',
  message: 'Update 2026 page',
  contentBase64: 'e30=',
  sha: 'abc123',
  branch: 'main'
});

assert.equal(update.method, 'PUT');
assert.equal(update.url, contentsUrl('2026/content.json'));
assert.equal(update.url, 'https://api.github.com/repos/ichiyotsu/ichiyotsu.github.io/contents/2026/content.json');
assert.equal(update.headers.Accept, 'application/vnd.github+json');
assert.equal(update.headers.Authorization, 'Bearer TOKEN');
assert.equal(update.headers['X-GitHub-Api-Version'], '2022-11-28');
assert.equal(update.body.message, 'Update 2026 page');
assert.equal(update.body.content, 'e30=');
assert.equal(update.body.sha, 'abc123');
assert.equal(update.body.branch, 'main');
assert.equal(JSON.stringify(update.body).includes('github_pat'), false);

const created = buildContentsPut({
  path: '/2026/assets/shot.png',
  message: 'Add 2026 image',
  contentBase64: 'aGVsbG8=',
  sha: ''
});
assert.equal(created.url.endsWith('/contents/2026/assets/shot.png'), true);
assert.equal('sha' in created.body, false);
assert.equal(created.body.branch, 'main');

console.log('publish request shape ok');
