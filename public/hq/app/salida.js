// Salida suave de una tarjeta resuelta (#2118, orden del chief 28-09): al aprobar, rechazar, responder,
// descartar o retirar, la tarjeta se desvanece y colapsa en ~250 ms, los contadores se recalculan en local
// sobre S.datos y no se recarga la página ni la lista. Si la API falla, la tarjeta vuelve y se avisa.
// Módulo sin importar vistas: lo usan decisiones.js, decision-lic.js, hoy.js y licitaciones.js.
import { estadoBase, CLAVE_RESUMEN } from './licitaciones.js';

export const MS_SALIDA = 250;
const MARGEN_MS = 30;

// Quita la tarjeta de S.datos: pendientes y pospuestas (las dos listas de las que sale la bandeja).
// 'seguimiento' lo repone el servidor en el siguiente latido (60 s); no se inventa aquí.
export function resolucionLocal(S, id) {
  const d = S?.datos;
  if (!d) return;
  for (const clave of ['pendientes', 'pospuestas']) {
    if (Array.isArray(d[clave])) d[clave] = d[clave].filter(p => p.id !== id);
  }
}

function estadosDeLaCache(cache) {
  try { return JSON.parse(cache.firma).estados || []; } catch { return []; }
}

// true si la fila sigue en la lista de licitaciones ya pintada tras la transición (destino dentro del
// mismo filtro, p. ej. las fases agregadas de 'Presentadas'): entonces no hay que hacerla desaparecer.
export function permanece(S, l, destino) {
  const c = S?.cacheLicTabla;
  if (!c?.datos?.filas?.some(x => x.id === l.id)) return false;
  return estadosDeLaCache(c).includes(destino);
}

// Aplica una transición de licitación a lo que ya tiene la app en memoria: la fila en S.datos.licitaciones,
// los contadores de lic_resumen (n y eur) y la lista cacheada de Operación/Licitaciones.
export function transicionLocal(S, l, destino) {
  const d = S?.datos;
  const fila = (d?.licitaciones || []).find(x => x.id === l.id);
  const origenRef = fila || l;
  const origen = origenRef.estado ? estadoBase(origenRef) : null;
  if (fila) fila.estado = destino;
  const r = d?.lic_resumen;
  if (r && origen && origen !== destino) {
    const o = r[CLAVE_RESUMEN[origen]], n = r[CLAVE_RESUMEN[destino]];
    const eur = Number(origenRef.importe) || 0;
    if (o) { o.n = Math.max(0, (Number(o.n) || 0) - 1); if (o.eur != null) o.eur = Math.max(0, (Number(o.eur) || 0) - eur); }
    if (n) { n.n = (Number(n.n) || 0) + 1; if (n.eur != null) n.eur = (Number(n.eur) || 0) + eur; }
  }
  const c = S?.cacheLicTabla;
  const filas = c?.datos?.filas;
  const i = Array.isArray(filas) ? filas.findIndex(x => x.id === l.id) : -1;
  if (i >= 0) {
    if (estadosDeLaCache(c).includes(destino)) filas[i].estado = destino;
    else { filas.splice(i, 1); c.datos.total = Math.max(0, (Number(c.datos.total) || 0) - 1); }
  }
}

// Fade + colapso de altura. El nodo lleva su altura actual en max-height para que la transición de CSS
// (.saliendo, cards.css) tenga desde dónde bajar a 0. restaurar() lo devuelve; quitar() lo saca del DOM
// cuando ya han pasado los ms de la animación (contados desde el desvanecer, no desde la llamada).
export function desvanecer(nodo, ms = MS_SALIDA) {
  const t0 = Date.now();
  nodo.style.maxHeight = (nodo.offsetHeight || nodo.getBoundingClientRect?.().height || 0) + 'px';
  nodo.getBoundingClientRect?.();
  nodo.classList.add('saliendo');
  nodo.setAttribute('aria-hidden', 'true');
  return {
    restaurar() {
      nodo.classList.remove('saliendo');
      nodo.removeAttribute?.('aria-hidden');
      setTimeout(() => { nodo.style.maxHeight = ''; }, ms + MARGEN_MS);
    },
    quitar() {
      const falta = Math.max(0, ms + MARGEN_MS - (Date.now() - t0));
      return new Promise(res => setTimeout(() => { nodo.remove(); res(); }, falta));
    },
  };
}

// Tarjetas desvaneciéndose a la vez: el repintado local (que reconstruye todo el DOM y mataría la animación
// de las demás) espera a que termine la última.
let enSalida = 0;

// operacion: escritura a la API. local: parche de S.datos (y toast) una vez confirmada. pintar: render
// local sin red. recargar: solo si no hay nodo o no hay pintar. Si operacion falla, la tarjeta vuelve y el
// error sube al llamador para que lo muestre.
export async function conSalida(nodo, operacion, { local, pintar, recargar, ms } = {}) {
  const animar = nodo && typeof nodo.classList?.add === 'function' && nodo.style;
  const s = animar ? desvanecer(nodo, ms) : null;
  if (s) enSalida++;
  try { await operacion(); }
  catch (err) { if (s) { enSalida--; s.restaurar(); } throw err; }
  local?.();
  if (s) { await s.quitar(); enSalida--; }
  if (enSalida > 0) return;
  if (pintar) pintar(); else await recargar?.();
}
