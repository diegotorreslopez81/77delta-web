import test from 'node:test';
import assert from 'node:assert/strict';
import { opcionesPosponer } from '../app/vistas/hoy-pantalla.js';

test('opcionesPosponer: mañana y lunes a las 09:00 de Madrid', () => {
  const o = opcionesPosponer(new Date('2026-10-18T12:00:00Z')); // domingo 18-10, CEST
  assert.equal(o.manana, '2026-10-19T07:00:00.000Z');
  assert.equal(o.lunes, '2026-10-19T07:00:00.000Z');
});
test('opcionesPosponer: miércoles → lunes siguiente', () => {
  const o = opcionesPosponer(new Date('2026-10-21T12:00:00Z'));
  assert.equal(o.manana, '2026-10-22T07:00:00.000Z');
  assert.equal(o.lunes, '2026-10-26T08:00:00.000Z'); // 25-10 cambio a CET, lunes 26 = +01:00
});

import { recuento, leerAbierto, guardarAbierto } from '../app/vistas/hoy-pantalla.js';
const mem = () => { const d = {}; return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } }; };

test('recuento: suma claves de cifras y usa respaldo si faltan', () => {
  const c = [{ clave: 'decidir', valor: 3, color: 'rojo' }, { clave: 'pagar', valor: 0, color: 'verde' }];
  assert.deepEqual(recuento(c, ['decidir', 'pagar'], 9), { n: 3, color: 'rojo' });
  assert.deepEqual(recuento([], ['correos'], 4), { n: 4, color: '' });
  assert.equal(recuento([], ['web'], null).n, null);
});
test('estado de acordeón: plegado por defecto y recordado por bloque', () => {
  const a = mem();
  assert.equal(leerAbierto('hoy-decidir', a), false);
  guardarAbierto('hoy-decidir', true, a);
  assert.equal(leerAbierto('hoy-decidir', a), true);
  assert.equal(leerAbierto('hoy-web', a), false);
});
test('estado de acordeón: storage que lanza no rompe', () => {
  const roto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(leerAbierto('hoy-web', roto), false);
  assert.doesNotThrow(() => guardarAbierto('hoy-web', true, roto));
});

import { enlaceCifra, celdasCabecera } from '../app/vistas/hoy-pantalla.js';
test('enlaceCifra: decidir y pagar abren Depende de ti; firmar abre la pestaña de lotes', () => {
  assert.equal(enlaceCifra({ clave: 'decidir' }), '#hoy?bloque=decidir');
  assert.equal(enlaceCifra({ clave: 'pagar' }), '#hoy?bloque=decidir&filtro=pagar');
  assert.equal(enlaceCifra({ clave: 'firmar' }), '#licitaciones?bloque=firmar');
  assert.equal(enlaceCifra({ clave: 'tareas' }), 'https://tasks.google.com');
});
test('celdasCabecera: 6 celdas, sin cola_chief ni agentes, tareas y caja grises, pagar 0 gris', () => {
  const c = celdasCabecera([{ clave: 'decidir', valor: 3 }, { clave: 'pagar', valor: 0 }, { clave: 'firmar', valor: 9 }, { clave: 'correos', valor: 3 }, { clave: 'cola_chief', valor: 124 }, { clave: 'agentes', valor: 45 }, { clave: 'caja', valor: null }]);
  assert.deepEqual(c.map(x => x.clave), ['decidir', 'firmar', 'pagar', 'correos', 'tareas', 'caja']);
  assert.deepEqual(c.map(x => !!x.gris), [false, false, true, false, true, true]);
});


import { cifraTareas } from '../app/vistas/hoy-pantalla.js';
test('cifraTareas: rojo con vencidas u hoy, ámbar sin fecha, verde sin nada, gris sin dato', () => {
  assert.equal(cifraTareas({ estado: 'ok', vencidas: 1, hoy: 0, sin_fecha: 0 }).color, 'rojo');
  assert.equal(cifraTareas({ estado: 'ok', vencidas: 0, hoy: 2, sin_fecha: 5 }).color, 'rojo');
  assert.equal(cifraTareas({ estado: 'ok', vencidas: 0, hoy: 0, sin_fecha: 3 }).color, 'ambar');
  assert.equal(cifraTareas({ estado: 'ok', vencidas: 0, hoy: 0, sin_fecha: 0 }).color, 'verde');
  assert.equal(cifraTareas({ estado: 'sin_dato' }).valor, null);
  assert.equal(cifraTareas(null).valor, null);
  assert.equal(celdasCabecera([cifraTareas({ estado: 'ok', vencidas: 0, hoy: 0, sin_fecha: 0 })]).find(x => x.clave === 'tareas').gris, undefined);
});
