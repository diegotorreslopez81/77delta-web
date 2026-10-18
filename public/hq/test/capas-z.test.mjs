import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = ['app/hq.css', 'app/cards.css'].map(f => readFileSync(new URL('../' + f, import.meta.url), 'utf8')).join('\n');
const tokens = readFileSync(new URL('../app/tokens.css', import.meta.url), 'utf8');

test('todo elemento fixed usa la escala --z-* y no un número suelto', () => {
  const malos = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (/position:\s*fixed/.test(m[2]) && /z-index:\s*\d/.test(m[2])) malos.push(m[1].trim());
  }
  assert.deepEqual(malos, []);
});

test('la escala ordena barra < hoja < franja < menú < banner', () => {
  const z = n => Number(tokens.match(new RegExp('--' + n + ':(\\d+)'))[1]);
  assert.ok(z('z-barra') < z('z-hoja') && z('z-hoja') < z('z-franja') && z('z-franja') < z('z-menu') && z('z-menu') < z('z-banner'));
});

test('con-modal oculta franja y banner', () => {
  assert.match(css, /body\.con-modal \.franja-recordar,body\.con-modal \.aviso-banner\{display:none\}/);
});
