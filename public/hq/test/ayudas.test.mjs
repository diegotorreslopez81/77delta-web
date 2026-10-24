import test from 'node:test';
import assert from 'node:assert/strict';
import { textoAyudas } from '../app/vistas/ayudas.js';

test('textoAyudas: recuento e importe de la RPC, sin sumar en el front', () => {
  assert.equal(textoAyudas({ pedidas_n: 2, pedidas_importe: 45000 }), 'Ayudas pedidas: 2 · 45.000 €');
  assert.equal(textoAyudas(null), 'Ayudas pedidas: 0 · 0 €');
});
