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


test('proyectosMalos: solo rojo, ámbar o bloqueo, máximo 5', async () => {
  const { proyectosMalos } = await import('../app/vistas/hoy-pantalla.js');
  const f = [...Array(7)].map((_, i) => ({ id: i, semaforo: 'rojo' })).concat([{ id: 9, semaforo: 'verde' }, { id: 10, semaforo: 'verde', bloqueo: 'espera a Diego' }]);
  assert.equal(proyectosMalos(f).length, 5);
  assert.deepEqual(proyectosMalos([{ semaforo: 'verde' }]), []);
  assert.equal(proyectosMalos([{ semaforo: 'verde', bloqueo: 'x' }]).length, 1);
});
test('modeloWeb7: suma 7 días y variación frente a los 7 anteriores', async () => {
  const { modeloWeb7 } = await import('../app/vistas/hoy-pantalla.js');
  const ahora = new Date('2026-10-18T12:00:00Z');
  const filas = [
    { sitio: 'a', dia: '2026-10-18', visitas: 30, visitantes: 10, clics_reservar: 2, envios_contacto: 1 },
    { sitio: 'a', dia: '2026-10-08', visitas: 20 },
  ];
  const m = modeloWeb7(filas, ahora);
  assert.equal(m[0].visitas, 30); assert.equal(m[0].antes, 20); assert.equal(m[0].variacion, 50); assert.equal(m[0].formularios, 1);
});
