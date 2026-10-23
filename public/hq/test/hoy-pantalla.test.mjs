import test from 'node:test';
import assert from 'node:assert/strict';
import { opcionesPosponer, vuelve } from '../app/vistas/hoy-pantalla.js';

test('opcionesPosponer: mañana y lunes a las 09:00 de Madrid', () => {
  const o = opcionesPosponer(new Date('2026-10-18T12:00:00Z')); // domingo 18-10, CEST
  assert.equal(o.manana, '2026-10-19T07:00:00.000Z');
  assert.equal(o.lunes, '2026-10-19T07:00:00.000Z');
});
test('opcionesPosponer: miércoles → lunes siguiente', () => {
  const o = opcionesPosponer(new Date('2026-10-21T12:00:00Z'));
  assert.equal(o.manana, '2026-10-22T07:00:00.000Z');
  assert.equal(o.lunes, '2026-10-26T08:00:00.000Z'); // 25-10 cambio a CET, lunes 26 = +01:00
});

import { recuento, leerAbierto, guardarAbierto } from '../app/vistas/hoy-pantalla.js';
const mem = () => { const d = {}; return { getItem: k => (k in d ? d[k] : null), setItem: (k, v) => { d[k] = String(v); } }; };

test('recuento: suma claves de cifras y usa respaldo si faltan', () => {
  const c = [{ clave: 'decidir', valor: 3, color: 'rojo' }, { clave: 'pagar', valor: 0, color: 'verde' }];
  assert.deepEqual(recuento(c, ['decidir', 'pagar'], 9), { n: 3, color: 'rojo' });
  assert.deepEqual(recuento([], ['correos'], 4), { n: 4, color: '' });
  assert.equal(recuento([], ['web'], null).n, null);
});
test('estado de acordeón: plegado por defecto y recordado por bloque', () => {
  const a = mem();
  assert.equal(leerAbierto('hoy-decidir', a), false);
  guardarAbierto('hoy-decidir', true, a);
  assert.equal(leerAbierto('hoy-decidir', a), true);
  assert.equal(leerAbierto('hoy-web', a), false);
});
test('estado de acordeón: storage que lanza no rompe', () => {
  const roto = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); } };
  assert.equal(leerAbierto('hoy-web', roto), false);
  assert.doesNotThrow(() => guardarAbierto('hoy-web', true, roto));
});




import { eurNegocio, modeloNegocio } from '../app/vistas/hoy-pantalla.js';
test('eurNegocio: punto de miles, sin decimales, M desde 1.000.000', () => {
  assert.equal(eurNegocio(32438.02), '32.438 €');
  assert.equal(eurNegocio(999999), '999.999 €');
  assert.equal(eurNegocio(1120000), '1,12 M €');
  assert.equal(eurNegocio(null), 'sin dato');
});
test('modeloNegocio: omite filas sin principal (caja), máximo 2 pares de detalle, usa texto de la vista', () => {
  const m = modeloNegocio([
    { clave: 'caja', etiqueta: 'Caja', principal: null },
    { clave: 'pipeline', etiqueta: 'Pipeline', principal: 230500, principal_unidad: 'eur', secundario: 34, secundario_unidad: 'oportunidades', enlace: '#ventas?bloque=pipeline', detalle: [{ etiqueta: 'a', valor: 1 }, { etiqueta: 'b', valor: 2 }, { etiqueta: 'c', valor: 3 }] },
  ]);
  assert.equal(m.length, 1);
  assert.equal(m[0].principal, '230.500 €');
  assert.equal(m[0].secundario, '34 oportunidades');
  const [i] = modeloNegocio([{ clave: 'ingresos', principal: 5000, principal_unidad: 'eur', principal_texto: 'facturado octubre', secundario: 5000, secundario_unidad: 'eur', secundario_texto: 'cobrado 2026' }]);
  assert.equal(i.principal, '5.000 €');
  assert.equal(i.principalTexto, 'facturado octubre');
  assert.equal(i.secundario, '5.000 € cobrado 2026');
  assert.equal(m[0].detalle.length, 2);
  assert.deepEqual(modeloNegocio(null), []);
});

import { resolver } from '../app/rutas.js';
test('modeloNegocio: enlaces de la vista resuelven a su ruta, no a Hoy; detalle en euros con formato', () => {
  const enlaces = { ingresos: '#operacion/ventas/hoy', pipeline: '#operacion/ventas/pipeline', captacion_7d: '#operacion/ventas/campanas', licitaciones: '#operacion/licitaciones', caja: '#hoy' };
  for (const [k, e] of Object.entries(enlaces)) {
    const [m] = modeloNegocio([{ clave: k, etiqueta: k, principal: 1, enlace: e }]).concat({ enlace: '#hoy' });
    const r = resolver(m.enlace);
    assert.equal(r.redirigido, false, k);
    assert.equal(r.clave === 'hoy', k === 'caja', k);
  }
  assert.equal(modeloNegocio([{ clave: 'x', principal: 1, enlace: '#/ventas', detalle: [{ etiqueta: 'a', valor: 142500, unidad: 'eur' }, { etiqueta: 'b', valor: 9 }] }])[0].enlace, '#ventas');
  assert.deepEqual(modeloNegocio([{ clave: 'x', principal: 1, detalle: [{ etiqueta: 'a', valor: 142500, unidad: 'eur' }, { etiqueta: 'b', valor: 9 }] }])[0].detalle, [{ etiqueta: 'a', valor: '142.500 €' }, { etiqueta: 'b', valor: '9' }]);
});

test('#2584: Ingresos con facturado del año grande y mes pequeño; sin (aprox.)', () => {
  const [i] = modeloNegocio([{ clave: 'ingresos', principal: 5000, principal_unidad: 'eur', principal_texto: 'facturado octubre', periodo_texto: 'octubre',
    detalle: [{ etiqueta: 'por facturar (aprox.)', valor: 27438.02, unidad: 'eur' }, { etiqueta: '2026 facturado', valor: 15000, unidad: 'eur' }, { clave: 'concedido_2026', etiqueta: 'concedido 2026', valor: 16000, unidad: 'eur' }] }]);
  assert.equal(i.principal, '15.000 €');
  assert.equal(i.principalTexto, 'Facturado 2026');
  assert.equal(i.secundario, 'octubre 5.000 €');
  assert.deepEqual(i.detalle.map(d => d.etiqueta), ['por facturar', 'concedido 2026']);
});

test('#2584 ingresos con el formato real v181 (fila de hq_v_hoy_negocio 19-10)', () => {
  const fila = {"clave":"ingresos","etiqueta":"Ingresos","principal":15000.0,"principal_unidad":"eur","principal_texto":"facturado 2026","secundario":5000.0,"secundario_unidad":"eur","secundario_texto":"facturado octubre","periodo_texto":"octubre","detalle":[{"clave":"facturado_2026","valor":15000.0,"unidad":"eur","etiqueta":"2026 facturado"},{"clave":"cobrado_2026","valor":5000.0,"unidad":"eur","etiqueta":"cobrado 2026"},{"clave":"por_facturar","valor":27438.02,"unidad":"eur","etiqueta":"por facturar"},{"clave":"contratado_2026","valor":27438.02,"unidad":"eur","etiqueta":"contratado 2026"},{"clave":"concedido_2026","valor":16000.0,"unidad":"eur","etiqueta":"concedido 2026"},{"clave":"lineas_2026","lineas":[{"pct":0,"etiqueta":"Licita","facturado":0},{"pct":100,"etiqueta":"Sales","facturado":15000.0},{"pct":0,"etiqueta":"Cupones","facturado":0},{"pct":0,"etiqueta":"Otros","facturado":0}],"etiqueta":"por línea"}],"color":"verde","enlace":"#ventas?bloque=ingresos"};
  const [m] = modeloNegocio([fila]);
  assert.equal(m.periodo, '2026');
  assert.equal(m.principal.replace(/\s/g, ' '), '15.000 €');
  assert.equal(m.principalTexto, 'Facturado 2026');
  assert.equal(m.secundario, '');
  assert.deepEqual(m.lineasEnl.map(l => l.texto.replace(/\s/g, ' ')), ['Caja: pdte', 'Octubre: 5.000 €', 'Cobrado 2026: 5.000 €']);
  assert.equal(m.enlace, '#operacion/ventas/ingresos');
  assert.equal(m.enlacePrincipal.enlace, '#operacion/ventas/ingresos');
  assert.equal(m.lineasEnl[0].enlace, '');
  assert.match(m.lineasEnl[1].enlace, /^#operacion\/ventas\/ingresos\?mes=\d{4}-\d{2}$/);
  assert.equal(m.lineasEnl[2].enlace, '#operacion/ventas/ingresos?estado=cobrado');
  assert.deepEqual(m.lineas, []);
});

// #2695: barra y leyenda de Pipeline y Contratado
import { lineasBarra } from '../app/vistas/hoy-pantalla.js';
test('lineasBarra calcula del valor, ordena en orden fijo y deja 0 % en la leyenda', () => {
  const l = lineasBarra([], [{ clave: 'licitaciones', valor: 433000 }, { clave: 'propuestas', valor: 14500 }, { clave: 'ayudas', valor: 0 }, { clave: 'subvenciones', valor: 220000 }]);
  assert.deepEqual(l.map(x => x.etiqueta + ' ' + x.pct), ['Licit. 65', 'Sales 2', 'Ayudas 0', 'Subv. 33']);
  assert.deepEqual(lineasBarra([], [{ clave: 'ayudas', valor: 0 }]), []);
});
test('lineasBarra usa las líneas de la vista y las lleva a clave', () => {
  const l = lineasBarra([{ clave: 'lineas', lineas: [{ etiqueta: 'Sales', pct: 20 }, { etiqueta: 'Licita', pct: 80 }] }], []);
  assert.deepEqual(l.map(x => x.clave + x.pct), ['licitaciones80', 'propuestas20']);
});

test('#2779 ingresos: Caja sale de la fila propia `caja`, que no pinta tarjeta; sin ella, pdte', () => {
  const ing = { clave: 'ingresos', etiqueta: 'Ingresos', principal: 1, principal_unidad: 'eur', periodo_texto: 'octubre', detalle: [
    { clave: 'facturado_2026', valor: 1, unidad: 'eur', etiqueta: '2026 facturado', enlace: 'operacion/ventas/ingresos' },
    { clave: 'por_facturar', valor: 2, unidad: 'eur', etiqueta: 'por facturar' }] };
  const caja = { clave: 'caja', etiqueta: 'caja', principal: 2500, principal_unidad: 'eur', enlace: 'https://fs.example/caja' };
  const r = modeloNegocio([ing, caja]);
  assert.deepEqual(r.map(x => x.clave), ['ingresos']);
  assert.deepEqual(r[0].lineasEnl.map(l => l.texto.replace(/\s/g, ' ')), ['Caja: 2.500 €', 'Octubre: 1 €']);
  assert.equal(r[0].lineasEnl[0].externo, true);
  const vacia = modeloNegocio([ing, { clave: 'caja', etiqueta: 'caja', principal: null, principal_unidad: 'eur', enlace: '#hoy' }]);
  assert.deepEqual(vacia.map(x => x.clave), ['ingresos']);
  assert.equal(vacia[0].lineasEnl[0].texto, 'Caja: pdte');
});

test('#2779 captación (fila real v225): enviados = principal, % sobre el paso anterior, solo CRM', () => {
  const det = [{ clave: 'respuestas', valor: 33 }, { clave: 'reuniones', valor: 2 }, { clave: 'propuestas', valor: 2 }, { clave: 'visitas', valor: 900 }];
  const [c] = modeloNegocio([{ clave: 'captacion', etiqueta: 'Captación', principal: 1905, principal_unidad: 'n', principal_texto: 'enviados', secundario: 33, color: 'rojo', enlace: '#operacion/ventas/campanas', detalle: det }]);
  assert.equal(c.principal, '1905');
  assert.equal(c.principalTexto, 'enviados');
  assert.deepEqual(c.lineasEnl.map(l => l.texto), ['Respuestas 33 (2 %)', 'Reuniones 2 (6 %)', 'Propuestas 2 (100 %)']);
  assert.equal(c.color, 'verde');
  assert.equal(c.enlacePrincipal.enlace, '#operacion/ventas/campanas');
  const [p] = modeloNegocio([{ clave: 'captacion', etiqueta: 'Captación', principal: null, color: 'rojo', detalle: det }]);
  assert.equal(p.principal, 'pdte');
  assert.equal(p.color, 'rojo');
  assert.equal(p.lineasEnl[0].texto, 'Respuestas 33');
  const [z] = modeloNegocio([{ clave: 'captacion', etiqueta: 'Captación', principal: 0, detalle: [] }]);
  assert.equal(z.color, 'rojo');
});

test('vuelve: fecha dd-mm en hora de Madrid', () => {
  assert.equal(vuelve('2026-11-10T08:00:00Z'), 'Vuelve el 10-11');
  assert.equal(vuelve('2026-11-09T23:30:00Z'), 'Vuelve el 10-11');
});

import { formulariosWeb } from '../app/vistas/hoy-pantalla.js';
test('formulariosWeb: suma 30 días por sitio, altas y contacto, guion (null) si el sitio no mide el evento', () => {
  const ahora = new Date('2026-10-21T12:00:00Z');
  const dias = [
    { sitio: '77delta.com', dia: '2026-10-20', clics_reservar: 2, envios_contacto: 1, envios_empleo: 0 },
    { sitio: '77delta.com', dia: '2026-10-01', clics_reservar: 1, envios_contacto: 1, envios_empleo: 0 },
    { sitio: '77delta.com', dia: '2026-08-01', clics_reservar: 9, envios_contacto: 9, envios_empleo: 9 },
    { sitio: 'docureal.77delta.com', dia: '2026-10-19', envios_docureal: 4 },
    { sitio: 'swarmix.co', dia: '2026-10-19', visitas: 5 },
  ];
  assert.deepEqual(formulariosWeb(dias, '77delta.com', ahora), { altas: null, contacto: 2 });
  assert.deepEqual(formulariosWeb(dias, 'docureal.77delta.com', ahora), { altas: 4, contacto: null });
  assert.deepEqual(formulariosWeb(dias, 'swarmix.co', ahora), { altas: null, contacto: null });
});
