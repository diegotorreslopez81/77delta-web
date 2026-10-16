// node --test api/docureal.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { validar, fila, insertarSupabase, correo } from './docureal.mjs';

const ok = { email: ' Ana@Agencia.com ', empresa: 'Agencia Sol', tipo: 'agencia', idioma: 'ca', candidaturas_mes: '5-20', ya_me_paso: true, preferencia_precio: '49-mes', comentario: 'hola', origen: 'docureal.77delta.com|l=ca|utm=|cta=demo' };

test('honeypot descarta sin error', () => {
  assert.deepEqual(validar({ ...ok, web: 'x' }, '1.1.1.1'), { honeypot: true });
});

test('datos validos normalizan email y conservan los campos del formulario', () => {
  const { lead } = validar(ok, '1.1.1.1', 'sal');
  assert.equal(lead.email, 'ana@agencia.com');
  assert.equal(lead.idioma, 'ca');
  assert.equal(lead.candidaturas_mes, '5-20');
  assert.equal(lead.ya_me_paso, true);
  assert.equal(lead.preferencia_precio, '49-mes');
  assert.equal(lead.comentario, 'hola');
  assert.match(lead.ip_hash, /^[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(lead).includes('1.1.1.1'));
});

test('faltan datos, email malo o tipo desconocido dan error', () => {
  for (const c of [{}, { ...ok, email: 'mal' }, { ...ok, empresa: '' }, { ...ok, tipo: 'gestoria' }]) assert.ok(validar(c, 'ip').error);
});

test('valores fuera de lista caen al valor por defecto', () => {
  const { lead } = validar({ ...ok, idioma: 'fr', candidaturas_mes: 'x', preferencia_precio: 'gratis', ya_me_paso: 'si' }, 'ip');
  assert.equal(lead.idioma, 'es');
  assert.equal(lead.candidaturas_mes, '');
  assert.equal(lead.preferencia_precio, 'no-se');
  assert.equal(lead.ya_me_paso, false);
});

test('textos largos se recortan', () => {
  const { lead } = validar({ ...ok, empresa: 'e'.repeat(500), comentario: 'c'.repeat(5000), origen: 'o'.repeat(500) }, 'ip');
  assert.equal(lead.empresa.length, 120);
  assert.equal(lead.comentario.length, 1000);
  assert.equal(lead.origen.length, 200);
});

test('fila solo lleva columnas de la tabla', () => {
  const { lead } = validar(ok, 'ip');
  assert.ok(!('fecha' in fila(lead)));
});

test('supabase: sin config no llama; PATCH existente no inserta; si no existe inserta; fallo no lanza', async () => {
  const { lead } = validar(ok, 'ip');
  assert.equal(await insertarSupabase(lead, {}), false);
  const llamadas = [];
  const existe = async (u, o) => { llamadas.push(o.method); return { ok: true, json: async () => [{ id: 1 }] }; };
  assert.equal(await insertarSupabase(lead, { url: 'https://s', service: 'k' }, existe), true);
  assert.deepEqual(llamadas, ['PATCH']);
  llamadas.length = 0;
  const nuevo = async (u, o) => { llamadas.push(o.method); return { ok: true, json: async () => [] }; };
  assert.equal(await insertarSupabase(lead, { url: 'https://s', service: 'k' }, nuevo), true);
  assert.deepEqual(llamadas, ['PATCH', 'POST']);
  assert.equal(await insertarSupabase(lead, { url: 'https://s', service: 'k' }, async () => { throw new Error('x'); }), false);
});

test('correo lleva reply-to del lead y los datos clave', () => {
  const { lead } = validar(ok, 'ip');
  const m = correo(lead, 'de@x.com', 'para@x.com');
  assert.equal(m.replyTo, 'ana@agencia.com');
  assert.match(m.text, /Preferencia de precio: 49-mes/);
});
