// Appends "Last updated <time> · <location>" to the page footer, from
// last-update.json (written by scripts/stamp_update.py and the Log Flight page).
(function () {
  var footer = document.querySelector('footer');
  if (!footer) return;
  fetch('last-update.json?_=' + Date.now())
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (u) {
      if (!u || !u.timestamp) return;
      var el = document.createElement('div');
      el.style.marginTop = '0.45rem';
      el.style.textTransform = 'none';
      el.style.letterSpacing = '0.05em';
      el.textContent = 'Last updated ' + u.timestamp + (u.location ? ' · ' + u.location : '');
      footer.appendChild(el);
    })
    .catch(function () {});
})();
