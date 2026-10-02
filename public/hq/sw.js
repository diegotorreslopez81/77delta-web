/* HQ v2 · service worker: cachea el shell estatico (network-first, con caida a cache); nunca la API de
   Supabase ni el payload omc_hq_v2 (van a otro origen, asi que ya quedan fuera del filtro de fetch).
   Push y notificationclick son el mismo comportamiento real que public/hq/v1/sw.js (mismo payload que
   envia hq-push en el servidor: title, body, url, tag, id, lic). */
var CACHE = 'hq-v27';
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
// Traza remota (medicion del fallo de toque en iPhone): cada paso de push y notificationclick se manda a la RPC
// omc_push_traza (schema-v139), autenticada con el endpoint de la propia suscripcion. Nunca bloquea ni rompe el
// flujo: todo error de la traza se traga. Se leen con: select * from omc_push_traza order by id desc.
var TRAZA_CFG = null, TRAZA_EP = null, IOS = /iPhone|iPad|iPod/.test(self.navigator && navigator.userAgent || '');
function trazaCfg() {
  return TRAZA_CFG || (TRAZA_CFG = fetch('https://api.77delta.com/hq/config').then(function (r) { return r.json(); }).catch(function () { TRAZA_CFG = null; return null; }));
}
function trazaEp() {
  if (TRAZA_EP) return TRAZA_EP;
  try { TRAZA_EP = self.registration.pushManager.getSubscription().then(function (s) { return s && s.endpoint; }).catch(function () { return null; }); } catch (err) { TRAZA_EP = Promise.resolve(null); }
  return TRAZA_EP;
}
function msg(err) { return String(err && (err.name ? err.name + ': ' : '') + (err.message || err)).slice(0, 200); }
function traza(evento, datos) {
  var base = { cache: CACHE, ios: IOS, t: Date.now() };
  for (var k in datos) base[k] = datos[k];
  return Promise.all([trazaCfg(), trazaEp()]).then(function (r) {
    var cfg = r[0], ep = r[1];
    if (!cfg || !cfg.url || !ep) return null;
    return fetch(cfg.url + '/rest/v1/rpc/omc_push_traza', { method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: cfg.anon, Authorization: 'Bearer ' + cfg.anon },
      body: JSON.stringify({ p_endpoint: ep, p_evento: evento, p_datos: base }) });
  }).catch(function () { return null; });
}
self.addEventListener('push', function (e) {
  var d = {}, errJson = null; try { d = e.data ? e.data.json() : {}; } catch (err) { errJson = msg(err); d = { body: e.data && e.data.text() }; }
  var aviso = nuevoAviso(d, Date.now());
  var tz = [traza('push_recibido', { data: !!e.data, errJson: errJson, id: d.id || null, url: aviso.url, tag: aviso.tag })];
  e.waitUntil(guardarAviso(aviso).catch(function (err) { tz.push(traza('push_guardar_fallo', { error: msg(err) })); return null; }).then(function (n) {
    return self.registration.showNotification(aviso.title, {
      body: aviso.body, icon: '/hq/icon-192.png', badge: '/hq/icon-192.png', tag: aviso.tag, renotify: true,
      data: { url: aviso.url, id: aviso.id, lic: aviso.lic, n: n }
    }).then(function () { tz.push(traza('push_mostrado', { n: n })); }, function (err) { tz.push(traza('push_mostrar_fallo', { error: msg(err) })); throw err; });
  }).then(function () { return Promise.all(tz); }, function (err) { return Promise.all(tz).then(function () { throw err; }); }));
});
// Al tocar: la app abierta recibe siempre {tipo:'ir', url} y aplica el hash ella misma (iOS WebKit no tiene
// Client.navigate()). La url se pasa a absoluta dentro del scope (openWindow en WebKit la exige). En iPhone
// openWindow se llama de forma SINCRONA, sin matchAll ni await previos (tras un await WebKit puede perder el
// permiso de abrir ventana); despues se avisa a las ventanas que ya existian. En el resto: focus() primero y
// openWindow(url) como caida si no hay ventana de HQ v2 o focus() falla. El aviso se marca leido.
function urlAbs(url) {
  try { var u = new URL(url || '/hq/#avisos', self.location.origin); if (u.origin === self.location.origin && u.pathname.indexOf('/hq/') === 0) return u.href; } catch (err) {}
  return new URL('/hq/#avisos', self.location.origin).href;
}
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var d = e.notification.data || {}, sinData = !e.notification.data;
  var url = urlAbs(d.url || (d.id ? '/hq/#hoy/' + d.id : '/hq/#avisos'));
  var tz = [traza('click_inicio', { sinData: sinData, url: url, id: d.id || null, tag: e.notification.tag, camino: IOS ? 'ios-openWindow-directo' : 'focus-primero' })];
  var abrir = function (motivo) {
    var p;
    try { p = Promise.resolve(clients.openWindow(url)); } catch (err) { p = Promise.reject(err); }
    return p.then(function (w) { tz.push(traza('click_openWindow_ok', { motivo: motivo, devuelveCliente: !!w })); return w; },
      function (err) { tz.push(traza('click_openWindow_fallo', { motivo: motivo, error: msg(err) })); });
  };
  var trabajo = [marcarLeido(d.n).catch(function () {})];
  var abierta = IOS ? abrir('ios-directo') : null;
  trabajo.push(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    var propias = ws.filter(function (w) { return w.url.indexOf('/hq/') >= 0 && w.url.indexOf('/hq/v1/') < 0; });
    tz.push(traza('click_clientes', { total: ws.length, propias: propias.length, urls: ws.map(function (w) { return w.url + ' [' + w.visibilityState + (w.focused ? ',foco' : '') + ']'; }) }));
    propias.forEach(function (w) {
      try { w.postMessage({ tipo: 'ir', url: url }); } catch (err) {}
      if (d.id) { try { w.postMessage({ tipo: 'abrir', id: d.id }); } catch (err) {} }
      if (d.lic) { try { w.postMessage({ tipo: 'abrir-lic', lic: d.lic }); } catch (err) {} }
    });
    if (IOS) return abierta;
    if (!propias.length) return abrir('sin-ventana');
    var w0 = propias[0], enfoque;
    try { enfoque = w0.focus ? Promise.resolve(w0.focus()) : Promise.reject(new Error('sin focus')); } catch (err) { enfoque = Promise.reject(err); }
    return enfoque.then(function () { tz.push(traza('click_focus_ok', {})); }, function (err) { tz.push(traza('click_focus_fallo', { error: msg(err) })); return abrir('focus-fallo'); });
  }, function (err) { tz.push(traza('click_matchAll_fallo', { error: msg(err) })); return IOS ? abierta : abrir('matchAll-fallo'); }));
  e.waitUntil(Promise.all(trabajo).then(function () { return Promise.all(tz); }));
});
