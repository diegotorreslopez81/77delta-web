import test from 'node:test';
import assert from 'node:assert/strict';
// #2676: cifras que aún no salen de la fuente de la verdad, en rojo (--error) con data-provisional.
function crearNodo(tag) {
  const n = {
    tag, nodeType: 1, children: [], attrs: {}, className: '', _text: '', _html: '', listeners: {}, parent: null, dataset: {},
    classList: { toggle(c, on) { const s = new Set(this._n.className.split(' ').filter(Boolean)); on ? s.add(c) : s.delete(c); this._n.className = [...s].join(' '); return on; }, contains(c) { return this._n.className.split(' ').includes(c); }, add(c) { this.toggle(c, true); }, remove(c) { this.toggle(c, false); } },
    setAttribute(k, v) { this.attrs[k] = v; if (k.startsWith('data-')) this.dataset[k.slice(5)] = v; },
    getAttribute(k) { return this.attrs[k] ?? null; },
    addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
    append(...kids) { for (const k of kids) { if (k == null) continue; k.parent = this; this.children.push(k); } },
    remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; } },
    prepend(...kids) { for (const k of kids.reverse()) { if (k == null) continue; k.parent = this; this.children.unshift(k); } },
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
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
  addEventListener: () => {},
};
globalThis.location = { hash: '', search: '', pathname: '/hq/' };
globalThis.history = { replaceState: () => {} };
globalThis.window = { addEventListener: () => {} };
globalThis.HQ_VERSION = { v: 'test' };
globalThis.matchMedia = () => ({ matches: false });
if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
}

const { pintarNegocio, PROVISIONAL } = await import('../app/vistas/hoy-pantalla.js');
const { pintarCaptacion, PROVISIONAL_CAPTACION } = await import('../app/vistas/home.js');
const { provisional } = await import('../app/ui.js');
const buscar = (n, f, out = []) => { if (n && n.nodeType === 1) { if (f(n)) out.push(n); n.children.forEach(c => buscar(c, f, out)); } return out; };
const marcados = n => buscar(n, x => x.dataset && x.dataset.provisional);

test('provisional: clase, data-provisional y título con el encargo', () => {
  const n = provisional(crearNodo('div'), '#2672');
  assert.ok(n.classList.contains('fuente-provisional')); assert.equal(n.dataset.provisional, '#2672'); assert.match(n.title, /\(#2672\)/);
});
test('Negocio: pipeline, captacion_7d e ingresos en rojo; licitaciones normal', () => {
  const f = clave => ({ clave, etiqueta: clave, principal: 5, principal_unidad: 'n' });
  const raiz = pintarNegocio(['pipeline', 'captacion_7d', 'ingresos', 'licitaciones'].map(f));
  assert.deepEqual(marcados(raiz).map(x => x.dataset.provisional), ['#2672', '#2673', 'pendiente de encargo']);
  assert.deepEqual(Object.keys(PROVISIONAL), ['pipeline', 'captacion_7d', 'ingresos']);
});
test('Captación: enviados, respuestas y ganados en rojo; visitas, reservar y formularios normal', () => {
  const fila = { periodo: 7, producto: 'total', enviados: 902, respuestas: 24, visitas: 100, clics_reservar: 3, formularios: 1, ganados: 2 };
  const raiz = pintarCaptacion([fila], 7);
  assert.equal(marcados(raiz).length, 3); assert.ok(marcados(raiz).every(x => x.dataset.provisional === '#2673'));
  assert.deepEqual(Object.keys(PROVISIONAL_CAPTACION), ['enviados', 'respuestas', 'ganados']);
});
