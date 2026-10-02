/* HQ v2 · service worker: cachea el shell estatico (network-first, con caida a cache); nunca la API de
   Supabase ni el payload omc_hq_v2 (van a otro origen, asi que ya quedan fuera del filtro de fetch).
   Push y notificationclick son el mismo comportamiento real que public/hq/v1/sw.js (mismo payload que
   envia hq-push en el servidor: title, body, url, tag, id, lic). */
var CACHE = 'hq-v24';
var SHELL = ['/hq/', '/hq/app/main.js', '/hq/app/api.js', '/hq/app/estado.js', '/hq/app/recargador.js', '/hq/app/rutas.js', '/hq/app/buscador.js', '/hq/app/licitaciones.js', '/hq/app/shell.js', '/hq/app/ui.js', '/hq/app/tarjeta.js', '/hq/app/detalle.js', '/hq/app/dnd.js', '/hq/app/vistas/hoy.js', '/hq/app/vistas/objetivo.js', '/hq/app/vistas/tablero.js', '/hq/app/vistas/decisiones.js', '/hq/app/vistas/licitaciones.js', '/hq/app/vistas/licitaciones-menores.js', '/hq/app/vistas/equipo.js', '/hq/app/vistas/motor.js', '/hq/app/vistas/expedientes.js', '/hq/app/vistas/avisos.js', '/hq/app/avisos.js', '/hq/app/tokens.css', '/hq/app/hq.css', '/hq/manifest.webmanifest', '/hq/icon-192.png', '/hq/icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  // Fix ronda 2 (revision final, F-d/D2): borrar solo caches de la propia familia v2 ('hq-v' seguido
  // de digitos, p.ej. 'hq-v13'), nunca 'hq-v1-legado' (esa es del sw de v1, mismo origen, misma
  // CacheStorage). Antes borraba cualquier clave que no fuera CACHE, incluida la del otro sw.
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE && /^hq-v\d+$/.test(k); }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  // Solo GET del propio origen y bajo /hq/ (nunca /hq/v1/, que tiene su sw y cache propios); todo lo
  // demas (Supabase, api.77delta.com, POST/PUT/DELETE) pasa de largo sin respondWith: red directa.
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/hq/') || u.pathname.startsWith('/hq/v1/')) return;
  // Fix ronda 2 (F-f/D4): solo se cachea una respuesta si r.ok; una 4xx/5xx (p.ej. un 404 tras un
  // rename de fichero) ya no se guarda como si fuera valida para servirla luego en modo offline.
  e.respondWith(fetch(e.request).then(function (r) { if (r.ok) { var copia = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copia); }); } return r; })
    .catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('/hq/'); }); }));
});
// #2159: cada push se guarda en IndexedDB ('hq-avisos'/'avisos', la vista Avisos de la app lo lee) antes de
// mostrarse, para poder releerlo si la notificacion se cierra o se pierde. El esquema (nombre, version, almacen,
// clave 'n') lo comparte app/avisos.js.
var BD_AVISOS = 'hq-avisos', ALMACEN_AVISOS = 'avisos', MAX_AVISOS = 200;
function abrirBD() {
  return new Promise(function (ok, ko) {
    var r = indexedDB.open(BD_AVISOS, 1);
    r.onupgradeneeded = function () { r.result.createObjectStore(ALMACEN_AVISOS, { keyPath: 'n', autoIncrement: true }); };
    r.onsuccess = function () { ok(r.result); };
    r.onerror = function () { ko(r.error); };
  });
}
function guardarAviso(aviso) {
  return abrirBD().then(function (db) {
    return new Promise(function (ok, ko) {
      var tx = db.transaction(ALMACEN_AVISOS, 'readwrite'), s = tx.objectStore(ALMACEN_AVISOS), clave = null;
      var a = s.add(aviso); a.onsuccess = function () { clave = a.result; };
      var k = s.getAllKeys(); k.onsuccess = function () { var ks = k.result; for (var i = 0; i < ks.length - MAX_AVISOS; i++) s.delete(ks[i]); };
      tx.oncomplete = function () { db.close(); ok(clave); };
      tx.onerror = tx.onabort = function () { db.close(); ko(tx.error); };
    });
  });
}
function marcarLeido(n) {
  if (n == null) return Promise.resolve();
  return abrirBD().then(function (db) {
    return new Promise(function (ok, ko) {
      var tx = db.transaction(ALMACEN_AVISOS, 'readwrite'), s = tx.objectStore(ALMACEN_AVISOS);
      var g = s.get(n); g.onsuccess = function () { if (g.result) { g.result.leido = true; s.put(g.result); } };
      tx.oncomplete = function () { db.close(); ok(); };
      tx.onerror = tx.onabort = function () { db.close(); ko(tx.error); };
    });
  });
}
// Enlace real de cada push: la tarjeta si trae id, la bandeja para una licitacion o un aviso agrupado, y solo
// como ultimo recurso la url del payload o la vista Avisos. Nunca la raiz '/hq/' a secas.
function destino(d) {
  if (d.id) return '/hq/#hoy/' + d.id;
  if (d.lic || d.tag === 'hq-lote') return '/hq/#hoy/bandeja';
  try {
    var u = new URL(d.url, self.location.origin);
    if (u.origin === self.location.origin && u.pathname.indexOf('/hq/') === 0 && (u.hash || u.search)) return u.pathname + u.search + u.hash;
  } catch (err) {}
  return '/hq/#avisos';
}
// Etiqueta unica por aviso: 'hq-<id>' por tarjeta, la del payload por licitacion, y para el resto (aviso agrupado
// con etiqueta fija 'hq-lote', o sin etiqueta) una con marca de tiempo, para que uno nuevo no borre el anterior.
function etiqueta(d, ahora) {
  if (d.id) return 'hq-' + d.id;
  if (d.tag && d.tag !== 'hq' && d.tag !== 'hq-lote') return d.tag;
  return 'hq-' + ahora + '-' + Math.random().toString(36).slice(2, 7);
}
function nuevoAviso(d, ahora) {
  return { t: ahora, title: d.title || 'HQ', body: d.body || '', url: destino(d), id: d.id || null, lic: d.lic || null, tag: etiqueta(d, ahora), leido: false };
}
self.addEventListener('push', function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data && e.data.text() }; }
  var aviso = nuevoAviso(d, Date.now());
  e.waitUntil(guardarAviso(aviso).catch(function () { return null; }).then(function (n) {
    return self.registration.showNotification(aviso.title, {
      body: aviso.body, icon: '/hq/icon-192.png', badge: '/hq/icon-192.png', tag: aviso.tag, renotify: true,
      data: { url: aviso.url, id: aviso.id, lic: aviso.lic, n: n }
    });
  }));
});
// Al tocar: la app abierta recibe siempre {tipo:'ir', url} y aplica el hash ella misma (iOS WebKit no tiene
// Client.navigate()); focus() va el primero, sin awaits previos, y si no hay ventana de HQ v2 o focus() falla,
// openWindow(url). El aviso se marca leido.
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var d = e.notification.data || {}, url = d.url || (d.id ? '/hq/#hoy/' + d.id : '/hq/#avisos');
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    var propias = ws.filter(function (w) { return w.url.indexOf('/hq/') >= 0 && w.url.indexOf('/hq/v1/') < 0; });
    var trabajo = [marcarLeido(d.n).catch(function () {})];
    if (!propias.length) { trabajo.push(clients.openWindow(url)); return Promise.all(trabajo); }
    var w0 = propias[0], enfoque;
    try { enfoque = w0.focus ? Promise.resolve(w0.focus()) : Promise.reject(new Error('sin focus')); } catch (err) { enfoque = Promise.reject(err); }
    propias.forEach(function (w) {
      try { w.postMessage({ tipo: 'ir', url: url }); } catch (err) {}
      if (d.id) { try { w.postMessage({ tipo: 'abrir', id: d.id }); } catch (err) {} }
      if (d.lic) { try { w.postMessage({ tipo: 'abrir-lic', lic: d.lic }); } catch (err) {} }
    });
    trabajo.push(enfoque.catch(function () { return clients.openWindow(url); }));
    return Promise.all(trabajo);
  }));
});
