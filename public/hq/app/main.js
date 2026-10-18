import { conf, TOKEN, cargar, rpc, guardarToken, salir, configLicita, catalogoDescarte } from './api.js';
import { S, poner } from './estado.js';
import { el, toast } from './ui.js';
import { crearRecargador, decidirRecargaAutomatica } from './recargador.js';
import { fotografiar, restaurar } from './conservar.js';
import { resolver } from './rutas.js';
import { listar as listarAvisos, marcarLeido as marcarAvisoLeido } from './avisos.js';
import { decidirAviso, haceCuanto, hashDeAviso, trazarPagina } from './aviso-pendiente.js';
import { montarMenu, marcarActiva, pintarBarra, cablearShell } from './shell.js';
import * as hoy from './vistas/hoy.js';
import * as avisos from './vistas/avisos.js';
import * as kpis from './vistas/kpis.js';
import * as objetivo from './vistas/objetivo.js';
import * as tablero from './vistas/tablero.js';
import * as equipo from './vistas/equipo.js';
import * as motor from './vistas/motor.js';
import * as colaboradores from './vistas/colaboradores.js';
import * as expedientes from './vistas/expedientes.js';
import * as licitaciones from './vistas/licitaciones.js';
import { configurarLicita, configurarMotivosNo } from './licitaciones.js';
import * as recursos from './vistas/recursos.js';
import * as salud from './vistas/salud.js';
import * as admin from './vistas/admin.js';
import * as ventas from './vistas/ventas.js';
import * as progreso from './vistas/progreso.js';
import * as web from './vistas/web.js';
import * as home from './vistas/home.js';
import * as enCurso from './vistas/en-curso.js';
import { conectar as conectarADemanda } from './a-demanda.js';

// Plan 3a: una vista por clave de ruta (rutas.js). 'equipo/agente' es la ficha de equipo.js (arg = id).
// #1057 tarea 29: Hoy ya monta la bandeja de decisiones ella misma (decisiones.montar, solo owner),
// justo debajo de la franja; no hace falta envolverla aquí.
// Home v2 (spec 1, 18-10): owner sin arg ve la home de cuatro bloques; con arg (#hoy/bandeja, #hoy/<id>) y agentes, el Hoy de siempre.
const hoyOHome = { render: (raiz, S, arg, filtros) => (S.datos?.rol === 'owner' && !arg ? home : hoy).render(raiz, S, arg, filtros) };
const VISTAS = { 'hoy': hoyOHome, 'avisos': avisos, 'kpis': kpis, 'direccion/objetivo': objetivo, 'operacion/tablero': tablero, 'operacion/expedientes': expedientes, 'operacion/licitaciones': licitaciones, 'operacion/salud': salud, 'operacion/ventas': ventas, 'operacion/admin': admin, 'equipo/organigrama': equipo, 'equipo/agente': equipo, 'equipo/colaboradores': colaboradores, 'recursos/computo': recursos, 'licita-engine': motor, 'progreso': progreso, 'web': web, 'operacion/en-curso': enCurso };
const raiz = document.getElementById('vista');
document.getElementById('ver').textContent = 'v' + HQ_VERSION.v;
montarMenu(document.getElementById('nav'));
cablearShell();

// resolver() absorbe las rutas de la v2.0 (#inicio, #tablero/f/A3, ?id=N...) y devuelve el hash canónico;
// si difiere del actual (o hay que limpiar la query) se sustituye en el historial para no dejar enlaces
// viejos colgados. Ruling del controlador (17-sep): comparar contra r.canonico, no solo r.redirigido,
// porque '#hoy/extra' resuelve a canonico '#hoy' con redirigido=false y aun asi hay que limpiar la URL.
// Brief 2021 (feedback movil de Diego, 19-sep): ultimaVista recuerda la clave de la ultima vista pintada
// para saber, en la siguiente llamada, si render() reconstruye la MISMA vista (recarga automatica, tick
// de 60s) o si el usuario navego a otra (clic de menu, buscador): solo en el primer caso tiene sentido
// restaurar lo que habia en pantalla (un <details> abierto, un textarea a medio escribir).
let ultimaVista = null;
export function render() {
  // Fix Important 3 de la revisión final: sin token, cualquier hashchange (clic en el menú, en "HQ" o
  // Enter en el buscador) llegaba hasta aquí, borraba el formulario de pedirToken() y dejaba "Cargando
  // HQ..." para siempre (S.datos nunca llega sin token). pedirToken está declarada con `function`, así
  // que el hoisting cubre este orden.
  if (!TOKEN) return pedirToken();
  const r = resolver(location.hash, location.search);
  if (r.canonico !== location.hash || location.search) history.replaceState(null, '', location.pathname + r.canonico);
  marcarActiva(r.clave);
  const mismaVista = ultimaVista === r.clave;
  const foto = mismaVista ? fotografiar(raiz, document.activeElement) : null;
  raiz.innerHTML = ''; raiz.className = 'vista vista-' + r.clave.replace('/', '-');
  if (!S.datos) { raiz.append(el('p', { class: 'cargando', text: 'Cargando HQ...' })); ultimaVista = r.clave; return; }
  window.HQ_DATOS = S.datos; pintarBarra(S.datos);
  VISTAS[r.clave].render(raiz, S, r.arg, r.filtros);
  if (foto) restaurar(raiz, foto);
  ultimaVista = r.clave;
}
// Fix ronda 2 (revision final, D3): recargar() coalescido via crearRecargador (modulo sin DOM, con test
// propio en test/recargador.test.mjs). cargarFn atrapa el error y muestra el toast (igual que antes:
// nunca deja una excepcion sin capturar), renderFn no hace nada si cargarFn no trajo datos.
export const recargar = crearRecargador(
  async () => { try { return await cargar(); } catch (e) { toast('HQ: ' + e.message); return undefined; } },
  datos => { if (datos !== undefined) { poner(datos); render(); } }
);
// #1057 tarea 29: campana/reload del menú y el gate de 60s de abajo comparten un único punto de
// entrada. ultimaRecarga se actualiza tanto en la recarga automática como en el botón manual (shell.js
// llama a window.HQ_RECARGAR desde el icono de recarga), para que un clic manual no dispare además una
// recarga automática un segundo después.
let ultimaRecarga = Date.now();
function recargarYMarcar() { ultimaRecarga = Date.now(); return recargar(); }
window.HQ_RECARGAR = recargarYMarcar;

function pedirToken() {
  const campo = el('input', { class: 'campo', placeholder: 'Pega el enlace de HQ o el token', autofocus: true });
  const recordar = el('input', { type: 'checkbox', id: 'recordar-disp' });
  raiz.innerHTML = ''; raiz.append(el('div', { class: 'entrar' }, [el('h1', { text: 'HQ' }), campo,
    el('label', { class: 'recordar', for: 'recordar-disp' }, [recordar, ' Recordar este dispositivo']),
    el('button', { class: 'btn primario', text: 'Entrar', onclick: () => { const m = campo.value.match(/[?&#]t=([0-9a-f]{20,})/i) || campo.value.match(/^([0-9a-f]{20,})$/i); if (!m) { campo.focus(); return; } guardarToken(m[1], recordar.checked); location.reload(); } })]));
}
window.addEventListener('hashchange', render);
document.addEventListener('click', e => { if (e.target.closest('[data-salir]')) salir(); });

// Push: la clave publica VAPID viaja en la config que ya trae conf() (GET /hq/config -> { url, anon,
// publicKey }), nunca literal en el codigo. b64() replica el formato de public/hq/v1/index.html (misma
// codificacion base64url con relleno) porque la clave VAPID no siempre trae el '=' de relleno.
function b64(s) { const p = '='.repeat((4 - s.length % 4) % 4), b = (s + p).replace(/-/g, '+').replace(/_/g, '/'), r = atob(b), o = new Uint8Array(r.length); for (let i = 0; i < r.length; i++) o[i] = r.charCodeAt(i); return o; }
async function pedirPush() { if (await Notification.requestPermission() === 'granted') activarPush(await navigator.serviceWorker.ready); }
async function activarPush(reg) {
  try {
    const cfg = JSON.parse(localStorage.getItem('hq_cfg') || '{}');
    if (!cfg.publicKey) return;
    const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(cfg.publicKey) });
    await rpc('omc_guardar_push', { p_sub: sub.toJSON() });
  } catch (e) { console.warn('push', e.message); }
}

// Service worker: registra el nuevo /hq/sw.js y desregistra cualquier registro sobrante en el mismo
// scope (/hq/) que no sea ese script activo (residuos de versiones o pruebas anteriores). Nunca toca
// registros de otro scope (p.ej. /hq/v1/, que se gestiona a si mismo y no se debe romper desde aqui).
// #1057 tarea 29: si Diego está escribiendo algo (un campo de texto enfocado, con o sin contenido) la
// versión nueva espera al toast con botón; si no hay nada que perder, se recarga sola sin interrumpir.
// document.activeElement no existe en los shims de los tests (por eso el try/catch), pero esta rama
// solo se ejecuta con 'serviceWorker' in navigator, que tampoco existe ahí: no se cubre con node --test.
function escribiendo() {
  try {
    const a = document.activeElement;
    if (!a) return false;
    const tag = (a.tagName || '').toLowerCase();
    if (tag === 'textarea') return true;
    if (tag === 'input') return !['checkbox', 'radio', 'button', 'submit', 'range', 'color', 'file'].includes((a.type || 'text').toLowerCase());
    return !!a.isContentEditable;
  } catch { return false; }
}
// C1 (18-10): versión nueva. Con skipWaiting+clients.claim el sw nuevo toma el control solo: controllerchange
// recarga UNA vez (marca en sessionStorage 15 s contra bucles) o, si Diego escribe, deja un aviso fijo con botón.
// Primera instalación (sin controller previo) no recarga. Además se pide update() al volver a la app.
let versionAvisada = false;
function aplicarVersionNueva() {
  if (versionAvisada) return; versionAvisada = true;
  try { const t = Number(sessionStorage.getItem('hq_sw_recarga') || 0); if (Date.now() - t < 15000) return; } catch {}
  const recargar = () => { try { sessionStorage.setItem('hq_sw_recarga', String(Date.now())); } catch {} location.reload(); };
  if (!escribiendo()) { recargar(); return; }
  const b = el('div', { class: 'toast', id: 'aviso-version' }, [el('span', { text: 'HQ tiene versión nueva' }), el('button', { class: 'btn-enlace', text: 'Recargar', onclick: recargar })]);
  document.body.append(b);
}
// C2: destino de la notificación guardado por el sw (Cache 'hq-destino'): iOS puede abrir la PWA en la home y
// perder el hash; se aplica si tiene menos de 2 min y se borra siempre.
async function aplicarDestinoPendiente() {
  try {
    const c = await caches.open('hq-destino'), r = await c.match('/hq/__destino');
    if (!r) return false;
    await c.delete('/hq/__destino');
    const d = await r.json();
    if (Date.now() - d.t > 120000) return true;
    const u = new URL(d.url, location.origin);
    if (u.origin === location.origin && u.pathname.startsWith('/hq/') && u.hash) location.hash = u.hash;
    return true;
  } catch { return false; }
}
// C1/C3 (ronda 2, 18-10): fallback que no depende de notificationclick (iOS abre la PWA sin entregarlo). Al
// arrancar y al volver visible: traza pagina_abierta y, si hay avisos sin leer en IndexedDB, banner fijo arriba con
// el último (título, hace cuánto, Abrir, cerrar y "y N más" hacia Avisos). Cerrar no borra el aviso.
const trazaPag = (ev, d, reg) => { let cfg = null; try { cfg = JSON.parse(localStorage.getItem('hq_cfg') || 'null'); } catch {} return trazarPagina(ev, d, { reg, cfg }); };
async function revisarAvisos(visita) {
  let reg = null, lista = [], hayDestino = false, cache = null;
  try { reg = await navigator.serviceWorker.getRegistration('/hq/'); } catch {}
  try { hayDestino = await aplicarDestinoPendiente(); } catch {}
  try { lista = await listarAvisos(); } catch {}
  try { cache = (await caches.keys()).filter(k => /^hq-v\d+$/.test(k)).join(',') || null; } catch {}
  const { aviso: a, total } = decidirAviso(lista);
  let standalone = false; try { standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches; } catch {}
  const origen = hayDestino || (visita === 'arranque' && location.hash) ? 'notificacion' : standalone ? 'icono' : 'pestana';
  trazaPag('pagina_abierta', { visita, origen, entrada: location.pathname + location.hash.slice(0, 60), cache, version: window.HQ_VERSION && HQ_VERSION.v, destinoPendiente: hayDestino, sinLeer: total, avisoN: a ? a.n : null, controlado: !!navigator.serviceWorker.controller }, reg);
  if (!a || document.getElementById('aviso-nuevo')) return;
  const h = hashDeAviso(a, location.origin), quitar = () => document.getElementById('aviso-nuevo')?.remove();
  const abrir = () => { trazaPag('banner_abrir', { avisoN: a.n, url: a.url }, reg); marcarAvisoLeido(a.n).catch(() => {}); if (h) location.hash = h; quitar(); };
  const cerrar = () => { trazaPag('banner_cerrar', { avisoN: a.n }, reg); quitar(); };
  document.body.append(el('div', { class: 'aviso-banner', id: 'aviso-nuevo', role: 'alert' }, [
    el('span', { class: 'aviso-texto', text: (a.title || 'HQ') + ' · ' + haceCuanto(a.t) }),
    total > 1 ? el('a', { href: '#avisos', class: 'btn-enlace', text: 'y ' + (total - 1) + ' más', onclick: quitar }) : null,
    el('button', { class: 'btn-enlace', text: 'Abrir', onclick: abrir }),
    el('button', { class: 'btn-enlace', text: '✕', 'aria-label': 'Cerrar', onclick: cerrar })]));
  trazaPag('banner_mostrado', { avisoN: a.n, total, url: a.url }, reg);
}
if ('serviceWorker' in navigator) {
  const habiaControl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (habiaControl) aplicarVersionNueva(); });
  revisarAvisos('arranque');
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { revisarAvisos('visible'); navigator.serviceWorker.getRegistration('/hq/').then(r => r && r.update()).catch(() => {}); } });
  navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => { if (new URL(r.scope).pathname === '/hq/' && !(r.active && r.active.scriptURL.endsWith('/hq/sw.js'))) r.unregister(); }));
  navigator.serviceWorker.register('/hq/sw.js', { updateViaCache: 'none' }).then(reg => {
    reg.addEventListener('updatefound', () => { const nuevo = reg.installing; if (nuevo) nuevo.addEventListener('statechange', () => { if (nuevo.state === 'activated' && navigator.serviceWorker.controller) aplicarVersionNueva(); }); });
    reg.update().catch(() => {});
    if (Notification.permission === 'default') document.addEventListener('click', pedirPush, { once: true });
    else if (Notification.permission === 'granted') activarPush(reg);
  }).catch(() => {});
  // Fix ronda 2 (revision final, D5): enlace profundo del push cuando la app ya esta abierta (sw.js
  // hace postMessage en vez de navegar la pestana existente). #1057 tarea 27: las decisiones viven en
  // la bandeja de Hoy ('#hoy/N'; las licitaciones por decidir, plegadas en la misma bandeja).
  navigator.serviceWorker.addEventListener('message', ev => {
    if (ev.data?.tipo === 'ir' && typeof ev.data.url === 'string') {
      // El sw manda siempre la url del aviso (iOS no tiene Client.navigate()): solo se aplica su hash, mismo origen.
      try { const u = new URL(ev.data.url, location.origin); if (u.origin === location.origin && u.pathname.startsWith('/hq/') && u.hash) location.hash = u.hash; } catch {}
    } else if (ev.data?.tipo === 'abrir' && ev.data.id) location.hash = '#hoy/' + ev.data.id;
    else if (ev.data?.tipo === 'abrir-lic' && ev.data.lic) location.hash = '#operacion/licitaciones?exp=' + encodeURIComponent(ev.data.lic);
  });
}

if (!TOKEN) pedirToken();
else {
  // schema-v153: hilos y enlaces de pliegos se piden al pintarse (a-demanda.js); sin token nunca se conecta.
  conectarADemanda(rpc, render);
  conf().then(recargarYMarcar).catch(e => { raiz.innerHTML = ''; raiz.append(el('p', { class: 'error', text: 'No se pudo cargar HQ: ' + e.message })); });
  // D17 (#1355): estados/transiciones de Licita en directo, opcional y sin bloquear el arranque (mismo
  // patron que el push de mas abajo): si falla, la vista de licitaciones sigue con el snapshot de
  // licitaciones.js.
  configLicita().then(configurarLicita).catch(() => {});
  // D57/Tanda G: unico catalogo de motivos de NO, pedido en vivo a omc_motivos_no() (fuente unica, ver licitaciones.js).
  catalogoDescarte().then(configurarMotivosNo).catch(() => {});
  // Sin realtime (T7-b): recarga cada 60s y al volver a la pestaña, nunca en segundo plano. Fix ronda 2
  // (revision final, D3): el propio tick del intervalo tambien mira document.hidden (antes solo lo
  // miraba el comentario, no el codigo). #1057 tarea 29: al volver a la pestaña solo si ya pasaron 60s
  // desde la última recarga (si el tick de abajo acaba de recargar hace 5s, no hace falta repetir).
  // Brief 2021 (feedback movil de Diego, 19-sep, capa A): si hay un campo de texto enfocado (escribiendo()
  // === true) ni el tick de 60s ni el volver-a-la-pestaña deben recargar (eso era lo que cerraba la
  // tarjeta y borraba el textarea a medio escribir): se deja recargaPendiente = true y un listener de
  // focusout (con un margen de ~300ms, para que cambiar el foco entre dos campos de la misma tarjeta no
  // dispare una recarga de mas) la dispara en cuanto deja de haber ningun campo enfocado. Las recargas
  // explicitas (tras un RPC, el boton manual HQ_RECARGAR) siguen llamando a recargarYMarcar() directo, sin
  // pasar por aqui.
  let recargaPendiente = false;
  function recargaAutomatica() {
    const { disparar, pendiente } = decidirRecargaAutomatica(escribiendo());
    if (disparar) recargarYMarcar(); else recargaPendiente = pendiente;
  }
  setInterval(() => { if (!document.hidden) recargaAutomatica(); }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - ultimaRecarga > 60000) recargaAutomatica(); });
  document.addEventListener('focusout', () => {
    if (!recargaPendiente) return;
    setTimeout(() => { if (recargaPendiente && !escribiendo()) { recargaPendiente = false; recargarYMarcar(); } }, 300);
  });
}
