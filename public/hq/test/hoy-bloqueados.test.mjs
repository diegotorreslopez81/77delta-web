import test from 'node:test';
import assert from 'node:assert/strict';
const mk = tag => ({ nodeType: 1, tag, attrs: {}, kids: [], className: '', textContent: '', setAttribute(k, v) { this.attrs[k] = v; }, append(...k) { this.kids.push(...k); }, addEventListener() {} });
globalThis.document = { createElement: mk, createTextNode: t => ({ nodeType: 3, textContent: t }), getElementById: () => ({}), body: {}, addEventListener() {}, removeEventListener() {} };
const { pintarBloqueados, pintarDecidir } = await import('../app/vistas/hoy-pantalla.js');

const h = { bloqueados: [
  { id: 5, texto: 'Sin hito', agente: 'bernat', fecha_hito: null },
  { id: 3, texto: 'Mañana', agente: 'pol', fecha_hito: '2026-10-23' },
  { id: 4, texto: 'Hoy', agente: 'nuria', fecha_hito: '2026-10-22' },
] };
const ahora = new Date('2026-10-22T10:00:00Z');

test('pintarBloqueados: hito más cercano primero, sin hito al final', () => {
  const f = pintarBloqueados(h, ahora);
  assert.deepEqual(f.map(x => x.attrs.href), ['#en-curso/4', '#en-curso/3', '#en-curso/5']);
});
test('pintarBloqueados: rojo si hito hoy o pasado; texto de hito', () => {
  const f = pintarBloqueados(h, ahora);
  assert.match(f[0].className, /rojo/);
  assert.doesNotMatch(f[1].className, /rojo/);
  assert.equal(f[1].kids[1].textContent, 'pol');
  assert.equal(f[2].kids[1].textContent, 'bernat');
});
test('pintarDecidir: sin bloqueados no añade subtítulos; con ellos, subtítulo y filas', () => {
  assert.deepEqual(pintarDecidir({}), []);
  const r = pintarDecidir(h);
  assert.equal(r[0].textContent, 'Encargos parados por ti');
  assert.equal(r.length, 4);
});

import { tituloCorto } from '../app/vistas/hoy-pantalla.js';
test('tituloCorto: primera frase y 80 caracteres', () => {
  assert.equal(tituloCorto('Diego 20-10: decide el precio. Luego sigue con el resto.'), 'Diego 20-10');
  assert.equal(tituloCorto('Aprobar la propuesta. Más texto'), 'Aprobar la propuesta');
  const t = tituloCorto('palabra '.repeat(30));
  assert.ok(t.length <= 80 && t.endsWith('…'));
  assert.equal(tituloCorto(null), '');
});
