const { githubRequest, verifySession } = require('./_util');

const OWNER = 'camilozanetti';
const REPO = 'alfredozanetti';
const BRANCH = 'main';
const DATA_FILE = 'data.json';

// Writes data.json back to GitHub. Requires a valid admin session token and
// always targets the configured DATA_FILE — a client-supplied path here
// would let anyone who finds this endpoint overwrite any file in the repo
// (including the functions themselves), so it is not accepted as input.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const token = (event.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!verifySession(token)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  let message, content, sha;
  try {
    ({ message, content, sha } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  if (!content || !sha) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing content or sha' }) };
  }

  try {
    JSON.parse(Buffer.from(content, 'base64').toString('utf8'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'content must be valid base64-encoded JSON' }) };
  }

  const { status, json } = await githubRequest({
    method: 'PUT',
    path: `/repos/${OWNER}/${REPO}/contents/${DATA_FILE}`,
    body: { message: message || 'Update site content via CMS', content, sha, branch: BRANCH }
  });

  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json)
  };
};
