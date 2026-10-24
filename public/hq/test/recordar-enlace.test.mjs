import test from 'node:test';
import assert from 'node:assert/strict';
import { decidirFranja } from '../app/recordar-enlace.js';

const base = { porEnlace: true, recordado: false, otro: false, descartada: false, clave: 'hoy', arg: undefined };
test('enlace nuevo: sale la franja de recordar', () => assert.match(decidirFranja(base).texto, /Recordar este dispositivo/));
test('otro token recordado: ofrece actualizar', () => assert.equal(decidirFranja({ ...base, otro: true }).texto, 'Actualizar el dispositivo con este acceso'));
test('mismo token recordado, sin enlace o descartada: nada', () => {
  assert.equal(decidirFranja({ ...base, recordado: true }), null);
  assert.equal(decidirFranja({ ...base, porEnlace: false }), null);
  assert.equal(decidirFranja({ ...base, descartada: true }), null);
});
test('no sale en #secreto ni con tarjeta de Hoy abierta, sí en Hoy sola', () => {
  assert.equal(decidirFranja({ ...base, clave: 'secreto' }), null);
  assert.equal(decidirFranja({ ...base, arg: '42' }), null);
  assert.ok(decidirFranja({ ...base, clave: 'productos' }));
});
