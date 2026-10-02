import test from 'node:test';
import assert from 'node:assert/strict';
// #2236 Ventas: orden de etapas, enviados por día y estados de pantalla (datos y RPC caída).
function crearNodo(tag) {
  const n = { tag, nodeType: 1, children: [], attrs: {}, className: '', _text: '',
    setAttribute(k, v) { this.attrs[k] = v; }, addEventListener() {},
    append(...kids) { for (const k of kids) if (k != null) this.children.push(k); },
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    set innerHTML(v) { this.children = []; this._text = ''; }, get innerHTML() { return ''; } };
  return n;
}
globalThis.document = { createElement: t => crearNodo(t), createTextNode: d => ({ nodeType: 3, data: d }) };
const V = await import('../app/vistas/ventas.js');
const DATOS = { meta: { n: 50, fecha: '2026-12-31' }, por_etapa: { contactada: 6, lista: 9 }, enviados_por_dia: [{ dia: '2026-10-02', buzon: 'a', n: 4 }, { dia: '2026-10-02', buzon: 'b', n: 2 }],
  abiertas: Array.from({ length: 15 }, (_, i) => ({ id: i, empresa: 'E' + i, etapa: i < 9 ? 'lista' : 'contactada', siguiente: null })), ultimas_transiciones: [] };
const pintar = async c => { V.usarCargador(c); const raiz = crearNodo('main'); await V.render(raiz); return raiz; };

test('etapasOrdenadas: orden del embudo, no el del objeto', () => assert.deepEqual(V.etapasOrdenadas({ contactada: 6, lista: 9 }), [['lista', 9], ['contactada', 6]]));
test('enviadosPorDia suma buzones del mismo día', () => assert.deepEqual(V.enviadosPorDia(DATOS.enviados_por_dia), [['2026-10-02', 6]]));
test('render muestra las 15 oportunidades abiertas', async () => {
  const t = (await pintar(async () => DATOS)).textContent;
  assert.match(t, /Oportunidades abiertas · 15/); for (let i = 0; i < 15; i++) assert.ok(t.includes('E' + i + 'Lista') || t.includes('E' + i + 'Contactada'), 'E' + i);
});
test('RPC caída: aviso, no pantalla vacía', async () => assert.match((await pintar(async () => { throw new Error('boom'); })).textContent, /No se pudo leer el embudo de ventas \(boom\)/));
