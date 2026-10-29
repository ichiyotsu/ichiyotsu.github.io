/**
 * Sync public GitHub Discussions into a small JSON file for the static
 * /garden/ page, and optionally announce a new release as a discussion.
 *
 * Used by .github/workflows/garden-sync.yml. It can also be run locally:
 *
 *   $env:GITHUB_TOKEN = gh auth token
 *   node tools/garden-sync.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const repository = process.env.GITHUB_REPOSITORY || 'ichiyotsu/ichiyotsu.github.io';
const [owner, name] = repository.split('/');
const token = process.env.GITHUB_TOKEN;
const api = 'https://api.github.com';
const dataFile = join(root, 'garden', 'data', 'discussions.json');

if (!token) {
  console.error('GITHUB_TOKEN is required.');
  process.exit(1);
}

const headers = {
  Authorization: `bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ichiyotsu-garden-sync',
  'Content-Type': 'application/json'
};

async function graphql(query, variables = {}) {
  const response = await fetch(`${api}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });

  const result = await response.json();
  if (!response.ok || result.errors) {
    const message = result.errors?.map((error) => error.message).join('; ') || `HTTP ${response.status}`;
    throw new Error(`GraphQL: ${message}`);
  }

  return result.data;
}

const REPO_QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      id
      hasDiscussionsEnabled
      discussionCategories(first: 20) {
        nodes { id name slug }
      }
    }
  }
`;

const DISCUSSIONS_QUERY = `
  query($owner: String!, $name: String!, $after: String) {
    repository(owner: $owner, name: $name) {
      discussions(first: 100, after: $after, orderBy: { field: UPDATED_AT, direction: DESC }) {
        pageInfo { hasNextPage endCursor }
        nodes {
          number
          title
          url
          createdAt
          updatedAt
          body
          bodyText
          upvoteCount
          category { name slug }
          author { login avatarUrl url }
          comments(first: 30) {
            totalCount
            nodes {
              id
              body
              createdAt
              upvoteCount
              author { login avatarUrl url }
            }
          }
        }
      }
    }
  }
`;

const CREATE_DISCUSSION = `
  mutation($repo: ID!, $cat: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repo, categoryId: $cat, title: $title, body: $body }) {
      discussion { number url }
    }
  }
`;

function excerpt(value, length = 260) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

async function getRepo() {
  const data = await graphql(REPO_QUERY, { owner, name });
  const repo = data.repository;

  if (!repo.hasDiscussionsEnabled) {
    throw new Error('GitHub Discussions is not enabled for this repository.');
  }

  return repo;
}

async function fetchDiscussions() {
  const items = [];
  let after = null;

  do {
    const data = await graphql(DISCUSSIONS_QUERY, { owner, name, after });
    const connection = data.repository.discussions;
    items.push(...connection.nodes);
    after = connection.pageInfo.hasNextPage ? connection.pageInfo.endCursor : null;
  } while (after);

  return items.map((item) => ({
    number: item.number,
    title: item.title,
    url: item.url,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    excerpt: excerpt(item.bodyText),
    body: item.body || '',
    upvotes: item.upvoteCount || 0,
    comments: item.comments?.totalCount || 0,
    commentItems: (item.comments?.nodes || []).map((comment) => ({
      id: comment.id,
      body: comment.body || '',
      createdAt: comment.createdAt,
      upvotes: comment.upvoteCount || 0,
      author: comment.author ? { login: comment.author.login, avatarUrl: comment.author.avatarUrl, url: comment.author.url } : null
    })),
    category: item.category ? { name: item.category.name, slug: item.category.slug } : { name: '讨论', slug: 'general' },
    author: item.author ? { login: item.author.login, avatarUrl: item.author.avatarUrl, url: item.author.url } : null
  }));
}

async function createReleaseDiscussion(repo) {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (eventName !== 'release' || !eventPath) return;

  let event;
  try {
    event = JSON.parse(readFileSync(eventPath, 'utf8'));
  } catch (error) {
    console.warn('Could not read release event payload:', error.message);
    return;
  }

  if (event.action !== 'published' || !event.release) return;

  const release = event.release;
  const title = `Release ${release.tag_name}${release.name ? ` · ${release.name}` : ''}`;
  const existing = await fetchDiscussions();

  if (existing.some((item) => item.title === title)) {
    console.log(`Discussion already exists for ${release.tag_name}; skipping.`);
    return;
  }

  const category = repo.discussionCategories.nodes.find((item) => item.slug === 'announcements')
    || repo.discussionCategories.nodes.find((item) => item.slug === 'general')
    || repo.discussionCategories.nodes[0];

  if (!category) {
    console.warn('No discussion category available; release announcement skipped.');
    return;
  }

  const body = [
    release.name ? `## ${release.name}` : `## ${release.tag_name}`,
    '',
    release.body || '这个版本的具体内容见 GitHub Release。',
    '',
    '---',
    '',
    `[在 GitHub 查看 Release](${release.html_url})`
  ].join('\n');

  try {
    await graphql(CREATE_DISCUSSION, {
      repo: repo.id,
      cat: category.id,
      title,
      body
    });
    console.log(`Created release discussion: ${title}`);
  } catch (error) {
    // Announcements are a nice-to-have; never let them break the data sync.
    console.warn(`Release announcement skipped: ${error.message}`);
  }
}

async function main() {
  const repo = await getRepo();
  await createReleaseDiscussion(repo);

  const discussions = await fetchDiscussions();
  let generatedAt = new Date().toISOString();

  // Keep the file byte-identical when nothing but the clock changed, so the
  // scheduled workflow does not create empty commits every six hours.
  try {
    const previous = JSON.parse(readFileSync(dataFile, 'utf8'));
    if (JSON.stringify(previous.discussions) === JSON.stringify(discussions)) {
      generatedAt = previous.generatedAt || generatedAt;
    }
  } catch (error) {
    // First run, or a malformed previous file: write a fresh one.
  }

  const payload = {
    generatedAt,
    repository,
    discussions
  };

  mkdirSync(dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Synced ${discussions.length} discussion(s) to ${dataFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
