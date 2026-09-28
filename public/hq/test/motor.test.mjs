import test from 'node:test';
import assert from 'node:assert/strict';

// Licita Engine (D91), mismo shim que equipo.test.mjs. Origen del shim: organigrama con perfiles vivos (#1057 tarea 23, HQ 2.0.10; tarjetas ricas #1057 hallazgo de Diego con
// capturas). equipo.js importa `recargar` de main.js, que toca el DOM al importarse: mismo shim mínimo
// que tablero.test.mjs. replaceWith no está en el shim (jsdom real lo tiene, este no): el test del svg
// de avatar lo monkey-patchea en el nodo concreto que necesita.
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

const { render, usarCargadorCadena, restablecerCadena, textoTareas, tarjetaFase, usarCargadorPiezas, restablecerPiezas } = await import('../app/vistas/motor.js');
const buscarNodos = (n, f, out = []) => { if (n && n.nodeType === 1) { if (f(n)) out.push(n); n.children.forEach(c => buscarNodos(c, f, out)); } return out; };
const textos = n => buscarNodos(n, () => true).map(x => x._text).filter(Boolean);
const AHORA = new Date('2026-09-18T20:00:00Z');
const Sx = () => ({ datos: { agentes: [
  { id: 'chief', nombre: 'Marc', depto: 'Dirección', nivel: 1, encargos_abiertos: 0, frentes_codigos: [] },
  { id: 'sales-licita-redaccion-menor', nombre: 'Judit', nivel: 3, fase: 'extraccion', depto: 'Licita · Motor: fases' },
  { id: 'operaciones', nombre: 'Pol', nivel: 3, depto: 'Licita · Motor: mantenimiento' }], frentes: [], encargos: [], sesiones: [], expedientes: [], rol: 'owner' } });
usarCargadorPiezas(async () => [{ nombre: 'barrido', tipo: 'cron', maquina: 'vps1', estado: 'activa' }]);

// D91 (schema-v91): cadena del motor desde lic_cadena_estado, con cargador stub.
const CADENA = [
  { orden: 3, fase: 'criba', grupo: 'cadena', nombre: 'Criba', que_hace: 'criba 1 y 2', ejecutor: 'sql', piezas: ['lic_cribar_ficha'], piezas_estado: [{ nombre: 'lic_cribar_ficha', estado: 'activa' }], peor_estado: 'activa', con_tareas: false, donde: 'Supabase' },
  { orden: 1, fase: 'captacion', grupo: 'cadena', nombre: 'Captación', que_hace: 'scrapers', ejecutor: 'script', piezas: ['barrido'], piezas_estado: [{ nombre: 'barrido', estado: 'averiada' }], peor_estado: 'averiada', con_tareas: false, donde: 'VPS1' },
  { orden: 5, fase: 'extraccion', grupo: 'cadena', nombre: 'Extracción', que_hace: 'lee el pliego', ejecutor: 'agente', agente_id: 'sales-licita-redaccion-menor', agente_nombre: 'Judit', piezas: [], piezas_estado: [], peor_estado: null, con_tareas: true, donde: 'VPS de agentes',
    tareas: { en_curso: 3, pendiente: 1, esperando: 0, bloqueada: 0, hechas_24h: 303 } },
  { orden: 10, fase: 'orquestador', grupo: 'transversal', nombre: 'Orquestador', que_hace: 'crea tareas', ejecutor: 'script', piezas: ['lic-orquestador'], piezas_estado: [{ nombre: 'lic-orquestador', estado: 'pausada' }], peor_estado: 'pausada', con_tareas: false },
];
const tick = () => new Promise(r => setTimeout(r, 0));

test('textoTareas: línea viva con en curso, cola, esperando y hechas 24 h', () => {
  assert.equal(textoTareas({ en_curso: 2, pendiente: 255, esperando: 0, hechas_24h: 307 }), 'Ahora: 2 en curso · 255 en cola · 0 esperando · 307 hechas 24 h');
  assert.equal(textoTareas({ en_curso: 0, pendiente: 0, esperando: 75, bloqueada: 1, hechas_24h: 5 }), 'Ahora: 0 en curso · 0 en cola · 75 esperando · 1 bloqueada · 5 hechas 24 h');
  assert.equal(textoTareas(null), null);
});

test('render: cadena numerada en orden desde Supabase, ejecutor, semáforo de piezas y sin agentes de fase duplicados', async () => {
  restablecerCadena();
  usarCargadorCadena(async () => CADENA);
  restablecerPiezas();
  const raiz = crearNodo('main');
  render(raiz, Sx(), null, {}, AHORA);
  await tick();
  const motor = raiz.children.find(s => s.className === 'seccion motor');
  const fases = buscarNodos(motor, n => n.className === 'card-fase');
  assert.deepEqual(fases.map(f => f.attrs['data-fase']), ['captacion', 'criba', 'extraccion', 'orquestador']);
  assert.deepEqual(buscarNodos(motor, n => n.className === 'fase-num').map(n => n._text), ['1', '3', '5']);
  assert.equal(buscarNodos(motor, n => n.className === 'cadena transversal').length, 1);
  // Judit sale como ejecutora enlazada a su ficha y no como tarjeta de agente duplicada.
  assert.equal(buscarNodos(motor, n => n.tag === 'a' && n.attrs.href === '#equipo/agente/sales-licita-redaccion-menor').length, 1);
  assert.equal(buscarNodos(raiz, n => n.className === 'card-agente' && n.textContent.includes('Judit')).length, 0);
  assert.ok(buscarNodos(motor, n => n.className === 'card-agente' && n.textContent.includes('Pol')).length === 1);
  assert.ok(textos(fases[1]).includes('SQL') && textos(fases[0]).includes('script'));
  assert.equal(buscarNodos(fases[0], n => n.className === 'pill rojo').length, 1);
  assert.equal(buscarNodos(fases[3], n => n.className === 'pill gris').length, 1);
  assert.ok(textos(fases[2]).includes('Ahora: 3 en curso · 1 en cola · 0 esperando · 303 hechas 24 h'));
  assert.equal(buscarNodos(fases[0], n => n.className === 'ahora').length, 0);
  // Solo el motor: Marc (resto del equipo) no sale; el registro de piezas va debajo.
  assert.equal(buscarNodos(raiz, n => n.className === 'card-agente' && n.textContent.includes('Marc')).length, 0);
  const piezas = raiz.children.findIndex(s => s.className === 'seccion piezas');
  assert.ok(piezas > raiz.children.indexOf(motor));
  assert.ok(buscarNodos(raiz.children[piezas], n => n._text === 'barrido').length === 1);
});

test('render: si la cadena falla sin caché, aviso rojo y respaldo con las tarjetas de fase', async () => {
  restablecerCadena();
  usarCargadorCadena(async () => { throw new Error('token no válido'); });
  const raiz = crearNodo('main');
  const S = Sx();
  render(raiz, { datos: { ...S.datos, agentes: [{ id: 'q', nombre: 'Queralt', nivel: 3, fase: 'redaccion', depto: 'Licita · Motor: fases' }] } }, null, {}, AHORA);
  await tick();
  const motor = raiz.children.find(s => s.className === 'seccion motor');
  assert.match(buscarNodos(motor, n => n.className === 'aviso rojo')[0]._text, /token no válido/);
  assert.equal(buscarNodos(motor, n => n.className === 'card-agente').length, 1);
  restablecerCadena();
});

test('tarjetaFase: transversal sin número y sin línea viva; fase sin piezas registradas lo dice', () => {
  const t = tarjetaFase({ orden: 11, fase: 'vigia-plazos', grupo: 'transversal', nombre: 'Vigía de plazos', ejecutor: 'script', piezas: ['lic-vigia-plazos'], piezas_estado: [], peor_estado: null }, AHORA);
  assert.equal(buscarNodos(t, n => n.className === 'fase-num').length, 0);
  assert.equal(buscarNodos(t, n => n.className === 'ahora').length, 0);
  assert.ok(textos(t).includes('piezas sin registrar'));
});
