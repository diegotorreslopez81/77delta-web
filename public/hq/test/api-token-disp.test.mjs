import test from 'node:test';
import assert from 'node:assert/strict';

function almacen() { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; }
async function cargar(local, sess) {
  globalThis.sessionStorage = sess; globalThis.localStorage = local;
  globalThis.location = { search: '', hash: '', pathname: '/hq/', reload() {} };
  globalThis.history = { replaceState() {} };
  return import('../app/api.js?' + Math.random());
}

test('sin recordar: solo sessionStorage, nada en localStorage', async () => {
  const l = almacen(), s = almacen(); const api = await cargar(l, s);
  api.guardarToken('a'.repeat(24), false);
  assert.equal(s.getItem('hq_t'), 'a'.repeat(24)); assert.equal(l.getItem('hq_t_disp'), null); assert.equal(l.getItem('hq_t'), null);
});
test('recordar: guarda hq_t_disp y lo lee sin sessionStorage', async () => {
  const l = almacen(), s = almacen(); const api = await cargar(l, s);
  api.guardarToken('b'.repeat(24), true);
  assert.equal(l.getItem('hq_t_disp'), 'b'.repeat(24));
  const api2 = await cargar(l, almacen()); assert.equal(api2.TOKEN, 'b'.repeat(24));
});
test('la purga de hq_t no toca hq_t_disp y no deja hq_t antiguo', async () => {
  const l = almacen(); l.setItem('hq_t', 'viejo'); l.setItem('hq_t_disp', 'c'.repeat(24));
  await cargar(l, almacen());
  assert.equal(l.getItem('hq_t'), null); assert.equal(l.getItem('hq_t_disp'), 'c'.repeat(24));
});

test('entrar sin casilla borra hq_t_disp de una entrada anterior', async () => {
  const l = almacen(); l.setItem('hq_t_disp', 'd'.repeat(24)); const api = await cargar(l, almacen());
  api.guardarToken('e'.repeat(24), false);
  assert.equal(l.getItem('hq_t_disp'), null);
});

test('enlace con token ya recordado: se conserva hq_t_disp y no se ofrece', async () => {
  const l = almacen(); l.setItem('hq_t_disp', 'e'.repeat(24));
  globalThis.sessionStorage = almacen(); globalThis.localStorage = l;
  globalThis.location = { search: '', hash: '#t=' + 'e'.repeat(24), pathname: '/hq/', reload() {} }; globalThis.history = { replaceState() {} };
  const api = await import('../app/api.js?' + Math.random());
  assert.equal(api.entradaPorEnlace, true); assert.equal(api.recordado, true);
  assert.equal(l.getItem('hq_t_disp'), 'e'.repeat(24));
});
test('enlace con otro token: otroRecordado y hq_t_disp se borra hasta que se pulse Recordar', async () => {
  const l = almacen(); l.setItem('hq_t_disp', 'f'.repeat(24));
  globalThis.sessionStorage = almacen(); globalThis.localStorage = l;
  globalThis.location = { search: '', hash: '#t=' + 'a'.repeat(24), pathname: '/hq/', reload() {} }; globalThis.history = { replaceState() {} };
  const api = await import('../app/api.js?' + Math.random());
  assert.equal(api.otroRecordado, true); assert.equal(api.recordado, false);
});
