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
test('celdasCabecera: 5 celdas, sin cola_chief, agentes ni caja, tareas gris, pagar 0 gris', () => {
  const c = celdasCabecera([{ clave: 'decidir', valor: 3 }, { clave: 'pagar', valor: 0 }, { clave: 'firmar', valor: 9 }, { clave: 'correos', valor: 3 }, { clave: 'cola_chief', valor: 124 }, { clave: 'agentes', valor: 45 }, { clave: 'caja', valor: null }]);
  assert.deepEqual(c.map(x => x.clave), ['decidir', 'firmar', 'pagar', 'correos', 'tareas']);
  assert.deepEqual(c.map(x => !!x.gris), [false, false, true, false, true]);
});


import { cifraTareas } from '../app/vistas/hoy-pantalla.js';
test('cifraTareas: rojo con vencidas u hoy, ámbar sin fecha, verde sin nada, gris sin dato', () => {
  assert.equal(cifraTareas({ abiertas: 9, vencidas: 1, hoy: 0, sin_fecha: 0 }).color, 'rojo');
  assert.equal(cifraTareas({ abiertas: 9, vencidas: 0, hoy: 2, sin_fecha: 5 }).color, 'rojo');
  assert.equal(cifraTareas({ abiertas: 9, vencidas: 0, hoy: 0, sin_fecha: 3 }).color, 'ambar');
  assert.equal(cifraTareas({ abiertas: 9, vencidas: 0, hoy: 0, sin_fecha: 0 }).color, 'verde');
  assert.equal(cifraTareas({ error: 'x' }).valor, null);
  assert.equal(cifraTareas(null).valor, null);
  assert.equal(celdasCabecera([cifraTareas({ abiertas: 9, vencidas: 0, hoy: 0, sin_fecha: 0 })]).find(x => x.clave === 'tareas').gris, undefined);
});

import { eurNegocio, modeloNegocio } from '../app/vistas/hoy-pantalla.js';
test('eurNegocio: punto de miles, sin decimales, M desde 1.000.000', () => {
  assert.equal(eurNegocio(32438.02), '32.438 €');
  assert.equal(eurNegocio(999999), '999.999 €');
  assert.equal(eurNegocio(1120000), '1,12 M €');
  assert.equal(eurNegocio(null), 'sin dato');
});
test('modeloNegocio: omite filas sin principal (caja), máximo 2 pares de detalle, usa texto de la vista', () => {
  const m = modeloNegocio([
    { clave: 'caja', etiqueta: 'Caja', principal: null },
    { clave: 'pipeline', etiqueta: 'Pipeline', principal: 230500, principal_unidad: 'eur', secundario: 34, secundario_unidad: 'oportunidades', enlace: '#ventas?bloque=pipeline', detalle: [{ etiqueta: 'a', valor: 1 }, { etiqueta: 'b', valor: 2 }, { etiqueta: 'c', valor: 3 }] },
  ]);
  assert.equal(m.length, 1);
  assert.equal(m[0].principal, '230.500 €');
  assert.equal(m[0].secundario, '34 oportunidades');
  assert.equal(m[0].detalle.length, 2);
  assert.deepEqual(modeloNegocio(null), []);
});

import { resolver } from '../app/rutas.js';
test('modeloNegocio: enlaces de la vista resuelven a su ruta, no a Hoy; detalle en euros con formato', () => {
  const enlaces = { contratado_mes: '#operacion/ventas/hoy', pipeline: '#operacion/ventas/pipeline', captacion_7d: '#operacion/ventas/campanas', licitaciones: '#operacion/licitaciones', caja: '#hoy' };
  for (const [k, e] of Object.entries(enlaces)) {
    const [m] = modeloNegocio([{ clave: k, etiqueta: k, principal: 1, enlace: e }]).concat({ enlace: '#hoy' });
    const r = resolver(m.enlace);
    assert.equal(r.redirigido, false, k);
    assert.equal(r.clave === 'hoy', k === 'caja', k);
  }
  assert.equal(modeloNegocio([{ clave: 'x', principal: 1, enlace: '#/ventas', detalle: [{ etiqueta: 'a', valor: 142500, unidad: 'eur' }, { etiqueta: 'b', valor: 9 }] }])[0].enlace, '#ventas');
  assert.deepEqual(modeloNegocio([{ clave: 'x', principal: 1, detalle: [{ etiqueta: 'a', valor: 142500, unidad: 'eur' }, { etiqueta: 'b', valor: 9 }] }])[0].detalle, [{ etiqueta: 'a', valor: '142.500 €' }, { etiqueta: 'b', valor: '9' }]);
});
