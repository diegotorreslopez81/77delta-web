// Web: visitas, visitantes y fuentes por sitio, leídas en directo de Umami a través de la vista hq_v_web
// (postgres_fdw) y la RPC hq_web(p_token, p_dias). Solo pinta; sin cálculo propio salvo sumar días.
import { el } from '../ui.js';

let carga = async (dias) => (await import('../api.js')).rpc('hq_web', { p_dias: dias });
export function usarCargador(fn) { if (fn) carga = fn; }
export const cargarWeb = () => carga(30);

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

const miles = x => new Intl.NumberFormat('es-ES').format(n(x));

// La RPC devuelve un array de días (forma vieja) o {dias, resumen} (v183).
export function separar(r) {
  if (Array.isArray(r)) return { dias: r, resumen: null };
  return { dias: (r && r.dias) || [], resumen: (r && r.resumen) || null };
}

// Un bloque por sitio: 30 días y totales del resumen de la RPC; sin resumen, 30 días sumados de las filas.
export function bloquesWeb(r, ahora = new Date()) {
  const { dias, resumen } = separar(r);
  const por = {};
  modeloWeb(dias, ahora).forEach(s => { por[s.sitio] = s; });
  const sitios = resumen && resumen.length ? resumen.map(x => x.sitio) : Object.keys(por);
  return sitios.map(sitio => {
    const x = (resumen || []).find(q => q.sitio === sitio);
    const s = por[sitio];
    const pct = x && x.variacion_pct != null ? n(x.variacion_pct) : null;
    return {
      sitio,
      visitas: x ? n(x.visitas_30d) : s ? s.s30.v : 0,
      visitantes: x ? n(x.visitantes_30d) : s ? s.s30.u : 0,
      visitas_total: x ? n(x.visitas_total) : null,
      visitantes_total: x ? n(x.visitantes_total) : null,
      variacion: pct,
    };
  }).sort((a, b) => b.visitas - a.visitas);
}

export const SITIOS = ['77delta.com', 'docureal.77delta.com', 'verifix.77delta.com', 'swarmix.co'];
export const anclaSitio = sitio => String(sitio).replace(/\./g, '');

// Bloques en orden fijo: los cuatro sitios siempre salen (a 0 si la RPC aún no los trae, p. ej. swarmix.co antes de v183).
export function bloquesOrdenados(r, ahora = new Date()) {
  const m = bloquesWeb(r, ahora), por = Object.fromEntries(m.map(b => [b.sitio, b]));
  const resto = m.filter(b => !SITIOS.includes(b.sitio));
  return [...SITIOS.map(sitio => por[sitio] || { sitio, visitas: 0, visitantes: 0, visitas_total: null, visitantes_total: null, variacion: null }), ...resto];
}

export function tarjeta(b) {
  const hijos = [
    el('h3', { text: b.sitio }),
    el('div', { class: 'v' }, [String(miles(b.visitas)), el('small', { text: 'visitas' })]),
    el('div', { class: 'l', text: miles(b.visitantes) + ' visitantes' }),
  ];
  if (b.variacion) {
    const sube = b.variacion > 0;
    hijos.push(el('div', { class: 'l web-var ' + (sube ? 'verde t-verde' : 'rojo t-rojo'), text: (sube ? '▲ +' : '▼ ') + b.variacion + ' %' }));
  }
  if (b.visitas_total != null) hijos.push(el('span', { class: 's', text: 'Total ' + miles(b.visitas_total) + ' visitas · ' + miles(b.visitantes_total) + ' visitantes' }));
  return el('a', { class: 'mini web-mini', href: '#operacion/ventas/web?sitio=' + anclaSitio(b.sitio) }, hijos);
}
export const rejillaWeb = (r, ahora) => el('div', { class: 'web-mini-grid' }, bloquesOrdenados(r, ahora).map(tarjeta));

// Vista completa (pestaña Web de Ventas): las mismas tarjetas y, debajo, una sección por sitio con fuentes y serie de 7 días.
export function vistaWeb(raiz, r, filtros = {}, ahora = new Date()) {
  raiz.append(rejillaWeb(r, ahora));
  const por = Object.fromEntries(modeloWeb(separar(r).dias, ahora).map(s => [s.sitio, s]));
  bloquesOrdenados(r, ahora).forEach(b => {
    const s = por[b.sitio];
    const sec = el('section', { class: 'home-bloque web-sitio' + (filtros.sitio === anclaSitio(b.sitio) ? ' destacado' : ''), id: 'web-' + anclaSitio(b.sitio) }, [el('h2', { text: b.sitio })]);
    if (s && s.fuentes.length) sec.append(el('table', { class: 'vt-tabla' }, [el('tr', {}, ['Fuente (7 días)', 'Visitas'].map(h => el('th', { text: h }))), ...s.fuentes.map(f => el('tr', {}, [f.fuente, f.n].map(x => el('td', { text: String(x) }))))]));
    else sec.append(el('p', { class: 'vt-nota', text: 'Sin fuentes en los últimos 7 días.' }));
    if (s && s.dias.length) sec.append(el('p', { class: 'vt-nota', text: 'Por día: ' + s.dias.map(d => fdia(d.dia) + ' ' + d.v + '/' + d.u).join(' · ') }));
    raiz.append(sec);
    if (filtros.sitio === anclaSitio(b.sitio) && sec.scrollIntoView) setTimeout(() => sec.scrollIntoView(), 0);
  });
  raiz.append(el('p', { class: 'vt-nota', text: 'Eventos (clics y formularios) pendientes de Umami.' }));
}

export async function render(raiz) {
  raiz.append(el('h2', { text: 'Web' }));
  raiz.append(el('p', { class: 'vt-nota', text: 'Umami en directo (visitas y visitantes por sitio).' }));
  const caja = el('div', { class: 'web-bloques' });
  raiz.append(caja);
  caja.append(el('p', { class: 'vt-nota', text: 'Cargando...' }));
  let r;
  try { r = await carga(DIAS); } catch (e) { caja.innerHTML = ''; caja.append(el('p', { class: 'vt-nota', text: 'No se ha podido leer Umami: ' + (e.message || e) })); return; }
  const m = bloquesWeb(r);
  caja.innerHTML = '';
  if (!m.length) { caja.append(el('p', { class: 'vt-nota', text: 'Sin datos de Umami en los últimos 30 días.' })); return; }
  m.forEach(b => caja.append(tarjeta(b)));
}
