import { test } from 'node:test';
import assert from 'node:assert/strict';
import { modeloTwenty, haceMinutos, ventasTwentyActivo } from '../app/vistas/ventas-twenty.js';

test('tabla vacía no rompe', () => {
  const m = modeloTwenty({ actualizado: null });
  assert.deepEqual(m.etapas, []); assert.deepEqual(m.actividades, []); assert.equal(haceMinutos(m.actualizado), null);
});
test('etapas por orden', () => {
  const m = modeloTwenty({ etapas: { por_etapa: { a: { n: 2, importe: 10 } }, orden: ['a', 'b'], total: 2 } });
  assert.equal(m.etapas.length, 2); assert.equal(m.etapas[1].n, 0);
});
test('minutos', () => assert.equal(haceMinutos('2026-10-14T10:00:00Z', new Date('2026-10-14T10:15:00Z')), 15));
test('apagado por defecto', () => assert.equal(ventasTwentyActivo(), false));
