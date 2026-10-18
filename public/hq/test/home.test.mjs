import test from 'node:test';
import assert from 'node:assert/strict';
import { modeloDecidir, modeloHomeWeb } from '../app/vistas/home.js';

test('modeloDecidir: resto = decidir-1 + firmar + pagar', () => {
  const m = modeloDecidir({ decidir: [{ id: 1 }, { id: 2 }, { id: 3 }], firmar: new Array(38).fill({}), pagar: [], umbral_decidir_h: 24 });
  assert.equal(m.primera.id, 1); assert.equal(m.resto, 40); assert.equal(m.umbral, 24);
});
test('modeloDecidir: vacío', () => {
  const m = modeloDecidir({ decidir: [], firmar: [], pagar: [] });
  assert.equal(m.total, 0); assert.equal(m.primera, null);
});
test('modeloHomeWeb: suma 7 días, envíos y hoy/ayer', () => {
  const ahora = new Date('2026-10-18T12:00:00Z');
  const f = [
    { sitio: '77delta.com', dia: '2026-10-18', visitas: 5, visitantes: 4, clics_reservar: 1, envios_contacto: 1 },
    { sitio: '77delta.com', dia: '2026-10-17', visitas: 3, visitantes: 2, envios_empleo: 2 },
    { sitio: 'verifix', dia: '2026-10-01', visitas: 9, visitantes: 9 },
  ];
  const m = modeloHomeWeb(f, ahora);
  const s = m.sitios.find(x => x.sitio === '77delta.com');
  assert.deepEqual([s.visitas, s.visitantes, s.clics, s.envios], [8, 6, 1, 3]);
  assert.equal(m.hoy, 5); assert.equal(m.ayer, 3);
});
