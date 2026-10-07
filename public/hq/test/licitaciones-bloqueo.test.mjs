import test from 'node:test';
import assert from 'node:assert/strict';
const { tableroFases, nombreBloqueo, textoHoras } = await import('../app/vistas/licitaciones-bloqueo.js');

test('tableroFases agrupa por fase y nombra el bloqueo', () => {
  const t = tableroFases([{ fase: 'redaccion', espera_de: 'proveedor', n: 2, horas_max: 50 }, { fase: 'redaccion', espera_de: 'agente', n: '3', horas_max: 5 }]);
  const r = t.find(x => x.fase === 'redaccion');
  assert.equal(r.total, 5);
  assert.deepEqual(r.chips.map(c => c.nombre), ['Proveedor', 'Agente']);
  assert.equal(t.length, 4);
});
test('nombreBloqueo y textoHoras', () => {
  assert.equal(nombreBloqueo('tecnico'), 'Herramienta/robot');
  assert.equal(nombreBloqueo(null), 'Agente');
  assert.equal(textoHoras(50), '2 d');
  assert.equal(textoHoras(5.4), '5 h');
});
