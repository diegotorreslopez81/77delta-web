import test from 'node:test';
import assert from 'node:assert/strict';
// #1281 semáforo de seis filas y regla de las cifras (sin fila en omc_datos no se pinta). Mock DOM mínimo, como salud.test.mjs.
function crearNodo(tag) {
  const n = { tag, nodeType: 1, children: [], attrs: {}, className: '', _text: '', listeners: {}, parent: null,
    setAttribute(k, v) { this.attrs[k] = v; }, getAttribute(k) { return this.attrs[k] ?? null; },
    addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
    append(...kids) { for (const k of kids) { if (k == null) continue; k.parent = this; this.children.push(k); } },
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    set innerHTML(v) { this.children = []; this._text = ''; }, get innerHTML() { return ''; } };
  return n;
}
globalThis.document = { createElement: t => crearNodo(t), createTextNode: d => ({ nodeType: 3, data: d }) };
const { tieneFila, estadoFila, textoDuenos, fila, bloque } = await import('../app/semaforo.js');
const clase = (n, c) => (n.className || '').split(' ').includes(c);
const AG = [{ id: 'operaciones', nombre: 'Pol-Operaciones' }, { id: 'licitaciones', nombre: 'Guillem-Licitaciones' }];
const SEM = { filas: [
  { objeto: 'correo', nombre: 'Correo', total: 0, rojos: 0, sin_medir: true, enlace: null, nota: 'sin regla calculable', por_dueno: [] },
  { objeto: 'licitacion', nombre: 'Licitación', total: 64, rojos: 9, sin_medir: false, enlace: '#operacion/licitaciones', por_dueno: [{ dueno: 'licitaciones', rojos: 9 }] },
  { objeto: 'encargo', nombre: 'Encargo', total: 220, rojos: 114, sin_medir: false, enlace: '#operacion/tablero', por_dueno: [{ dueno: 'operaciones', rojos: 3 }, { dueno: 'licitaciones', rojos: 5 }, { dueno: 'x', rojos: 0 }] },
  { objeto: 'tarjeta', nombre: 'Tarjeta', total: 54, rojos: 26, sin_medir: false, enlace: '#hoy/bandeja', por_dueno: [] },
  { objeto: 'contacto', nombre: 'Contacto', total: 0, rojos: 0, sin_medir: true, enlace: null, por_dueno: [] },
  { objeto: 'dato', nombre: 'Dato, fuente y cron', total: 90, rojos: 0, sin_medir: false, enlace: '#operacion/salud', por_dueno: [] }] };

test('tieneFila: clave presente se pinta, ausente no; sin lista cargada se pinta todo', () => {
  assert.equal(tieneFila(['home.a', 'home.b'], 'home.a'), true);
  assert.equal(tieneFila(['home.a'], 'home.inexistente'), false);
  assert.equal(tieneFila([], 'home.a'), false);
  assert.equal(tieneFila(null, 'home.a'), true);
  assert.equal(tieneFila(undefined, 'home.a'), true);
});
test('estadoFila: sin medir gris (nunca verde ni 0 rojos), rojos rojo, cero verde', () => {
  assert.deepEqual(estadoFila({ sin_medir: true, rojos: 0 }), { color: 'gris', texto: 'sin medir' });
  assert.deepEqual(estadoFila({ sin_medir: false, rojos: 114 }), { color: 'rojo', texto: '114 rojos' });
  assert.deepEqual(estadoFila({ sin_medir: false, rojos: 1 }), { color: 'rojo', texto: '1 rojo' });
  assert.deepEqual(estadoFila({ sin_medir: false, rojos: 0 }), { color: 'verde', texto: '0 rojos' });
  assert.equal(estadoFila(undefined).color, 'gris');
});
test('textoDuenos: nombre visible, más rojos primero, los de 0 fuera', () => {
  assert.equal(textoDuenos(SEM.filas[2], AG), 'Guillem-Licitaciones 5 · Pol-Operaciones 3');
  assert.equal(textoDuenos(SEM.filas[3], AG), '');
});
test('bloque: seis filas en el orden de la RPC, enlace en <a>, sin enlace en <div>, texto siempre presente', () => {
  const b = bloque(SEM, AG);
  assert.equal(b.children.length, 6);
  assert.deepEqual(b.children.map(f => f.children[0].textContent), ['Correo', 'Licitación', 'Encargo', 'Tarjeta', 'Contacto', 'Dato, fuente y cron']);
  assert.deepEqual(b.children.map(f => f.tag), ['div', 'a', 'a', 'a', 'div', 'a']);
  assert.equal(b.children[2].attrs.href, '#operacion/tablero');
  assert.deepEqual(b.children.map(f => ['gris', 'rojo', 'verde'].find(c => clase(f, c))), ['gris', 'rojo', 'rojo', 'rojo', 'gris', 'verde']);
  assert.equal(b.children[2].children[1].textContent, '114 rojos');
  assert.match(b.children[2].textContent, /Guillem-Licitaciones 5/);
  assert.match(b.children[0].textContent, /sin medir/);
});
test('bloque: sin datos (RPC caída o sin cargar) no pinta nada', () => {
  for (const s of [undefined, null, {}, { filas: [] }, { filas: 'x' }]) assert.equal(bloque(s, AG), null);
});
test('fila: un dato pausado llega como rojo con su dueño, no gris', () => {
  const f = fila({ objeto: 'dato', nombre: 'Dato', total: 1, rojos: 1, sin_medir: false, enlace: '#operacion/salud', por_dueno: [{ dueno: 'operaciones', rojos: 1 }] }, AG);
  assert.ok(clase(f, 'rojo')); assert.ok(!clase(f, 'gris'));
  assert.match(f.textContent, /Pol-Operaciones 1/);
});
