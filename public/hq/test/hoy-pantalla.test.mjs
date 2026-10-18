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
