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
test('Pipeline: embudo 9 Lista, 6 Contactada y sin "false" suelto', async () => {
  const raiz = crearNodo('main'); V.usarCargador(async () => DATOS); await V.render(raiz, AHORA, 'pipeline'); const t = raiz.textContent;
  assert.match(t, /9\|?Lista/); assert.match(t, /6\|?Contactada/); assert.doesNotMatch(t, /false|NaN|undefined/);
});
const OP = { ...ops[10], id: 99, empresa: 'Alcalá', etapa: 'reunion_agendada', campana: 'privado', carpeta_url: 'https://drive.google.com/drive/folders/abc', buzon: 'x@77delta.com',
  envios: [{ de: 'cuenta@77delta.com', toque: 1, estado: 'enviado', enviado_en: '2026-10-02T09:00:00Z', respondido_en: '2026-10-03T08:00:00Z', asunto: 'Hola Marta' }],
  tareas: [{ accion: 'Llamar', quien: 'diego', vence: '2026-10-02', creado: '2026-10-01T10:00:00Z', hecha_en: null }] };
const D2 = { ...DATOS, oportunidades: [OP, ...ops], campanas: [{ clave: 'privado', nombre: 'Privado', activa: true, franja: [8, 19], tope_dia: 20, toques: 2, dias_toque: [0, 7], firmante: 'Aina', plantillas_aprobadas: {}, envios: { enviado: 1 }, etapas: { reunion_agendada: 1 } }] };
test('Hoy: tarea vencida de Diego, contadores y raíl; sin correos ni cuentas', async () => {
  const raiz = crearNodo('main'); V.usarCargador(async () => D2); await V.render(raiz, AHORA); const t = raiz.textContent;
  assert.match(t, /Necesita a una persona/); assert.match(t, /Vencida/); assert.match(t, /Alcalá/); assert.match(t, /Sale solo hoy/); assert.match(t, /En espera|Enviando|Hecho/);
  assert.doesNotMatch(t, /@|Hola Marta/);
});
test('Campañas: texto 2 pendiente de OK y sin cuenta de envío', async () => {
  const raiz = crearNodo('main'); V.usarCargador(async () => D2); await V.render(raiz, AHORA, 'campanas'); const t = raiz.textContent;
  assert.match(t, /Texto 2 pendiente de OK/); assert.match(t, /Aina/); assert.doesNotMatch(t, /@/);
});
test('contadores: respuesta sin contestar y reunión agendada', () => { const k = V.contadores(D2.oportunidades); assert.equal(k.respuestas, 1); assert.equal(k.reuniones, 1); });
test('estadoRail: antes de la franja En espera, pasada con aprobados sin enviar Parado', () => {
  const c = { clave: 'privado', franja: [8, 19], tope_dia: 20, enviados_hoy: 0 }, ap = [{ ...OP, envios: [{ estado: 'aprobado', programado: '2026-10-03T08:00:00Z' }] }];
  assert.equal(V.estadoRail(c, ap, new Date('2026-10-03T04:00:00Z')).estado, 'En espera');
  assert.equal(V.estadoRail(c, ap, new Date('2026-10-03T18:00:00Z')).estado, 'Parado');
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
