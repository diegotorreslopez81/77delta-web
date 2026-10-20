// Pestaña Campañas de Ventas (encargo #2661, spec f2 2.3): una tarjeta por campaña con el embudo en 5 pasos.
// Todo sale de la RPC hq_crm_funnel (vista hq_v_crm_funnel_campana); la vista solo pinta. Una columna que la vista aún no trae
// se muestra como "-" sin romper nada, para que Bernat la añada sin cambiar este contrato.
import { el } from '../ui.js';

let carga = async () => (await import('../api.js')).rpc('hq_crm_funnel');
// La RPC devuelve {campanas: [...]}; se acepta también un array suelto.
const filasDe = r => (Array.isArray(r) ? r : Array.isArray(r?.campanas) ? r.campanas : []);
export function usarCargador(fn) { if (fn) carga = fn; }
export const cargarCampanas = async () => filasDe(await carga());

const num = v => (v == null || v === '' || isNaN(Number(v)) ? null : Number(v));
const euros = n => Number(n).toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';
const fdia = f => (f ? String(f).slice(0, 10).split('-').reverse().join('-') : '');

export function pasosCampana(c) {
  const imp = num(c.propuestas_importe);
  return [
    { clave: 'contactados', nombre: 'Contactados', n: num(c.contactados) },
    { clave: 'respondidos', nombre: 'Respondidos', n: num(c.respondidos) },
    { clave: 'reuniones', nombre: 'Reuniones', n: num(c.reuniones) },
    { clave: 'propuestas', nombre: 'Propuestas', n: num(c.propuestas_n), extra: imp != null && imp > 0 ? euros(imp) : '' },
    { clave: 'clientes', nombre: 'Clientes', n: num(c.clientes_n) },
  ];
}

// Vivas primero, luego fecha_inicio descendente.
export function ordenarCampanas(filas) {
  const viva = c => (c.viva === true || c.viva === 't' || c.estado === 'viva' ? 1 : 0);
  return [...(filas || [])].sort((a, b) => (viva(b) - viva(a)) || String(b.fecha_inicio || '').localeCompare(String(a.fecha_inicio || '')));
}

export function tasaRespuesta(c) {
  const t = num(c.tasa_respuesta_pct);
  if (t != null) return t;
  const cont = num(c.contactados), resp = num(c.respondidos);
  return cont ? Math.round(1000 * (resp || 0) / cont) / 10 : null;
}

function tarjeta(c) {
  const pasos = pasosCampana(c), base = pasos[0].n || 0, tasa = tasaRespuesta(c);
  const cab = [c.canal, c.fecha_inicio ? 'desde ' + fdia(c.fecha_inicio) : ''].filter(Boolean).join(' · ');
  return el('section', { class: 'vt-bloque vt-camp-tarjeta' }, [
    el('h2', { text: c.nombre || 'Campaña sin nombre' }),
    cab ? el('p', { class: 'vt-camp-cab', text: cab }) : null,
    ...pasos.map(p => el('div', { class: 'vt-paso' }, [
      el('span', { class: 'vt-paso-n', text: p.nombre }),
      el('span', { class: 'vt-paso-barra' }, [el('i', { style: `width:${base && p.n ? Math.max(2, Math.min(100, Math.round(100 * p.n / base))) : 0}%` })]),
      el('span', { class: 'vt-paso-v', text: (p.n == null ? '-' : String(p.n)) + (p.extra ? ' · ' + p.extra : '') }),
    ])),
    el('p', { class: 'vt-camp-pie', text: `Tasa de respuesta ${tasa == null ? '-' : String(tasa).replace('.', ',') + ' %'}` + (num(c.rebotados ?? c.rebotes) ? ` · Rebotes ${num(c.rebotados ?? c.rebotes)}` : '') }),
  ]);
}

export function vistaCampanas(raiz, filas) {
  const ord = ordenarCampanas(filas);
  if (!ord.length) { raiz.append(el('p', { class: 'vt-vacio', text: 'Sin campañas.' })); return; }
  raiz.append(...ord.map(tarjeta));
}
