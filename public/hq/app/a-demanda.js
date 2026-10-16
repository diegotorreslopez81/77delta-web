// Detalle que omc_hq_v2 ya no trae en la carga inicial (schema-v153, 17-oct-2026: la llamada pasaba de
// 2 MB y 1,9 s a 0,8 MB y 0,4 s). Dos cosas se piden aqui solo cuando una vista las pinta:
//   - hilos(d): los mensajes de las tarjetas de la bandeja (omc_hq_hilos). Se piden una vez por carga de
//     datos (firma = d.ahora) y se repinta solo si han cambiado; invalidarHilos() fuerza la siguiente.
//   - enlacesPliegos(lics): PCAP, PPT, carpeta y copias en Drive por expediente (omc_licitaciones_enlaces),
//     rellenados sobre las mismas filas con una cache que caduca a CADUCIDAD_ENLACES_MS.
// El modulo no toca el DOM ni la red por si mismo: main.js le conecta rpc y render con conectar(); sin
// conectar (tests) todo devuelve vacio y nunca hay red. Si el payload aun trae la clave (contrato viejo o
// fixtures), decisiones.js la usa y este modulo no pide nada.
let pedir = null, repintar = null;
export function conectar(fnPedir, fnRepintar) { pedir = fnPedir; repintar = fnRepintar; }

export const CAMPOS_ENLACES = ['pcap', 'ppt', 'carpeta', 'pcap_drive', 'ppt_drive'];
export const CADUCIDAD_ENLACES_MS = 15 * 60 * 1000;

let hilosCache = { firma: null, datos: {}, enVuelo: false };
export function hilos(d) {
  if (!d || d.rol !== 'owner') return {};
  const firma = String(d.ahora || '');
  if (hilosCache.firma !== firma && pedir && !hilosCache.enVuelo) {
    hilosCache.enVuelo = true;
    new Promise(r => r(pedir('omc_hq_hilos'))).then(h => {
      const nuevo = h && typeof h === 'object' && !Array.isArray(h) ? h : {};
      const cambia = JSON.stringify(nuevo) !== JSON.stringify(hilosCache.datos);
      hilosCache = { firma, datos: nuevo, enVuelo: false };
      if (cambia) repintar?.();
    }).catch(() => { hilosCache.enVuelo = false; });
  }
  return hilosCache.datos;
}
export function invalidarHilos() { hilosCache.firma = null; }

const enlacesCache = new Map();
let enlacesEnVuelo = false;
export function enlacesPliegos(lics, ahora = Date.now()) {
  if (!Array.isArray(lics) || !lics.length) return lics;
  const faltan = [];
  for (const l of lics) {
    if (!l || !l.expediente) continue;
    const c = enlacesCache.get(l.expediente);
    if (c && c.hasta > ahora) Object.assign(l, c.enlaces);
    else if (!CAMPOS_ENLACES.some(k => k in l) && !faltan.includes(l.expediente)) faltan.push(l.expediente);
  }
  if (faltan.length && pedir && !enlacesEnVuelo) {
    enlacesEnVuelo = true;
    new Promise(r => r(pedir('omc_licitaciones_enlaces', { p_expedientes: faltan }))).then(m => {
      const hasta = Date.now() + CADUCIDAD_ENLACES_MS;
      for (const exp of faltan) enlacesCache.set(exp, { hasta, enlaces: (m && typeof m === 'object' && m[exp]) || {} });
      enlacesEnVuelo = false;
      repintar?.();
    }).catch(() => { enlacesEnVuelo = false; });
  }
  return lics;
}
export function olvidarEnlaces() { enlacesCache.clear(); }
