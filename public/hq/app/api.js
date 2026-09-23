// Acceso a HQ: config, token y RPC. Sin canal realtime (T7-b: main.js recarga por intervalo, no por
// suscripción); sin estado de negocio (eso está en estado.js).
const API = 'https://api.77delta.com';
const params = new URLSearchParams(location.search);
if (params.get('t')) { localStorage.setItem('hq_t', params.get('t')); history.replaceState(null, '', location.pathname + location.hash); }
export let TOKEN = localStorage.getItem('hq_t');
let sb = null, CFG = null;

export async function conf() {
  const cache = localStorage.getItem('hq_cfg');
  const pedir = fetch(API + '/hq/config').then(r => r.json()).then(j => { if (!j.url || !j.anon) throw new Error('sin configuración'); localStorage.setItem('hq_cfg', JSON.stringify(j)); return j; });
  CFG = cache ? JSON.parse(cache) : await pedir;
  if (cache) pedir.catch(() => {});
  sb = window.supabase.createClient(CFG.url, CFG.anon, { auth: { persistSession: false, autoRefreshToken: false } });
  return CFG;
}
export function guardarToken(t) { localStorage.setItem('hq_t', t); TOKEN = t; }
export function salir() { localStorage.removeItem('hq_t'); TOKEN = null; location.reload(); }
export async function rpc(fn, args = {}) {
  if (!sb) await conf();
  const r = await sb.rpc(fn, { p_token: TOKEN, ...args });
  if (r.error) throw new Error(r.error.message || 'error');
  return r.data;
}
// Tanda 4 (LICITA-SPEC.md 5, 6.2, 6.3): unico camino de escritura de estado para toda la HQ. Sustituye a
// omc_licitacion_cribar/omc_licitacion_decidir usados desde decision-lic.js y a cualquier PATCH directo.
export const transicionLicitacion = (id, estado, extra = {}) => rpc('omc_licitacion_transicion', {
  p_id: id, p_estado: estado, p_actor: extra.actor || '', p_motivo: extra.motivo ?? null, p_nota: extra.nota || '',
  p_justificante: extra.justificante ?? null, p_plazo: extra.plazo ?? null, p_origen: extra.origen ?? null,
});
// omc_motivos_no() no lleva p_token (catalogo H4, publico para el rol anon): llamada sb.rpc directa, sin pasar por rpc().
export async function catalogoDescarte() {
  if (!sb) await conf();
  const r = await sb.rpc('omc_motivos_no');
  if (r.error) throw new Error(r.error.message || 'error');
  return r.data || [];
}
// H7: historial de cambios de una licitacion (omc_licitacion_cambios, RPC de lectura de schema-v20).
export const licitacionCambios = id => rpc('omc_licitacion_cambios', { p_id: id });
// Listado unico de la vista de Licitaciones (omc_licitaciones_tabla extendida en schema-v20): filtro server-side
// por estado, etiqueta(s), importe (Menor = importe_max 20000) y cierre.
export const licitacionesTabla = (filtro = {}) => rpc('omc_licitaciones_tabla', { p_filtro: filtro });
// P1: clave de sobre, solo owner (RLS + guardia en la propia RPC); nunca se guarda en localStorage ni en S.datos.
export const claveSobre = id => rpc('omc_licitacion_clave_sobre', { p_id: id });
// #1170: omc_licitaciones_toque (schema-v12, solo owner) da la última vez que se tocó cada licitación viva; se pide en paralelo
// y es opcional: si la RPC aún no existe o falla, las licitaciones se pintan sin "sin tocar" y no se vuelve a intentar en esta
// sesión. Un agente recibe [] y no cambia nada.
let toqueNoDisponible = false;
// #1281: omc_semaforo (seis filas, schema-v14) y las claves de omc_datos (`omc_datos_lista`, la misma para todo el Home: se pide
// como mucho cada 5 min) viajan adjuntas al payload como `semaforo` y `claves_datos`. Opcionales igual que `toque`: si la RPC falla
// se pintan como null y las vistas no muestran el semáforo ni recortan cifras (ver semaforo.js: tieneFila).
const CLAVES_MS = 5 * 60e3;
let clavesCache = null;   // { claves, t }
async function clavesDatos() {
  if (clavesCache && Date.now() - clavesCache.t < CLAVES_MS) return clavesCache.claves;
  try {
    const l = await rpc('omc_datos_lista');
    if (!l || !Array.isArray(l.datos)) return clavesCache?.claves ?? null;
    clavesCache = { claves: l.datos.map(x => x.clave), t: Date.now() };
    return clavesCache.claves;
  } catch { return clavesCache?.claves ?? null; }
}
export async function cargar() {
  const [d, toque, semaforo, claves] = await Promise.all([rpc('omc_hq_v2'), toqueNoDisponible ? null : rpc('omc_licitaciones_toque').catch(() => { toqueNoDisponible = true; return null; }),
    rpc('omc_semaforo').catch(() => null), clavesDatos()]);
  if (d && Array.isArray(d.licitaciones) && Array.isArray(toque)) {
    const m = new Map(toque.map(x => [x.expediente, x.toque]));
    for (const l of d.licitaciones) if (m.has(l.expediente)) l.toque = m.get(l.expediente);
  }
  if (d && typeof d === 'object') { d.semaforo = semaforo && Array.isArray(semaforo.filas) ? semaforo : null; d.claves_datos = claves; }
  return d;
}
