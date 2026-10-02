import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Carga sw.js en un sandbox y devuelve el manejador de notificationclick.
function cargar(ventanas, abiertas) {
  const h = {};
  const self = { addEventListener: (n, f) => { h[n] = f; }, location: { origin: 'https://77delta.com' }, registration: {}, clients: null };
  self.clients = { matchAll: async () => ventanas, openWindow: async u => { abiertas.push(u); }, claim: async () => {} };
  vm.runInNewContext(readFileSync(new URL('../sw.js', import.meta.url), 'utf8'), { self, clients: self.clients, URL, Promise, console, caches: {}, indexedDB: {}, location: self.location });
  return h.notificationclick;
}
const clic = async (f, data) => { let p; f({ notification: { close() {}, data }, waitUntil: x => { p = x; } }); await p; };

test('ventana abierta sin navigate (iOS): postMessage ir y focus, sin openWindow', async () => {
  const msgs = [], abiertas = []; let foco = 0;
  const w = { url: 'https://77delta.com/hq/', postMessage: m => msgs.push(m), focus: async () => { foco++; } };
  await clic(cargar([w], abiertas), { url: '/hq/#hoy/55', id: 55 });
  assert.equal(JSON.stringify(msgs[0]), JSON.stringify({ tipo: 'ir', url: '/hq/#hoy/55' }));
  assert.equal(foco, 1); assert.equal(abiertas.length, 0);
});
test('focus falla: cae a openWindow(url)', async () => {
  const abiertas = [];
  const w = { url: 'https://77delta.com/hq/', postMessage() {}, focus: async () => { throw new Error('x'); } };
  await clic(cargar([w], abiertas), { url: '/hq/#avisos' });
  assert.equal(JSON.stringify(abiertas), JSON.stringify(['/hq/#avisos']));
});
test('sin ventana de HQ v2: openWindow(url)', async () => {
  const abiertas = [];
  await clic(cargar([{ url: 'https://77delta.com/hq/v1/' }], abiertas), { url: '/hq/#hoy/7', id: 7 });
  assert.equal(JSON.stringify(abiertas), JSON.stringify(['/hq/#hoy/7']));
});
