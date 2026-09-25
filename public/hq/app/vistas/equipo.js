// Equipo: lista por departamento y ficha de agente con frentes y encargos abiertos. Sustituye el
// stub de T1.
//
// T6-b (ruling del controlador, 2026-09-16): agentes[].jefe no existe en el payload real: se omite
// por completo (ni se lee ni se muestra "reporta a ...").
//
// Ultima instruccion del controlador (punto 3): "editar" frentes de un agente es una de las 4
// acciones de escritura de esta tarea y solo se muestra con S.datos.rol==='owner' (ya lo hacia el
// paso 3 del brief; se mantiene).
//
// Fix ronda 1 (revision del controlador, hallazgo BLOQUEA): agentes[].sesion_abierta es el
// expediente_id (bigint, schema-v2.sql:964), no un objeto con .expediente_id/.nombre. Se resuelve el
// nombre buscando primero en S.datos.sesiones (misma sesion, mismo agente) y si no aparece en
// S.datos.expedientes por id; si tampoco esta, se muestra '#' + id en vez de "undefined".
//
// Fix ronda de tarjetas ricas (#1057, hallazgo de Diego con capturas): la cabecera de la tarjeta y de
// la ficha reusaban '.cab' y '.objetivo' (fondo oscuro de la app), con texto oscuro encima: casi
// invisible en los dos sitios. Cabeceras nuevas en app/cards.css, sin depender de esas dos clases.
// Avatar con svg propio si falta avatar_url (como en v1), semaforo de latido en la tarjeta y en la
// ficha, coste del mes cuando d.uso trae dato para el agente. El cuadro de mando se va a Operacion/KPIs
// (grupo equipo): aqui queda un enlace; cuadroEquipo/TRAMOS/tramo/porDepto se mantienen exportados
// para ese uso.
import { rpc } from '../api.js';
import { el, modal, toast, horas, urlSegura } from '../ui.js';
import { filtrar, tramoLatido } from '../estado.js';
import { donut, apilada } from '../graficos.js';
import { panel, cifra, grafico, leyenda, filaBarra } from '../cuadro.js';
import { tarjetaEncargo } from '../tarjeta.js';
import { recargar } from '../main.js';
import { usd } from './recursos.js';
import { hace } from './salud.js';

// Fix ronda 2 (B2): avatar_url lo publica hq.py agente avatar-url sin validar esquema en la BD.
// NIT #9 (parado, aplicado aqui por ser trivial): (a.nombre || a.id) puede ser '' si ambos faltan;
// se cae a '?' en vez de lanzar en [0] de una cadena vacia.
// Fix tarjetas ricas: si falta avatar_url se prueba el svg de /hq/avatares/<id>.svg (como en v1) antes
// de caer a la inicial; si la imagen falla al cargar (svg inexistente, 404), onerror la sustituye por
// la inicial en vez de dejar el hueco roto del navegador.
function inicial(a) { return ((a.nombre || a.id || '?')[0] || '?').toUpperCase(); }
function avatar(a) {
  const letra = el('span', { class: 'avatar letra', text: inicial(a) });
  const src = urlSegura(a.avatar_url) || (a.id ? '/hq/avatares/' + encodeURIComponent(a.id) + '.svg' : '');
  if (!src) return letra;
  return el('img', { class: 'avatar', src, alt: '', onerror: e => { const t = e?.target; if (t?.replaceWith) t.replaceWith(letra); } });
}
// Punto 2 del hallazgo de Diego ("click en avatar abre chat"): si hay sesion_url el avatar es el enlace,
// sin boton aparte en la tarjeta (texto minimo). Sin sesion_url el avatar no es clicable.
function avatarConChat(a) {
  const img = avatar(a);
  const url = urlSegura(a.sesion_url);
  return url ? el('a', { class: 'avatar-link', href: url, target: '_blank', rel: 'noopener', 'aria-label': 'Abrir chat de ' + (a.nombre || a.id) }, [img]) : img;
}
function nombreExpedienteSesion(id, agenteId, S) {
  const s = (S.datos.sesiones || []).find(x => x.expediente_id === id && x.agente === agenteId);
  if (s?.nombre) return s.nombre;
  const e = (S.datos.expedientes || []).find(x => x.id === id);
  return e?.nombre || ('#' + id);
}

function editarFrentes(a, S) {
  const cajas = (S.datos.frentes || []).map(f => el('label', { class: 'fila' }, [el('input', { type: 'checkbox', value: f.codigo, checked: (a.frentes_codigos || []).includes(f.codigo) }), f.codigo + ' ' + f.linea]));
  const m = modal({ titulo: 'Frentes de ' + a.nombre, cuerpo: cajas, acciones: [el('button', { class: 'btn primario', text: 'Guardar', onclick: async () => {
    const sel = cajas.map(c => c.querySelector('input')).filter(i => i.checked).map(i => i.value);
    try { await rpc('omc_agente_frentes_set', { p_agente: a.id, p_frentes: sel }); m.cerrar(); toast('frentes guardados'); await recargar(); }
    catch (err) { toast('HQ rechaza: ' + err.message); }
  } })] });
}

// Perfiles vivos (#1057 tarea 23, HQ 2.0.10). Latido en cuatro tramos (activo menos de 1 h, hoy menos
// de 24 h, dormido, sin latido); TRAMOS alimenta el grafico apilado de cuadroEquipo (paleta neutra del
// cuadro), COLOR_LATIDO alimenta el semaforo de la tarjeta/ficha (verde/ambar/rojo/gris): son dos
// escalas distintas a proposito, no se fusionan.
export const TRAMOS = [['activo', 'activo ahora', 'tinta'], ['hoy', 'hoy', 'tinta-2'], ['dormido', 'más de 24 h', 'neutro-2'], ['sin', 'sin latido', 'neutro-3']];
// 2.0.20: el criterio del latido vive en estado.js (tramoLatido), única fuente para el punto verde,
// para decidirSesion de expedientes y para "N agentes activos" de Home. Aquí solo se reexporta.
export const tramo = tramoLatido;
const COLOR_LATIDO = { activo: 'verde', hoy: 'ambar', dormido: 'rojo', sin: 'neutro-2' };
function textoLatido(a, ahora) {
  const t = tramo(a, ahora);
  if (t === 'dormido') return 'hace ' + Math.floor(horas(a.ultima_actividad, ahora) / 24) + ' d';
  return { activo: 'activo ahora', hoy: 'hoy', sin: 'sin latido' }[t];
}
function chipLatido(a, ahora) {
  const color = COLOR_LATIDO[tramo(a, ahora)];
  return el('span', { class: 'pill' + (color !== 'neutro-2' ? ' ' + color : '') }, [el('i', { class: 'punto g-' + color }), textoLatido(a, ahora)]);
}
const COLORES_DEPTO = ['tinta', 'tinta-2', 'neutro-1', 'neutro-2', 'neutro-3'];
// Departamentos por número de agentes; a partir del quinto se agrupan en "otros".
export function porDepto(ags) {
  const m = new Map();
  for (const a of ags) { const d = a.depto || 'sin depto'; m.set(d, (m.get(d) || 0) + 1); }
  const xs = [...m].map(([l, v]) => ({ l, v })).sort((x, y) => (y.v - x.v) || x.l.localeCompare(y.l));
  const top = xs.length > 5 ? [...xs.slice(0, 4), { l: 'otros', v: xs.slice(4).reduce((s, x) => s + x.v, 0) }] : xs;
  return top.map((x, i) => ({ ...x, color: COLORES_DEPTO[i] }));
}

// Chips comunes a tarjeta y ficha: cuenta, latido en semaforo, encargos abiertos (enlace al tablero
// filtrado por agente), hasta 3 frentes (con "+N" el resto) y coste del mes si d.uso trae dato para
// este agente. Encargos y frentes son enlaces: menos texto, menos clics para llegar al detalle.
function chipsAgente(a, S, ahora) {
  const f = a.frentes_codigos || [];
  const uso = (S.datos.uso?.por_agente || []).find(u => u.agente === a.id);
  return el('div', { class: 'chips' }, [
    a.cuenta ? el('span', { class: 'pill', text: a.cuenta + '@' }) : null,
    chipLatido(a, ahora),
    el('a', { class: 'pill', href: '#operacion/tablero?agente=' + encodeURIComponent(a.id), text: (a.encargos_abiertos || 0) + (a.encargos_abiertos === 1 ? ' encargo' : ' encargos') }),
    ...f.slice(0, 3).map(c => el('a', { class: 'pill codigo', href: '#operacion/tablero?frente=' + c, text: c })),
    f.length > 3 ? el('span', { class: 'pill', text: '+' + (f.length - 3) }) : null,
    uso && Number(uso.coste) ? el('span', { class: 'pill', text: usd(uso.coste) + '/mes' }) : null,
    a.sesion_abierta ? el('a', { class: 'pill sesion', href: '#operacion/expedientes/' + a.sesion_abierta, text: 'en sesión: ' + nombreExpedienteSesion(a.sesion_abierta, a.id, S) }) : null,
  ]);
}

// Schema-v30: tipo (fase|area|proyecto) y modo (continuo|a_demanda) de omc_agentes viajan solos en el
// payload (to_jsonb(a) en omc_hq_v2, sin lista de columnas explicita) y se anaden a la misma linea de
// sub que depto/nivel/modelo; filter(Boolean) los omite si el agente aun no los trae.
const MODO_TEXTO = { continuo: 'continuo', a_demanda: 'a demanda' };
function subAgente(a) { return [a.depto, 'nivel ' + a.nivel, a.modelo, a.tipo, MODO_TEXTO[a.modo]].filter(Boolean).join(' · '); }

function ficha(raiz, S, a, ahora = new Date()) {
  raiz.append(el('a', { href: '#equipo/organigrama', class: 'btn-enlace', text: '← equipo' }));
  const sesionUrl = urlSegura(a.sesion_url);
  raiz.append(el('section', { class: 'ficha-cab fila' }, [
    avatarConChat(a),
    el('div', {}, [
      el('h1', { text: a.nombre || a.id }),
      el('p', { class: 'sub', text: subAgente(a) }),
      chipsAgente(a, S, ahora),
      sesionUrl ? el('a', { class: 'btn primario', href: sesionUrl, target: '_blank', rel: 'noopener', text: 'Abrir sesión' }) : el('span', { class: 'mudo', text: 'sin sesión publicada' }),
    ]),
  ]));
  raiz.append(el('section', { class: 'seccion' }, [
    el('div', { class: 'fila' }, [el('h2', { text: 'Frentes' }), S.datos.rol === 'owner' ? el('button', { class: 'btn-enlace', text: 'editar', onclick: () => editarFrentes(a, S) }) : null]),
    ...(a.frentes_codigos || []).map(c => { const f = (S.datos.frentes || []).find(x => x.codigo === c); return el('a', { class: 'pill codigo', href: '#operacion/tablero?frente=' + c, text: c + (f ? ' ' + f.linea : '') }); }),
    (a.frentes_codigos || []).length ? null : el('p', { class: 'mudo', text: 'sin frentes asignados' })]));
  const enc = filtrar(S.datos.encargos, { agente: a.id }).filter(e => e.estado !== 'hecho' && e.estado !== 'descartado');
  raiz.append(el('section', { class: 'seccion' }, [el('h2', { text: 'Encargos abiertos (' + enc.length + ')' }), ...enc.map(e => tarjetaEncargo(e))]));
}

export function cuadroEquipo(ags, S, ahora = new Date()) {
  const n = t => ags.filter(a => tramo(a, ahora) === t).length;
  const segs = TRAMOS.map(([t, l, color]) => ({ l, v: n(t), color }));
  const vivos = n('activo') + n('hoy');
  const deps = porDepto(ags);
  const carga = ags.filter(a => a.encargos_abiertos > 0).sort((x, y) => y.encargos_abiertos - x.encargos_abiertos);
  const max = Math.max(1, ...carga.map(a => a.encargos_abiertos));
  const total = carga.reduce((s, a) => s + a.encargos_abiertos, 0);
  const enSesion = ags.filter(a => a.sesion_abierta);
  return [
    panel('Equipo activo', '#equipo/organigrama', [cifra(String(ags.length), vivos + ' con latido en las últimas 24 h'),
      grafico(apilada(segs, 'agentes por latido'), 'fina'), leyenda(segs)], 'ancho-2'),
    panel('Por departamento', '#equipo/organigrama', [el('div', { class: 'donut-fila' }, [grafico(donut(deps, 'agentes por departamento'), 'donut'), leyenda(deps)])]),
    panel('Carga de encargos', '#operacion/tablero', [cifra(String(total), 'encargos abiertos en ' + carga.length + (carga.length === 1 ? ' agente' : ' agentes')),
      ...carga.slice(0, 6).map(a => filaBarra(a.nombre || a.id, String(a.encargos_abiertos), 100 * a.encargos_abiertos / max, 'tinta', '#equipo/agente/' + a.id))], 'ancho-2'),
    panel('En sesión', '#equipo/organigrama', [cifra(String(enSesion.length), enSesion.length ? enSesion.map(a => a.nombre || a.id).join(' · ') : 'nadie en sesión ahora')]),
  ];
}

// Tarjeta rica de un agente: el nombre sigue siendo un enlace de verdad a la ficha (teclado y lector de
// pantalla), y ademas toda la tarjeta es clicable (mas area de toque en movil), salvo los enlaces y
// botones internos (encargos, frentes, chat).
export function tarjetaAgente(a, S, ahora = new Date()) {
  return el('article', { class: 'card-agente', onclick: e => { if (e.target?.closest?.('a, button')) return; location.hash = '#equipo/agente/' + a.id; } }, [
    avatarConChat(a),
    // 'cuerpo-agente' y no 'cuerpo': ese nombre ya es la clase global del layout del shell (hq.css), y
    // colisionaba por especificidad heredando align-items:stretch y min-height:100vh en esta tarjeta (19-sep).
    el('div', { class: 'cuerpo-agente' }, [
      el('h3', {}, [el('a', { href: '#equipo/agente/' + a.id, text: a.nombre || a.id })]),
      el('p', { class: 'sub', text: subAgente(a) }),
      chipsAgente(a, S, ahora),
    ]),
  ]);
}

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

export function render(raiz, S, arg, filtrosRuta = {}, ahora = new Date()) {
  // NIT #9 (parado, aplicado aqui por ser trivial): x.nombre/y.nombre pueden faltar en un agente mal
  // dado de alta; localeCompare sobre undefined lanza TypeError y tira toda la vista.
  const ags = (S.datos.agentes || []).filter(a => a.activo !== false).sort((x, y) => (x.nivel - y.nivel) || (x.nombre || '').localeCompare(y.nombre || ''));
  if (arg) { const a = ags.find(x => x.id === arg); if (a) return ficha(raiz, S, a, ahora); }
  raiz.append(el('div', { class: 'fila enlace-kpis' }, [el('a', { class: 'btn-enlace', href: '#kpis?grupo=equipo', text: 'KPIs ›' })]));
  const deptos = [...new Set(ags.map(a => a.depto))];
  for (const d of deptos) raiz.append(el('section', { class: 'seccion' }, [el('h2', { text: d }), el('div', { class: 'lista-rica' }, ags.filter(a => a.depto === d).map(a => tarjetaAgente(a, S, ahora)))]));
  raiz.append(seccionPiezas(ahora));
}
