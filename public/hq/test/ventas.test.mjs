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

test('etapas son las del enum ven_etapa', () => assert.deepEqual(V.ETAPAS, ['lista', 'contactada', 'respondio', 'reunion_agendada', 'reunion_hecha', 'propuesta_enviada', 'ganada', 'perdida', 'baja']));
test('alertas: 15 abiertas sin siguiente acción (la tarea hecha no cuenta)', () => assert.equal(V.alertas(ops, AHORA).sinTarea.length, 15));
test('tarea vencida se detecta por fecha, sin umbrales', () => {
  assert.equal(V.vencida({ vence: '2026-10-02' }, AHORA), true);
  assert.equal(V.vencida({ vence: '2026-10-03' }, AHORA), false);
});
test('render: 9 Lista, 6 Contactada, alerta de 15 y sin "false" suelto', async () => {
  const t = (await pintar(async () => DATOS)).textContent;
  assert.match(t, /9\|?Lista/); assert.match(t, /6\|?Contactada/);
  assert.match(t, /15 abiertas sin siguiente acción/); assert.doesNotMatch(t, /false/);
  for (let i = 0; i < 15; i++) assert.ok(t.includes('E' + i), 'E' + i);
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
