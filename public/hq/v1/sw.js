/* HQ v1 retirada: kill-switch. Desregistra este service worker en los móviles que lo tenían y recarga las pestañas hacia /hq/. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (ks) { return Promise.all(ks.filter(function (k) { return k.indexOf('hq-v1-') === 0; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (ws) { ws.forEach(function (w) { w.navigate('/hq/'); }); })
  );
});
