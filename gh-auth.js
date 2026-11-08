// Shared "Sign in with GitHub" for File Drop (index.html) and Log Flight (log.html).
// Uses the "DragonBroSY File Drop" GitHub App. GitHub sends the browser back to
// the site root with a one-time code; the Cloudflare Worker in
// workers/github-oauth swaps it for an 8-hour token, kept in sessionStorage
// (this tab only). GitHub only accepts the root as the return address, so a
// sign-in started on another page comes back through index.html and is then
// sent on to the page that started it.
(function() {
  var CLIENT_ID = 'Iv23li1WNeCUgA1hlL5a';
  var AUTH_URL = 'https://dragonbrosy-oauth.dragonbrosy.workers.dev/token';
  var REDIRECT = 'https://dragonbrosy.github.io/';
  var SESSION_KEY = 'dragonbrosy_gh_oauth';
  var STATE_KEY = 'dragonbrosy_gh_oauth_state';
  var RETURN_KEY = 'dragonbrosy_gh_oauth_return';

  // The old pasted personal access token is no longer used anywhere; drop it.
  try { localStorage.removeItem('dragonbrosy_gh_token'); } catch (e) {}

  function token() {
    try {
      var t = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      return t && t.exp > Date.now() ? t.token : '';
    } catch (e) { return ''; }
  }

  function signIn(returnTo) {
    var state = Array.from(crypto.getRandomValues(new Uint8Array(16)), function(b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
    sessionStorage.setItem(STATE_KEY, state);
    sessionStorage.setItem(RETURN_KEY, returnTo || (location.pathname + location.hash));
    location.href = 'https://github.com/login/oauth/authorize?client_id=' + CLIENT_ID +
      '&redirect_uri=' + encodeURIComponent(REDIRECT) + '&state=' + state;
  }

  function signOut() { sessionStorage.removeItem(SESSION_KEY); }

  // Call on page load. Resolves to { redirecting: true } when it is sending the
  // browser on to another page, { error: '...' } on failure, otherwise {}.
  async function finishLogin() {
    var q = new URLSearchParams(location.search);
    var code = q.get('code'), state = q.get('state');
    if (!code) return {};
    var expected = sessionStorage.getItem(STATE_KEY);
    var returnTo = sessionStorage.getItem(RETURN_KEY) || '/';
    sessionStorage.removeItem(STATE_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    history.replaceState(null, '', location.pathname + location.hash);
    if (!expected || state !== expected) return { error: 'login request didn\'t match. Try again.' };
    try {
      var res = await fetch(AUTH_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ code: code }) });
      var j = await res.json();
      if (!res.ok || !j.access_token) throw new Error(j.error || res.status);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 }));
    } catch (e) {
      return { error: e.message };
    }
    var target = new URL(returnTo, location.origin);
    if (target.pathname.replace(/index\.html$/, '') !== location.pathname.replace(/index\.html$/, '')) {
      location.replace(target.pathname + target.hash);
      return { redirecting: true };
    }
    // Same page: just restore the #section without reloading.
    history.replaceState(null, '', location.pathname + target.hash);
    return {};
  }

  window.GHAuth = { token: token, signIn: signIn, signOut: signOut, finishLogin: finishLogin };
})();
