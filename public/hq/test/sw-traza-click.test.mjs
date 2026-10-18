import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// C3 (18-10): el toque deja click_* usando el endpoint guardado en la notificacion, sin getSubscription.
function cargar(llamadas) {
  const h = {};
  const self = { navigator: { userAgent: 'iPhone' }, addEventListener: (n, f) => { h[n] = f; }, location: { origin: 'https://77delta.com' }, registration: {}, clients: null };
  self.clients = { matchAll: async () => [], openWindow: async () => ({}), claim: async () => {} };
  const fetch = async (u, o) => {
    if (String(u).includes('/hq/config')) return { json: async () => ({ url: 'https://s.test', anon: 'a' }) };
    llamadas.push(JSON.parse(o.body)); return { ok: true };
  };
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), { self, navigator: self.navigator, fetch, clients: self.clients, URL, Promise, console, caches: {}, indexedDB: {}, location: self.location });
  return h;
}
test('notificationclick traza click_inicio con el endpoint de la notificacion', async () => {
  const ll = [], h = cargar(ll); let p;
  h.notificationclick({ notification: { close() {}, tag: 't', data: { url: '/hq/#hoy/9', id: 9, ep: 'https://ep.test/1' } }, waitUntil: x => { p = x; } });
  await p;
  const ev = ll.map(x => x.p_evento);
  assert.ok(ev.includes('click_inicio') && ev.includes('click_openWindow_ok'));
  assert.ok(ll.every(x => x.p_endpoint === 'https://ep.test/1'));
});
test('notificationclose traza cierre', async () => {
  const ll = [], h = cargar(ll); let p;
  h.notificationclose({ notification: { tag: 't', data: { id: 3, ep: 'https://ep.test/1' } }, waitUntil: x => { p = x; } });
  await p; assert.equal(ll[0].p_evento, 'cierre');
});
