import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document = { createElement: () => ({}), createTextNode: () => ({}), getElementById: () => ({}), body: {}, addEventListener() {}, removeEventListener() {} };
globalThis.location = { hash: '', search: '', pathname: '/hq/' };
globalThis.history = { replaceState: () => {} };
globalThis.window = { addEventListener: () => {} };
globalThis.HQ_VERSION = { v: 'test' };
if (typeof globalThis.localStorage === 'undefined') globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { modeloAvisos } = await import('../app/vistas/avisos.js');

test('modeloAvisos: sin leer primero, luego más nuevo; enlace del hash; leido por leido_en', () => {
  const m = modeloAvisos([
    { id: 1, ts: '2026-10-21T10:00:00Z', tipo: 'licitacion', texto: 'Plazo cerca', url: 'https://77delta.com/hq/#operacion/licitaciones?lic=X', leido_en: '2026-10-21T11:00:00Z' },
    { id: 2, ts: '2026-10-21T09:00:00Z', tipo: 'tarjeta', texto: 'Antiguo sin leer', url: 'https://77delta.com/hq/#hoy/2', leido_en: null },
    { id: 3, ts: '2026-10-21T12:00:00Z', tipo: 'sistema', texto: 'Nuevo', url: null, leido_en: null }]);
  assert.deepEqual(m.avisos.map(a => a.id), [3, 2, 1]);
  assert.equal(m.sinLeer, 2);
  assert.equal(m.avisos[1].enlace, '#hoy/2');
  assert.equal(m.avisos[0].enlace, '#hoy');
  assert.equal(m.avisos[2].enlace, '#operacion/licitaciones?lic=X');
  assert.equal(m.avisos[0].tipo, 'Sistema');
});
test('modeloAvisos: entrada no válida da lista vacía', () => {
  assert.deepEqual(modeloAvisos(null), { avisos: [], sinLeer: 0 });
});
