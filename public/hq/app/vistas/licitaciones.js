// Operación/Licitaciones (#1057 tarjetas ricas; tanda 4 LICITA-SPEC.md 5/6.2/6.3: vista única de los 12
// estados de omc_licitaciones, con card + ficha, historial de cambios y los botones de transición).
// omc_hq_v2 recorta 'licitaciones' a la pestaña activa y ~30 días, y solo se lo sirve al owner (visto en
// el cuerpo en vivo de la función); para no esconder nunca una fila real esta vista pide su listado
// directo a omc_licitaciones_tabla (licitacionesTabla() de api.js), filtrado por estado en servidor.
// H5: se retira ?vista=menores; 'Menor' pasa a ser un filtro más (importe_max 20000) de esta misma vista.
// El cuadro de los cinco paneles (embudo, pipeline...) se queda en Operación/KPIs vía panelesLicitaciones,
// que sigue leyendo el payload de omc_hq_v2 sin tocar: esa vista es una foto agregada, no necesita fidelidad total.
import { el, fecha, urlSegura, toast } from '../ui.js';
import { embudo, porElegible, porDecidir, vencida, esperandoResolucion, sinPresentarUrgente, ordenCierre, estadoDe, estadoBase, estadoPartido, solvenciaTexto, pipelinePorMes, tipologiaOrgano, tipologia, TIPOLOGIAS, filtrar, enlacesLic, ESTADOS_H1, ETAPAS_LIC, etapaDe, CLAVE_RESUMEN } from '../licitaciones.js';
import { botonesTransicion, botonClaveSobre, checklistA5, ejecutarTransicion } from '../decision-lic.js';
import { recargar, render as repintar } from '../main.js';
import { nombreBloqueo, textoHoras, tableroFases } from './licitaciones-bloqueo.js';
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
// D70 (#2086 spec §2/§3): 'todas-presentadas' es el valor agregado del chip "Todas las presentadas",
// pasa intacto (no es una fase de ESTADOS_H1, así que se distingue antes de mirar el catálogo).
export function estadoChip(valorRuta) {
  const v = String(valorRuta || '');
  if (v === 'todas-presentadas') return v;
  const k = ALIAS[v] || v;
  return ESTADOS_H1.includes(k) ? k : '';
}
// Etapa del filtro (spec §1/§3) para un valor ya resuelto por estadoChip(): el agregado cuenta
// siempre como la etapa 'presentadas'.
export function etapaValor(est) { return est === 'todas-presentadas' ? 'presentadas' : etapaDe(est); }
export function ordenar(rows, orden = 'cierre', descendente = false) {
  const cmp = orden === 'importe' ? (a, b) => (Number(a.importe) || Infinity) - (Number(b.importe) || Infinity) || ordenCierre(a, b) : ordenCierre;
  const prio = r => (r.estado === 'Por decidir' && r.tag_prioritario ? 1 : 0);
  const listado = [...rows].sort(descendente ? cmp : (x, y) => prio(y) - prio(x) || cmp(x, y));
  return descendente ? listado.reverse() : listado;
}
// El buscador de la hoja es el filtro 'texto' de filtrar(); buscar() se mantiene como atajo.
export function buscar(rows, texto) { return filtrar(rows, { texto }); }
// Filtro que viaja al servidor (omc_licitaciones_tabla): estado, importe (Menor = importe_max 20000),
// etiqueta y cierre (por defecto solo abiertas, cierre >= hoy; 'abiertas=0' las incluye todas). La
// 'Nueva' pide hasta 1000 filas (cola de criba); el resto, 500.
export function filtroServidor(v, ahora = new Date()) {
  const agregado = estadoChip(v.estado) === 'todas-presentadas';
  const est = agregado ? null : (estadoChip(v.estado) || 'Por decidir');
  const estados = agregado ? ETAPAS_LIC.find(e => e.clave === 'presentadas').fases : [est];
  const etapa = agregado ? 'presentadas' : etapaDe(est);
  const f = { estados, limite: estados.includes('Nueva') ? 1000 : 500 };
  if (v.menor === '1') f.importe_max = 20000;
  if (v.etiqueta) f.etiquetas = [v.etiqueta];
  // D70 (#2086 spec §3, "caso Calp"): cierre_desde=hoy solo decide algo en 'Antes de decidir'/'En
  // marcha'; en 'Presentadas'/'Cerradas sin ir' la fecha límite ya pasó casi siempre y no debe esconder la fila.
  if ((etapa === 'antes' || etapa === 'marcha') && v.abiertas !== '0') f.cierre_desde = ahora.toISOString().slice(0, 10);
  // O13d (D69, tanda E bis): espera_diego = true cuando la licitación tiene una tarea abierta con
  // lic_tareas.espera_de = 'diego' (schema-v57/v58).
  if (v.espera === '1') f.espera_diego = true;
  return f;
}
// Filtros que no tiene la RPC (tipología, solvencia, tipo, presencial, texto, motivo de NO): se aplican
// en cliente sobre la página ya traída, igual que hacía filtrar() antes de esta tanda.
export function filtroCliente(v) {
  return { tipologia: v.tipologia || '', solvencia: v.solvencia || '', tipo: v.tipo || '', presencial: v.presencial || '', texto: v.texto || '' };
}

// D70 (#2086 spec §2): clave de lic_resumen para cada fase de ESTADOS_H1 (mismo patrón que embudo()
// en licitaciones.js). El contador del chip sale de aquí, no de la página ya traída, para que cuadre
// con omc_licitaciones_tabla aunque esa fase no esté en los ~500 resultados servidos.
export function nFase(resumen, estado) { return Number(resumen?.[CLAVE_RESUMEN[estado]]?.n) || 0; }

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
// Card (Diego 23-sep): sin textos repetidos; una línea con lo que pide la ficha C2 y botón para el chat.
const norm = t => String(t || '').toLowerCase().replace(/[^a-z0-9áéíóúñü]+/g, ' ').trim();
export function resumenFicha(l) {
  const f = l.ficha || {}, c = f.criterios_adjudicacion || {}, s = f.solvencia || {};
  const partes = [];
  if (c.peso_automatico === 100) partes.push('solo precio');
  else if (c.peso_subjetivo != null) partes.push(c.peso_subjetivo + ' % juicio de valor');
  if (f.plazo_ejecucion) partes.push(corto(f.plazo_ejecucion, 40));
  const solv = [s.economica && 'económica', s.tecnica && 'técnica', s.clasificacion && 'clasificación'].filter(Boolean);
  if (f.objeto_real || Object.keys(s).length) partes.push(solv.length ? 'solvencia ' + solv.join(', ') : 'el pliego no detalla solvencia');
  if (f.certificaciones) partes.push('pide ' + corto([].concat(f.certificaciones).join(', '), 40));
  return partes.join(' · ');
}
export function textoChatLic(l) {
  return ['Licitación #' + l.id, l.expediente, corto(l.resumen_corto || l.ficha?.objeto_real || l.objeto || '', 120),
    l.importe ? eurCorto(l.importe) + ' sin IVA' : null, l.cierre ? 'cierra ' + fecha(l.cierre) : null].filter(Boolean).join(' · ') + ': ';
}
async function copiarLic(l) {
  try { await navigator.clipboard.writeText(textoChatLic(l)); toast('Copiado: pégalo en el chat del chief'); }
  catch { toast('No se pudo copiar'); }
}
// D118: importe publicado, ofertado, coste y margen + hitos de la ficha; solo pinta lo que existe.
export function economiaLic(l) {
  const eur = n => (n == null || n === '' ? null : eurCorto(n) + ' sin IVA');
  const pct = l.margen_pct == null || l.margen_pct === '' ? '' : ' (' + (Number(l.margen_pct) * 100).toFixed(1).replace('.', ',') + ' %)';
  const cifras = [
    ['Publicado', eur(l.importe)], ['Ofertado', eur(l.importe_ofertado)], ['Coste estimado', eur(l.coste_estimado)],
    ['Margen', eur(l.margen_estimado) ? eur(l.margen_estimado) + pct : null],
  ].filter(([, v]) => v);
  const hitos = [['En redacción', l.en_redaccion_en], ['Por presentar', l.por_presentar_en], ['Presentada', l.presentada_en], ['Resuelta', l.resuelta_en]]
    .filter(([, v]) => v).map(([k, v]) => k + ' ' + fecha(v, { hora: true }));
  const sinVerificar = l.cierre_fuente === 'fin_de_dia' && !l.cierre_verificado_en;
  return [
    cifras.length ? el('p', { class: 'sub lic-economia', text: cifras.map(([k, v]) => k + ' ' + v).join(' · ') }) : null,
    hitos.length ? el('p', { class: 'sub lic-hitos', text: hitos.join(' · ') }) : null,
    l.cierre ? el('p', { class: 'sub', text: 'Cierre ' + fecha(l.cierre, { hora: true }) + (sinVerificar ? ' (sin verificar: fin de día supuesto)' : l.cierre_verificado_en ? ' (verificado ' + fecha(l.cierre_verificado_en, { hora: true }) + ')' : '') }) : null,
  ].filter(Boolean);
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
  // D99 (#2118): el resumen corto humano manda en la cabecera; objeto (jerga del pliego) y objeto_real pasan al detalle si difieren.
  const titulo = corto(l.resumen_corto || l.ficha?.objeto_real || l.objeto || l.expediente, 160);
  const objetoReal = l.ficha?.objeto_real;
  const historial = el('div', { class: 'lic-historial' });
  let historialCargado = false;
  const cargarHistorial = () => {
    if (historialCargado || !l.id) return;
    historialCargado = true;
    historial.append(el('p', { class: 'mudo', text: 'cargando historial…' }));
    import('../api.js').then(m => m.licitacionHistoria(l.id)).then(h => {
      historial.innerHTML = '';
      const envios = Array.isArray(h?.presentaciones) ? h.presentaciones.filter(x => x.estado === 'confirmada') : [];
      const tareas = Array.isArray(h?.tareas) ? h.tareas : [];
      const cambios = Array.isArray(h?.cambios) ? h.cambios : [];
      const lista = (titulo, items, vacio) => {
        historial.append(el('h4', { class: 'mudo', text: titulo }));
        historial.append(items.length ? el('ul', { class: 'lista-corta' }, items) : el('p', { class: 'mudo', text: vacio }));
      };
      lista('Envíos', envios.map(x => el('li', { text: (x.confirmada_en ? fecha(x.confirmada_en) + ' · ' : '') + x.tipo + (x.requerimiento ? ' ' + x.requerimiento : '')
        + (x.n_registro ? ' · reg ' + x.n_registro : '') + (x.plataforma ? ' · ' + x.plataforma : '') + (x.justificante_drive ? '' : ' · sin justificante en Drive') })), 'sin envíos registrados');
      lista('Tareas', tareas.map(x => el('li', {}, [
        (x.creada_en ? fecha(x.creada_en) + ' · ' : '') + x.fase + ' · ' + x.estado + (x.resultado?.notificacion ? ' · notif ' + x.resultado.notificacion : '') + ' ',
        x.estado !== 'hecha' ? el('span', { class: 'chip bloqueo ' + (x.espera_de === 'proveedor' ? 'proveedor' : ''), text: nombreBloqueo(x.espera_de) + (x.horas_parada != null ? ' · ' + textoHoras(x.horas_parada) : '') }) : '',
      ])), 'sin tareas');
      lista('Cambios', cambios.map(c => el('li', {
        text: (c.fecha ? fecha(c.fecha) + ' · ' : '') + c.campo + ': ' + (c.antes ?? '-') + ' → ' + (c.despues ?? '-') + (c.actor ? ' · ' + c.actor : '') + (c.motivo ? ' (' + c.motivo + ')' : ''),
      })), 'sin cambios registrados');
    }).catch(() => { historial.innerHTML = ''; historial.append(el('p', { class: 'mudo', text: 'no se pudo cargar el historial' })); });
  };
  // O13c (D69, tanda E bis): campos extraidos con cita/ubicacion y criterios evaluados GO/NO GO/DUDA,
  // via lic_ficha_extraccion (schema-v59). Mismo patron de lazy-load que cargarHistorial.
  const ficha = el('div', { class: 'lic-ficha-extraccion' });
  let fichaCargada = false;
  const cargarFicha = () => {
    if (fichaCargada || !l.id) return;
    fichaCargada = true;
    ficha.append(el('p', { class: 'mudo', text: 'cargando…' }));
    import('../api.js').then(m => m.licitacionFicha(l.id)).then(f => {
      ficha.innerHTML = '';
      const extraccion = Array.isArray(f?.extraccion) ? f.extraccion : [];
      const evaluaciones = Array.isArray(f?.evaluaciones) ? f.evaluaciones : [];
      if (!extraccion.length && !evaluaciones.length) { ficha.append(el('p', { class: 'mudo', text: 'sin extracción ni evaluación' })); return; }
      if (evaluaciones.length) {
        ficha.append(el('ul', { class: 'lista-corta' }, evaluaciones.map(v => el('li', {
          text: v.resultado + (v.critico ? ' (crítico)' : '') + ' · ' + v.nombre + (v.motivo_criterio ? ': ' + v.motivo_criterio : ''),
        }))));
      }
      if (extraccion.length) {
        ficha.append(el('ul', { class: 'lista-corta' }, extraccion.map(e => el('li', {
          text: e.campo + ': ' + (typeof e.valor === 'string' ? e.valor : JSON.stringify(e.valor)) + (e.cita ? ' · «' + corto(e.cita, 120) + '»' : ''),
        }))));
      }
    }).catch(() => { ficha.innerHTML = ''; ficha.append(el('p', { class: 'mudo', text: 'no se pudo cargar' })); });
  };
  // D136 (LICITA-SPEC 5.9): notificaciones de sede de esta licitacion (abiertas, sin_asignar o en
  // error). Mismo patron lazy-load; documento/acuse enlazan a Drive, nunca se descargan aqui.
  const notifs = el('div', { class: 'lic-notificaciones' });
  let notifsCargadas = false;
  const cargarNotificaciones = () => {
    if (notifsCargadas || !l.id) return;
    notifsCargadas = true;
    notifs.append(el('p', { class: 'mudo', text: 'cargando…' }));
    import('../api.js').then(m => m.licitacionNotificaciones(l.id)).then(ns => {
      notifs.innerHTML = '';
      if (!Array.isArray(ns) || !ns.length) { notifs.append(el('p', { class: 'mudo', text: 'sin notificaciones' })); return; }
      notifs.append(el('ul', { class: 'lista-corta' }, ns.map(n => el('li', {}, [
        el('span', { text: (n.recibido_en ? fecha(n.recibido_en) + ' · ' : '') + n.plataforma + ' · ' + (n.tipo || '?')
          + ' · ' + n.estado + (n.plazo ? ' · plazo ' + fecha(n.plazo) : '') + (n.organo ? ' · ' + n.organo : '')
          + (n.estado === 'error' && n.error ? ' · ' + n.error : '') }),
        n.documento_drive ? el('a', { class: 'btn-enlace', href: urlSegura(n.documento_drive), target: '_blank', rel: 'noopener', text: 'Documento' }) : null,
        n.acuse_drive ? el('a', { class: 'btn-enlace', href: urlSegura(n.acuse_drive), target: '_blank', rel: 'noopener', text: 'Acuse' }) : null,
      ]))));
    }).catch(() => { notifs.innerHTML = ''; notifs.append(el('p', { class: 'mudo', text: 'no se pudo cargar' })); });
  };
  const alClic = e => { if (e.target?.closest?.('a, button')) return; alternar(e.currentTarget || art); };
  const art = el('article', {
    class: 'card-lic', 'data-sale': '1', tabindex: '0', 'aria-expanded': 'false', 'data-expediente': l.expediente || '',
    onclick: alClic, onkeydown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault?.(); alternar(e.currentTarget || art); } },
  }, [
    el('div', { class: 'lic-tags' }, [
      l.id != null ? el('span', { class: 'pill', title: 'ID de licitación', text: '#' + l.id }) : null,
      el('span', { class: 'pill tag-' + colorEstado(par.estado), title: 'Estado: ' + par.estado }, [el('i', { class: 'punto g-' + (COLOR_ESTADO[par.estado] || 'neutro-3') }), par.estado]),
      ...(Array.isArray(l.tags) ? l.tags.filter(t => ['IA', 'Software'].includes(t)).map(t => el('span', { class: 'pill tag-verde', title: 'Tag prioritario (D127): va primero en Por decidir y en la cola', text: t })) : []),
      l.etiqueta && l.etiqueta !== 'Otros' ? el('span', { class: 'pill tag-teal', title: 'Tipo (CPV' + (l.cpv ? ' ' + String(l.cpv).split(',')[0].trim() : '') + '): ' + l.etiqueta, text: l.etiqueta }) : null,
      tipo && tipo !== 'Otro' ? el('span', { class: 'pill tag-' + colorOrgano(tipo), title: 'Órgano: ' + tipo, text: tipo }) : null,
      el('span', { class: 'pill ' + importeClase(l.importe), text: l.importe ? eurCorto(l.importe) + ' sin IVA' : 'sin importe' }),
      // D56/Tanda G (#2051): Adjudicada con importe_adjudicado (real, sin IVA) muestra un pill aparte;
      // el pill de arriba sigue siendo el presupuesto de licitación, nunca se sustituye (ambos datos son reales).
      par.estado === 'Adjudicada' && l.importe_adjudicado ? el('span', { class: 'pill tag-verde', text: 'Adjudicado ' + eurCorto(l.importe_adjudicado) + ' sin IVA' }) : null,
      l.procedimiento ? el('span', { class: 'pill', text: l.procedimiento }) : null,
      ...tagsMotivo,
      ...etiquetas.map(e => el('span', { class: 'pill', text: e })),
      el('span', { class: 'plazo' }, [el('i', { class: 'punto g-' + p.color }), el('span', { class: 'plazo-txt ' + claseTexto, text: p.texto })]),
      l.cierre_fuente === 'fin_de_dia' && !l.cierre_verificado_en ? el('span', { class: 'pill tag-ambar', title: 'La hora de cierre es fin de día supuesto, no leída del pliego ni de la sede', text: 'cierre sin verificar' }) : null,
    ]),
    tags.length ? el('div', { class: 'lic-tipologia' }, tags.map(t => el('span', { class: 'pill tag-' + t.color, title: 'Tipología: ' + t.texto, text: t.texto }))) : null,
    el('h3', { class: 'lic-titulo', text: titulo }),
    resumenFicha(l) ? el('p', { class: 'sub lic-resumen', text: resumenFicha(l) }) : null,
    l.organo || l.provincia ? el('p', { class: 'lic-organo', text: [l.organo, l.provincia].filter(Boolean).join(' · ') }) : null,
    el('div', { class: 'detalle' }, [
      objetoReal && norm(objetoReal) !== norm(titulo) ? el('p', { class: 'sub', text: 'Objeto real: ' + objetoReal }) : null,
      l.objeto && norm(l.objeto) !== norm(titulo) && norm(l.objeto) !== norm(objetoReal || '') ? el('p', { class: 'sub', text: l.objeto }) : null,
      l.id != null ? el('p', { class: 'sub', text: 'ID ' + l.id }) : null,
      ...economiaLic(l),
      l.expediente ? el('p', { class: 'sub', text: 'Expediente ' + l.expediente }) : null,
      solv !== 'sin dato' ? el('p', { class: 'sub', text: 'Solvencia: ' + solv }) : null,
      l.agente ? el('p', { class: 'sub', text: 'Agente: ' + l.agente + (l.tomada_en ? ' · tomada ' + fecha(l.tomada_en) : '') }) : null,
      l.motivo_descarte ? el('p', { class: 'sub', text: 'Motivo: ' + l.motivo_descarte + (l.origen_descarte ? ' (' + l.origen_descarte + ')' : '') }) : null,
      l.justificante_drive ? el('p', { class: 'sub' }, [el('a', { class: 'btn-enlace', href: urlSegura(l.justificante_drive), target: '_blank', rel: 'noopener', text: 'Justificante' })]) : null,
      checklistA5(l),
      el('details', { class: 'lic-hist', ontoggle: e => { if (e.currentTarget?.open) cargarHistorial(); } }, [el('summary', { text: 'Historial' }), historial]),
      el('details', { class: 'lic-hist', ontoggle: e => { if (e.currentTarget?.open) cargarFicha(); } }, [el('summary', { text: 'Extracción y evaluación' }), ficha]),
      el('details', { class: 'lic-hist', ontoggle: e => { if (e.currentTarget?.open) cargarNotificaciones(); } }, [el('summary', { text: 'Notificaciones' }), notifs]),
    ]),
    el('div', { class: 'lic-pie enlaces enlaces-doc' }, [
      ...enlaces.map(([t, u]) => el('a', { class: 'btn-enlace', href: u, target: '_blank', rel: 'noopener', text: t })),
      ...botonesTransicion(l, recargarSinCache, rol, undefined, repintar),
      botonClaveSobre(l, rol),
      el('button', { class: 'btn', text: 'Copiar para el chat', onclick: () => copiarLic(l) }),
    ]),
  ]);
  return art;
}

function filaCriba(l) {
  const perfil = urlSegura(l.enlace);
  const texto = [l.id != null ? '#' + l.id : null, l.expediente, l.resumen_corto || l.objeto, l.cierre ? 'cierra ' + fecha(l.cierre) : null, l.importe ? eurCorto(l.importe) + ' sin IVA' : null].filter(Boolean).join(' · ');
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
  if (v.espera === '1') q.set('espera', '1');
  const s = q.toString();
  return '#operacion/licitaciones' + (s ? '?' + s : '');
}

// O13b (D69, tanda E bis): panel de D1 (criba-2 con todos los criterios GO auto-aprueba, ventana de veto
// de 12h). Solo owner: es una decision de Diego, no de los agentes. lic_aprobadas_auto (schema-v60) ya
// filtra a las que siguen en Aprobada; el boton 'Vetar' reutiliza ejecutarTransicion (mismo modal de
// motivo que el resto de la app) hacia 'Descartada' y recarga la vista al confirmar.
function panelAprobadasAuto(rol) {
  if (rol !== 'owner') return null;
  // D70 (#2086 spec §5): el panel entero (no solo su contenido) sale únicamente si hay filas dentro
  // de plazo; se resuelve async así que se cuelga vacío y solo se rellena si hay algo que veto.
  const caja = el('div', {});
  import('../api.js').then(m => m.aprobadasAuto(3)).then(filas => {
    const enPlazo = (Array.isArray(filas) ? filas : []).filter(f => f.dentro_de_plazo);
    if (!enPlazo.length) return;
    const cuerpo = el('div', { class: 'lic-historial' }, [el('ul', { class: 'lista-corta' }, enPlazo.map(f => el('li', { 'data-sale': '1' }, [
      el('span', { text: (f.expediente || '#' + f.licitacion_id) + ' · ' + (f.organo || '') + ' · ' + (f.importe ? eurCorto(f.importe) : 'sin importe') + ' · aprobada ' + fecha(f.aprobada_en) + ' ' }),
      el('button', { class: 'btn peligro chip', text: 'Vetar', onclick: ev => ejecutarTransicion({ id: f.licitacion_id, expediente: f.expediente }, 'Descartada', recargarSinCache, { nodo: ev?.currentTarget?.closest?.('[data-sale]'), pintar: repintar }) }),
    ])))]);
    caja.append(el('details', { class: 'lic-hist panel-aprobadas-auto', open: true }, [el('summary', { text: 'Auto-aprobadas por criba 2 · veto 12h (D1)' }), cuerpo]));
  }).catch(() => {});
  return caja;
}

// Avisos y push de licitación (06-10, Diego: "cuando pico en abrir no lo abre"): el aviso solo trae el
// expediente, así que '#operacion/licitaciones?exp=<expediente>' busca su id y salta a la ficha.
function renderPorExpediente(raiz, S, exp) {
  const mio = ++turno;
  const caja = el('div', { class: 'lic-ficha-unica' }, [el('p', { class: 'mudo', text: 'buscando licitación ' + exp + '…' })]);
  raiz.append(cabeceraFuentes(S), caja);
  return cargador({ texto: exp, limite: 20 }).then(datos => {
    if (mio !== turno || raiz.isConnected === false) return;
    const l = (Array.isArray(datos?.filas) ? datos.filas : []).find(x => x.expediente === exp);
    if (l) { location.replace('#operacion/licitaciones/' + l.id); return; }
    caja.innerHTML = '';
    caja.append(el('p', { class: 'mudo', text: 'no se encuentra la licitación ' + exp }));
  }).catch(() => {
    if (mio !== turno) return;
    caja.innerHTML = '';
    caja.append(el('p', { class: 'mudo', text: 'no se pudo cargar la licitación' }));
  });
}

// #2210: deep link #operacion/licitaciones/<id>: la ficha de una sola licitación, sea cual sea su estado (filtro 'id' de la RPC, schema-v122).
function renderFicha(raiz, S, id, ahora, rol) {
  const mio = ++turno;
  const caja = el('div', { class: 'lic-ficha-unica' }, [el('p', { class: 'mudo', text: 'cargando licitación ' + id + '…' })]);
  raiz.append(cabeceraFuentes(S), el('div', { class: 'fila enlace-kpis' }, [el('a', { class: 'btn-enlace', href: '#operacion/licitaciones', text: '‹ Licitaciones' })]), caja);
  return cargador({ id, limite: 1 }).then(datos => {
    if (mio !== turno || raiz.isConnected === false) return;
    const l = (Array.isArray(datos?.filas) ? datos.filas : []).find(x => Number(x.id) === id);
    caja.innerHTML = '';
    if (!l) { caja.append(el('p', { class: 'mudo', text: 'no existe la licitación L-' + id })); return; }
    const card = tarjetaLic(l, ahora, rol);
    caja.append(card);
    if (card.getAttribute?.('aria-expanded') !== 'true') card.click?.();
  }).catch(() => {
    if (mio !== turno) return;
    caja.innerHTML = '';
    caja.append(el('p', { class: 'mudo', text: 'no se pudo cargar la licitación' }));
  });
}

export function render(raiz, S, arg, filtrosRuta = {}, ahora = new Date()) {
  estadoApp = S;
  const d = S.datos || {};
  const rol = d.rol || 'agente';
  if (/^\d+$/.test(arg || '')) return renderFicha(raiz, S, Number(arg), ahora, rol);
  if (filtrosRuta.exp) return renderPorExpediente(raiz, S, filtrosRuta.exp);
  const estado = estadoChip(filtrosRuta.estado) || 'Por decidir';
  const valores = { estado, orden: filtrosRuta.orden === 'importe' ? 'importe' : 'cierre' };
  for (const k of ['tipologia', 'solvencia', 'tipo', 'presencial', 'texto', 'motivo', 'etiqueta']) if (filtrosRuta[k]) valores[k] = filtrosRuta[k];
  if (filtrosRuta.menor === '1') valores.menor = '1';
  if (filtrosRuta.abiertas === '0') valores.abiertas = '0';
  if (filtrosRuta.espera === '1') valores.espera = '1';

  raiz.append(cabeceraFuentes(S));
  raiz.append(el('div', { class: 'fila enlace-kpis' }, [el('a', { class: 'btn-enlace', href: '#kpis?grupo=licitaciones', text: 'KPIs ›' })]));
  const panelAuto = panelAprobadasAuto(rol);
  if (panelAuto) raiz.append(panelAuto);

  // D70 (#2086 spec §2): chips agrupados por etapa, en filas con wrap (nunca scroll horizontal).
  // Contador por fase desde d.lic_resumen vía nFase(); N=0 pinta chip gris, no pulsable, pero presente.
  // Fila 'presentadas' añade el chip agregado "Todas las presentadas N" que filtra las 5 fases a la vez.
  const resumen = d.lic_resumen || {};
  const etapaActiva = etapaValor(estado);
  const chips = el('div', { class: 'chips-etapas' });
  for (const et of ETAPAS_LIC) {
    const filaChips = el('div', { class: 'chips-fases' });
    for (const e of et.fases) {
      const n = nFase(resumen, e);
      if (!n && e !== estado) { filaChips.append(el('span', { class: 'chip vacio', text: e + ' 0' })); continue; }
      filaChips.append(el('a', { class: 'chip' + (e === estado ? ' activo' : ''), href: construirRuta({ ...valores, estado: e }), text: e + ' ' + n }));
    }
    if (et.clave === 'presentadas') {
      const total = et.fases.reduce((s, e) => s + nFase(resumen, e), 0);
      filaChips.append(el('a', { class: 'chip agregado' + (etapaActiva === 'presentadas' && estado === 'todas-presentadas' ? ' activo' : ''), href: construirRuta({ ...valores, estado: 'todas-presentadas' }), text: 'Todas las presentadas ' + total }));
    }
    chips.append(el('div', { class: 'fila-etapa' }, [el('span', { class: 'etapa-titulo', text: et.nombre }), filaChips]));
  }
  const zonaPills = el('div', { class: 'zona-pills' });
  const resumenTxt = el('p', { class: 'mudo' });
  const lista = el('div', { class: (estado === 'Nueva' ? 'lista-criba' : 'lista-rica') + ' con-fab' });

  let filas = [];
  const secciones = [
    { clave: 'estado', titulo: 'Estado', fija: true, visible: () => false, opciones: ESTADOS_H1.map(e => [e, e]) },
    { clave: 'orden', titulo: 'Orden', defecto: 'cierre', opciones: [['cierre', 'Cierre'], ['importe', 'Importe']] },
    { clave: 'menor', titulo: 'Importe', opciones: [['1', 'Solo Menor (< 20.000 € sin IVA)']] },
    // D70 (#2086 spec §3): "Incluir ya cerradas" solo pinta algo en 'Antes de decidir'/'En marcha';
    // en 'Presentadas'/'Cerradas sin ir' el cierre nunca filtra, así que el conmutador no se muestra.
    { clave: 'abiertas', titulo: 'Cierre', visible: v => { const et = etapaValor(v.estado); return et === 'antes' || et === 'marcha'; }, opciones: [['0', 'Incluir ya cerradas']] },
    { clave: 'espera', titulo: 'Espera', opciones: [['1', 'Espera a Diego']] },
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
    else ordenar(rows, valores.orden, etapaActiva === 'presentadas' || etapaActiva === 'cerradas').forEach(l => lista.append(tarjetaLic(l, ahora, rol)));
  };

  const hoja = hojaFiltros({
    secciones, valores, total: 0,
    onCambio: v => filasVisibles(v).length,
    onAplicar: v => { location.hash = construirRuta(v); },
  });
  pintarPills();
  // #2178: tablero por fase con chip de bloqueo (quien espera) y horas paradas; D101 'Esperando proveedor'.
  const tablero = el('div', { class: 'lic-tablero-fases' });
  import('../api.js').then(m => m.licitacionBloqueos()).then(filas => {
    const fases = tableroFases(filas);
    const prov = (Array.isArray(filas) ? filas : []).filter(x => x.espera_de === 'proveedor');
    tablero.append(...fases.map(f => el('div', { class: 'col-fase' }, [
      el('h4', { text: f.nombre + ' ' + f.total }),
      f.chips.length ? el('div', { class: 'chips-fases' }, f.chips.map(c => el('span', { class: 'chip bloqueo ' + c.espera_de, text: c.nombre + ' ' + c.n + ' · ' + textoHoras(c.horas) }))) : el('p', { class: 'mudo', text: 'sin tareas abiertas' }),
    ])), el('div', { class: 'col-fase' }, [
      el('h4', { text: 'Esperando proveedor ' + prov.reduce((a, x) => a + Number(x.n), 0) }),
      prov.length ? el('div', { class: 'chips-fases' }, prov.map(c => el('span', { class: 'chip bloqueo proveedor', text: c.fase + ' ' + c.n + ' · ' + textoHoras(c.horas_max) }))) : el('p', { class: 'mudo', text: 'ninguna' }),
    ]));
  }).catch(() => {});
  raiz.append(chips, tablero, zonaPills, resumenTxt, lista, hoja.fab, hoja.hoja);

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
