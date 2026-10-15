// node --test api/hiring.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { preparar, reenviar } from './hiring.mjs';

const TOKEN = 'a'.repeat(43);
const env = { WM_URL: 'https://w.example/', WM_WORKSPACE: 'delta77', WM_ALTA_TOKEN: 'x' };
const resp = (ok, j) => async () => ({ ok, json: async () => j });

test('honeypot descarta sin error', () => {
  assert.deepEqual(preparar({ web: 'x', token: TOKEN }), { honeypot: true });
});

test('token ausente o con forma mala no llega a Windmill', () => {
  for (const t of [undefined, '', 'corto', 'a'.repeat(43) + '!', 'a'.repeat(65)]) assert.deepEqual(preparar({ token: t }), { error: 'token_invalido' });
});

test('solo pasan los campos esperados y consentimiento es booleano estricto', () => {
  const { payload } = preparar({ token: TOKEN, nombre: 'Ana', consentimiento: 'true', admin: 'x', web: '' });
  assert.equal(payload.consentimiento, false);
  assert.equal(payload.nombre, 'Ana');
  assert.ok(!('admin' in payload));
});

test('reenvia con path, bearer y devuelve solo ok', async () => {
  let visto;
  const f = async (url, o) => { visto = { url, auth: o.headers.Authorization, body: JSON.parse(o.body) }; return { ok: true, json: async () => ({ ok: true, interno: 'x' }) }; };
  const r = await reenviar({ token: TOKEN }, env, f);
  assert.deepEqual(r, { codigo: 200, cuerpo: { ok: true } });
  assert.equal(visto.url, 'https://w.example/api/w/delta77/jobs/run_wait_result/p/f/hiring/alta');
  assert.equal(visto.auth, 'Bearer x');
});

test('errores de validacion pasan filtrados; fallos de Windmill dan 502 sin detalle', async () => {
  assert.deepEqual(await reenviar({}, env, resp(true, { ok: false, errores: ['token_invalido', 'a@b.c'] })),
    { codigo: 400, cuerpo: { ok: false, errores: ['token_invalido'] } });
  assert.equal((await reenviar({}, env, resp(false, { error: 'secreto' }))).codigo, 502);
  assert.equal((await reenviar({}, env, async () => { throw new Error('x'); })).codigo, 502);
  assert.equal((await reenviar({}, {}, resp(true, {}))).codigo, 503);
});
