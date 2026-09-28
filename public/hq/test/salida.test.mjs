import test from 'node:test';
import assert from 'node:assert/strict';
import { resolucionLocal, transicionLocal, permanece, desvanecer, conSalida } from '../app/salida.js';

// #2118: salida suave de la tarjeta resuelta. Los parches locales se prueban sobre un S falso; la animación,
// con un nodo falso (style, classList, remove) y ms pequeños para no esperar 250 ms por caso.
function nodoFalso() {
  const clases = new Set();
  return {
    style: {}, clases, quitado: false, attrs: {}, offsetHeight: 120,
    classList: { add: c => clases.add(c), remove: c => clases.delete(c) },
    setAttribute(k, v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    remove() { this.quitado = true; },
  };
}
const espera = ms => new Promise(r => setTimeout(r, ms));

test('resolucionLocal quita la tarjeta de pendientes y de pospuestas', () => {
  const S = { datos: { pendientes: [{ id: 1 }, { id: 2 }], pospuestas: [{ id: 2 }, { id: 3 }] } };
  resolucionLocal(S, 2);
  assert.deepEqual(S.datos.pendientes.map(p => p.id), [1]);
  assert.deepEqual(S.datos.pospuestas.map(p => p.id), [3]);
});

test('resolucionLocal no falla sin datos ni listas', () => {
  resolucionLocal({}, 1);
  resolucionLocal(null, 1);
  const S = { datos: { pendientes: [{ id: 1 }] } };
  resolucionLocal(S, 1);
  assert.deepEqual(S.datos.pendientes, []);
});

function estadoConLicitacion() {
  return {
    datos: {
      licitaciones: [{ id: 7, estado: 'Por decidir', importe: 1000 }],
      lic_resumen: { por_decidir: { n: 5, eur: 5000 }, descartadas: { n: 2, eur: 300 }, aprobadas: { n: 1, eur: 100 } },
    },
    cacheLicTabla: {
      firma: JSON.stringify({ estados: ['Por decidir'] }),
      datos: { filas: [{ id: 7, estado: 'Por decidir' }, { id: 8, estado: 'Por decidir' }], total: 2 },
    },
  };
}

test('transicionLocal mueve la fila y recalcula n y eur de lic_resumen', () => {
  const S = estadoConLicitacion();
  transicionLocal(S, { id: 7, estado: 'Por decidir', importe: 1000 }, 'Descartada');
  assert.equal(S.datos.licitaciones[0].estado, 'Descartada');
  assert.deepEqual(S.datos.lic_resumen.por_decidir, { n: 4, eur: 4000 });
  assert.deepEqual(S.datos.lic_resumen.descartadas, { n: 3, eur: 1300 });
});

test('transicionLocal quita la fila de la lista cacheada si el destino queda fuera del filtro', () => {
  const S = estadoConLicitacion();
  transicionLocal(S, { id: 7, estado: 'Por decidir' }, 'Descartada');
  assert.deepEqual(S.cacheLicTabla.datos.filas.map(f => f.id), [8]);
  assert.equal(S.cacheLicTabla.datos.total, 1);
});

test('transicionLocal conserva la fila en la caché si el destino sigue dentro del filtro', () => {
  const S = estadoConLicitacion();
  S.cacheLicTabla.firma = JSON.stringify({ estados: ['Por decidir', 'Aprobada'] });
  transicionLocal(S, { id: 7, estado: 'Por decidir' }, 'Aprobada');
  assert.deepEqual(S.cacheLicTabla.datos.filas.map(f => f.id), [7, 8]);
  assert.equal(S.cacheLicTabla.datos.filas[0].estado, 'Aprobada');
  assert.equal(S.cacheLicTabla.datos.total, 2);
});

test('transicionLocal usa el estado de la tarjeta si la fila no está en S.datos', () => {
  const S = estadoConLicitacion();
  S.datos.licitaciones = [];
  transicionLocal(S, { id: 9, estado: 'Por decidir', importe: 50 }, 'Descartada');
  assert.deepEqual(S.datos.lic_resumen.por_decidir, { n: 4, eur: 4950 });
});

test('transicionLocal no baja de cero y omite estados sin clave de resumen', () => {
  const S = estadoConLicitacion();
  S.datos.lic_resumen.por_decidir = { n: 0, eur: 0 };
  transicionLocal(S, { id: 7, estado: 'Por decidir', importe: 1000 }, 'Descartada');
  assert.deepEqual(S.datos.lic_resumen.por_decidir, { n: 0, eur: 0 });
  transicionLocal(S, { id: 8, estado: 'Por decidir', importe: 10 }, 'Estado inventado');
  assert.deepEqual(S.datos.lic_resumen.descartadas, { n: 3, eur: 1300 });
  assert.deepEqual(S.datos.lic_resumen.por_decidir, { n: 0, eur: 0 });
});

test('transicionLocal tolera S sin datos ni caché', () => {
  transicionLocal({}, { id: 1, estado: 'Por decidir' }, 'Descartada');
  transicionLocal(null, { id: 1, estado: 'Por decidir' }, 'Descartada');
});

test('permanece es true solo si la fila está en la caché y el destino cabe en el filtro', () => {
  const S = estadoConLicitacion();
  assert.equal(permanece(S, { id: 7 }, 'Por decidir'), true);
  assert.equal(permanece(S, { id: 7 }, 'Descartada'), false);
  assert.equal(permanece(S, { id: 99 }, 'Por decidir'), false);
  assert.equal(permanece({}, { id: 7 }, 'Por decidir'), false);
  S.cacheLicTabla.firma = 'no es json';
  assert.equal(permanece(S, { id: 7 }, 'Por decidir'), false);
});

test('desvanecer fija la altura, marca la clase y quita el nodo pasados los ms', async () => {
  const n = nodoFalso();
  const s = desvanecer(n, 10);
  assert.equal(n.style.maxHeight, '120px');
  assert.ok(n.clases.has('saliendo'));
  assert.equal(n.attrs['aria-hidden'], 'true');
  assert.equal(n.quitado, false);
  await s.quitar();
  assert.equal(n.quitado, true);
});

test('desvanecer.restaurar devuelve la tarjeta y limpia la altura', async () => {
  const n = nodoFalso();
  const s = desvanecer(n, 5);
  s.restaurar();
  assert.equal(n.clases.has('saliendo'), false);
  assert.equal(n.attrs['aria-hidden'], undefined);
  await espera(60);
  assert.equal(n.style.maxHeight, '');
  assert.equal(n.quitado, false);
});

test('conSalida en éxito: parcha, quita el nodo y repinta sin recargar', async () => {
  const n = nodoFalso();
  const orden = [];
  await conSalida(n, async () => { orden.push('api'); }, {
    local: () => orden.push('local'), pintar: () => orden.push('pintar'), recargar: () => orden.push('recargar'), ms: 10 });
  assert.deepEqual(orden, ['api', 'local', 'pintar']);
  assert.equal(n.quitado, true);
});

test('conSalida en fallo: restaura la tarjeta, no parcha ni repinta y relanza el error', async () => {
  const n = nodoFalso();
  const orden = [];
  await assert.rejects(
    conSalida(n, async () => { throw new Error('HQ 400'); }, {
      local: () => orden.push('local'), pintar: () => orden.push('pintar'), recargar: () => orden.push('recargar'), ms: 10 }),
    /HQ 400/);
  assert.deepEqual(orden, []);
  assert.equal(n.quitado, false);
  assert.equal(n.clases.has('saliendo'), false);
});

test('conSalida sin nodo no anima y repinta al momento', async () => {
  const orden = [];
  await conSalida(null, async () => orden.push('api'), { local: () => orden.push('local'), pintar: () => orden.push('pintar') });
  assert.deepEqual(orden, ['api', 'local', 'pintar']);
});

test('conSalida sin pintar recarga desde la red', async () => {
  const orden = [];
  await conSalida(null, async () => {}, { local: () => orden.push('local'), recargar: async () => { orden.push('recargar'); } });
  assert.deepEqual(orden, ['local', 'recargar']);
});

test('conSalida con un nodo sin style (DOM de test) no anima', async () => {
  const orden = [];
  await conSalida({ classList: {} }, async () => {}, { local: () => orden.push('local'), pintar: () => orden.push('pintar') });
  assert.deepEqual(orden, ['local', 'pintar']);
});

test('conSalida con dos tarjetas a la vez repinta solo cuando termina la última', async () => {
  const a = nodoFalso(), b = nodoFalso();
  let pintados = 0;
  const cierre = { a: false, b: false };
  const pA = conSalida(a, async () => { await espera(5); }, { local: () => { cierre.a = true; }, pintar: () => { pintados++; assert.equal(b.quitado, true); }, ms: 10 });
  const pB = conSalida(b, async () => { await espera(40); }, { local: () => { cierre.b = true; }, pintar: () => { pintados++; assert.equal(b.quitado, true); }, ms: 10 });
  await Promise.all([pA, pB]);
  assert.equal(pintados, 1);
  assert.equal(a.quitado, true);
  assert.deepEqual(cierre, { a: true, b: true });
});

test('conSalida: si una falla y otra acierta, la que acierta repinta', async () => {
  const a = nodoFalso(), b = nodoFalso();
  let pintados = 0;
  const pA = conSalida(a, async () => { await espera(5); throw new Error('no'); }, { pintar: () => { pintados++; }, ms: 10 }).catch(() => {});
  const pB = conSalida(b, async () => { await espera(30); }, { pintar: () => { pintados++; }, ms: 10 });
  await Promise.all([pA, pB]);
  assert.equal(pintados, 1);
  assert.equal(a.quitado, false);
  assert.equal(b.quitado, true);
});
