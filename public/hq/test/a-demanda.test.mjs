import test from 'node:test';
import assert from 'node:assert/strict';
import { conectar, hilos, invalidarHilos, enlacesPliegos, olvidarEnlaces, CADUCIDAD_ENLACES_MS } from '../app/a-demanda.js';

const tic = () => new Promise(r => setTimeout(r, 0));

test('sin conectar: hilos devuelve {} y enlacesPliegos no toca las filas', () => {
  assert.deepEqual(hilos({ rol: 'owner', ahora: 'x' }), {});
  const lics = [{ expediente: 'E1' }];
  assert.equal(enlacesPliegos(lics), lics); assert.deepEqual(lics, [{ expediente: 'E1' }]);
});

test('hilos: una peticion por carga, repinta solo si cambian, invalidarHilos fuerza otra', async () => {
  const llamadas = []; let pintados = 0; let respuesta = { 7: [{ id: 1, autor: 'a', texto: 'hola', ts: 't' }] };
  conectar(async (fn, args) => { llamadas.push([fn, args]); return respuesta; }, () => { pintados++; });
  assert.deepEqual(hilos({ rol: 'agente', ahora: 'a' }), {}); assert.equal(llamadas.length, 0, 'un agente nunca pide hilos');
  assert.deepEqual(hilos({ rol: 'owner', ahora: 'a' }), {}, 'primera pintada: aun vacio');
  assert.deepEqual(hilos({ rol: 'owner', ahora: 'a' }), {}); assert.equal(llamadas.length, 1, 'en vuelo: no se repite');
  await tic();
  assert.equal(pintados, 1); assert.deepEqual(llamadas[0], ['omc_hq_hilos', undefined]);
  assert.deepEqual(hilos({ rol: 'owner', ahora: 'a' })[7][0].texto, 'hola'); assert.equal(llamadas.length, 1, 'misma carga: cache');
  hilos({ rol: 'owner', ahora: 'b' }); await tic();
  assert.equal(llamadas.length, 2, 'carga nueva (ahora distinto): se vuelve a pedir'); assert.equal(pintados, 1, 'sin cambios no repinta');
  invalidarHilos(); hilos({ rol: 'owner', ahora: 'b' }); await tic();
  assert.equal(llamadas.length, 3);
  conectar(null, null);
});

test('enlacesPliegos: pide solo lo que falta, rellena las filas y caduca', async () => {
  olvidarEnlaces();
  const llamadas = []; let pintados = 0;
  conectar(async (fn, args) => { llamadas.push([fn, args]); return { E1: { pcap: 'https://e/pcap', ppt: null, carpeta: null, pcap_drive: null, ppt_drive: null } }; }, () => { pintados++; });
  const lics = [{ expediente: 'E1' }, { expediente: 'E2' }, { expediente: 'E3', pcap: 'ya' }, { expediente: 'E1' }];
  enlacesPliegos(lics);
  assert.deepEqual(llamadas, [['omc_licitaciones_enlaces', { p_expedientes: ['E1', 'E2'] }]], 'E3 ya trae pcap y E1 no se repite');
  await tic();
  assert.equal(pintados, 1);
  enlacesPliegos(lics);
  assert.equal(lics[0].pcap, 'https://e/pcap'); assert.equal(lics[3].pcap, 'https://e/pcap'); assert.equal(lics[1].pcap, undefined);
  assert.equal(llamadas.length, 1, 'E2 sin enlaces queda en cache como vacio: no se vuelve a pedir');
  enlacesPliegos([{ expediente: 'E2' }], Date.now() + CADUCIDAD_ENLACES_MS + 1); await tic();
  assert.equal(llamadas.length, 2, 'caducada: se pide otra vez');
  conectar(null, null);
});
