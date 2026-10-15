// node --test api/verifix.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { validar, fila, insertarSupabase, correo, ASUNTO } from './verifix.mjs';

const ok = { email: 'ana@gestoria.es', empresa: 'Gestoría Gil', tipo: 'gestoria', idioma: 'es', web: '' };

test('valida un alta correcta y hashea la IP', () => {
  const v = validar(ok, '1.2.3.4', 'sal');
  assert.equal(v.lead.email, 'ana@gestoria.es');
  assert.match(v.lead.ip_hash, /^[0-9a-f]{64}$/);
  assert.ok(!JSON.stringify(v.lead).includes('1.2.3.4'));
});

test('honeypot relleno: se descarta sin error', () => {
  assert.deepEqual(validar({ ...ok, web: 'http://spam' }, '1.1.1.1'), { honeypot: true });
});

test('rechaza email malo, empresa vacía y tipo desconocido', () => {
  for (const mal of [{ email: 'no' }, { empresa: '' }, { tipo: 'pyme' }, { tipo: '' }]) {
    assert.ok(validar({ ...ok, ...mal }, 'ip').error, JSON.stringify(mal));
  }
});

test('idioma desconocido cae a es y en se respeta', () => {
  assert.equal(validar({ ...ok, idioma: 'fr' }, 'ip').lead.idioma, 'es');
  assert.equal(validar({ ...ok, idioma: 'EN' }, 'ip').lead.idioma, 'en');
  assert.equal(validar({ ...ok, idioma: 'ca' }, 'ip').lead.idioma, 'ca');
  assert.equal(validar({ ...ok, idioma: 'CA' }, 'ip').lead.idioma, 'ca');
});

test('limpia saltos de línea y recorta (sin inyección de cabeceras)', () => {
  const v = validar({ ...ok, empresa: 'A\r\nBcc: x@y.es' + 'z'.repeat(300) }, 'ip');
  assert.ok(!/[\r\n]/.test(v.lead.empresa) && v.lead.empresa.length <= 120);
});

test('fila solo lleva las columnas de la tabla', () => {
  assert.deepEqual(Object.keys(fila(validar(ok, 'ip').lead)).sort(), ['email', 'empresa', 'idioma', 'ip_hash', 'origen', 'programa', 'tipo', 'ya_me_ha_pasado']);
});

test('insertarSupabase: inserta si no existe, blando ante 500 y excepción', async () => {
  const lead = validar(ok, 'ip').lead;
  const cfg = { url: 'https://sb.test', service: 'k' };
  const visto = [];
  const http = async (u, o) => { visto.push({ u, o }); return o.method === 'PATCH' ? { ok: true, json: async () => [] } : { ok: true, status: 201 }; };
  assert.equal(await insertarSupabase(lead, cfg, http), true);
  assert.equal(visto[0].o.method, 'PATCH');
  assert.equal(visto[0].u, 'https://sb.test/rest/v1/verifix_lista_espera?email=eq.ana%40gestoria.es&select=id');
  assert.equal(visto[1].o.method, 'POST');
  assert.equal(visto[1].u, 'https://sb.test/rest/v1/verifix_lista_espera');
  assert.equal(JSON.parse(visto[1].o.body).email, 'ana@gestoria.es');
  const falla = async (u, o) => (o.method === 'PATCH' ? { ok: true, json: async () => [] } : { ok: false, status: 500 });
  assert.equal(await insertarSupabase(lead, cfg, falla), false);
  assert.equal(await insertarSupabase(lead, cfg, async () => { throw new Error('red'); }), false);
  assert.equal(await insertarSupabase(lead, { url: '', service: '' }, async () => { throw new Error('no debe llamarse'); }), false);
});

test('insertarSupabase: email existente se actualiza y no se inserta otra fila', async () => {
  const lead = validar({ ...ok, empresa: 'Gil SL', programa: 'Holded', ya_me_ha_pasado: true }, 'ip').lead;
  const llamadas = [];
  const http = async (u, o) => { llamadas.push(o.method); return { ok: true, json: async () => [{ id: 7 }] }; };
  assert.equal(await insertarSupabase(lead, { url: 'https://sb.test', service: 'k' }, http), true);
  assert.deepEqual(llamadas, ['PATCH']);
});

test('insertarSupabase: PATCH solo toca empresa, tipo, idioma, ya_me_ha_pasado y programa', async () => {
  const lead = validar(ok, 'ip').lead;
  let cuerpo;
  await insertarSupabase(lead, { url: 'https://sb.test', service: 'k' }, async (u, o) => { cuerpo = JSON.parse(o.body); return { ok: true, json: async () => [{ id: 1 }] }; });
  assert.deepEqual(Object.keys(cuerpo).sort(), ['empresa', 'idioma', 'programa', 'tipo', 'ya_me_ha_pasado']);
});

test('email se guarda en minúsculas', () => {
  assert.equal(validar({ ...ok, email: 'Ana@Gestoria.ES' }, 'ip').lead.email, 'ana@gestoria.es');
});

test('correo: asunto y destinatario', () => {
  const c = correo(validar(ok, 'ip').lead, 'de@77delta.com', 'hola@77delta.com');
  assert.equal(c.subject, ASUNTO);
  assert.equal(c.subject, 'Verifix: alta en la lista de espera');
  assert.equal(c.to, 'hola@77delta.com');
});

test('ya_me_ha_pasado: opcional, false por defecto, solo true o "true" lo activan, va a fila y correo', () => {
  assert.equal(validar(ok, 'ip').lead.ya_me_ha_pasado, false);
  assert.equal(validar({ ...ok, ya_me_ha_pasado: true }, 'ip').lead.ya_me_ha_pasado, true);
  assert.equal(validar({ ...ok, ya_me_ha_pasado: 'true' }, 'ip').lead.ya_me_ha_pasado, true);
  assert.equal(validar({ ...ok, ya_me_ha_pasado: 'no' }, 'ip').lead.ya_me_ha_pasado, false);
  const lead = validar({ ...ok, ya_me_ha_pasado: true }, 'ip').lead;
  assert.equal(fila(lead).ya_me_ha_pasado, true);
  assert.match(correo(lead, 'de@77delta.com', 'hola@77delta.com').text, /Ya me ha pasado: sí/);
});

test('programa: opcional, limpiado y recortado a 40, va a fila y correo', () => {
  assert.equal(validar(ok, 'ip').lead.programa, '');
  const lead = validar({ ...ok, programa: 'Holded\r\nBcc: x@y.z ' + 'a'.repeat(60) }, 'ip').lead;
  assert.ok(lead.programa.length <= 40);
  assert.ok(!/[\r\n]/.test(lead.programa));
  assert.equal(fila(lead).programa, lead.programa);
  assert.match(correo(validar({ ...ok, programa: 'Odoo' }, 'ip').lead, 'de@77delta.com', 'hola@77delta.com').text, /Programa: Odoo/);
});
