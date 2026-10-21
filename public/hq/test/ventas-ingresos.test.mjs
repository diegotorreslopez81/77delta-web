import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarIngresos } from '../app/vistas/ventas-ingresos.js';

const r = { anio: 2026, filas: [
  { id: 3, fecha: '2026-10-05', cliente: 'A', importe: 5000, estado: 'cobrado' },
  { id: 2, fecha: '2026-09-10', cliente: 'B', importe: 10000, estado: 'facturado' },
  { id: 1, fecha: '2026-10-20', cliente: 'C', importe: 1, estado: 'facturado' }] };

test('#2693 ingresos: sin filtro devuelve todas', () => assert.equal(filtrarIngresos(r).length, 3));
test('#2693 ingresos: filtra por estado y por mes', () => {
  assert.deepEqual(filtrarIngresos(r, { estado: 'cobrado' }).map(f => f.id), [3]);
  assert.deepEqual(filtrarIngresos(r, { mes: '2026-10' }).map(f => f.id), [3, 1]);
  assert.deepEqual(filtrarIngresos(r, { estado: 'facturado', mes: '2026-10' }).map(f => f.id), [1]);
});
test('#2693 ingresos: valor de filtro inválido no filtra; array suelto vale', () => {
  assert.equal(filtrarIngresos(r, { estado: 'x', mes: 'octubre' }).length, 3);
  assert.equal(filtrarIngresos(r.filas, {}).length, 3);
  assert.equal(filtrarIngresos(null, {}).length, 0);
});
