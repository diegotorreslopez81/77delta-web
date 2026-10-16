// Web: visitas, visitantes y fuentes por sitio, leídas en directo de Umami a través de la vista hq_v_web
// (postgres_fdw) y la RPC hq_web(p_token, p_dias). Solo pinta; sin cálculo propio salvo sumar días.
import { el } from '../ui.js';

let carga = async (dias) => (await import('../api.js')).rpc('hq_web', { p_dias: dias });
export function usarCargador(fn) { if (fn) carga = fn; }

const DIAS = 30;
const hoyMadrid = ahora => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(ahora);
const fdia = iso => iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) : '';
const n = x => Number(x) || 0;

// Agrupa las filas (una por día y sitio) en un resumen por sitio: hoy, 7 y 30 días, y fuentes de 7 días.
export function modeloWeb(filas, ahora = new Date()) {
  const hoy = hoyMadrid(ahora);
  const corte = d => hoyMadrid(new Date(ahora.getTime() - (d - 1) * 86400000));
  const d7 = corte(7), d30 = corte(30);
  const sitios = {};
  (filas || []).forEach(f => {
    const s = sitios[f.sitio] || (sitios[f.sitio] = { sitio: f.sitio, hoy: { v: 0, u: 0 }, s7: { v: 0, u: 0 }, s30: { v: 0, u: 0 }, fuentes: {}, dias: [] });
    const v = n(f.visitas), u = n(f.visitantes);
    if (f.dia === hoy) { s.hoy.v += v; s.hoy.u += u; }
    if (f.dia >= d7) {
      s.s7.v += v; s.s7.u += u;
      (f.fuentes_top || []).forEach(x => { s.fuentes[x.fuente] = (s.fuentes[x.fuente] || 0) + n(x.n); });
      s.dias.push({ dia: f.dia, v, u });
    }
    if (f.dia >= d30) { s.s30.v += v; s.s30.u += u; }
  });
  return Object.values(sitios).map(s => ({
    ...s,
    fuentes: Object.entries(s.fuentes).map(([fuente, n]) => ({ fuente, n })).sort((a, b) => b.n - a.n).slice(0, 5),
    dias: s.dias.sort((a, b) => b.dia.localeCompare(a.dia)),
  })).sort((a, b) => b.s30.v - a.s30.v);
}

function tarjeta(s) {
  const caja = el('div', { class: 'vt-card compacta web-sitio' });
  caja.append(el('h3', { text: s.sitio }));
  const t = el('table', { class: 'tabla-lic web-tabla' });
  t.append(el('tr', {}, [el('th', { text: '' }), el('th', { text: 'Hoy' }), el('th', { text: '7 días' }), el('th', { text: '30 días' })]));
  t.append(el('tr', {}, [el('td', { text: 'Visitas' }), el('td', { text: String(s.hoy.v) }), el('td', { text: String(s.s7.v) }), el('td', { text: String(s.s30.v) })]));
  t.append(el('tr', {}, [el('td', { text: 'Visitantes' }), el('td', { text: String(s.hoy.u) }), el('td', { text: String(s.s7.u) }), el('td', { text: String(s.s30.u) })]));
  caja.append(t);
  caja.append(el('p', { class: 'vt-nota', text: s.fuentes.length ? 'Fuentes (7 días): ' + s.fuentes.map(f => f.fuente + ' ' + f.n).join(' · ') : 'Fuentes (7 días): sin datos.' }));
  if (s.dias.length) caja.append(el('p', { class: 'vt-nota', text: 'Por día (visitas / visitantes): ' + s.dias.map(d => fdia(d.dia) + ' ' + d.v + '/' + d.u).join(' · ') }));
  return caja;
}

export async function render(raiz) {
  raiz.append(el('h2', { text: 'Web' }));
  raiz.append(el('p', { class: 'vt-nota', text: 'Umami en directo (visitas y visitantes por sitio). Clics en Reservar y envíos de formularios llegarán cuando la web emita esos eventos.' }));
  const caja = el('div', { class: 'vt-cards' });
  raiz.append(caja);
  caja.append(el('p', { class: 'vt-nota', text: 'Cargando...' }));
  let filas;
  try { filas = await carga(DIAS); } catch (e) { caja.innerHTML = ''; caja.append(el('p', { class: 'vt-nota', text: 'No se ha podido leer Umami: ' + (e.message || e) })); return; }
  const m = modeloWeb(filas);
  caja.innerHTML = '';
  if (!m.length) { caja.append(el('p', { class: 'vt-nota', text: 'Sin datos de Umami en los últimos 30 días.' })); return; }
  m.forEach(s => caja.append(tarjeta(s)));
}
