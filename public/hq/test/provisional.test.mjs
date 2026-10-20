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

const { pintarNegocio, PROVISIONAL, kEur } = await import('../app/vistas/hoy-pantalla.js');
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
  assert.deepEqual(marcados(raiz).map(x => x.dataset.provisional), ['#2672', '#2645', '#2673']);
  assert.deepEqual(Object.keys(PROVISIONAL), ['pipeline', 'captacion_7d', 'ingresos']);
});
test('Captación: enviados, respuestas y ganados en rojo; visitas, reservar y formularios normal', () => {
  const fila = { periodo: 7, producto: 'total', enviados: 902, respuestas: 24, visitas: 100, clics_reservar: 3, formularios: 1, ganados: 2 };
  const raiz = pintarCaptacion([fila], 7);
  assert.equal(marcados(raiz).length, 3); assert.ok(marcados(raiz).every(x => x.dataset.provisional === '#2673'));
  assert.deepEqual(Object.keys(PROVISIONAL_CAPTACION), ['enviados', 'respuestas', 'ganados']);
});

test('kEur: 999 €, 433,2 k€, 1,12 M€, sin dato', () => {
  assert.equal(kEur(999), '999 €'); assert.equal(kEur(433205.86), '433,2 k€'); assert.equal(kEur(1120000), '1,12 M€'); assert.equal(kEur(null), 'sin dato');
});
test('Pipeline #2677: total y tres líneas; ayudas sin dato en rojo #2677; tarjeta sin marca #2672', () => {
  const d = (clave, etiqueta, valor, n, provisional, enlace) => ({ clave, etiqueta, valor, unidad: 'eur', n, provisional, enlace });
  const raiz = pintarNegocio([{ clave: 'pipeline', etiqueta: 'Pipeline', principal: 559705.86, principal_unidad: 'eur', principal_texto: 'en juego', detalle: [
    d('licitaciones', 'Licitaciones', 433205.86, 34, false, 'operacion/licitaciones'), d('propuestas', 'Propuestas comerciales', 126500, 16, false, 'operacion/ventas/pipeline'), d('ayudas', 'Ayudas pedidas', null, null, true, '') ] }]);
  const t = raiz.textContent;
  assert.match(t, /559,7 k€/); assert.match(t, /Licitaciones: 433,2 k€ \(#34\)/); assert.match(t, /Propuestas: 126,5 k€ \(#16\)/); assert.match(t, /Ayudas: pdte CRM/);
  assert.deepEqual(marcados(raiz).map(x => x.dataset.provisional), ['#2677']);
  assert.equal(buscar(raiz, x => x.classList && x.classList.contains('neg-linea')).length, 3);
  assert.doesNotMatch(t, /omc_ayudas|Otros \//);
});
test('Contratado #2678: tres líneas con (#n, p %), barra por tipología y ayudas sin dato en rojo #2678', () => {
  const d = (clave, etiqueta, valor, n, pct, provisional, enlace) => ({ clave, etiqueta, valor, unidad: 'eur', n, pct_conversion: pct, provisional, enlace });
  const raiz = pintarNegocio([{ clave: 'contratado', etiqueta: 'Contratado', principal: 70900, principal_unidad: 'eur', principal_texto: 'concedido', periodo_texto: 'concedido 2026', detalle: [
    d('licitaciones', 'Licitaciones', 3438.02, 1, 7, false, 'operacion/licitaciones'), d('propuestas', 'Propuestas comerciales', 64000, 8, 36, false, 'operacion/ventas/pipeline'), d('ayudas', 'Ayudas concedidas', null, null, null, true, ''),
    { clave: 'lineas', etiqueta: 'por línea', lineas: [{ etiqueta: 'Licita', pct: 5 }, { etiqueta: 'Sales', pct: 95 }, { etiqueta: 'Ayudas', pct: 0 }] }] }]);
  const t = raiz.textContent;
  assert.match(t, /70,9 k€/); assert.match(t, /Licitaciones: 3,4 k€ \(#1, 7 %\)/); assert.match(t, /Propuestas: 64,0 k€ \(#8, 36 %\)/); assert.match(t, /Ayudas: pdte CRM/);
  assert.deepEqual(marcados(raiz).map(x => x.dataset.provisional), ['#2678']);
  assert.equal(buscar(raiz, x => x.classList && x.classList.contains('neg-linea')).length, 3);
  assert.equal(buscar(raiz, x => x.classList && x.classList.contains('neg-tramo')).length, 2);
});
test('Contratado #2678: cuatro líneas (con Subvenciones) y tramo l-subvenciones en la barra', () => {
  const d = (clave, etiqueta, valor, n, pct, provisional) => ({ clave, etiqueta, valor, unidad: 'eur', n, pct_conversion: pct, provisional, enlace: '' });
  const raiz = pintarNegocio([{ clave: 'contratado', etiqueta: 'Contratado', principal: 100000, principal_unidad: 'eur', principal_texto: 'concedido', detalle: [
    d('licitaciones', 'Licitaciones', 3438.02, 1, 8, false), d('propuestas', 'Propuestas comerciales', 14500, 1, 50, false), d('ayudas', 'Ayudas', 64000, 8, 100, false), d('subvenciones', 'Subvenciones', 18000, 1, null, false),
    { clave: 'lineas', etiqueta: 'por línea', lineas: [{ etiqueta: 'Licita', pct: 3 }, { etiqueta: 'Sales', pct: 15 }, { etiqueta: 'Ayudas', pct: 64 }, { etiqueta: 'Subvenciones', pct: 18 }] }] }]);
  const t = raiz.textContent;
  assert.equal(buscar(raiz, x => x.classList && x.classList.contains('neg-linea')).length, 4);
  assert.match(t, /Ayudas: 64,0 k€ \(#8, 100 %\)/); assert.match(t, /Subvenciones: 18,0 k€ \(#1\)/);
  assert.ok(buscar(raiz, x => x.classList && x.classList.contains('l-subvenciones')).length === 1);
});
test('Orden #2679: Pipeline, Contratado, Facturado y cobrado (#2645), Captación', () => {
  const f = (clave, etiqueta, principal) => ({ clave, etiqueta, principal, principal_unidad: 'eur', detalle: [] });
  const raiz = pintarNegocio([f('captacion_7d', 'Captación', 5), f('ingresos', 'Ingresos', 15000), f('contratado', 'Contratado', 70900), f('pipeline', 'Pipeline', 559705)]);
  assert.deepEqual(buscar(raiz, x => x.classList && x.classList.contains('neg-etiqueta')).map(x => x.textContent), ['Pipeline', 'Contratado', 'Facturado y cobrado', 'Captación']);
  assert.ok(marcados(raiz).some(x => x.dataset.provisional === '#2645'));
});
