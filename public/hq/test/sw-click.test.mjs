import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Carga sw.js en un sandbox y devuelve el manejador de notificationclick.
function cargar(ventanas, abiertas, ua) {
  const h = {};
  const self = { navigator: { userAgent: ua || 'Android' }, addEventListener: (n, f) => { h[n] = f; }, location: { origin: 'https://77delta.com' }, registration: {}, clients: null };
  self.clients = { matchAll: async () => ventanas, openWindow: async u => { abiertas.push(u); }, claim: async () => {} };
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), { self, navigator: { userAgent: ua || 'Android' }, fetch: async () => { throw new Error('sin red'); }, clients: self.clients, URL, Promise, console, caches: {}, indexedDB: {}, location: self.location });
  return h.notificationclick;
}
const clic = async (f, data) => { let p; f({ notification: { close() {}, data }, waitUntil: x => { p = x; } }); await p; };

test('ventana abierta sin navigate (iOS): postMessage ir y focus, sin openWindow', async () => {
  const msgs = [], abiertas = []; let foco = 0;
  const w = { url: 'https://77delta.com/hq/', postMessage: m => msgs.push(m), focus: async () => { foco++; } };
  await clic(cargar([w], abiertas), { url: '/hq/#hoy/55', id: 55 });
  assert.equal(JSON.stringify(msgs[0]), JSON.stringify({ tipo: 'ir', url: 'https://77delta.com/hq/#hoy/55' }));
  assert.equal(foco, 1); assert.equal(abiertas.length, 0);
});
test('focus falla: cae a openWindow(url)', async () => {
  const abiertas = [];
  const w = { url: 'https://77delta.com/hq/', postMessage() {}, focus: async () => { throw new Error('x'); } };
  await clic(cargar([w], abiertas), { url: '/hq/#avisos' });
  assert.equal(JSON.stringify(abiertas), JSON.stringify(['https://77delta.com/hq/#avisos']));
});
test('sin ventana de HQ v2: openWindow(url)', async () => {
  const abiertas = [];
  await clic(cargar([{ url: 'https://77delta.com/hq/v1/' }], abiertas), { url: '/hq/#hoy/7', id: 7 });
  assert.equal(JSON.stringify(abiertas), JSON.stringify(['https://77delta.com/hq/#hoy/7']));
});
test('iPhone: openWindow directo con URL absoluta, sin esperar a matchAll, y avisa a la ventana abierta', async () => {
  const msgs = [], abiertas = []; let foco = 0;
  const w = { url: 'https://77delta.com/hq/', postMessage: m => msgs.push(m), focus: async () => { foco++; } };
  const f = cargar([w], abiertas, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)');
  let p; f({ notification: { close() {}, data: { url: '/hq/#hoy/9', id: 9 } }, waitUntil: x => { p = x; } });
  assert.equal(JSON.stringify(abiertas), JSON.stringify(['https://77delta.com/hq/#hoy/9'])); // sincrono, antes de cualquier await
  await p; assert.equal(msgs[0].tipo, 'ir'); assert.equal(foco, 0);
});
test('notificacion sin data (version vieja): abre #avisos', async () => {
  const abiertas = []; await clic(cargar([], abiertas), undefined);
  assert.equal(JSON.stringify(abiertas), JSON.stringify(['https://77delta.com/hq/#avisos']));
});
test('url fuera de /hq/ o de otro origen cae a #avisos', async () => {
  const abiertas = []; await clic(cargar([], abiertas), { url: 'https://evil.com/x' });
  assert.equal(JSON.stringify(abiertas), JSON.stringify(['https://77delta.com/hq/#avisos']));
});
