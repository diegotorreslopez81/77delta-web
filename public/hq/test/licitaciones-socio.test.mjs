import test from 'node:test';
import assert from 'node:assert/strict';

// #2704 punto 2: modo socio de la vista Licita (/hq/i4sme/): solo lectura, sin datos internos.
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
    closest(sel) { let n2 = this; while (n2) { if (sel.split(',').map(s => s.trim()).includes(n2.tag)) return n2; n2 = n2.parent; } return null; },
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; this.children = []; },
    scrollIntoView() {},
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

const { render, usarSocio } = await import('../app/vistas/licitaciones.js');

const buscarNodos = (n, pred, out = []) => { if (n.nodeType === 1) { if (pred(n)) out.push(n); n.children.forEach(c => buscarNodos(c, pred, out)); } return out; };
const clase = (n, c) => n.className && n.className.split(' ').includes(c);
const tarjetas = raiz => buscarNodos(raiz, n => clase(n, 'card-lic'));
const expedientes = raiz => tarjetas(raiz).map(t => t.attrs['data-expediente']);
// La barra de arriba pinta <a class="chip">; la hoja de filtros pinta <button class="chip"> por cada
// opcion de cada seccion (incluida Estado, que se oculta de la hoja con visible:()=>false para no
// duplicar los mismos 12 estados dos veces en pantalla). Distinguir por tag evita contar ambos a la vez.
const chips = raiz => buscarNodos(raiz, n => n.tag === 'a' && clase(n, 'chip'));
const raizVacia = () => crearNodo('div');
const abrirHoja = raiz => buscarNodos(raiz, n => clase(n, 'fab-filtros'))[0].listeners.click[0]();

const AHORA = new Date('2026-09-17T10:00:00Z');
const FILA = { id: 7, expediente: 'EXP-7', organo: 'Ayuntamiento X', objeto: 'Servicio Y', estado: 'Aprobada', importe: 1000, cierre: '2026-10-30T10:00:00Z', enlace: 'https://ejemplo.org/p' };
const RESUMEN = { aprobadas: { n: 1, eur: 0 }, presentadas: { n: 2, eur: 500 }, adjudicadas: { n: 3, eur: 0 } };
const textoDe = n => (n.nodeType === 3 ? n.data : n.textContent);

test('socio: lista por RPC de socio, estado por defecto todas (sin filtro de estado ni de cierre), chips marcha, presentadas y cerradas, sin botones ni datos internos', async () => {
  const pedidos = [];
  usarSocio({ tabla: async f => { pedidos.push(f); return { total: 1, resumen: RESUMEN, filas: [FILA] }; }, historia: async () => ({ tareas: [], presentaciones: [], cambios: [] }) });
  const raiz = raizVacia();
  await render(raiz, { datos: { rol: 'socio' } }, undefined, {}, AHORA);
  assert.equal(pedidos[0].estados, undefined);
  assert.equal(pedidos[0].cierre_desde, undefined);
  assert.deepEqual(expedientes(raiz), ['EXP-7']);
  const nombres = chips(raiz).filter(c => !clase(c, 'agregado')).map(c => c.textContent);
  assert.ok(nombres.includes('Aprobada 1') && nombres.includes('Presentada 2'));
  assert.ok(!nombres.some(t => /^(Nueva|Criba|Por decidir)/.test(t)));
  assert.ok(chips(raiz).some(c => clase(c, 'agregado') && /^Todas 6/.test(c.textContent)));
  assert.equal(buscarNodos(raiz, n => n.tag === 'button' && /Descartar|Aprobar|Copiar/.test(textoDe(n))).length, 0);
});
