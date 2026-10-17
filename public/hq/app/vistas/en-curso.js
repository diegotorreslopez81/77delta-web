// En curso: mapa de iniciativas leído de la vista hq_v_iniciativas (RPC hq_iniciativas). Solo pinta;
// el semáforo, el orden y el umbral de 96 h los calcula SQL.
import { el } from '../ui.js';

let carga = async () => (await import('../api.js')).rpc('hq_iniciativas', {});
export function usarCargador(fn) { if (fn) carga = fn; }

const GRUPOS = [['rojo', 'Rojo'], ['ambar', 'Ámbar'], ['verde', 'Verde']];
const fdia = iso => iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) : '';

export function modeloEnCurso(filas) {
  const por = { rojo: [], ambar: [], verde: [] };
  (filas || []).forEach(f => (por[f.semaforo] || por.verde).push(f));
  return por;
}

function linea(f) {
  const sin = f.dias_sin_avance == null ? 'sin avance registrado' : f.dias_sin_avance + ' d sin avance';
  const hito = f.proximo_hito ? f.proximo_hito + ' (' + (f.fecha_hito ? fdia(f.fecha_hito) : 'sin fecha') + ')' : 'sin fecha';
  const caja = el('div', { class: 'vt-card compacta en-curso-item sem-' + f.semaforo });
  const t = el('h3', {});
  t.append(el('a', { href: f.enlace || '#', text: '#' + f.id }), el('span', { text: ' ' + (f.titulo || '') }));
  caja.append(t);
  caja.append(el('p', { class: 'vt-nota', text: [f.responsable, f.frente_nombre || f.frente, f.estado].filter(Boolean).join(' · ') }));
  caja.append(el('p', { class: 'vt-nota', text: 'Hito: ' + hito + ' · ' + sin }));
  if (f.ultimo_avance) caja.append(el('p', { class: 'vt-nota', text: 'Último avance: ' + f.ultimo_avance }));
  if (f.bloqueo) caja.append(el('p', { class: 'vt-nota', text: 'Bloqueo: ' + f.bloqueo }));
  return caja;
}

export async function render(raiz) {
  raiz.append(el('h2', { text: 'En curso' }));
  raiz.append(el('p', { class: 'vt-nota', text: 'Iniciativas vivas. Rojo: hito vencido o más de 96 h sin avance.' }));
  const caja = el('div', { class: 'vt-cards' });
  raiz.append(caja);
  caja.append(el('p', { class: 'vt-nota', text: 'Cargando...' }));
  let filas;
  try { filas = await carga(); } catch (e) { caja.innerHTML = ''; caja.append(el('p', { class: 'vt-nota', text: 'No se ha podido leer las iniciativas: ' + (e.message || e) })); return; }
  caja.innerHTML = '';
  if (!filas || !filas.length) { caja.append(el('p', { class: 'vt-nota', text: 'Sin iniciativas en curso.' })); return; }
  const m = modeloEnCurso(filas);
  GRUPOS.forEach(([k, nombre]) => {
    if (!m[k].length) return;
    caja.append(el('h3', { class: 'en-curso-grupo', text: nombre + ' (' + m[k].length + ')' }));
    m[k].forEach(f => caja.append(linea(f)));
  });
}
