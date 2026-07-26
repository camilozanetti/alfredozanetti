// Conditional analytics loader. Reads tracking IDs from data.json and only
// injects the scripts that have an ID configured, so nothing loads until the
// client actually turns a channel on via the CMS.
(function () {
  function loadGA4(id) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id);
  }

  function loadMetaPixel(id) {
    if (window.fbq) return;
    var n = (window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(s);
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function loadGTM(id) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + id;
    document.head.appendChild(s);
  }

  fetch('/data.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var tracking = data.tracking || {};
      if (tracking.ga4Id) loadGA4(tracking.ga4Id);
      if (tracking.metaPixelId) loadMetaPixel(tracking.metaPixelId);
      if (tracking.gtmId) loadGTM(tracking.gtmId);
    })
    .catch(function () {
      /* Tracking is best-effort — a failed fetch should never block the page. */
    });
})();
