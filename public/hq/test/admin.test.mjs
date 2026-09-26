import test from 'node:test';
import assert from 'node:assert/strict';

// admin.js (O13a, D69 tanda E bis): panel genérico. Shim propio (no el de tablero.test.mjs/salud.test.mjs):
// admin.js lee de vuelta .value/.checked de inputs/textarea creados dinámicamente (leerCambios,
// leerValor), algo que ningún otro shim existente soporta todavía. admin.js no importa main.js (no hay
// cablearShell ni recargar de por medio), así que no hace falta matchMedia ni localStorage.
function crearNodo(tag) {
  const n = {
    tag, nodeType: 1, children: [], attrs: {}, className: '', _text: '', _html: '', listeners: {}, parent: null, dataset: {},
    _value: '', _valorFijado: false, _checked: false,
    classList: { toggle(c, on) { const s = new Set(this._n.className.split(' ').filter(Boolean)); on ? s.add(c) : s.delete(c); this._n.className = [...s].join(' '); return on; }, contains(c) { return this._n.className.split(' ').includes(c); }, add(c) { this.toggle(c, true); }, remove(c) { this.toggle(c, false); } },
    setAttribute(k, v) { this.attrs[k] = v; if (k.startsWith('data-')) this.dataset[k.slice(5)] = v; if (k === 'value') { this._value = v; this._valorFijado = true; } if (k === 'checked') this._checked = true; },
    getAttribute(k) { return this.attrs[k] ?? null; },
    addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
    append(...kids) { for (const k of kids) { if (k == null) continue; k.parent = this; this.children.push(k); } },
    remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; } },
    prepend(...kids) { for (const k of kids.reverse()) { if (k == null) continue; k.parent = this; this.children.unshift(k); } },
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
    click() { for (const fn of this.listeners.click || []) fn({ preventDefault() {}, stopPropagation() {} }); },
    focus() {}, blur() {},
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; this.children = []; },
    // <textarea> real: value arranca igual al texto inicial hasta que algo la fije a mano (setAttribute
    // o asignacion directa) - campoValor() (admin.js) pasa el JSON como hijo de texto, nunca como .value.
    get value() { return this._valorFijado ? this._value : (this.tag === 'textarea' ? this.textContent : this._value); },
    set value(v) { this._value = v; this._valorFijado = true; },
    get checked() { return this._checked; },
    set checked(v) { this._checked = !!v; },
  };
  n.classList._n = n;
  return n;
}
const nodosPorId = new Map();
globalThis.document = {
  createElement: (tag) => crearNodo(tag),
  createTextNode: (data) => ({ nodeType: 3, data }),
  // modal() en ui.js pide siempre #capa: mismo nodo cada vez, o el test y el modal ven capas distintas.
  getElementById: (id) => { if (!nodosPorId.has(id)) nodosPorId.set(id, crearNodo('div')); return nodosPorId.get(id); },
  body: crearNodo('body'),
  addEventListener: () => {},
  removeEventListener: () => {},
};

const admin = await import('../app/vistas/admin.js');
const { render, usarCargadores, restablecer, campoValor, leerValor, leerCambios, iguales } = admin;

function crearRaiz() { return crearNodo('div'); }
// admin.js busca #capa vía ui.js modal(): getElementById siempre devuelve un div nuevo, así que cada
// modal() se monta sobre su propia capa (igual que en producción, un solo modal a la vez).
function buscarPorClase(nodo, clase) {
  const out = [];
  (function rec(n) { if (!n || !n.children) return; for (const k of n.children) { if (k.className && k.className.split(' ').includes(clase)) out.push(k); rec(k); } })(nodo);
  return out;
}
function buscarPorAtributo(nodo, attr, valor) {
  const out = [];
  (function rec(n) { if (!n || !n.children) return; for (const k of n.children) { if (k.attrs && k.attrs[attr] === valor) out.push(k); rec(k); } })(nodo);
  return out;
}
function botonPorTexto(nodo, texto) {
  const out = [];
  (function rec(n) { if (!n || !n.children) return; for (const k of n.children) { if (k.tag === 'button' && k._text === texto) out.push(k); rec(k); } })(nodo);
  return out[0];
}

test.beforeEach(() => { restablecer(); usarCargadores({}); });

test('leerValor/campoValor: boolean, jsonb, ARRAY y texto', () => {
  const bool = campoValor({ tipo: 'boolean', columna: 'activo' }, true);
  assert.equal(bool.tag, 'input'); assert.equal(bool.attrs.type, 'checkbox'); assert.equal(bool.checked, true);
  assert.equal(leerValor({ checked: false }, 'boolean'), false);

  const arr = campoValor({ tipo: 'ARRAY', columna: 'tags' }, ['a', 'b']);
  assert.equal(arr.value, 'a, b');
  assert.deepEqual(leerValor({ value: ' a , b ,, c' }, 'ARRAY'), ['a', 'b', 'c']);

  const js = campoValor({ tipo: 'jsonb', columna: 'cfg' }, { x: 1 });
  assert.equal(js.value, JSON.stringify({ x: 1 }, null, 2));
  assert.deepEqual(leerValor({ value: '{"x":2}' }, 'jsonb'), { x: 2 });
  assert.equal(leerValor({ value: '   ' }, 'jsonb'), null);

  const txt = campoValor({ tipo: 'text', columna: 'nombre' }, null);
  assert.equal(txt.value, '');
  assert.equal(leerValor({ value: '  hola  ' }, 'text'), 'hola');
  assert.equal(leerValor({ value: '   ' }, 'text'), null);
});

test('iguales trata null y undefined como equivalentes', () => {
  assert.ok(iguales(null, undefined));
  assert.ok(iguales('a', 'a'));
  assert.ok(!iguales('a', 'b'));
  assert.ok(iguales(['a', 'b'], ['a', 'b']));
});

test('leerCambios solo devuelve columnas que cambiaron', () => {
  const fila = { id: 1, nombre: 'x', activo: true };
  const editables = [{ columna: 'nombre', tipo: 'text' }, { columna: 'activo', tipo: 'boolean' }];
  const nodos = new Map([['nombre', { value: 'x' }], ['activo', { checked: true }]]);
  assert.deepEqual(leerCambios(fila, nodos, editables), {});
  nodos.set('nombre', { value: 'y' });
  assert.deepEqual(leerCambios(fila, nodos, editables), { nombre: 'y' });
});

test('render sin rol owner no pinta el panel', async () => {
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'agente' } }, undefined);
  assert.ok(buscarPorClase(raiz, 'aviso').length);
  assert.equal(buscarPorClase(raiz, 'admin-lista').length, 0);
});

test('render sin arg lista las tablas y enlaza a #operacion/admin/<tabla>', async () => {
  usarCargadores({ tablas: async () => ({ tablas: [{ tabla: 'lic_organos', clave: 'id' }, { tabla: 'lic_motivos', clave: 'nombre' }] }) });
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'owner' } }, undefined);
  const enlaces = buscarPorClase(raiz, 'btn-enlace').filter(a => a.tag === 'a');
  assert.deepEqual(enlaces.map(a => a.attrs.href).sort(), ['#operacion/admin/lic_motivos', '#operacion/admin/lic_organos']);
});

test('render con arg pinta columnas y filas de esa tabla', async () => {
  usarCargadores({
    columnas: async () => [
      { columna: 'id', tipo: 'bigint', nulo: false, clave: true, control: false },
      { columna: 'nombre', tipo: 'text', nulo: false, clave: false, control: false },
      { columna: 'version', tipo: 'integer', nulo: false, clave: false, control: true },
    ],
    filas: async () => [{ id: 1, nombre: 'Uno', version: 3 }],
  });
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'owner' } }, 'lic_organos');
  assert.ok(raiz.children.some(n => n.tag === 'h1' && n._text === 'lic_organos'));
  const filas = buscarPorClase(raiz, 'admin-fila');
  assert.equal(filas.length, 1);
  const nombreInput = buscarPorAtributo(filas[0], 'data-col', 'nombre')[0];
  assert.equal(nombreInput.value, 'Uno');
  assert.equal(buscarPorAtributo(filas[0], 'data-col', 'id').length, 0, 'la clave no se pinta como editable');
  assert.equal(buscarPorAtributo(filas[0], 'data-col', 'version').length, 0, 'las columnas de control no se editan');
});

test('Guardar sin cambios no llama a la RPC (toast "sin cambios")', async () => {
  let llamado = false;
  usarCargadores({
    columnas: async () => [{ columna: 'id', tipo: 'bigint', nulo: false, clave: true, control: false }, { columna: 'nombre', tipo: 'text', nulo: false, clave: false, control: false }],
    filas: async () => [{ id: 1, nombre: 'Uno' }],
    guardar: async () => { llamado = true; return {}; },
  });
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'owner' } }, 'lic_organos');
  const fila = buscarPorClase(raiz, 'admin-fila')[0];
  const guardar = botonPorTexto(fila, 'Guardar');
  await guardar.listeners.click[0]();
  assert.equal(llamado, false);
});

test('Guardar con un cambio llama a lic_admin_guardar con solo esa columna', async () => {
  let recibido = null;
  usarCargadores({
    columnas: async () => [{ columna: 'id', tipo: 'bigint', nulo: false, clave: true, control: false }, { columna: 'nombre', tipo: 'text', nulo: false, clave: false, control: false }],
    filas: async () => [{ id: 1, nombre: 'Uno' }],
    guardar: async (tabla, clave, cambios, motivo) => { recibido = { tabla, clave, cambios, motivo }; return { id: 1, nombre: cambios.nombre }; },
  });
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'owner' } }, 'lic_organos');
  const filaNodo = buscarPorClase(raiz, 'admin-fila')[0];
  const nombreInput = buscarPorAtributo(filaNodo, 'data-col', 'nombre')[0];
  nombreInput.value = 'Dos';
  const guardar = botonPorTexto(filaNodo, 'Guardar');
  await guardar.listeners.click[0]();
  assert.deepEqual(recibido, { tabla: 'lic_organos', clave: 1, cambios: { nombre: 'Dos' }, motivo: null });
});

test('+ Nueva fila abre modal y Crear llama a lic_admin_alta sin la clave si se deja vacía', async () => {
  let recibido = null;
  usarCargadores({
    columnas: async () => [{ columna: 'id', tipo: 'bigint', nulo: false, clave: true, control: false }, { columna: 'nombre', tipo: 'text', nulo: false, clave: false, control: false }],
    filas: async () => [],
    alta: async (tabla, fila, motivo) => { recibido = { tabla, fila, motivo }; return { id: 9, ...fila }; },
  });
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'owner' } }, 'lic_organos');
  const nuevaFila = botonPorTexto(raiz, '+ Nueva fila');
  nuevaFila.listeners.click[0]();
  const capa = document.getElementById('capa');
  const nombreInput = buscarPorAtributo(capa, 'data-col', 'nombre')[0];
  nombreInput.value = 'Tres';
  const crear = botonPorTexto(capa, 'Crear');
  await crear.listeners.click[0]();
  assert.deepEqual(recibido, { tabla: 'lic_organos', fila: { nombre: 'Tres' }, motivo: null });
});

test('+ Nueva fila exige las columnas obligatorias', async () => {
  let llamado = false;
  usarCargadores({
    columnas: async () => [{ columna: 'id', tipo: 'bigint', nulo: false, clave: true, control: false }, { columna: 'nombre', tipo: 'text', nulo: false, clave: false, control: false }],
    filas: async () => [],
    alta: async () => { llamado = true; return {}; },
  });
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'owner' } }, 'lic_organos');
  botonPorTexto(raiz, '+ Nueva fila').listeners.click[0]();
  const capa = document.getElementById('capa');
  const crear = botonPorTexto(capa, 'Crear');
  await crear.listeners.click[0]();
  assert.equal(llamado, false);
});

test('Historial pinta antes/después y version', async () => {
  usarCargadores({
    columnas: async () => [{ columna: 'id', tipo: 'bigint', nulo: false, clave: true, control: false }, { columna: 'nombre', tipo: 'text', nulo: false, clave: false, control: false }],
    filas: async () => [{ id: 1, nombre: 'Uno' }],
    historial: async () => [{ version: 2, antes: { nombre: 'Cero' }, despues: { nombre: 'Uno' }, cambiado_por: 'diego', motivo_cambio: 'ajuste', fecha: '2026-09-01T00:00:00Z' }],
  });
  const raiz = crearRaiz();
  await render(raiz, { datos: { rol: 'owner' } }, 'lic_organos');
  const filaNodo = buscarPorClase(raiz, 'admin-fila')[0];
  botonPorTexto(filaNodo, 'Historial').listeners.click[0]();
  const capa = document.getElementById('capa');
  await new Promise(r => setTimeout(r, 0));
  const entradas = buscarPorClase(capa, 'admin-historial-fila');
  assert.equal(entradas.length, 1);
  assert.match(entradas[0].children[0].textContent, /v2/);
  assert.match(entradas[0].children[1].textContent, /Cero/);
});
