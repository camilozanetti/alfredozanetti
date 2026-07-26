const https = require('https');
const crypto = require('crypto');

function githubRequest({ method = 'GET', path, body }) {
  const token = process.env.GITHUB_TOKEN;
  const payload = body ? JSON.stringify(body) : null;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method,
        headers: {
          Authorization: `token ${token}`,
          'User-Agent': 'Netlify-Function',
          Accept: 'application/vnd.github+json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: data ? JSON.parse(data) : null });
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Signs a short-lived admin session token so the CMS write endpoint can't be
// called anonymously. Requires ADMIN_SESSION_SECRET to be set alongside
// GITHUB_TOKEN in the Netlify environment.
function signSession(username) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const expires = Date.now() + 1000 * 60 * 60 * 8; // 8 hours
  const payload = `${username}.${expires}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}.${sig}`).toString('base64url');
}

function verifySession(token) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!token || !secret) return false;
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 3) return false;
    const [username, expires, sig] = parts;
    const expected = crypto.createHmac('sha256', secret).update(`${username}.${expires}`).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
    if (Date.now() > Number(expires)) return false;
    return true;
  } catch {
    return false;
  }
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = { githubRequest, signSession, verifySession, safeEqual };
