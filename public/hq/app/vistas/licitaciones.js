// Operación/Licitaciones (#1057 tarjetas ricas; tanda 4 LICITA-SPEC.md 5/6.2/6.3: vista única de los 12
// estados de omc_licitaciones, con card + ficha, historial de cambios y los botones de transición).
// omc_hq_v2 recorta 'licitaciones' a la pestaña activa y ~30 días, y solo se lo sirve al owner (visto en
// el cuerpo en vivo de la función); para no esconder nunca una fila real esta vista pide su listado
// directo a omc_licitaciones_tabla (licitacionesTabla() de api.js), filtrado por estado en servidor.
// H5: se retira ?vista=menores; 'Menor' pasa a ser un filtro más (importe_max 20000) de esta misma vista.
// El cuadro de los cinco paneles (embudo, pipeline...) se queda en Operación/KPIs vía panelesLicitaciones,
// que sigue leyendo el payload de omc_hq_v2 sin tocar: esa vista es una foto agregada, no necesita fidelidad total.
import { el, fecha, urlSegura } from '../ui.js';
import { embudo, porElegible, porDecidir, vencida, esperandoResolucion, sinPresentarUrgente, ordenCierre, estadoDe, estadoBase, estadoPartido, solvenciaTexto, pipelinePorMes, tipologiaOrgano, tipologia, TIPOLOGIAS, filtrar, enlacesLic, ESTADOS_H1 } from '../licitaciones.js';
import { botonesTransicion, botonClaveSobre, checklistA5 } from '../decision-lic.js';
import { recargar } from '../main.js';
import { hojaFiltros, pillsActivos } from '../filtros.js';
import { donut, barras } from '../graficos.js';
import { eurCorto, anchoLog, panel, cifra, grafico, leyenda, ejeX, filaBarra } from '../cuadro.js';
import { cabeceraFuentes } from './licitaciones-menores.js';

const ACTIVAS = new Set(['Aprobada', 'Presentada']);
// Brief 2023 (colorines de la card, pedido de Diego): familia de color de tokens.css por estado, por
// tramo de importe y por familia de organo. Todas las pildoras nuevas usan la clase generica
// 'tag-<color>' (cards.css/tokens.css); nunca oro de relleno (regla de la propia app: oro solo acento).
const COLOR_TAG_ESTADO = { Aprobada: 'verde', Presentada: 'azul', 'Por decidir': 'ambar', 'En redacción': 'violeta', 'Por presentar': 'violeta', Subsanación: 'ambar', 'Propuesta de adjudicación': 'azul', Adjudicada: 'verde', Nueva: 'gris' };
export function colorEstado(estado) { return COLOR_TAG_ESTADO[estado] || 'gris'; }
// Umbral de procedimiento (LCSP simplificado/abierto): <15k, 15-60k, 60-215k, >215k.
export function importeClase(imp) {
  const n = Number(imp) || 0;
  return n < 15000 ? 'imp-1' : n < 60000 ? 'imp-2' : n < 215000 ? 'imp-3' : 'imp-4';
}
const COLOR_TAG_ORGANO = { Ayuntamiento: 'verde', Diputación: 'indigo', Consorcio: 'rosa', Autonómica: 'violeta', Estatal: 'oliva', Universidad: 'cian', 'Empresa pública': 'gris', Otro: 'gris' };
export function colorOrgano(nombre) { return COLOR_TAG_ORGANO[nombre] || 'gris'; }
// Texto de "cierra en N d": rojo <= 3, ambar <= 7, neutro el resto (distinto del semaforo del punto,
// que usa sus propios umbrales de 7/14 dias ya establecidos). Solo se aplica al futuro (d >= 0); lo ya
// cerrado o sin fecha se queda en neutro, igual que antes.
export function colorTextoPlazo(d) { return d == null || d < 0 ? 'neutro' : d <= 3 ? 'rojo' : d <= 7 ? 'ambar' : 'neutro'; }

// Tanda 4: unico camino de datos de esta vista. api.js se importa en diferido porque toca
// location/localStorage al cargarse y los tests importan esta vista sin DOM; usarCargador() permite a
// los tests sustituir la RPC por una funcion propia (misma idea que licitaciones-menores.js).
let cargador = async filtro => (await import('../api.js')).licitacionesTabla(filtro);
export function usarCargador(fn) { cargador = fn; }
const CACHE_MS = 5 * 60e3;
// Estado de la app de la última pintada: tras una transición se invalida la caché de la tabla, si no la
// lista sigue mostrando el estado viejo hasta 5 min (Diego 23-sep, 229/2026 seguía en Por decidir).
let estadoApp = null;
const recargarSinCache = () => { if (estadoApp) estadoApp.cacheLicTabla = null; return recargar(); };
let turno = 0;
const COLOR_ESTADO = { Aprobada: 'tinta', Presentada: 'tinta-2', 'Por decidir': 'neutro-1', Nueva: 'neutro-3' };
const DIA = 864e5;
const importe = l => Number(l.importe) || 0;
const suma = rows => rows.reduce((s, l) => s + importe(l), 0);
function corto(t, n) { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; }

// Días hasta el cierre (negativo si ya pasó), contados por fecha de Madrid a medianoche UTC.
export function diasA(cierre, ahora = new Date()) {
  if (!cierre) return null;
  const c = Date.parse(String(cierre).slice(0, 10)), h = Date.parse(ahora.toISOString().slice(0, 10));
  return isNaN(c) ? null : Math.round((c - h) / DIA);
}
// Semáforo del plazo: rojo a 7 días o menos, ámbar a 14, verde más allá; cerrado en neutro.
export function plazo(cierre, ahora = new Date()) {
  const d = diasA(cierre, ahora);
  if (d == null) return { d, color: 'neutro-3', texto: 'sin fecha de cierre' };
  if (d < 0) return { d, color: 'neutro-2', texto: 'cerró hace ' + -d + ' d' };
  return { d, color: d <= 7 ? 'rojo' : d <= 14 ? 'ambar' : 'verde', texto: d === 0 ? 'cierra hoy' : 'cierra en ' + d + ' d' };
}
// Porcentaje del plazo consumido entre la detección y el cierre (null si falta alguna fecha). Ya no
// se pinta en la tarjeta (recorte de alto en móvil), pero se mantiene: la usan otras vistas/tests.
export function plazoConsumido(l, ahora = new Date()) {
  const a = Date.parse(l.detectada || ''), c = Date.parse(String(l.cierre || '').slice(0, 10));
  if (isNaN(a) || isNaN(c) || c <= a) return null;
  return Math.max(0, Math.min(100, Math.round(100 * (ahora.getTime() - a) / (c - a))));
}

// H1: los 12 estados reales son ahora los chips (antes eran 7 grupos con nombres inventados). ALIAS
// mantiene vivos los enlaces viejos que ya existen en hoy.js, kpis.js, objetivo.js y embudos.js
// (?estado=activas, criba, pausadas, nuevas, decidir, aprobadas, redaccion, presentadas, descartadas);
// 'pausadas' cae en 'Por decidir', el estado vivo mas parecido tras la migracion H1.
const ALIAS = { activas: 'Aprobada', criba: 'Nueva', pausadas: 'Por decidir', descartadas: 'Descartada',
  nuevas: 'Nueva', decidir: 'Por decidir', aprobadas: 'Aprobada', redaccion: 'En redacción', presentadas: 'Presentada' };
export function estadoChip(valorRuta) {
  const v = String(valorRuta || ''), k = ALIAS[v] || v;
  return ESTADOS_H1.includes(k) ? k : '';
}
export function ordenar(rows, orden = 'cierre') {
  return [...rows].sort(orden === 'importe' ? (a, b) => (Number(a.importe) || Infinity) - (Number(b.importe) || Infinity) || ordenCierre(a, b) : ordenCierre);
}
// El buscador de la hoja es el filtro 'texto' de filtrar(); buscar() se mantiene como atajo.
export function buscar(rows, texto) { return filtrar(rows, { texto }); }
// Filtro que viaja al servidor (omc_licitaciones_tabla): estado, importe (Menor = importe_max 20000),
// etiqueta y cierre (por defecto solo abiertas, cierre >= hoy; 'abiertas=0' las incluye todas). La
// 'Nueva' pide hasta 1000 filas (cola de criba); el resto, 500.
export function filtroServidor(v, ahora = new Date()) {
  const est = estadoChip(v.estado) || 'Por decidir';
  const f = { estados: [est], limite: est === 'Nueva' ? 1000 : 500 };
  if (v.menor === '1') f.importe_max = 20000;
  if (v.etiqueta) f.etiquetas = [v.etiqueta];
  if (v.abiertas !== '0') f.cierre_desde = ahora.toISOString().slice(0, 10);
  return f;
}
// Filtros que no tiene la RPC (tipología, solvencia, tipo, presencial, texto, motivo de NO): se aplican
// en cliente sobre la página ya traída, igual que hacía filtrar() antes de esta tanda.
export function filtroCliente(v) {
  return { tipologia: v.tipologia || '', solvencia: v.solvencia || '', tipo: v.tipo || '', presencial: v.presencial || '', texto: v.texto || '' };
}

// Paneles del cuadro (se mueven a Operación/KPIs vía panelesLicitaciones; se dejan intactos aquí como
// funciones internas para que ese export los reutilice sin duplicar código). Siguen leyendo el payload
// de omc_hq_v2 (d.licitaciones/d.lic_resumen/d.kpis): es una foto agregada, no la vista única de arriba.
function panelPipeline(lics, ahora) {
  const act = lics.filter(l => ACTIVAS.has(estadoDe(l))), meses = pipelinePorMes(lics, ahora);
  const nA = act.filter(l => estadoDe(l) === 'Aprobada').length, nP = act.length - nA;
  return panel('Pipeline activo', '#operacion/licitaciones?estado=activas', [
    cifra(eurCorto(suma(act)), nA + ' aprobadas · ' + nP + ' presentadas · sin IVA'),
    grafico(barras(meses.map(m => ({ partes: [{ v: m.presentada, color: 'tinta' }, { v: m.aprobada, color: 'neutro-2' }] })), 'importe por mes de cierre'), 'barras'),
    ejeX(meses.map(m => m.etiqueta)),
    leyenda([{ color: 'tinta', l: 'presentadas' }, { color: 'neutro-2', l: 'aprobadas' }]),
  ], 'ancho-2');
}
function panelEmbudo(lics, kpis, resumen, ahora) {
  const filas = embudo(lics, kpis, resumen, ahora).filter(f => f.n > 0 || ['aprobadas', 'presentadas', 'adjudicadas'].includes(f.clave));
  const max = Math.max(1, ...filas.map(f => f.n)), tasa = kpis['lic.tasa_exito'], act = kpis['lic.actualizado'];
  return panel('Embudo', '#operacion/licitaciones', [
    el('div', { class: 'filas' }, filas.map(f => filaBarra(f.nombre, f.n.toLocaleString('es-ES'), anchoLog(f.n, max), f.clave === 'presentadas' ? 'oro' : 'tinta-2'))),
    tasa?.valor != null ? el('p', { class: 'sub', text: 'tasa de éxito ' + tasa.valor + ' %' }) : null,
    act?.texto ? el('p', { class: 'sub', text: 'barrido actualizado ' + act.texto }) : null,
  ]);
}
function panelEstados(lics) {
  const cuenta = {};
  for (const l of lics) { const e = estadoDe(l); if (COLOR_ESTADO[e]) cuenta[e] = (cuenta[e] || 0) + 1; }
  const segs = Object.keys(COLOR_ESTADO).filter(e => cuenta[e]).map(e => ({ l: e, v: cuenta[e], color: COLOR_ESTADO[e] }));
  const total = segs.reduce((s, x) => s + x.v, 0);
  return panel('Por estado', '#operacion/licitaciones', [
    el('div', { class: 'donut-fila' }, [el('div', { class: 'donut' }, [grafico(donut(segs, 'licitaciones abiertas por estado')), el('span', { class: 'centro', text: String(total) })]), leyenda(segs)]),
  ]);
}
function panelDecidir(lics, ahora) {
  const pd = porDecidir(lics, ahora);
  return panel('Por decidir', '#hoy/bandeja', [
    cifra(String(pd.length), pd.length ? eurCorto(suma(pd)) + ' sin IVA en juego' : 'nada pendiente'),
    pd.length ? el('ul', { class: 'lista-corta' }, pd.slice(0, 3).map(l => el('li', { text: corto(l.resumen_corto || l.objeto || l.expediente, 60) + ' · ' + plazo(l.cierre).texto }))) : null,
  ], pd.length ? 'alerta' : null);
}
function panelCierres(lics, ahora) {
  const prox = ordenar(lics.filter(l => estadoDe(l) === 'Aprobada' && (diasA(l.cierre, ahora) ?? -1) >= 0), 'cierre');
  const p = prox[0] ? plazo(prox[0].cierre, ahora) : null;
  return panel('Próximos cierres', '#operacion/licitaciones?estado=activas', [
    cifra(p ? (p.d === 0 ? 'hoy' : p.d + ' d') : '-', p ? 'hasta el siguiente cierre de una aprobada' : 'sin aprobadas por cerrar'),
    prox.length ? el('ul', { class: 'lista-corta' }, prox.slice(0, 3).map(l => el('li', { text: fecha(l.cierre) + ' · ' + corto(l.resumen_corto || l.objeto || l.expediente, 50) }))) : null,
  ], p && p.d <= 7 ? 'alerta' : null);
}
// Grupo 'Licitaciones' de Operación/KPIs (#1057 tarea 29): mismos 5 paneles que antes encabezaban esta
// vista, ahora reutilizados desde kpis.js sin duplicar código ni tocar más de esta vista.
export function panelesLicitaciones(d, ahora = new Date()) {
  const lics = d.licitaciones || [], resumen = d.lic_resumen || {}, kpis = d.kpis || {};
  const vivas = lics.filter(l => !vencida(l, ahora));                // #1238: las vencidas sin resolver no cuentan como pipeline ni como abiertas
  return [panelPipeline(vivas, ahora), panelEmbudo(lics, kpis, resumen, ahora), panelEstados(vivas), panelDecidir(lics, ahora), panelCierres(vivas, ahora)];
}

// Tarjeta rica de una licitación: colapsada por defecto, clic/Intro/espacio despliega el detalle,
// ficha y el historial de cambios (H7, se pide una vez, al primer despliegue). Sin '.cab' (esa clase es
// la barra superior oscura de la app, aquí pintaba el header casi ilegible).
function alternar(art) {
  const abierto = art.getAttribute('aria-expanded') === 'true';
  art.setAttribute('aria-expanded', String(!abierto));
  return !abierto;
}
export function tarjetaLic(l, ahora = new Date(), rol = 'agente') {
  const venc = vencida(l, ahora), espera = esperandoResolucion(l, ahora);
  // #1238: vencida sin resolver en rojo y con lo que falta por hacer; Presentada con cierre pasado no "cerro", espera al organo.
  const p0 = plazo(l.cierre, ahora);
  const urgente = sinPresentarUrgente(l, ahora);                 // Aprobada/OK que cierra en menos de 48 h y no esta presentada
  const p = venc ? { ...p0, color: 'rojo', texto: p0.texto + ' · sin resolver' } : espera ? { ...p0, color: 'neutro-2', texto: 'Presentada · esperando resolución' }
    : urgente ? { ...p0, color: 'rojo', texto: p0.texto + ' · sin presentar' } : p0;
  const claseTexto = venc || urgente ? 'rojo' : colorTextoPlazo(p.d);
  const enlaces = enlacesLic(l).map(([t, u]) => [t, urlSegura(u)]).filter(x => x[1]);
  const solv = solvenciaTexto(l);
  const tipo = tipologiaOrgano(l.organo);
  const tags = tipologia(l);
  const par = estadoPartido(l);
  // H4: el motivo de descarte ya no es un array de texto libre (l.motivos, catálogo viejo sin fiabilidad
  // desde la migración H1) sino el campo nuevo motivo_descarte, escrito por omc_licitacion_transicion
  // desde el catálogo cerrado de omc_motivos_no(). Se muestra tal cual, sin filtrar por ninguna lista.
  const tagsMotivo = par.estado === 'Descartada' && l.motivo_descarte ? [el('span', { class: 'pill', text: corto(l.motivo_descarte, 60) })] : [];
  const etiquetas = Array.isArray(l.etiquetas) ? l.etiquetas : [];
  const historial = el('div', { class: 'lic-historial' });
  let historialCargado = false;
  const cargarHistorial = () => {
    if (historialCargado || !l.id) return;
    historialCargado = true;
    historial.append(el('p', { class: 'mudo', text: 'cargando historial…' }));
    import('../api.js').then(m => m.licitacionCambios(l.id)).then(cambios => {
      historial.innerHTML = '';
      if (!Array.isArray(cambios) || !cambios.length) { historial.append(el('p', { class: 'mudo', text: 'sin cambios registrados' })); return; }
      historial.append(el('ul', { class: 'lista-corta' }, cambios.map(c => el('li', {
        text: (c.fecha ? fecha(c.fecha) + ' · ' : '') + c.campo + ': ' + (c.antes ?? '-') + ' → ' + (c.despues ?? '-') + (c.actor ? ' · ' + c.actor : '') + (c.motivo ? ' (' + c.motivo + ')' : ''),
      }))));
    }).catch(() => { historial.innerHTML = ''; historial.append(el('p', { class: 'mudo', text: 'no se pudo cargar el historial' })); });
  };
  const alClic = e => { if (e.target?.closest?.('a, button')) return; if (alternar(e.currentTarget || art)) cargarHistorial(); };
  const art = el('article', {
    class: 'card-lic', tabindex: '0', 'aria-expanded': 'false', 'data-expediente': l.expediente || '',
    onclick: alClic, onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault?.(); if (alternar(e.currentTarget || art)) cargarHistorial(); } },
  }, [
    el('div', { class: 'lic-tags' }, [
      el('span', { class: 'pill tag-' + colorEstado(par.estado), title: 'Estado: ' + par.estado }, [el('i', { class: 'punto g-' + (COLOR_ESTADO[par.estado] || 'neutro-3') }), par.estado]),
      tipo && tipo !== 'Otro' ? el('span', { class: 'pill tag-' + colorOrgano(tipo), title: 'Órgano: ' + tipo, text: tipo }) : null,
      el('span', { class: 'pill ' + importeClase(l.importe), text: l.importe ? eurCorto(l.importe) + ' sin IVA' : 'sin importe' }),
      l.procedimiento ? el('span', { class: 'pill', text: l.procedimiento }) : null,
      ...tagsMotivo,
      ...etiquetas.map(e => el('span', { class: 'pill', text: e })),
      el('span', { class: 'plazo' }, [el('i', { class: 'punto g-' + p.color }), el('span', { class: 'plazo-txt ' + claseTexto, text: p.texto })]),
    ]),
    tags.length ? el('div', { class: 'lic-tipologia' }, tags.map(t => el('span', { class: 'pill tag-' + t.color, title: 'Tipología: ' + t.texto, text: t.texto }))) : null,
    el('h3', { class: 'lic-titulo', text: corto(l.resumen_corto || l.objeto || l.expediente, 160) }),
    l.organo || l.provincia ? el('p', { class: 'lic-organo', text: [l.organo, l.provincia].filter(Boolean).join(' · ') }) : null,
    el('div', { class: 'detalle' }, [
      l.objeto ? el('p', { class: 'sub', text: l.objeto }) : null,
      l.expediente ? el('p', { class: 'sub', text: 'Expediente ' + l.expediente }) : null,
      solv !== 'sin dato' ? el('p', { class: 'sub', text: 'Solvencia: ' + solv }) : null,
      l.agente ? el('p', { class: 'sub', text: 'Agente: ' + l.agente + (l.tomada_en ? ' · tomada ' + fecha(l.tomada_en) : '') }) : null,
      l.motivo_descarte ? el('p', { class: 'sub', text: 'Motivo: ' + l.motivo_descarte + (l.origen_descarte ? ' (' + l.origen_descarte + ')' : '') }) : null,
      l.justificante_drive ? el('p', { class: 'sub' }, [el('a', { class: 'btn-enlace', href: urlSegura(l.justificante_drive), target: '_blank', rel: 'noopener', text: 'Justificante' })]) : null,
      checklistA5(l),
      historial,
    ]),
    el('div', { class: 'lic-pie enlaces enlaces-doc' }, [
      ...enlaces.map(([t, u]) => el('a', { class: 'btn-enlace', href: u, target: '_blank', rel: 'noopener', text: t })),
      ...botonesTransicion(l, recargarSinCache, rol),
      botonClaveSobre(l, rol),
    ]),
  ]);
  return art;
}

function filaCriba(l) {
  const perfil = urlSegura(l.enlace);
  const texto = [l.expediente, l.resumen_corto || l.objeto, l.cierre ? 'cierra ' + fecha(l.cierre) : null, l.importe ? eurCorto(l.importe) + ' sin IVA' : null].filter(Boolean).join(' · ');
  return el('p', {}, [texto, perfil ? el('a', { class: 'btn-enlace', href: perfil, target: '_blank', rel: 'noopener', text: 'Perfil' }) : null]);
}
function grupoCriba([nombre, rows], abierto) {
  return el('details', { class: 'grupo-criba', open: abierto }, [el('summary', { text: nombre + ' (' + rows.length + ')' }), ...rows.map(filaCriba)]);
}

// Ruta canónica de la vista con los filtros puestos; se omite lo vacío y lo que ya es el defecto. Los
// valores viven en la ruta (no en memoria) para que los enlaces de KPIs/Home y el botón atrás del
// iPhone sigan funcionando. H5: ya no hay '?vista=menores'; 'Menor' es v.menor='1' (importe_max 20000).
export function construirRuta(v = {}) {
  const q = new URLSearchParams();
  if (v.estado) q.set('estado', v.estado);
  if (v.orden === 'importe') q.set('orden', 'importe');
  for (const k of ['tipologia', 'solvencia', 'tipo', 'motivo', 'presencial', 'texto', 'etiqueta']) if (v[k] && v[k] !== 'todas') q.set(k, v[k]);
  if (v.menor === '1') q.set('menor', '1');
  if (v.abiertas === '0') q.set('abiertas', '0');
  const s = q.toString();
  return '#operacion/licitaciones' + (s ? '?' + s : '');
}

export function render(raiz, S, arg, filtrosRuta = {}, ahora = new Date()) {
  estadoApp = S;
  const d = S.datos || {};
  const rol = d.rol || 'agente';
  const estado = estadoChip(filtrosRuta.estado) || 'Por decidir';
  const valores = { estado, orden: filtrosRuta.orden === 'importe' ? 'importe' : 'cierre' };
  for (const k of ['tipologia', 'solvencia', 'tipo', 'presencial', 'texto', 'motivo', 'etiqueta']) if (filtrosRuta[k]) valores[k] = filtrosRuta[k];
  if (filtrosRuta.menor === '1') valores.menor = '1';
  if (filtrosRuta.abiertas === '0') valores.abiertas = '0';

  raiz.append(cabeceraFuentes(S));
  raiz.append(el('div', { class: 'fila enlace-kpis' }, [el('a', { class: 'btn-enlace', href: '#kpis?grupo=licitaciones', text: 'KPIs ›' })]));

  const chips = el('div', { class: 'chips chips-embudo' });
  for (const e of ESTADOS_H1) {
    const a = el('a', { class: 'chip' + (e === estado ? ' activo' : ''), href: construirRuta({ ...valores, estado: e }), text: e });
    chips.append(a);
    if (e === estado && a.scrollIntoView) setTimeout(() => a.scrollIntoView({ block: 'nearest', inline: 'center' }), 0);
  }
  const zonaPills = el('div', { class: 'zona-pills' });
  const resumenTxt = el('p', { class: 'mudo' });
  const lista = el('div', { class: (estado === 'Nueva' ? 'lista-criba' : 'lista-rica') + ' con-fab' });

  let filas = [];
  const secciones = [
    { clave: 'estado', titulo: 'Estado', fija: true, visible: () => false, opciones: ESTADOS_H1.map(e => [e, e]) },
    { clave: 'orden', titulo: 'Orden', defecto: 'cierre', opciones: [['cierre', 'Cierre'], ['importe', 'Importe']] },
    { clave: 'menor', titulo: 'Importe', opciones: [['1', 'Solo Menor (< 20.000 € sin IVA)']] },
    { clave: 'abiertas', titulo: 'Cierre', opciones: [['0', 'Incluir ya cerradas']] },
    { clave: 'etiqueta', titulo: 'Etiqueta', opciones: [] },
    { clave: 'tipologia', titulo: 'Tipología', opciones: TIPOLOGIAS.map(t => [t, t]) },
    { clave: 'solvencia', titulo: 'Solvencia', opciones: [['sin solvencia', 'Sin solvencia'], ['exige', 'Exige solvencia']] },
    { clave: 'tipo', titulo: 'Tipo', opciones: [] },
    { clave: 'presencial', titulo: 'Presencial', opciones: [['no', 'Sin presencia'], ['si', 'Requiere presencia']] },
    { clave: 'motivo', titulo: 'Motivo de NO', visible: v => estadoChip(v.estado) === 'Descartada', opciones: [] },
    { clave: 'texto', titulo: 'Buscar', libre: true },
  ];

  const pintarPills = () => {
    zonaPills.innerHTML = '';
    const p = pillsActivos(valores, secciones, clave => { const v = { ...valores }; delete v[clave]; location.hash = construirRuta(v); });
    if (p) zonaPills.append(p);
  };
  const filasVisibles = v => {
    const base = filtrar(filas, filtroCliente(v));
    return base.filter(l => !v.motivo || (v.motivo === 'sin' ? !l.motivo_descarte : l.motivo_descarte === v.motivo));
  };
  const pintarLista = rows => {
    lista.innerHTML = '';
    if (!rows.length) { lista.append(el('p', { class: 'mudo', text: 'nada con este filtro' })); return; }
    if (estado === 'Nueva') porElegible(rows).forEach((g, i) => lista.append(grupoCriba(g, i === 0)));
    else ordenar(rows, valores.orden).forEach(l => lista.append(tarjetaLic(l, ahora, rol)));
  };

  const hoja = hojaFiltros({
    secciones, valores, total: 0,
    onCambio: v => filasVisibles(v).length,
    onAplicar: v => { location.hash = construirRuta(v); },
  });
  pintarPills();
  raiz.append(chips, zonaPills, resumenTxt, lista, hoja.fab, hoja.hoja);

  const mio = ++turno;
  const filtro = filtroServidor(valores, ahora);
  const firma = JSON.stringify(filtro);
  const cache = S.cacheLicTabla;
  const usar = datos => {
    filas = Array.isArray(datos?.filas) ? datos.filas : [];
    const total = Number(datos?.total) || filas.length;
    resumenTxt.textContent = total + (total === 1 ? ' resultado' : ' resultados') + (filas.length < total ? ' (mostrando ' + filas.length + ')' : '');
    const secEtq = secciones.find(s => s.clave === 'etiqueta'), secTipo = secciones.find(s => s.clave === 'tipo'), secMot = secciones.find(s => s.clave === 'motivo');
    if (secEtq) secEtq.opciones = [...new Set(filas.flatMap(l => l.etiquetas || []))].map(e => [e, e]);
    if (secTipo) secTipo.opciones = [...new Set(filas.map(l => l.tipo).filter(Boolean))].map(t => [t, t]);
    if (secMot) secMot.opciones = [...new Set(filas.map(l => l.motivo_descarte).filter(Boolean))].map(m => [m, m]).concat([['sin', 'Sin motivo']]);
    const rows = filasVisibles(valores);
    pintarLista(rows);
    hoja.actualizar(valores, rows.length);
  };
  if (cache && cache.firma === firma && Date.now() - cache.ts < CACHE_MS) { usar(cache.datos); return; }
  lista.append(el('p', { class: 'mudo', text: 'cargando…' }));
  return cargador(filtro).then(datos => {
    if (mio !== turno || raiz.isConnected === false) return;
    S.cacheLicTabla = { firma, datos, ts: Date.now() };
    usar(datos);
  }).catch(() => {
    if (mio !== turno) return;
    lista.innerHTML = '';
    lista.append(el('p', { class: 'mudo', text: 'no se pudo cargar la tabla' }));
  });
}
