import test from 'node:test';
import assert from 'node:assert/strict';

// Tanda 4 (H5, LICITA-SPEC.md): se retira ?vista=menores y con ella toda la tabla dedicada de este
// fichero (leerVista/guardarVista, filtroServidor, filtrarLocal, tablaMenores, render, ESTADOS_MENORES
// con el estado retirado 'Analizada'). Menor pasa a ser un filtro mas (menor=1) de la vista unica
// (vistas/licitaciones.js, ver licitaciones-vista.test.mjs). Solo queda cabeceraFuentes(), que esa vista
// sigue usando; este fichero de test se reduce a probarla a ella sola.
function crearNodo(tag) {
  const n = {
    tag, nodeType: 1, children: [], attrs: {}, className: '', _text: '', _html: '', listeners: {}, parent: null,
    classList: { toggle(c, on) { const s = new Set(this._n.className.split(' ').filter(Boolean)); on ? s.add(c) : s.delete(c); this._n.className = [...s].join(' '); return on; }, contains(c) { return this._n.className.split(' ').includes(c); }, add(c) { this.toggle(c, true); }, remove(c) { this.toggle(c, false); } },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k] ?? null; },
    addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
    append(...kids) { for (const k of kids) { if (k == null) continue; k.parent = this; this.children.push(k); } },
    prepend(...kids) { for (const k of kids.reverse()) { if (k == null) continue; k.parent = this; this.children.unshift(k); } },
    remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; } },
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; this.children = []; },
  };
  n.classList._n = n;
  return n;
}
globalThis.document = {
  createElement: (tag) => crearNodo(tag),
  createTextNode: (data) => ({ nodeType: 3, data }),
  getElementById: () => crearNodo('div'),
  body: crearNodo('body'),
  addEventListener() {}, removeEventListener() {},
};
globalThis.location = { hash: '', search: '', pathname: '/hq/' };
globalThis.history = { replaceState: () => {} };
globalThis.window = { addEventListener: () => {} };
globalThis.HQ_VERSION = { v: 'test' };
if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
}

const M = await import('../app/vistas/licitaciones-menores.js');
const buscarNodos = (n, pred, out = []) => { if (n.nodeType === 1) { if (pred(n)) out.push(n); n.children.forEach(c => buscarNodos(c, pred, out)); } return out; };
const clase = (n, c) => n.className.split(' ').includes(c);
const tick = () => new Promise(r => setTimeout(r, 0));

test('cabeceraFuentes: sin no activas, una linea "Fuentes N/M"', async () => {
  M.usarCargadores({ fuentes: async () => ({ activas: 30, total: 30, rotas: 0, pendientes: 0, no_activas: [] }) });
  const S = {};
  const caja = M.cabeceraFuentes(S);
  await tick();
  assert.equal(caja.textContent, 'Fuentes 30/30');
});

test('cabeceraFuentes: con no activas, details con estado y motivo de cada una', async () => {
  M.usarCargadores({ fuentes: async () => ({ activas: 14, total: 30, rotas: 3, pendientes: 13, no_activas: [{ nombre: 'Fuente rota', estado: 'rota', motivo: 'HTTP 403' }, { nombre: 'Fuente pendiente', estado: 'pendiente', motivo: '' }] }) });
  const S = {};
  const caja = M.cabeceraFuentes(S);
  await tick();
  const det = buscarNodos(caja, n => n.tag === 'details' && clase(n, 'fuentes-det'))[0];
  assert.match(det.children[0].textContent, /Fuentes 14\/30 · 3 rotas · 13 pendientes/);
  assert.match(det.textContent, /rota.*Fuente rota · HTTP 403/);
  assert.match(det.textContent, /pendiente.*Fuente pendiente/);
});

test('cabeceraFuentes: si la RPC falla, no pinta nada (no estorba a la vista)', async () => {
  M.usarCargadores({ fuentes: async () => { throw new Error('red'); } });
  const S = {};
  const caja = M.cabeceraFuentes(S);
  await tick();
  assert.equal(caja.textContent, '');
});

test('cabeceraFuentes: repite sin llamar de nuevo si S.cacheFuentes esta fresco (5 min)', async () => {
  let llamadas = 0;
  M.usarCargadores({ fuentes: async () => { llamadas++; return { activas: 1, total: 1, no_activas: [] }; } });
  const S = {};
  M.cabeceraFuentes(S);
  await tick();
  assert.equal(llamadas, 1);
  const caja2 = M.cabeceraFuentes(S);
  assert.equal(llamadas, 1, 'segunda llamada sale de S.cacheFuentes, no pide otra vez');
  assert.match(caja2.textContent, /Fuentes 1\/1/);
});
