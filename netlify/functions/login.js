const { githubRequest, signSession, safeEqual } = require('./_util');

const OWNER = 'camilozanetti';
const REPO = 'alfredozanetti';
const BRANCH = 'main';
const USERS_FILE = 'users.json';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let user, pass;
  try {
    ({ user, pass } = JSON.parse(event.body || '{}'));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  if (!user || !pass) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing credentials' }) };
  }

  const { status, json } = await githubRequest({
    path: `/repos/${OWNER}/${REPO}/contents/${USERS_FILE}?ref=${BRANCH}`
  });
  if (status !== 200 || !json || !json.content) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Could not verify credentials' }) };
  }

  let users;
  try {
    users = JSON.parse(Buffer.from(json.content, 'base64').toString('utf8'));
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: 'Invalid users file' }) };
  }

  const admin = users.admin_access;
  const isValid = admin && safeEqual(user, admin.user) && safeEqual(pass, admin.pass);
  if (!isValid) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid credentials' }) };
  }

  const token = signSession(admin.user);
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, displayName: admin.display_name || admin.user })
  };
};
