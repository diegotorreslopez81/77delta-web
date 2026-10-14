// Ventas leyendo Twenty vía resumen en Supabase (RPC ven_twenty_hq, schema-v150). Interruptor hq.ventasTwenty, apagado por defecto.
// Spec: 77delta/docs/empresa/hq-ventas-twenty.md. Con la tabla vacía pinta "sin datos" sin romperse.
import { el } from '../ui.js';

export function ventasTwentyActivo() {
  try {
    const q = typeof location !== 'undefined' && /[?&]ventasTwenty=([01])/.exec(location.search || '');
    if (q) { try { localStorage.setItem('hq.ventasTwenty', q[1]); } catch {} return q[1] === '1'; }
    return localStorage.getItem('hq.ventasTwenty') === '1';
  } catch { return false; }
}

export const haceMinutos = (iso, ahora = new Date()) => iso ? Math.max(0, Math.round((ahora - new Date(iso)) / 60000)) : null;
const euros = n => Number(n || 0).toLocaleString('es-ES') + ' €';

export function modeloTwenty(d = {}) {
  const e = d.etapas || {};
  const orden = Array.isArray(e.orden) ? e.orden : Object.keys(e.por_etapa || {});
  return {
    etapas: orden.map(k => ({ etapa: k, n: e.por_etapa?.[k]?.n || 0, importe: e.por_etapa?.[k]?.importe || 0 })),
    total: e.total ?? null,
    actividades: Array.isArray(d.actividades?.items) ? d.actividades.items : Array.isArray(d.actividades) ? d.actividades : [],
    toques: Array.isArray(d.toques?.items) ? d.toques.items : Array.isArray(d.toques) ? d.toques : [],
    leads: d.leads || {},
    actualizado: d.actualizado || null,
  };
}

const fdia = iso => iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) : '';
const unir = (...x) => x.filter(Boolean).join(' · ');
export const lineaActividad = a => unir(fdia(a.cuando), a.tipo, a.titulo, a.empresa, a.persona);
export const lineaToque = t => unir(fdia(t.vence), t.accion, t.empresa, t.persona, t.responsable);
export const lineaLead = l => unir(l.prioridad, l.empresa, l.etapa, l.ultimo_toque && 'último ' + fdia(l.ultimo_toque));

export function hayDatos(m) {
  return !!(m.etapas.length || m.actividades.length || m.toques.length || Object.keys(m.leads.por_prioridad || {}).length || (m.leads.top || []).length);
}

export async function renderTwenty(caja, carga, ahora = new Date()) {
  const m = modeloTwenty(await carga());
  caja.innerHTML = '';
  if (!hayDatos(m)) { caja.append(el('p', { class: 'vt-nota', text: 'Sin datos aún del job de Twenty. Se rellena solo cuando el job escriba la primera fila (cada 15 min).' })); return; }
  const min = haceMinutos(m.actualizado, ahora);
  caja.append(el('p', { class: 'vt-nota', text: min === null ? 'Twenty: sin hora de actualización.' : 'Twenty: datos de hace ' + min + ' min.' }));
  const bloque = (titulo, items, f) => {
    caja.append(el('h2', { text: titulo }));
    if (!items.length) { caja.append(el('p', { class: 'vt-nota', text: 'Sin datos.' })); return; }
    const ul = el('ul', { class: 'vt-lista' }); items.forEach(i => ul.append(el('li', { text: f(i) }))); caja.append(ul);
  };
  bloque('Oportunidades por etapa', m.etapas, x => x.etapa + ': ' + x.n + ' · ' + euros(x.importe));
  bloque('Últimas actividades', m.actividades, lineaActividad);
  bloque('Próximos toques', m.toques, lineaToque);
  const pp = Object.entries(m.leads.por_prioridad || {}).map(([k, v]) => ({ k, v }));
  bloque('Leads por prioridad', pp, x => x.k + ': ' + x.v);
  if ((m.leads.top || []).length) bloque('Leads destacados', m.leads.top, lineaLead);
}
