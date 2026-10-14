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

export async function renderTwenty(caja, carga, ahora = new Date()) {
  const m = modeloTwenty(await carga());
  caja.innerHTML = '';
  const min = haceMinutos(m.actualizado, ahora);
  caja.append(el('p', { class: 'vt-nota', text: min === null ? 'Twenty: sin datos todavía.' : 'Twenty: datos de hace ' + min + ' min.' }));
  if (m.etapas.length) {
    const ul = el('ul', { class: 'vt-lista' });
    for (const x of m.etapas) ul.append(el('li', { text: x.etapa + ': ' + x.n + ' · ' + euros(x.importe) }));
    caja.append(el('h2', { text: 'Oportunidades por etapa' }), ul);
  }
  const lista = (titulo, items, f) => { if (!items.length) return; const ul = el('ul', { class: 'vt-lista' }); items.forEach(i => ul.append(el('li', { text: f(i) }))); caja.append(el('h2', { text: titulo }), ul); };
  lista('Últimas actividades', m.actividades, a => [a.fecha, a.tipo, a.titulo].filter(Boolean).join(' · '));
  lista('Próximos toques', m.toques, t => [t.fecha, t.persona, t.titulo].filter(Boolean).join(' · '));
  const pp = m.leads.por_prioridad || {};
  if (Object.keys(pp).length) caja.append(el('h2', { text: 'Leads por prioridad' }), el('p', { text: Object.entries(pp).map(([k, v]) => k + ': ' + v).join(' · ') }));
}
