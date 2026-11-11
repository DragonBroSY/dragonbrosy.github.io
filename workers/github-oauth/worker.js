// GitHub sign-in helper for the File Drop on dragonbrosy.github.io.
// The browser can't finish GitHub's login itself (it needs the app's client
// secret, which must never ship to the browser), so it sends the one-time
// login code here and gets back a short-lived (8 hour) user access token.
// Secrets: GITHUB_CLIENT_SECRET (wrangler secret). Var: GITHUB_CLIENT_ID.

const ALLOWED_ORIGIN = 'https://dragonbrosy.github.io';

function cors(body, status, origin) {
  return new Response(body == null ? null : JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin === ALLOWED_ORIGIN ? origin : 'null',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin'
    }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return cors(null, 204, origin);
    if (origin !== ALLOWED_ORIGIN) return cors({ error: 'origin not allowed' }, 403, origin);
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/token') {
      return cors({ error: 'not found' }, 404, origin);
    }

    let code;
    try { code = (await request.json()).code; } catch (e) {}
    if (!code || typeof code !== 'string') return cors({ error: 'missing code' }, 400, origin);

    const gh = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'dragonbrosy-oauth-worker' },
      body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code })
    });
    // GitHub intermittently answers 429 to Cloudflare's shared outbound IPs. That
    // doesn't use up the code, and a fresh request usually gets through, so tell
    // the browser to retry (retrying inside this same request keeps failing).
    if (gh.status === 429) return cors({ error: 'GitHub busy', retry: true }, 503, origin);
    const text = await gh.text();
    let data = {};
    try { data = JSON.parse(text); } catch (e) {}
    if (!data.access_token) {
      // Log only the shape of GitHub's reply, never token values.
      console.log('exchange failed', gh.status, Object.keys(data).join(','), text.slice(0, 200).replace(/gh[ousr]_\w+/g, '[redacted]'));
      return cors({ error: data.error_description || data.error || ('GitHub replied ' + gh.status) }, 400, origin);
    }

    // Only the short-lived access token goes back; the long-lived refresh token is dropped.
    return cors({ access_token: data.access_token, expires_in: data.expires_in || 28800 }, 200, origin);
  }
};
