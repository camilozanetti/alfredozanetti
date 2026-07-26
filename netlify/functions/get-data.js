const { githubRequest, verifySession } = require('./_util');

const OWNER = 'camilozanetti';
const REPO = 'alfredozanetti';
const BRANCH = 'main';
const DATA_FILE = 'data.json';

// Serves the current content + sha of data.json to the CMS so it can be
// edited and written back. Only the configured DATA_FILE can be read here —
// this intentionally ignores any client-supplied path to avoid exposing
// arbitrary repo files through this endpoint.
exports.handler = async (event) => {
  const token = (event.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!verifySession(token)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const { status, json } = await githubRequest({
    path: `/repos/${OWNER}/${REPO}/contents/${DATA_FILE}?ref=${BRANCH}`
  });
  if (status !== 200) {
    return { statusCode: status, body: JSON.stringify({ error: 'Could not read data file' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: json.content, sha: json.sha })
  };
};
