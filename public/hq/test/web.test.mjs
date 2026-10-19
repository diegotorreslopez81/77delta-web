import test from 'node:test';
import assert from 'node:assert/strict';
import { bloquesWeb, separar, modeloWeb } from '../app/vistas/web.js';

const ahora = new Date('2026-10-19T10:00:00Z');
const dias = [
  { dia: '2026-10-18', sitio: '77delta.com', visitas: 10, visitantes: 4, fuentes_top: [] },
  { dia: '2026-10-10', sitio: '77delta.com', visitas: 5, visitantes: 3, fuentes_top: [] },
];

test('V1: forma vieja (array) suma 30 días por sitio sin totales', () => {
  const b = bloquesWeb(dias, ahora);
  assert.equal(b.length, 1);
  assert.deepEqual([b[0].visitas, b[0].visitantes, b[0].visitas_total, b[0].variacion], [15, 7, null, null]);
});

test('V1: forma nueva usa el resumen, incluye sitios a 0 y ordena por visitas', () => {
  const resumen = [
    { sitio: 'swarmix.co', visitas_30d: 0, visitantes_30d: 0, visitas_total: 12, visitantes_total: 9, variacion_pct: null },
    { sitio: '77delta.com', visitas_30d: 15, visitantes_30d: 7, visitas_total: 400, visitantes_total: 150, variacion_pct: -20 },
  ];
  const b = bloquesWeb({ dias, resumen }, ahora);
  assert.deepEqual(b.map(x => x.sitio), ['77delta.com', 'swarmix.co']);
  assert.equal(b[0].variacion, -20);
  assert.equal(b[1].variacion, null);
  assert.equal(b[1].visitas_total, 12);
});

test('V1: separar tolera null', () => {
  assert.deepEqual(separar(null), { dias: [], resumen: null });
});

test('bloquesOrdenados: cuatro sitios en orden fijo, swarmix.co a 0 si la RPC no lo trae', async () => {
  const { bloquesOrdenados, anclaSitio } = await import('../app/vistas/web.js');
  const r = { dias: [], resumen: [{ sitio: 'verifix.77delta.com', visitas_30d: 5, visitantes_30d: 3, visitas_total: 9, visitantes_total: 6, variacion_pct: -10 }, { sitio: '77delta.com', visitas_30d: 100, visitantes_30d: 40, visitas_total: 900, visitantes_total: 300, variacion_pct: 12 }] };
  const m = bloquesOrdenados(r, new Date('2026-10-19T10:00:00Z'));
  assert.deepEqual(m.map(b => b.sitio), ['77delta.com', 'docureal.77delta.com', 'verifix.77delta.com', 'swarmix.co']);
  assert.equal(m[0].visitas, 100); assert.equal(m[0].variacion, 12); assert.equal(m[2].variacion, -10);
  assert.equal(m[3].sinDatos, true); assert.equal(m[0].sinDatos, undefined);
  assert.equal(anclaSitio('docureal.77delta.com'), 'docureal77deltacom');
});

test('modeloWeb: serie de 30 días ordenada, fuentes y páginas top sumadas', () => {
  const ahora = new Date('2026-10-19T10:00:00Z');
  const d = [
    { dia: '2026-10-18', sitio: 'x.com', visitas: 10, visitantes: 4, fuentes_top: [{ fuente: 'g', n: 3 }], paginas_top: [{ url: '/a', n: 2 }] },
    { dia: '2026-09-25', sitio: 'x.com', visitas: 5, visitantes: 3, fuentes_top: [{ fuente: 'g', n: 2 }], paginas_top: [{ url: '/a', n: 1 }, { url: '/b', n: 4 }] },
  ];
  const [s] = modeloWeb(d, ahora);
  assert.deepEqual(s.serie.map(x => x.dia), ['2026-09-25', '2026-10-18']);
  assert.deepEqual(s.fuentes, [{ fuente: 'g', n: 5 }]);
  assert.deepEqual(s.paginas, [{ url: '/b', n: 4 }, { url: '/a', n: 3 }]);
});

test('bloquesWeb: sitio con histórico y sin eventos en 30 días es sinSeguimiento, no 0', () => {
  const ahora = new Date('2026-10-19T10:00:00Z');
  const resumen = [
    { sitio: 'swarmix.co', visitas_30d: 0, visitantes_30d: 0, visitas_total: 304, visitantes_total: 255, variacion_pct: null, ultimo_evento: '2026-06-18' },
    { sitio: '77delta.com', visitas_30d: 370, visitantes_30d: 97, visitas_total: 589, visitantes_total: 157, variacion_pct: 69, ultimo_evento: '2026-10-19' },
  ];
  const por = Object.fromEntries(bloquesWeb({ dias: [], resumen }, ahora).map(b => [b.sitio, b]));
  assert.equal(por['swarmix.co'].sinSeguimiento, true);
  assert.equal(por['77delta.com'].sinSeguimiento, false);
});
