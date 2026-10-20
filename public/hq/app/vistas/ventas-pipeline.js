// Pestaña Pipeline de Ventas (encargo #2672): lee la RPC hq_crm_pipeline (vista hq_v_crm_pipeline), sin ven_hq.
// Filas: etapa, orden, tipo_lead, n, importe. El front solo agrupa por etapa y pinta; no calcula negocio.
import { el } from '../ui.js';

let carga = async () => (await import('../api.js')).rpc('hq_crm_pipeline');
export function usarCargador(fn) { if (fn) carga = fn; }
// La RPC puede devolver un array o un objeto con el array dentro (como hq_crm_funnel); se acepta ambos.
const filasDe = r => (Array.isArray(r) ? r : Array.isArray(r?.pipeline) ? r.pipeline : Array.isArray(r?.filas) ? r.filas : Object.values(r || {}).find(Array.isArray) || []);
export const cargarPipeline = async () => filasDe(await carga());

const NOMBRES = { SCREENING: 'Cribado', MEETING: 'Reunión', PROPOSAL: 'Propuesta', CUSTOMER: 'Cliente', LOST: 'Perdida' };
const num = v => (v == null || v === '' || isNaN(Number(v)) ? 0 : Number(v));
const euros = n => Number(n).toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';

// Una columna por etapa, por orden ascendente; dentro, los tipos de lead de mayor a menor n.
export function modeloPipeline(filas) {
  const por = new Map();
  for (const f of filas || []) {
    const k = f.etapa ?? '';
    if (!por.has(k)) por.set(k, { etapa: k, nombre: NOMBRES[String(k).toUpperCase()] || String(k), orden: num(f.orden), n: 0, importe: 0, tipos: [] });
    const c = por.get(k); c.n += num(f.n); c.importe += num(f.importe);
    c.tipos.push({ tipo: f.tipo_lead || 'sin tipo', n: num(f.n), importe: num(f.importe) });
  }
  const cols = [...por.values()].sort((a, b) => a.orden - b.orden);
  for (const c of cols) c.tipos.sort((a, b) => b.n - a.n);
  return cols;
}

function columna(c) {
  return el('section', { class: 'vt-col' }, [
    el('h2', {}, [el('span', { text: c.nombre }), el('span', { class: 'vt-k', text: String(c.n) })]),
    el('p', { class: 'vt-pipe-imp', text: c.importe > 0 ? euros(c.importe) : '-' }),
    el('div', { class: 'vt-cards' }, c.tipos.map(t => el('div', { class: 'vt-card compacta vt-pipe-tipo' }, [
      el('div', { class: 'vt-cab' }, [el('b', { text: t.tipo }), el('span', { class: 'vt-dias', text: t.importe > 0 ? euros(t.importe) : '' })]),
      el('div', { class: 'vt-fila' }, [el('span', { class: 'vt-sig', text: t.n + (t.n === 1 ? ' oportunidad' : ' oportunidades') })])]))),
  ]);
}

export function vistaPipeline(raiz, filas) {
  const cols = modeloPipeline(filas);
  if (!cols.length) { raiz.append(el('p', { class: 'vt-vacio', text: 'Sin oportunidades en el pipeline.' })); return; }
  const de = (...e) => cols.filter(c => e.includes(String(c.etapa).toUpperCase()));
  const abiertas = de('PROPOSAL'), clientes = de('CUSTOMER');
  const suma = (cs, k) => cs.reduce((s, c) => s + c[k], 0);
  raiz.append(
    el('div', { class: 'vt-indicadores' }, [['Propuestas enviadas', String(suma(abiertas, 'n'))], ['Importe en juego', euros(suma(abiertas, 'importe'))], ['Clientes', String(suma(clientes, 'n'))], ['Importe clientes', euros(suma(clientes, 'importe'))]]
      .map(([l, v]) => el('div', { class: 'vt-cont' }, [el('span', { class: 'vt-n', text: v }), el('span', { class: 'vt-l', text: l })]))),
    el('div', { class: 'vt-tablero' }, cols.map(columna)));
}
