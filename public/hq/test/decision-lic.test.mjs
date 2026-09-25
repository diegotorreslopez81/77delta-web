import test from 'node:test';
import assert from 'node:assert/strict';

// Tanda 4: decision-lic.js ya no ofrece los tres verbos fijos (Descartar/Estudiar/Presentar de
// omc_licitacion_decidir); ahora ofrece un boton por cada destino valido de la tabla 5.3, filtrado por
// rol (licitaciones.js:transicionesValidas). Mismo shim pesado que antes: rpc de api.js toca
// location/localStorage/history al importarse, asi que hace falta fijar los globals antes del import
// dinamico.
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

const { botonesTransicion, botonClaveSobre, checklistA5 } = await import('../app/decision-lic.js');
const buscarNodos = (n, pred, out = []) => { if (n.nodeType === 1) { if (pred(n)) out.push(n); n.children.forEach(c => buscarNodos(c, pred, out)); } return out; };

// Construir los botones no toca la red: el handler onclick solo se dispara al pulsar, y aqui no se
// pulsa ninguno. Si botonesTransicion() llamase a rpc() al construirse, esto lanzaria (no hay fetch en
// node test).
test('botonesTransicion: un boton por destino de la tabla 5.3, Descartar en rojo, el primero primario', () => {
  const l = { expediente: 'EXP-1', estado: 'Por decidir' };
  let recargado = false;
  const botones = botonesTransicion(l, async () => { recargado = true; }, 'owner');
  assert.deepEqual(botones.map(b => b.textContent), ['Aprobada', 'Descartada'], 'Cerrada sin presentar solo con el cierre pasado');
  assert.deepEqual(botones.map(b => b.className), ['btn primario', 'btn peligro']);
  const cerrada = botonesTransicion({ ...l, cierre: '2020-01-01' }, async () => {}, 'owner');
  assert.deepEqual(cerrada.map(b => b.textContent), ['Aprobada', 'Descartada', 'Cerrada sin presentar']);
  assert.equal(recargado, false, 'construir los botones no ejecuta la transicion ni recarga');
  assert.ok(botones.every(b => typeof b.listeners.click[0] === 'function'));
});

test('botonesTransicion: rol agente no ofrece Por decidir -> Aprobada ni -> Descartada, ni recuperar una Descartada', () => {
  const pd = botonesTransicion({ estado: 'Por decidir', cierre: '2020-01-01' }, async () => {}, 'agente');
  assert.deepEqual(pd.map(b => b.textContent), ['Cerrada sin presentar'], "Descartada exige owner desde cualquier estado que no sea Nueva");
  const desc = botonesTransicion({ estado: 'Descartada' }, async () => {}, 'agente');
  assert.deepEqual(desc.map(b => b.textContent), []);
  const desOwner = botonesTransicion({ estado: 'Descartada' }, async () => {}, 'owner');
  assert.deepEqual(desOwner.map(b => b.textContent), ['Por decidir', 'Criba de pliego']);
});

test('botonesTransicion: un estado final sin salidas (Adjudicada) no ofrece ningun boton', () => {
  assert.deepEqual(botonesTransicion({ estado: 'Adjudicada' }, async () => {}, 'owner'), []);
});

test('botonClaveSobre: solo para el rol owner, null para agente', () => {
  assert.equal(botonClaveSobre({ id: 1, estado: 'En redacción' }, 'agente'), null);
  assert.equal(botonClaveSobre({ id: 1, estado: 'Por decidir' }, 'owner'), null, 'antes de redactar no hay sobre');
  const b = botonClaveSobre({ id: 1, estado: 'En redacción' }, 'owner');
  assert.equal(b.tag, 'button');
  assert.equal(b.textContent, 'Clave de sobre');
  assert.equal(typeof b.listeners.click[0], 'function');
});

test('checklistA5: sin ficha.documentos no pinta nada; con documentos marca ok/pendiente', () => {
  assert.equal(checklistA5({}), null);
  assert.equal(checklistA5({ ficha: {} }), null);
  const ul = checklistA5({ ficha: { documentos: ['DEUC', { nombre: 'Solvencia', ok: true }, { doc: 'Oferta', estado: 'pendiente' }] } });
  const items = buscarNodos(ul, n => n.tag === 'li');
  assert.deepEqual(items.map(i => i.className), ['pendiente', 'ok', 'pendiente']);
  assert.deepEqual(items.map(i => i.textContent), ['[ ] DEUC', '[x] Solvencia', '[ ] Oferta']);
});
