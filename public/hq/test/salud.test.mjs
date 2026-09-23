import test from 'node:test';
import assert from 'node:assert/strict';
// #1121 Salud: contadores, orden, agrupado, "hace X", vigía parado y los estados de pantalla (datos, vacío, RPC caída).
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
const V = await import('../app/vistas/salud.js');
const buscar = (n, pred, out = []) => { if (n.nodeType === 1) { if (pred(n)) out.push(n); n.children.forEach(c => buscar(c, pred, out)); } return out; };
const clase = (n, c) => (n.className || '').split(' ').includes(c);
const AHORA = new Date('2026-09-20T12:00:00Z');
const g = (clave, estado, extra = {}) => ({ clave, nombre: 'N-' + clave, grupo: 'cron', resp: 'Pol-Operaciones', estado, detalle: 'd-' + clave, ultima: '2026-09-20T11:55:00Z', critico: false, ...extra });
const DATOS = { actualizado: '2026-09-20T11:58:00Z', engranajes: [
  g('a', 'OK'), g('b', 'ERROR', { grupo: 'cron', critico: true }), g('c', 'RETRASO'), g('d', 'SIN VIGILANCIA', { grupo: 'credencial', ultima: null }),
  g('e', 'CADUCA', { grupo: 'credencial', critico: true }), g('f', 'ESPERANDO 1ª CORRIDA'), g('h', 'OK', { grupo: 'backup' }), g('i', 'OK', { grupo: 'sonda' })] };
const tick = () => new Promise(r => setTimeout(r, 0));
const pintar = async (cargador, ahora = AHORA) => { V.restablecer(); V.usarCargador(cargador); const raiz = crearNodo('main'); await V.render(raiz, {}, undefined, {}, ahora); await tick(); return raiz; };

test('colorEstado: primer token; gris no es verde; lo desconocido es rojo', () => {
  assert.equal(V.colorEstado('OK'), 'verde'); assert.equal(V.colorEstado('OK (hace 3 min)'), 'verde');
  for (const e of ['ESPERANDO 1ª CORRIDA', 'SIN VIGILANCIA', 'BAJO DEMANDA']) assert.equal(V.colorEstado(e), 'gris', e);
  for (const e of ['ERROR', 'RETRASO', 'SIN LATIDO', 'SIN CRON', 'SONDA CAIDA', 'CADUCA', 'BACKUP VIEJO', 'LO_QUE_SEA', '', null]) assert.equal(V.colorEstado(e), 'rojo', String(e));
});
test('contadores y texto: N verdes, R rojos, G grises de M', () => {
  const c = V.contadores(DATOS.engranajes);
  assert.deepEqual(c, { verdes: 3, rojos: 3, grises: 2, demanda: 0, total: 8 });
  assert.equal(V.textoContadores(c), '3 verdes, 3 rojos, 2 grises de 8');
  assert.deepEqual(V.contadores(undefined), { verdes: 0, rojos: 0, grises: 0, demanda: 0, total: 0 });
});
test('bajo demanda: gris, contador propio solo si hay, nunca verde ni rojo', () => {
  const c = V.contadores([g('a', 'OK'), g('b', 'BAJO DEMANDA'), g('c', 'BAJO DEMANDA · sin cron a propósito'), g('d', 'SIN VIGILANCIA')]);
  assert.deepEqual(c, { verdes: 1, rojos: 0, grises: 1, demanda: 2, total: 4 });
  assert.equal(V.textoContadores(c), '1 verde, 0 rojos, 1 gris, 2 bajo demanda de 4');
});
test('singular en 1: 1 verde, 1 rojo, 1 gris', () => {
  assert.equal(V.textoContadores({ verdes: 1, rojos: 1, grises: 1, demanda: 0, total: 3 }), '1 verde, 1 rojo, 1 gris de 3');
});
test('ordenar: rojos primero, críticos arriba dentro de los rojos, luego grises y verdes', () => {
  assert.deepEqual(V.ordenar(DATOS.engranajes).map(x => x.clave), ['b', 'e', 'c', 'd', 'f', 'a', 'h', 'i']);
});
test('agrupar: grupos con rojo crítico primero, luego con rojo, luego el resto en orden fijo', () => {
  const gs = V.agrupar(DATOS.engranajes);
  assert.deepEqual(gs.map(x => x.id), ['cron', 'credencial', 'sonda', 'backup']);
  assert.deepEqual(gs.map(x => x.rojos), [2, 1, 0, 0]);
  assert.equal(V.agrupar([g('z', 'OK', { grupo: 'rarito' })])[0].nombre, 'rarito');
});
test('hace: relativo en min, h y d; sin fecha, null', () => {
  assert.equal(V.hace('2026-09-20T11:59:30Z', AHORA), 'hace menos de 2 min');
  assert.equal(V.hace('2026-09-20T11:15:00Z', AHORA), 'hace 45 min');
  assert.equal(V.hace('2026-09-20T07:00:00Z', AHORA), 'hace 5 h');
  assert.equal(V.hace('2026-09-15T12:00:00Z', AHORA), 'hace 5 d');
  assert.equal(V.hace(null, AHORA), null); assert.equal(V.hace('basura', AHORA), null);
});
test('vigiaParado: más de 3 h o sin fecha', () => {
  assert.equal(V.vigiaParado({ actualizado: '2026-09-20T09:01:00Z' }, AHORA), false);
  assert.equal(V.vigiaParado({ actualizado: '2026-09-20T08:59:00Z' }, AHORA), true);
  assert.equal(V.vigiaParado({}, AHORA), true);
});

test('pantalla con datos: título, contadores, grupos con rojo abiertos y los verdes colapsados, sin banner', async () => {
  const raiz = await pintar(async () => DATOS);
  assert.match(raiz.textContent, /Salud/);
  assert.match(raiz.textContent, /3 verdes, 3 rojos, 2 grises de 8/);
  assert.equal(buscar(raiz, n => n.attrs.role === 'alert').length, 0, 'sin banner con datos frescos');
  const det = buscar(raiz, n => n.tag === 'details');
  const abierto = id => det.find(d => d.attrs.id === 'salud-grupo-' + id).attrs.open !== undefined;
  assert.ok(abierto('cron') && abierto('credencial')); assert.ok(!abierto('backup') && !abierto('sonda'));
  const filas = buscar(raiz, n => clase(n, 'salud-fila'));
  assert.equal(filas.length, 8);
  assert.match(filas[0].textContent, /ERROR.*N-b.*crítico.*d-b.*resp\. Pol-Operaciones · última señal hace 5 min/s, 'estado en texto, nombre, resp, detalle y señal relativa');
  assert.match(buscar(raiz, n => clase(n, 'salud-fila') && /N-d/.test(n.textContent))[0].textContent, /sin señal todavía/);
});
test('vigía parado: banner rojo con la edad de la última subida', async () => {
  const raiz = await pintar(async () => ({ ...DATOS, actualizado: '2026-09-20T07:00:00Z' }));
  const b = buscar(raiz, n => n.attrs.role === 'alert');
  assert.equal(b.length, 1); assert.ok(clase(b[0], 'rojo')); assert.match(b[0].textContent, /Vigía parado: última subida hace 5 h/);
});
test('sin engranajes: mensaje claro, no pantalla vacía', async () => {
  const raiz = await pintar(async () => ({ verdes: 0, rojos: 0, grises: 0, total: 0, actualizado: null, engranajes: [] }));
  assert.match(raiz.textContent, /Todavía no hay engranajes/);
  assert.equal(buscar(raiz, n => n.tag === 'details').length, 0);
});
test('RPC caída sin datos previos: aviso rojo con el motivo', async () => {
  const raiz = await pintar(async () => { throw new Error('Could not find the function omc_engranajes_lista'); });
  assert.match(raiz.textContent, /No se pudo leer el estado del engranaje \(Could not find the function omc_engranajes_lista\)/);
  assert.equal(buscar(raiz, n => n.attrs.role === 'alert').length, 1);
});
test('RPC devuelve null: mismo aviso, sin excepción', async () => {
  const raiz = await pintar(async () => null);
  assert.match(raiz.textContent, /No se pudo leer el estado del engranaje \(respuesta vacía\)/);
});
test('RPC caída con datos previos: se muestran los últimos datos y el aviso', async () => {
  V.restablecer(); V.usarCargador(async () => DATOS);
  await V.render(crearNodo('main'), {}, undefined, {}, AHORA); await tick();
  V.usarCargador(async () => { throw new Error('red'); });
  const t0 = Date.now; Date.now = () => t0() + 60e3;   // la caché de 30 s ya caducó
  try { const raiz = crearNodo('main'); await V.render(raiz, {}, undefined, {}, AHORA); await tick();
    assert.match(raiz.textContent, /No se pudo leer el estado del engranaje \(red\).*últimos datos/);
    assert.match(raiz.textContent, /3 verdes, 3 rojos, 2 grises de 8/); } finally { Date.now = t0; }
});
test('lo abierto o cerrado a mano sobrevive a la recarga', async () => {
  V.restablecer(); V.usarCargador(async () => DATOS);
  let raiz = crearNodo('main'); await V.render(raiz, {}, undefined, {}, AHORA); await tick();
  const back = buscar(raiz, n => n.tag === 'details' && n.attrs.id === 'salud-grupo-backup')[0];
  back.open = true; back.listeners.toggle[0]();
  const cron = buscar(raiz, n => n.tag === 'details' && n.attrs.id === 'salud-grupo-cron')[0];
  cron.open = false; cron.listeners.toggle[0]();
  raiz = crearNodo('main'); await V.render(raiz, {}, undefined, {}, AHORA); await tick();
  const ab = id => buscar(raiz, n => n.tag === 'details' && n.attrs.id === 'salud-grupo-' + id)[0].attrs.open !== undefined;
  assert.ok(ab('backup')); assert.ok(!ab('cron'));
});

// #1281: las seis filas de control van encima de los grupos, tras el h1; sin semáforo la pantalla queda como estaba.
test('#1281 salud: semáforo de seis filas justo tras el h1 y antes de los grupos; sin datos no se pinta', async () => {
  V.restablecer(); V.usarCargador(async () => DATOS);
  const sem = { filas: ['correo', 'licitacion', 'encargo', 'tarjeta', 'contacto', 'dato'].map(o => ({ objeto: o, nombre: o, total: 1, rojos: 0, sin_medir: o === 'correo', enlace: null, por_dueno: [] })) };
  const raiz = crearNodo('main'); await V.render(raiz, { datos: { semaforo: sem, agentes: [] } }, undefined, {}, AHORA); await tick();
  assert.equal(raiz.children[0].tag, 'h1');
  assert.equal(raiz.children[1].className, 'semaforo-seis');
  assert.equal(raiz.children[1].children.length, 6);
  const sin = await pintar(async () => DATOS);
  assert.equal(buscar(sin, n => clase(n, 'semaforo-seis')).length, 0);
});
