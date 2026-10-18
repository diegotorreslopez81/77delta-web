import test from 'node:test';
import assert from 'node:assert/strict';
import { textoFin, modeloCronograma } from '../app/vistas/en-curso.js';

test('textoFin enseña las dos fechas cuando los encargos superan la prevista', () => {
  assert.equal(textoFin({ fin_prevista: '2026-10-30', fin_por_encargos: '2026-11-06' }), 'fin 30-10, por encargos 06-11');
  assert.equal(textoFin({ fin_prevista: '2026-10-30', fin_por_encargos: '2026-10-20' }), 'fin 30-10');
  assert.equal(textoFin({}), 'sin fin previsto');
});

test('cronograma: por fecha, hechos al final, vencidos marcados', () => {
  const ahora = new Date('2026-10-18T12:00:00Z');
  const m = modeloCronograma([
    { encargo_id: 3, estado: 'hecho', fecha_hito: '2026-10-01' },
    { encargo_id: 2, estado: 'encolado', fecha_hito: '2026-10-25' },
    { encargo_id: 1, estado: 'en_curso', fecha_hito: '2026-10-10' },
    { encargo_id: 4, estado: 'encolado', fecha_hito: null },
  ], ahora);
  assert.deepEqual(m.map(f => f.encargo_id), [1, 2, 4, 3]);
  assert.deepEqual(m.map(f => f.vencido), [true, false, false, false]);
  assert.equal(m[3].cerrado, true);
});
