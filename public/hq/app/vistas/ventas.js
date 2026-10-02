// Embudo de ventas privadas (encargo #2236, Carla dir-sales, Diego 02-10, decisión #287/#290): pestaña
// operacion/ventas. Lee las tablas ven_* por la RPC ven_hq (schema-v135, con p_token como el resto de vistas).
// Muestra la meta, el embudo por etapa, los enviados por día y las oportunidades abiertas con su siguiente acción.
// Sin dato o con la RPC caída se dice claro, no se deja la pantalla vacía.
import { el, fecha } from '../ui.js';
import { panel, cifra, filaBarra } from '../cuadro.js';

let carga = async () => (await import('../api.js')).rpc('ven_hq');
export function usarCargador(fn) { if (fn) carga = fn; }

const ETAPAS = ['lista', 'contactada', 'respondida', 'reunion', 'propuesta', 'ganada', 'perdida', 'baja'];
const NOMBRE = { lista: 'Lista', contactada: 'Contactada', respondida: 'Respondida', reunion: 'Reunión', propuesta: 'Propuesta', ganada: 'Ganada', perdida: 'Perdida', baja: 'Baja' };
const etapa = e => NOMBRE[e] || e;
export function etapasOrdenadas(porEtapa) {
  const p = porEtapa || {}, claves = Object.keys(p);
  return [...ETAPAS.filter(e => e in p), ...claves.filter(e => !ETAPAS.includes(e)).sort()].map(e => [e, Number(p[e]) || 0]);
}
export function enviadosPorDia(filas) {
  const m = new Map();
  for (const f of filas || []) m.set(f.dia, (m.get(f.dia) || 0) + (Number(f.n) || 0));
  return [...m.entries()].sort((a, b) => String(b[0]).localeCompare(String(a[0])));
}
const plural = (k, uno, varios) => `${k} ${k === 1 ? uno : varios}`;

function cuerpo(d, aviso) {
  const nodos = [], por = d?.por_etapa || {}, filas = etapasOrdenadas(por), abiertas = Array.isArray(d?.abiertas) ? d.abiertas : [];
  if (aviso) nodos.push(el('p', { class: 'aviso rojo', role: 'alert', text: aviso }));
  const ganadas = Number(por.ganada) || 0, meta = d?.meta?.n;
  nodos.push(panel('Clientes ganados', '#operacion/ventas', [cifra(meta ? `${ganadas} de ${meta}` : String(ganadas), meta && d.meta.fecha ? 'meta al ' + d.meta.fecha : null)]));
  nodos.push(panel('Oportunidades abiertas · ' + abiertas.length, '#operacion/ventas', [cifra(String(abiertas.length), plural(abiertas.length, 'oportunidad abierta', 'oportunidades abiertas'))]));
  const max = Math.max(1, ...filas.map(f => f[1]));
  nodos.push(el('section', { class: 'panel-kpi' }, [el('h2', { text: 'Embudo por etapa' }), ...filas.map(([e, k]) => filaBarra(etapa(e), String(k), Math.round(100 * k / max), 'tinta'))]));
  const env = enviadosPorDia(d?.enviados_por_dia);
  nodos.push(el('section', { class: 'panel-kpi' }, [el('h2', { text: 'Enviados por día (30 d)' }),
    env.length ? el('ul', { class: 'lista-corta' }, env.map(([dia, k]) => el('li', { text: `${dia} · ${plural(k, 'envío', 'envíos')}` }))) : el('p', { class: 'mudo', text: 'Todavía no hay envíos.' })]));
  nodos.push(el('h2', { text: 'Abiertas' }));
  nodos.push(abiertas.length ? el('ul', { class: 'lista-corta ventas-abiertas' }, abiertas.map(o => el('li', {}, [
    el('b', { text: o.empresa || o.dominio || '?' }), el('span', { class: 'pill', text: etapa(o.etapa) }),
    o.siguiente?.accion ? el('span', { class: 'sub', text: ' · ' + o.siguiente.accion + (o.siguiente.vence ? ' (vence ' + fecha(o.siguiente.vence) + ')' : '') }) : el('span', { class: 'sub', text: ' · sin siguiente acción' })])))
    : el('p', { class: 'mudo', text: 'No hay oportunidades abiertas.' }));
  const ult = Array.isArray(d?.ultimas_transiciones) ? d.ultimas_transiciones : [];
  if (ult.length) {
    nodos.push(el('h2', { text: 'Últimos movimientos' }));
    nodos.push(el('ul', { class: 'lista-corta' }, ult.map(t => el('li', { text: `${fecha(t.cuando, { hora: true })} · ${t.empresa}: ${etapa(t.de)} a ${etapa(t.a)}${t.quien ? ' (' + t.quien + ')' : ''}` }))));
  }
  return nodos;
}

export async function render(raiz) {
  raiz.append(el('h1', { text: 'Ventas' }));
  const caja = el('div', { class: 'ventas' });
  raiz.append(caja);
  caja.append(el('p', { class: 'cargando', text: 'Cargando el embudo de ventas...' }));
  try {
    const d = await carga();
    if (!d || typeof d !== 'object') throw new Error('respuesta vacía');
    caja.innerHTML = ''; caja.append(...cuerpo(d, null));
  } catch (e) {
    caja.innerHTML = '';
    caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: 'No se pudo leer el embudo de ventas (' + (e?.message || 'error') + '). Prueba a recargar; si sigue igual, avisa a Pol-Operaciones.' }));
  }
}
