import test from 'node:test';
import assert from 'node:assert/strict';
import { decidirAviso, haceCuanto, hashDeAviso, trazarPagina } from '../app/aviso-pendiente.js';

const A = (n, min, extra = {}) => ({ n, t: 1e12 - min * 60000, title: 'T' + n, url: '/hq/#hoy/' + n, leido: false, ...extra });
const ahora = 1e12;

test('sin avisos o todos leídos: ninguno', () => {
  assert.equal(decidirAviso([]).aviso, null);
  assert.equal(decidirAviso([A(1, 1, { leido: true })]).total, 0);
});
test('el más reciente sin leer y el total, sin límite de edad', () => {
  const d = decidirAviso([A(1, 500), A(2, 1), A(3, 90, { leido: true })]);
  assert.equal(d.aviso.n, 2); assert.equal(d.total, 2);
});
test('haceCuanto', () => {
  assert.equal(haceCuanto(ahora - 30000, ahora), 'hace un momento');
  assert.equal(haceCuanto(ahora - 5 * 60000, ahora), 'hace 5 min');
  assert.equal(haceCuanto(ahora - 125 * 60000, ahora), 'hace 2 h');
});
test('hashDeAviso solo mismo origen y /hq/', () => {
  assert.equal(hashDeAviso({ url: '/hq/#hoy/9' }, 'https://77delta.com'), '#hoy/9');
  assert.equal(hashDeAviso({ url: 'https://malo.test/hq/#x' }, 'https://77delta.com'), null);
  assert.equal(hashDeAviso({ url: '/otro/#x' }, 'https://77delta.com'), null);
});
test('trazarPagina manda app_visible con el endpoint y nunca lanza', async () => {
  const ll = [];
  const reg = { pushManager: { getSubscription: async () => ({ endpoint: 'https://ep.test/1' }) } };
  await trazarPagina('pagina_abierta', { cache: 'hq-v47' }, { reg, cfg: { url: 'https://s.test', anon: 'a' }, fetchFn: async (u, o) => { ll.push(JSON.parse(o.body)); } });
  assert.equal(ll[0].p_evento, 'pagina_abierta'); assert.equal(ll[0].p_endpoint, 'https://ep.test/1'); assert.equal(ll[0].p_datos.origen, 'pagina');
  assert.equal(await trazarPagina('x', {}, { reg: null, cfg: null }), null);
  assert.equal(await trazarPagina('x', {}, { reg, cfg: { url: 'u', anon: 'a' }, fetchFn: async () => { throw new Error('r'); } }), null);
});
