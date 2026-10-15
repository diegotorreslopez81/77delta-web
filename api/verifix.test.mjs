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
});

test('limpia saltos de línea y recorta (sin inyección de cabeceras)', () => {
  const v = validar({ ...ok, empresa: 'A\r\nBcc: x@y.es' + 'z'.repeat(300) }, 'ip');
  assert.ok(!/[\r\n]/.test(v.lead.empresa) && v.lead.empresa.length <= 120);
});

test('fila solo lleva las columnas de la tabla', () => {
  assert.deepEqual(Object.keys(fila(validar(ok, 'ip').lead)).sort(), ['email', 'empresa', 'idioma', 'ip_hash', 'origen', 'tipo']);
});

test('insertarSupabase: éxito, 500 y excepción son blandos', async () => {
  const lead = validar(ok, 'ip').lead;
  const cfg = { url: 'https://sb.test', service: 'k' };
  let visto;
  assert.equal(await insertarSupabase(lead, cfg, async (u, o) => { visto = { u, o }; return { ok: true, status: 201 }; }), true);
  assert.equal(visto.u, 'https://sb.test/rest/v1/verifix_lista_espera');
  assert.equal(JSON.parse(visto.o.body).email, 'ana@gestoria.es');
  assert.equal(await insertarSupabase(lead, cfg, async () => ({ ok: false, status: 500 })), false);
  assert.equal(await insertarSupabase(lead, cfg, async () => { throw new Error('red'); }), false);
  assert.equal(await insertarSupabase(lead, { url: '', service: '' }, async () => { throw new Error('no debe llamarse'); }), false);
});

test('correo: asunto y destinatario', () => {
  const c = correo(validar(ok, 'ip').lead, 'de@77delta.com', 'hola@77delta.com');
  assert.equal(c.subject, ASUNTO);
  assert.equal(c.subject, 'Verifix: alta en la lista de espera');
  assert.equal(c.to, 'hola@77delta.com');
});
