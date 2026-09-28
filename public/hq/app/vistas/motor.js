// Licita Engine (D91, Diego 28-sep: "me faltan fases y agentes, por ejemplo el scrapper o las cribas, no lo
// veo ordenado por fases"): vista propia del motor Licita autonomo, fuera del organigrama. Todo sale de
// Supabase: la cadena (lic_cadena_estado, schema-v91), los agentes de mantenimiento (omc_agentes, depto
// "Licita · Motor: mantenimiento") y las piezas (lic_piezas_listar). Orden: cadena de 9 fases numeradas,
// piezas transversales, mantenimiento del motor y el registro completo de piezas.
import { rpc } from '../api.js';
import { el } from '../ui.js';
import { hace } from './salud.js';
import { avatar, tarjetaAgente, separarMotor } from './equipo.js';

// Piezas de Licita (schema-v31, lic_piezas_listar via p_token): mismo patron de carga y cache de 30 s
// que salud.js, pero sin volver async el render() de esta vista (los tests del organigrama esperan las
// secciones de departamento en la misma pasada sincrona). El contenedor se cuelga ya del DOM y se rellena
// en cuanto llega la RPC; si falla y no hay cache previa, aviso rojo con el motivo (nunca pantalla vacia).
let cargaPiezas = () => rpc('lic_piezas_listar');
export function usarCargadorPiezas(fn) { if (fn) cargaPiezas = fn; }
const PIEZAS_CACHE_MS = 30e3;
let piezasCache = null;   // { piezas, t }
const abiertosPiezas = new Map();
export function restablecerPiezas() { piezasCache = null; abiertosPiezas.clear(); }
const plural = (k, uno, varios) => `${k} ${k === 1 ? uno : varios}`;

// Averiada o sin_latido (activa pero el cron lleva mas de 26 h sin latir, marcado por la propia RPC):
// rojo. Pausada: gris, con su motivo. Activa y con latido: verde. Nunca solo color: cada fila lleva el
// texto del estado.
function colorPieza(p) { return (p.estado === 'averiada' || p.sin_latido) ? 'rojo' : p.estado === 'pausada' ? 'gris' : 'verde'; }

export function contadoresPiezas(piezas) {
  const m = new Map();
  for (const p of piezas || []) {
    const k = p.maquina || '?';
    const c = m.get(k) || { maquina: k, activas: 0, pausadas: 0, averiadas: 0, sinLatido: 0, total: 0 };
    c.total++;
    if (p.estado === 'averiada') c.averiadas++; else if (p.estado === 'pausada') c.pausadas++; else c.activas++;
    if (p.sin_latido) c.sinLatido++;
    m.set(k, c);
  }
  return [...m.values()].sort((a, b) => a.maquina.localeCompare(b.maquina, 'es'));
}

function resumenPiezas(piezas) {
  const activas = piezas.filter(p => p.estado === 'activa').length, pausadas = piezas.filter(p => p.estado === 'pausada').length,
    averiadas = piezas.filter(p => p.estado === 'averiada').length, sinLatido = piezas.filter(p => p.sin_latido).length;
  return el('div', {}, [
    el('p', { class: 'salud-contadores', role: 'status' }, [
      el('span', { class: 'cont verde', text: plural(activas, 'activa', 'activas') }), ', ',
      el('span', { class: 'cont gris', text: plural(pausadas, 'pausada', 'pausadas') }), ', ',
      el('span', { class: 'cont rojo', text: plural(averiadas, 'averiada', 'averiadas') }),
      sinLatido ? el('span', { class: 'cont rojo', text: ', ' + plural(sinLatido, 'sin latido', 'sin latido') }) : '',
      ' de ' + piezas.length]),
    el('ul', { class: 'lista-corta' }, contadoresPiezas(piezas).map(c => el('li', {}, [
      el('b', { text: c.maquina }), ': ' + plural(c.activas, 'activa', 'activas') + ', ' + plural(c.pausadas, 'pausada', 'pausadas') +
        ', ' + plural(c.averiadas, 'averiada', 'averiadas') + (c.sinLatido ? ', ' + plural(c.sinLatido, 'sin latido', 'sin latido') : '')]))),
  ]);
}

// Comando solo en el title (tooltip): nunca en texto visible. Pausada/averiada muestran su motivo_estado.
function filaPieza(p, ahora) {
  const col = colorPieza(p), senal = hace(p.ultimo_latido, ahora);
  return el('li', { class: 'salud-fila ' + col, title: p.comando || '' }, [
    el('div', { class: 'salud-cab' }, [
      el('span', { class: 'pill ' + col, text: p.estado }),
      el('b', { class: 'salud-nombre', text: p.nombre }),
      el('span', { class: 'sub', text: p.tipo }),
      p.sin_latido ? el('span', { class: 'salud-critico', text: 'sin latido' }) : null,
      p.fallos_seguidos > 0 ? el('span', { class: 'salud-critico', text: plural(p.fallos_seguidos, 'fallo seguido', 'fallos seguidos') }) : null]),
    (p.estado === 'pausada' || p.estado === 'averiada') && p.motivo_estado ? el('p', { class: 'salud-detalle', text: p.motivo_estado }) : null,
    el('p', { class: 'sub salud-meta', text: (p.horario || 'sin horario') + ' · ' + (senal ? 'último latido ' + senal : 'sin latido todavía') })]);
}
function grupoPiezas(maquina, filas, ahora) {
  const rojos = filas.filter(p => colorPieza(p) === 'rojo').length;
  const abierto = abiertosPiezas.has(maquina) ? abiertosPiezas.get(maquina) : rojos > 0;
  const det = el('details', { class: 'salud-grupo' + (rojos ? ' con-rojo' : ''), id: 'piezas-grupo-' + maquina, open: abierto }, [
    el('summary', {}, [el('span', { class: 'salud-grupo-nombre', text: maquina }), el('span', { class: 'sub', text: ' · ' + (rojos ? rojos + ' en rojo de ' + filas.length : filas.length + ' sin rojo') })]),
    el('ul', { class: 'salud-lista' }, filas.map(f => filaPieza(f, ahora)))]);
  det.addEventListener('toggle', () => abiertosPiezas.set(maquina, !!det.open));
  return det;
}
function cuerpoPiezas(piezas, aviso, ahora) {
  const nodos = [];
  if (aviso) nodos.push(el('p', { class: 'aviso rojo', role: 'alert', text: aviso }));
  if (!piezas.length) { nodos.push(el('p', { class: 'mudo', text: 'Sin piezas registradas.' })); return nodos; }
  nodos.push(resumenPiezas(piezas));
  const porMaquina = new Map();
  for (const p of piezas) { const k = p.maquina || '?'; if (!porMaquina.has(k)) porMaquina.set(k, []); porMaquina.get(k).push(p); }
  for (const [maquina, filas] of [...porMaquina].sort((x, y) => x[0].localeCompare(y[0], 'es'))) nodos.push(grupoPiezas(maquina, filas, ahora));
  return nodos;
}
// 'seccion piezas' y no solo 'seccion': visualmente reusa el mismo espaciado (hq.css), pero con una clase
// propia distinguible de las secciones de departamento.
function seccionPiezas(ahora) {
  const caja = el('div', { class: 'piezas' });
  const cont = el('section', { class: 'seccion piezas' }, [el('h2', { text: 'Piezas' }), caja]);
  const pintar = (piezas, aviso) => { caja.innerHTML = ''; caja.append(...cuerpoPiezas(piezas, aviso, ahora)); };
  if (piezasCache) pintar(piezasCache.piezas, null);
  else caja.append(el('p', { class: 'cargando', text: 'Cargando piezas...' }));
  if (piezasCache && Date.now() - piezasCache.t < PIEZAS_CACHE_MS) return cont;
  (async () => {
    try {
      const piezas = await cargaPiezas();
      const lista = Array.isArray(piezas) ? piezas : [];
      piezasCache = { piezas: lista, t: Date.now() };
      pintar(lista, null);
    } catch (e) {
      const msg = 'No se pudieron cargar las piezas (' + (e?.message || 'error') + ').';
      if (piezasCache) pintar(piezasCache.piezas, msg);
      else { caja.innerHTML = ''; caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: msg })); }
    }
  })();
  return cont;
}


// D91 (schema-v91): la cadena del motor sale entera de Supabase (lic_cadena_estado): orden, fase, quien la
// ejecuta (agente de IA, script o SQL), que hace, sus piezas de lic_piezas y los contadores vivos de
// lic_tareas. Nada de la cadena esta escrito aqui. Mismo patron de carga y cache que las piezas.
let cargaCadena = () => rpc('lic_cadena_estado');
export function usarCargadorCadena(fn) { if (fn) cargaCadena = fn; }
let cadenaCache = null;   // { filas, t }
export function restablecerCadena() { cadenaCache = null; }
const EJECUTOR_TEXTO = { script: 'script', sql: 'SQL', agente: 'agente IA' };
// Peor estado de las piezas de la fase (lo calcula la RPC) al semaforo de colorPieza.
const COLOR_PEOR = { averiada: 'rojo', sin_latido: 'rojo', pausada: 'gris', activa: 'verde' };
const TEXTO_PEOR = { averiada: 'pieza averiada', sin_latido: 'sin latido', pausada: 'pausada', activa: 'activa' };
export function textoTareas(t) {
  if (!t) return null;
  const n = k => Number(t[k]) || 0;
  const partes = [n('en_curso') + ' en curso', n('pendiente') + ' en cola', n('esperando') + ' esperando'];
  if (n('bloqueada')) partes.push(n('bloqueada') + (n('bloqueada') === 1 ? ' bloqueada' : ' bloqueadas'));
  partes.push(n('hechas_24h') + ' hechas 24 h');
  return 'Ahora: ' + partes.join(' · ');
}
// Diego 28-sep: el semaforo de la fase dice si la fase trabaja, no el estado de una pieza vieja. Con
// tareas en curso, verde; con cola y nada en curso, rojo (parada); sin tareas, el peor estado de piezas.
function chipPiezas(f, ahora) {
  const t = f.con_tareas ? (f.tareas || {}) : null, curso = Number(t?.en_curso) || 0, cola = Number(t?.pendiente) || 0;
  if (curso) return el('span', { class: 'pill verde', text: 'trabajando · ' + curso + (curso === 1 ? ' réplica' : ' réplicas') });
  if (cola) return el('span', { class: 'pill rojo', text: 'parada con ' + cola + ' en cola' });
  if (!f.peor_estado) return el('span', { class: 'pill gris', text: (f.piezas || []).length ? 'piezas sin registrar' : 'sin pieza registrada' });
  const col = COLOR_PEOR[f.peor_estado] || 'gris', senal = hace(f.ultimo_latido, ahora);
  return el('span', { class: 'pill ' + col, title: (f.piezas_estado || []).map(p => p.nombre + ': ' + p.estado + (p.sin_latido ? ' (sin latido)' : '')).join('\n') },
    [TEXTO_PEOR[f.peor_estado] || f.peor_estado, senal ? ' · ' + senal : '']);
}
function ejecutorFase(f) {
  const piezas = (f.piezas_estado || []).map(p => el('span', { class: 'pill codigo pieza-' + (COLOR_PEOR[p.sin_latido ? 'sin_latido' : p.estado] || 'gris'), text: p.nombre }));
  const quien = f.ejecutor === 'agente' && f.agente_id
    ? el('a', { class: 'fase-agente', href: '#equipo/agente/' + encodeURIComponent(f.agente_id) }, [avatar({ id: f.agente_id, nombre: f.agente_nombre, avatar_url: f.agente_avatar_url }), el('b', { text: f.agente_nombre || f.agente_id })])
    : el('span', { class: 'pill gris ejecutor', text: EJECUTOR_TEXTO[f.ejecutor] || f.ejecutor });
  return el('div', { class: 'fase-ejecutor' }, [quien, ...piezas]);
}
export function tarjetaFase(f, ahora = new Date()) {
  const vivo = f.con_tareas ? textoTareas(f.tareas || {}) : null;
  return el('li', { class: 'card-fase', 'data-fase': f.fase }, [
    el('div', { class: 'fase-cab' }, [
      f.grupo === 'cadena' ? el('span', { class: 'fase-num', text: String(f.orden) }) : null,
      el('h3', { text: f.nombre || f.fase }),
      chipPiezas(f, ahora)]),
    ejecutorFase(f),
    f.que_hace ? el('p', { class: 'funcion', text: f.que_hace }) : null,
    el('p', { class: 'sub', text: f.donde || '' }),
    vivo ? el('p', { class: 'ahora', text: vivo }) : null]);
}
function cuerpoCadena(filas, ahora) {
  const cadena = filas.filter(f => f.grupo !== 'transversal'), trans = filas.filter(f => f.grupo === 'transversal');
  return [
    el('h3', { text: 'Cadena, fase a fase' }),
    el('ol', { class: 'cadena' }, cadena.map(f => tarjetaFase(f, ahora))),
    trans.length ? el('h3', { text: 'Piezas transversales' }) : null,
    trans.length ? el('ul', { class: 'cadena transversal' }, trans.map(f => tarjetaFase(f, ahora))) : null].filter(Boolean);
}
// Si la RPC falla y no hay cache, aviso rojo y, como respaldo, las tarjetas de los agentes de fase.
function seccionCadena(fasesAgs, S, ahora) {
  const caja = el('div', { class: 'cadena-caja' });
  const pintar = (filas, aviso) => {
    caja.innerHTML = '';
    if (aviso) caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: aviso }));
    if (filas) caja.append(...cuerpoCadena(filas, ahora));
    else caja.append(el('div', { class: 'lista-rica' }, fasesAgs.map(a => tarjetaAgente(a, S, ahora))));
  };
  if (cadenaCache) pintar(cadenaCache.filas, null);
  else caja.append(el('p', { class: 'cargando', text: 'Cargando la cadena...' }));
  if (cadenaCache && Date.now() - cadenaCache.t < PIEZAS_CACHE_MS) return caja;
  (async () => {
    try {
      const r = await cargaCadena();
      const filas = (Array.isArray(r) ? r : []).slice().sort((x, y) => (x.orden || 0) - (y.orden || 0));
      cadenaCache = { filas, t: Date.now() };
      pintar(filas, null);
    } catch (e) {
      pintar(cadenaCache ? cadenaCache.filas : null, 'No se pudo cargar la cadena del motor (' + (e?.message || 'error') + ').');
    }
  })();
  return caja;
}


export function render(raiz, S, arg, filtrosRuta = {}, ahora = new Date()) {
  const ags = (S.datos.agentes || []).filter(a => a.activo !== false).sort((x, y) => (x.nivel - y.nivel) || (x.nombre || '').localeCompare(y.nombre || ''));
  const { fases, mantenimiento } = separarMotor(ags);
  raiz.append(el('section', { class: 'seccion motor' }, [
    el('h1', { text: 'Licita Engine' }),
    el('p', { class: 'mudo', text: 'La cadena en orden: cada fase con quien la ejecuta, agente de IA o pieza sin IA. Los agentes se clonan en réplicas y solo trabajan en el motor.' }),
    seccionCadena(fases, S, ahora),
    mantenimiento.length ? el('h3', { text: 'Mantenimiento del motor' }) : null,
    el('div', { class: 'lista-rica' }, mantenimiento.map(a => tarjetaAgente(a, S, ahora)))]));
  raiz.append(seccionPiezas(ahora));
}
