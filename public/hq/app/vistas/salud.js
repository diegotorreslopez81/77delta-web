// Salud del engranaje (encargo #1121, 20-sep-2026, Pol-Operaciones con Núria/po-hq): un semáforo por cosa que
// debe latir (cron de la Mac, sonda, copia de seguridad, credencial, fuentes, el propio vigía). Los datos los sube
// hq-vigia-engranaje.py cada 10 min a omc_engranajes y los lee la RPC omc_engranajes_lista.
// El color lo manda el primer token de `estado` (misma mecánica que Fuentes): OK = verde, ESPERANDO, SIN VIGILANCIA y
// BAJO DEMANDA = gris (nunca cuentan como verde; BAJO DEMANDA lleva su motivo y su propio contador), cualquier otro = rojo. Nunca solo color: cada fila lleva el
// texto del estado. Sin dato o con la RPC caída se dice claro, no se deja la pantalla vacía.
import { el } from '../ui.js';
import { bloque as semaforoSeis } from '../semaforo.js';

let cargaSalud = async () => (await import('../api.js')).rpc('omc_engranajes_lista');
export function usarCargador(fn) { if (fn) cargaSalud = fn; }

export const PARADO_MS = 3 * 36e5;   // el vigía corre cada 10 min: 3 h sin subir nada es "vigía parado"
const CACHE_MS = 30e3;
const GRUPOS = [['cron', 'Tareas programadas'], ['sonda', 'Sondas'], ['backup', 'Copias de seguridad'], ['credencial', 'Credenciales'], ['fuentes', 'Fuentes de licitación'], ['vigia', 'Vigías'], ['plan', 'Plan del Home'], ['sesion', 'Sesiones de licitación']];
const RANGO = { rojo: 0, gris: 1, verde: 2 };

// Color de un estado por su primer token. Lo desconocido es rojo: ante la duda, que se vea.
export function colorEstado(estado) {
  const t = String(estado || '').trim().toUpperCase();
  if (t.startsWith('OK')) return 'verde';
  if (t.startsWith('ESPERANDO') || t.startsWith('SIN VIGILANCIA') || t.startsWith('BAJO DEMANDA')) return 'gris';
  return 'rojo';
}
export function contadores(engranajes) {
  const c = { verdes: 0, rojos: 0, grises: 0, demanda: 0, total: 0 };
  for (const g of engranajes || []) {
    const col = colorEstado(g.estado); c.total++;
    if (col === 'verde') c.verdes++; else if (col === 'gris') { if (String(g.estado || '').trim().toUpperCase().startsWith('BAJO DEMANDA')) c.demanda++; else c.grises++; } else c.rojos++;
  }
  return c;
}
const n = (k, uno, varios) => `${k} ${k === 1 ? uno : varios}`;
export const textoContadores = c => `${n(c.verdes, 'verde', 'verdes')}, ${n(c.rojos, 'rojo', 'rojos')}, ${n(c.grises, 'gris', 'grises')}` + (c.demanda ? `, ${c.demanda} bajo demanda` : '') + ` de ${c.total}`;

// Rojos primero y, dentro de los rojos, los críticos arriba; luego grises y verdes. Estable por grupo y nombre.
export function ordenar(engranajes) {
  return [...(engranajes || [])].sort((a, b) => (RANGO[colorEstado(a.estado)] - RANGO[colorEstado(b.estado)])
    || ((b.critico ? 1 : 0) - (a.critico ? 1 : 0)) || String(a.nombre).localeCompare(String(b.nombre), 'es'));
}
// Grupos con al menos un rojo primero (el que tenga un rojo crítico, el primero de todos); el resto en el orden fijo.
export function agrupar(engranajes) {
  const etiqueta = new Map(GRUPOS), orden = GRUPOS.map(([k]) => k);
  const por = new Map();
  for (const g of ordenar(engranajes)) { const k = g.grupo || 'cron'; if (!por.has(k)) por.set(k, []); por.get(k).push(g); }
  const lista = [...por.entries()].map(([id, filas]) => ({
    id, nombre: etiqueta.get(id) || id, filas, rojos: filas.filter(f => colorEstado(f.estado) === 'rojo').length,
    critico: filas.some(f => f.critico && colorEstado(f.estado) === 'rojo'),
  }));
  const pos = id => { const i = orden.indexOf(id); return i < 0 ? orden.length : i; };
  return lista.sort((a, b) => (b.critico - a.critico) || ((b.rojos > 0) - (a.rojos > 0)) || (pos(a.id) - pos(b.id)));
}
export function hace(iso, ahora = new Date()) {
  const t = iso ? new Date(iso).getTime() : NaN;
  if (!Number.isFinite(t)) return null;
  const s = Math.max(0, Math.round((ahora.getTime() - t) / 1000));
  if (s < 90) return 'hace menos de 2 min';
  const m = Math.round(s / 60); if (m < 90) return `hace ${m} min`;
  const h = Math.round(m / 60); if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}
export function vigiaParado(datos, ahora = new Date()) {
  const t = datos?.actualizado ? new Date(datos.actualizado).getTime() : NaN;
  return !Number.isFinite(t) || ahora.getTime() - t > PARADO_MS;
}

// Lo que el usuario abrió o cerró a mano sobrevive a las recargas: main.js vacía la vista en cada tick.
const abiertos = new Map();
let cache = null;   // { datos, t }
export function restablecer() { abiertos.clear(); cache = null; }

function fila(g, ahora) {
  const col = colorEstado(g.estado), senal = hace(g.ultima, ahora);
  return el('li', { class: 'salud-fila ' + col }, [
    el('div', { class: 'salud-cab' }, [
      el('span', { class: 'pill ' + (col === 'gris' ? 'gris' : col), text: String(g.estado || '?') }),
      el('b', { class: 'salud-nombre', text: g.nombre || g.clave }),
      g.critico ? el('span', { class: 'salud-critico', text: 'crítico' }) : null]),
    g.detalle ? el('p', { class: 'salud-detalle', text: g.detalle }) : null,
    el('p', { class: 'sub salud-meta', text: 'resp. ' + (g.resp || '-') + ' · ' + (senal ? 'última señal ' + senal : 'sin señal todavía') })]);
}
function grupo(gr, ahora) {
  const por = abiertos.get(gr.id), abierto = por !== undefined ? por : gr.rojos > 0;
  const resumen = gr.rojos ? `${gr.rojos} en rojo de ${gr.filas.length}` : `${gr.filas.length} sin rojo`;
  const det = el('details', { class: 'salud-grupo' + (gr.rojos ? ' con-rojo' : ''), id: 'salud-grupo-' + gr.id, open: abierto },
    [el('summary', {}, [el('span', { class: 'salud-grupo-nombre', text: gr.nombre }), el('span', { class: 'sub', text: ' · ' + resumen })]),
      el('ul', { class: 'salud-lista' }, gr.filas.map(f => fila(f, ahora)))]);
  det.addEventListener('toggle', () => abiertos.set(gr.id, !!det.open));
  return det;
}
function cuerpo(datos, aviso, ahora) {
  const engranajes = Array.isArray(datos?.engranajes) ? datos.engranajes : [];
  const c = contadores(engranajes), nodos = [];
  if (aviso) nodos.push(el('p', { class: 'aviso rojo', role: 'alert', text: aviso }));
  if (!engranajes.length) {
    nodos.push(el('p', { class: 'aviso', role: 'status', text: 'Todavía no hay engranajes en la pantalla: el vigía (hq-vigia-engranaje, cada 10 min) aún no ha subido ningún dato. Si no aparece en unos minutos, avisa a Pol-Operaciones.' }));
    return nodos;
  }
  if (vigiaParado(datos, ahora)) {
    const h = hace(datos.actualizado, ahora);
    nodos.push(el('p', { class: 'aviso rojo', role: 'alert', text: 'Vigía parado: ' + (h ? 'última subida ' + h : 'sin fecha de la última subida') + '. Estos datos pueden estar viejos; el cron hq-vigia-engranaje no está subiendo.' }));
  }
  nodos.push(el('p', { class: 'salud-contadores', role: 'status' }, [
    el('span', { class: 'cont verde', text: n(c.verdes, 'verde', 'verdes') }), ', ', el('span', { class: 'cont rojo', text: n(c.rojos, 'rojo', 'rojos') }), ', ',
    el('span', { class: 'cont gris', text: n(c.grises, 'gris', 'grises') }),
    c.demanda ? el('span', { class: 'cont gris', text: ', ' + c.demanda + ' bajo demanda' }) : '', ' de ' + c.total]));
  const h = hace(datos.actualizado, ahora);
  nodos.push(el('p', { class: 'mudo', text: 'El vigía sube el estado cada 10 min' + (h ? ' · actualizado ' + h : '') + '. Gris = sin vigilancia o esperando su primera corrida; bajo demanda = no corre solo y lleva su motivo. Ninguno cuenta como verde.' }));
  for (const g of agrupar(engranajes)) nodos.push(grupo(g, ahora));
  return nodos;
}

export async function render(raiz, S, arg, filtros, ahora = new Date()) {
  raiz.append(el('h1', { text: 'Salud' }));
  raiz.append(semaforoSeis(S?.datos?.semaforo, S?.datos?.agentes));   // #1281: las seis filas de control encima de los grupos
  const caja = el('div', { class: 'salud' });
  raiz.append(caja);
  const pintar = (datos, aviso) => { caja.innerHTML = ''; caja.append(...cuerpo(datos, aviso, ahora)); };
  if (cache) pintar(cache.datos, null);
  else caja.append(el('p', { class: 'cargando', text: 'Cargando el estado del engranaje...' }));
  if (cache && Date.now() - cache.t < CACHE_MS) return;
  try {
    const datos = await cargaSalud();
    if (!datos || typeof datos !== 'object') throw new Error('respuesta vacía');
    cache = { datos, t: Date.now() }; pintar(datos, null);
  } catch (e) {
    const msg = 'No se pudo leer el estado del engranaje (' + (e?.message || 'error') + '). Prueba a recargar; si sigue igual, avisa a Pol-Operaciones.';
    if (cache) pintar(cache.datos, msg + ' Se muestran los últimos datos que llegaron.');
    else { caja.innerHTML = ''; caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: msg })); }
  }
}
