import test from 'node:test';
import assert from 'node:assert/strict';
// ui.js no toca document al importarse: import estatico seguro; el shim de DOM se define antes de llamar a pintarBloques.
import { partirBloques, pintarBloques } from '../app/tarjeta-bloques.js';

const BUENO = 'Resumen: Guillem no puede presentar la 320 sin tu firma. Cierra el jueves.\n'
  + 'Datos:\n- Cierre: jueves 25-09 a las 14:00\n- Importe: 42.000 EUR\n- Pliego: https://drive.google.com/file/d/abc/view\n'
  + 'Qué tienes que hacer:\n1. Abre el pliego https://drive.google.com/file/d/abc/view y firma.\n2. Contesta aquí: presentamos (sí) o soltamos (no).';

test('partirBloques: tres bloques en orden', () => {
  const b = partirBloques(BUENO);
  assert.equal(b.resumen, 'Guillem no puede presentar la 320 sin tu firma. Cierra el jueves.');
  assert.equal(b.datos.length, 3);
  assert.equal(b.datos[0], 'Cierre: jueves 25-09 a las 14:00');
  assert.equal(b.pasos.length, 2);
  assert.ok(b.pasos[0].startsWith('Abre el pliego https://'));
  assert.ok(!/^\d/.test(b.pasos[1]));
});

test('partirBloques: tarjeta vieja o incompleta devuelve null', () => {
  assert.equal(partirBloques('- Una cosa\n- Otra\nA) Sí\nB) No'), null);
  assert.equal(partirBloques(''), null);
  assert.equal(partirBloques(null), null);
  assert.equal(partirBloques('Resumen: x\nDatos:\n- y'), null);
  assert.equal(partirBloques('Datos:\n- y\nResumen: x\nQué tienes que hacer:\n1. z'), null, 'fuera de orden');
});

test('partirBloques: marcador sin acento y mayúsculas', () => {
  assert.ok(partirBloques('RESUMEN: a\nDATOS:\n- b\nQue tienes que hacer:\n1. c'));
});

// DOM minimo para el.
function nodo(tag) {
  return { tag, nodeType: 1, attrs: {}, children: [], _t: '', className: '',
    setAttribute(k, v) { this.attrs[k] = v; }, addEventListener() {},
    append(...ks) { this.children.push(...ks); },
    set textContent(v) { this._t = v; }, get textContent() { return this._t + this.children.map(c => c.nodeType === 3 ? c.data : c.textContent).join(''); } };
}
globalThis.document = { createElement: nodo, createTextNode: (d) => ({ nodeType: 3, data: String(d), textContent: String(d) }) };
const busca = (n, f, out = []) => { if (n.nodeType === 1) { if (f(n)) out.push(n); n.children.forEach(c => busca(c, f, out)); } return out; };

test('pintarBloques: tres secciones con titulo, pasos como lista numerada y URLs como enlace', () => {
  const raiz = pintarBloques(BUENO);
  const secc = busca(raiz, n => n.tag === 'section');
  assert.deepEqual(secc.map(s => s.children[0].textContent), ['Resumen', 'Datos', 'Qué tienes que hacer']);
  assert.deepEqual(secc.map(s => s.className), ['bloque bloque-resumen', 'bloque bloque-datos', 'bloque bloque-pasos']);
  assert.equal(busca(secc[2], n => n.tag === 'ol').length, 1);
  assert.equal(busca(secc[2], n => n.tag === 'li').length, 2);
  assert.equal(busca(secc[1], n => n.tag === 'li').length, 3);
  const enlaces = busca(raiz, n => n.tag === 'a');
  assert.equal(enlaces.length, 2);
  assert.ok(enlaces.every(a => a.attrs.href.startsWith('https://') && a.attrs.rel === 'noopener'));
});

test('pintarBloques: sin marcadores devuelve null para que decisiones.js pinte como hoy', () => {
  assert.equal(pintarBloques('- Cambio automático de cuenta\n- Sesión del chief: https://x.y'), null);
});
