import test from 'node:test';
import assert from 'node:assert/strict';
// #2239 Visor CRM de ventas: columnas por etapa, alertas, actividad y estado de error.
function crearNodo(tag) {
  const n = { tag, nodeType: 1, children: [], attrs: {}, className: '', _text: '',
    setAttribute(k, v) { this.attrs[k] = v; }, addEventListener() {},
    append(...kids) { for (const k of kids) if (k != null) this.children.push(k); },
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('|') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    set innerHTML(v) { this.children = []; this._text = ''; }, get innerHTML() { return ''; } };
  return n;
}
globalThis.document = { createElement: t => crearNodo(t), createTextNode: d => ({ nodeType: 3, data: d }) };
const V = await import('../app/vistas/ventas.js');
const AHORA = new Date('2026-10-03T09:00:00Z');
const ops = Array.from({ length: 15 }, (_, i) => ({ id: i, empresa: 'E' + i, dominio: 'e' + i + '.com', etapa: i < 9 ? 'lista' : 'contactada',
  f_lista: '2026-10-01T10:00:00+00:00', f_contactada: i < 9 ? null : '2026-10-02T11:43:00+00:00',
  ultima: i < 9 ? null : { quien: 'enviar-dia1', motivo: 'email día 1', cuando: '2026-10-02T11:43:00+00:00' },
  transiciones: i < 9 ? [] : [{ de: 'lista', a: 'contactada', quien: 'enviar-dia1', motivo: 'email día 1', cuando: '2026-10-02T11:43:00+00:00' }],
  tareas: i === 14 ? [{ accion: 'INVpack', quien: 'carla', creado: '2026-10-02T12:00:00+00:00', hecha_en: '2026-10-02T13:00:00+00:00', vence: null }] : [], cambios: [] }));
const act = [...Array.from({ length: 6 }, (_, i) => ({ tipo: 'transicion', cuando: '2026-10-02T11:4' + i + ':00+00:00', empresa: 'E' + (9 + i), quien: 'enviar-dia1', de: 'lista', a: 'contactada', motivo: 'm' })),
  { tipo: 'tarea_hecha', cuando: '2026-10-02T13:00:00+00:00', empresa: 'E14', quien: 'carla', accion: 'INVpack' }];
const DATOS = { meta: { n: 50, fecha: '2026-12-31' }, oportunidades: ops, actividad: act };
const pintar = async c => { V.usarCargador(c); const raiz = crearNodo('main'); await V.render(raiz, AHORA); return raiz; };

test('etapas son las del enum ven_etapa', () => assert.deepEqual(V.ETAPAS, ['lista', 'contactada', 'respondio', 'reunion_agendada', 'reunion_hecha', 'propuesta_redaccion', 'propuesta_enviada', 'negociacion', 'ganada', 'perdida', 'baja']));
test('abiertas son las 8 primeras', () => assert.equal(V.ABIERTAS.length, 8));
test('modeloCampana: etapas nuevas', () => { const c = V.modeloCampana({ clave: 'a', etapas: { negociacion: 2, propuesta_redaccion: 1, perdida: 1 }, tareas_vencidas: 3 }); assert.equal(c.etapas.find(e => e.etapa === 'negociacion').n, 2); assert.equal(c.etapas.find(e => e.etapa === 'propuesta_redaccion').nombre, 'Propuesta en redacción'); assert.equal(c.perdidas, 1); assert.equal(c.vencidas, 3); });
test('alertas: 15 abiertas sin siguiente acción (la tarea hecha no cuenta)', () => assert.equal(V.alertas(ops, AHORA).sinTarea.length, 15));
test('tarea vencida se detecta por fecha, sin umbrales', () => {
  assert.equal(V.vencida({ vence: '2026-10-02' }, AHORA), true);
  assert.equal(V.vencida({ vence: '2026-10-03' }, AHORA), false);
});
// #2672: la pestaña Pipeline lee hq_crm_pipeline (etapa, orden, tipo_lead, n, importe), no ven_hq.
const VP = await import('../app/vistas/ventas-pipeline.js');
const PIPE = [
  { etapa: 'PROPOSAL', orden: 4, tipo_lead: 'twenty-2026-05', n: 15, importe: '112000.00' }, { etapa: 'SCREENING', orden: 2, tipo_lead: 'piloto-carla', n: 168, importe: '0.0' },
  { etapa: 'SCREENING', orden: 2, tipo_lead: 'twenty-2026-05', n: 18, importe: '144000.0' }, { etapa: 'PROPOSAL', orden: 4, tipo_lead: 'piloto-carla', n: 1, importe: '14500' },
  { etapa: 'LOST', orden: 9, tipo_lead: 'piloto-carla', n: 14, importe: '0' },
  { etapa: 'CUSTOMER', orden: 8, tipo_lead: 'twenty-2026-05', n: 9, importe: '67438' },
];
test('Pipeline: columnas por orden con n e importe sumados y sin "false" suelto', async () => {
  const m = VP.modeloPipeline(PIPE); assert.deepEqual(m.map(c => c.nombre), ['Cribado', 'Propuesta', 'Cliente', 'Perdida']);
  assert.equal(m[0].n, 186); assert.equal(m[0].importe, 144000); assert.equal(m[1].importe, 126500); assert.equal(m[0].tipos[0].tipo, 'piloto-carla');
  const raiz = crearNodo('main'); VP.usarCargador(async () => PIPE); await V.render(raiz, AHORA, 'pipeline'); const t = raiz.textContent;
  assert.match(t, /Cribado\|186/); assert.match(t, /126\.500 €/); assert.doesNotMatch(t, /false|NaN|undefined|No se pudo leer/);
});
test('Pipeline: Propuestas enviadas = solo PROPOSAL (16 / 126.500 €); clientes aparte; funnel intacto', async () => {
  const raiz = crearNodo('main'); VP.usarCargador(async () => PIPE); await V.render(raiz, AHORA, 'pipeline'); const t = raiz.textContent;
  assert.match(t, /Propuestas enviadas/); assert.doesNotMatch(t, /Oportunidades abiertas/); assert.match(t, /Importe en juego/); assert.match(t, /Cribado\|186/); assert.match(t, /9|Clientes/); assert.match(t, /67\.438 €|Importe clientes/);
});
test('Pipeline: acepta {pipeline:[...]}, vacío muestra aviso y un fallo de la RPC un aviso rojo', async () => {
  let raiz = crearNodo('main'); VP.usarCargador(async () => ({ pipeline: PIPE })); await V.render(raiz, AHORA, 'pipeline'); assert.match(raiz.textContent, /Cribado/);
  raiz = crearNodo('main'); VP.usarCargador(async () => []); await V.render(raiz, AHORA, 'pipeline'); assert.match(raiz.textContent, /Sin oportunidades en el pipeline/);
  raiz = crearNodo('main'); VP.usarCargador(async () => { throw new Error('boom'); }); await V.render(raiz, AHORA, 'pipeline'); assert.match(raiz.textContent, /No se pudo leer el pipeline \(boom\)/);
});
const OP = { ...ops[10], id: 99, empresa: 'Alcalá', etapa: 'reunion_agendada', campana: 'privado', carpeta_url: 'https://drive.google.com/drive/folders/abc', buzon: 'x@77delta.com',
  envios: [{ de: 'cuenta@77delta.com', toque: 1, estado: 'enviado', enviado_en: '2026-10-02T09:00:00Z', respondido_en: '2026-10-03T08:00:00Z', asunto: 'Hola Marta' }],
  tareas: [{ accion: 'Llamar', quien: 'diego', vence: '2026-10-02', creado: '2026-10-01T10:00:00Z', hecha_en: null }] };
const D2 = { ...DATOS, oportunidades: [OP, ...ops], campanas: [{ clave: 'privado', nombre: 'Privado', activa: true, franja: [8, 19], tope_dia: 20, toques: 2, dias_toque: [0, 7], firmante: 'Aina', plantillas_aprobadas: {}, envios: { enviado: 1 }, etapas: { reunion_agendada: 1 } }] };
test('Hoy: tarea vencida de Diego, contadores y raíl; sin correos ni cuentas', async () => {
  const raiz = crearNodo('main'); V.usarCargador(async () => D2); await V.render(raiz, AHORA); const t = raiz.textContent;
  assert.match(t, /Necesita a una persona/); assert.match(t, /Vencida/); assert.match(t, /Alcalá/); assert.match(t, /Sale solo hoy/); assert.match(t, /Hoy no se envía|Empieza a las|Enviando|Hecho|Nada aprobado/);
  assert.doesNotMatch(t, /@|Hola Marta/);
});
// #2661: la pestaña Campañas lee hq_crm_funnel ({campanas:[...]}); el texto 2 pendiente de OK ya no se pinta aquí.
const VC = await import('../app/vistas/ventas-campanas.js');
const FILAS = [
  { nombre: 'Antigua', canal: 'gmail-api', fecha_inicio: '2026-09-01', viva: false, contactados: 10, respondidos: 1, tasa_respuesta_pct: 10 },
  { nombre: 'Viva', canal: 'whatsapp', fecha_inicio: '2026-10-01', viva: true, contactados: 40, respondidos: 8, reuniones: 2, propuestas_n: 1, propuestas_importe: 12000, clientes_n: 1, tasa_respuesta_pct: 20 },
];
test('Campañas: tarjetas del embudo desde hq_crm_funnel, vivas primero y columnas ausentes con guion', async () => {
  const raiz = crearNodo('main'); VC.usarCargador(async () => ({ campanas: FILAS })); await V.render(raiz, AHORA, 'campanas'); const t = raiz.textContent;
  assert.ok(t.indexOf('Viva') < t.indexOf('Antigua')); assert.match(t, /Contactados/); assert.match(t, /Clientes/); assert.match(t, /12\.?000 €/); assert.match(t, /Tasa de respuesta 20 %/);
  assert.match(t, /Reuniones\|[^|]*\|-/); assert.doesNotMatch(t, /No se pudo leer/);
});
test('Campañas: sin filas muestra "Sin campañas" y un fallo de la RPC un aviso, sin romper', async () => {
  let raiz = crearNodo('main'); VC.usarCargador(async () => ({ campanas: [] })); await V.render(raiz, AHORA, 'campanas'); assert.match(raiz.textContent, /Sin campañas/);
  raiz = crearNodo('main'); VC.usarCargador(async () => { throw new Error('boom'); }); await V.render(raiz, AHORA, 'campanas'); assert.match(raiz.textContent, /No se pudo leer las campañas \(boom\)/);
});
test('contadores: respuesta sin contestar y reunión agendada', () => { const k = V.contadores(D2.oportunidades); assert.equal(k.respuestas, 1); assert.equal(k.reuniones, 1); });
test('estadoRail: texto descriptivo por caso (decisión #462)', () => {
  const c = { clave: 'privado', franja: [8, 19], tope_dia: 10, enviados_hoy: 0 }, ap = [{ ...OP, envios: [{ estado: 'aprobado', programado: '2026-10-13T08:00:00Z' }, { estado: 'aprobado', programado: '2026-10-13T08:00:00Z' }] }];
  const E = (cc, ops, iso, fest) => V.estadoRail(cc, ops, new Date(iso), fest);
  assert.equal(E(c, ap, '2026-10-13T04:00:00Z').estado, 'Empieza a las 08:00');
  assert.equal(E(c, ap, '2026-10-13T10:00:00Z').estado, 'Enviando (0 de 2)');
  assert.equal(E(c, ap, '2026-10-13T10:00:00Z').tono, 'ambar');
  assert.equal(E(c, ap, '2026-10-13T18:00:00Z').estado, 'Faltaron envíos (0 de 2)');
  assert.equal(E(c, ap, '2026-10-13T18:00:00Z').tono, 'rojo');
  assert.equal(E({ ...c, enviados_hoy: 14 }, ap, '2026-10-13T18:00:00Z').estado, 'Tope del día enviado (14 de 2)');
  assert.equal(E({ ...c, enviados_hoy: 14 }, [], '2026-10-13T18:00:00Z').estado, 'Tope del día enviado (14 de 10)');
  assert.equal(E(c, [], '2026-10-13T10:00:00Z').estado, 'Nada aprobado para hoy');
  assert.equal(E({ ...c, enviados_hoy: 3 }, [], '2026-10-13T18:00:00Z').estado, 'Hecho (3 enviados)');
  assert.equal(E(c, ap, '2026-10-12T10:00:00Z', ['2026-10-12']).estado, 'Hoy no se envía (festivo)');
  assert.equal(E(c, ap, '2026-10-17T10:00:00Z').estado, 'Hoy no se envía (fin de semana)');
  const er = [{ ...OP, envios: [{ estado: 'error', programado: '2026-10-13T08:00:00Z', enviado_en: '2026-10-13T08:05:00Z' }] }];
  assert.equal(E(c, er, '2026-10-13T10:00:00Z').estado, 'Errores (1)');
});
test('embudo acumulado: tira por etapa_max y campaña por alcanzadas', () => {
  const m = V.modeloCampana({ clave: 'x', etapas: { lista: 1, contactada: 0 }, alcanzadas: { lista: 69, contactada: 69, respondio: 3 } });
  assert.deepEqual(m.etapas.slice(0, 3).map(e => e.n), [69, 69, 3]);
  assert.deepEqual(V.modeloCampana({ clave: 'y', etapas: { lista: 5 } }).etapas[0].n, 5);
});
test('indicadores: importe en juego, tasa y mediana', () => {
  const l = [{ etapa: 'negociacion', importe: 100, f_contactada: '2026-10-01T00:00:00Z', f_respondio: '2026-10-03T00:00:00Z' }, { etapa: 'contactada', f_contactada: '2026-10-01T00:00:00Z' }];
  const i = V.indicadores(l, { n: 50 }); assert.equal(i.juego, 100); assert.equal(i.tasa, 50); assert.equal(i.mediana, 2);
});
test('textoEvento: 6 "Lista a Contactada" y tarea hecha INVpack', () => {
  const t = act.map(V.textoEvento);
  assert.equal(t.filter(x => x.startsWith('Lista a Contactada')).length, 6);
  assert.ok(t.includes('tarea hecha: INVpack'));
});
test('cronología de la ficha incluye transición y tarea hecha', () => {
  assert.equal(V.cronologia(ops[9]).length, 1);
  assert.deepEqual(V.cronologia(ops[14]).map(e => e.tipo).sort(), ['tarea_creada', 'tarea_hecha', 'transicion']);
});
test('RPC caída: aviso, no pantalla vacía', async () => assert.match((await pintar(async () => { throw new Error('boom'); })).textContent, /No se pudo leer el embudo de ventas \(boom\)/));
test('render llamado como main.js (2º arg = estado) no da NaN', async () => {
  V.usarCargador(async () => DATOS); const raiz = crearNodo('main'); await V.render(raiz, { clave: 'x' }, undefined, {});
  assert.doesNotMatch(raiz.textContent, /NaN/);
});
test('ficha sin movimientos dice Sin movimientos', async () => {
  const sin = { ...DATOS, oportunidades: [ops[0]] }; V.usarCargador(async () => sin);
  const raiz = crearNodo('main'); await V.render(raiz, AHORA); assert.doesNotMatch(raiz.textContent, /No se pudo leer/);
});
