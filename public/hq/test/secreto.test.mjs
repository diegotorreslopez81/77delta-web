import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { cifrar, normalizaVariable, pintarDestinos, DESTINO_DEFECTO } from '../app/vistas/secreto.js';

// nacl real: el mismo fichero vendorizado que sirve la app.
const selfObj = { crypto: globalThis.crypto }, mod = { exports: {} };
new Function('self', 'window', 'module', readFileSync(new URL('../vendor/nacl-fast.min.js', import.meta.url), 'utf8'))(selfObj, selfObj, mod);
const nacl = mod.exports.box ? mod.exports : selfObj.nacl;

test('cifrar: solo la clave del servidor descifra y el valor no aparece en claro', () => {
  const srv = nacl.box.keyPair();
  const pub = Buffer.from(srv.publicKey).toString('base64');
  const r = cifrar(nacl, pub, { destino: 'hq', variable: 'X_Y', valor: 'pa-ss_123' });
  assert.ok(!JSON.stringify(r).includes('pa-ss_123'));
  const d = nacl.box.open(Buffer.from(r.p_cifrado, 'base64'), Buffer.from(r.p_nonce, 'base64'), Buffer.from(r.p_pubkey_efimera, 'base64'), srv.secretKey);
  const p = JSON.parse(new TextDecoder().decode(d));
  assert.deepEqual([p.destino, p.variable, p.valor], ['hq', 'X_Y', 'pa-ss_123']);
  assert.ok(p.id && p.ts);
});
test('cifrar: clave pública inválida lanza', () => assert.throws(() => cifrar(nacl, 'AAAA', { destino: 'hq', variable: 'X', valor: 'x' })));
test('normalizaVariable: mayúsculas y guion bajo', () => assert.equal(normalizaVariable('voyage api-key'), 'VOYAGE_API_KEY'));

test('tweetnacl vendorizado: hash fijado', async () => {
  const { createHash } = await import('node:crypto');
  assert.equal(createHash('sha256').update(readFileSync(new URL('../vendor/nacl-fast.min.js', import.meta.url))).digest('hex'), '3ec535c004aeeb225785d8e93fb33bf99f52e399bd7dfc01969b5629baea5131');
});
test('la vista no guarda el valor en el navegador ni usa innerHTML', () => {
  const src = readFileSync(new URL('../app/vistas/secreto.js', import.meta.url), 'utf8');
  assert.ok(!/localStorage|sessionStorage|indexedDB|innerHTML|console\./.test(src));
});
test('la clave pública sale del repo, no de la BD', () => {
  const src = readFileSync(new URL('../app/vistas/secreto.js', import.meta.url), 'utf8');
  assert.ok(src.includes('/hq/secretos-pubkey.json') && !src.includes('omc_secretos_config'));
});

test('secretos-pubkey.json: destinos incluyen twenty y regulia (#2079)', () => {
  const j = JSON.parse(readFileSync(new URL('../secretos-pubkey.json', import.meta.url), 'utf8'));
  assert.deepEqual(j.destinos, ['hq', 'voyage', 'oportunidades-ia', 'twenty', 'regulia', 'resend', 'swarmix']);
});

test('pintarDestinos: agentes por nombre, Sistema al final y Bernat preseleccionado', () => {
  const nodo = tag => ({ tag, nodeType: 1, children: [], attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, append(...k) { this.children.push(...k.filter(Boolean)); }, addEventListener() {} });
  globalThis.document = { createElement: nodo, createTextNode: d => ({ nodeType: 3, data: d }) };
  const sel = nodo('select');
  sel.replaceChildren = function () { this.children = []; };
  Object.defineProperty(sel, 'options', { get() { return this.children.flatMap(c => (c.tag === 'optgroup' ? c.children : [c])).map(o => ({ value: o.attrs.value })); } });
  pintarDestinos(sel, [{ id: 'tech-devops', nombre: 'Bernat' }, { id: 'operaciones', nombre: 'Pol' }], ['hq', 'voyage']);
  assert.equal(DESTINO_DEFECTO, 'tech-devops');
  assert.equal(sel.value, 'tech-devops');
  assert.deepEqual(sel.options.map(o => o.value), ['tech-devops', 'operaciones', 'hq', 'voyage']);
  assert.equal(sel.children.at(-1).tag, 'optgroup');
});
