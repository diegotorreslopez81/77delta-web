// En curso (spec 3, 18-10): proyectos con cronograma leídos de hq_v_proyectos y hq_v_proyecto_encargos
// por RPC con p_token, y bloque Procesos (Windmill) que pinta "pendiente de conexión" hasta que exista hq_procesos.
// Solo pinta: semáforo, orden, umbrales y fin por encargos los calcula SQL (hq_parametros).
import { el } from '../ui.js';

let cargadores = {
  proyectos: async () => (await import('../api.js')).rpc('hq_proyectos'),
  encargos: async id => (await import('../api.js')).rpc('hq_proyecto_encargos', { p_id: id }),
  procesos: async () => (await import('../api.js')).rpc('hq_procesos'),
};
export function usarCargadores(o) { cargadores = { ...cargadores, ...o }; }

const n = x => Number(x) || 0;
const fdia = iso => iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) : '';
const hoyMadrid = ahora => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(ahora);
const CERRADOS = ['hecho', 'descartado'];

// Fin previsto: si los encargos lo superan, se enseñan las dos fechas.
export function textoFin(p) {
  if (p.fin_por_encargos && p.fin_prevista && p.fin_por_encargos > p.fin_prevista) return 'fin ' + fdia(p.fin_prevista) + ', por encargos ' + fdia(p.fin_por_encargos);
  const f = p.fin_prevista || p.fin_por_encargos;
  return f ? 'fin ' + fdia(f) : 'sin fin previsto';
}

// Cronograma: por fecha de hito; hechos y descartados al final; vencido = hito pasado sin cerrar.
export function modeloCronograma(filas, ahora = new Date()) {
  const hoy = hoyMadrid(ahora);
  const ord = (a, b) => (a.fecha_hito || '9999').localeCompare(b.fecha_hito || '9999') || n(a.encargo_id) - n(b.encargo_id);
  const activos = (filas || []).filter(f => !CERRADOS.includes(f.estado)).sort(ord);
  const cerrados = (filas || []).filter(f => CERRADOS.includes(f.estado)).sort(ord);
  return [...activos, ...cerrados].map(f => ({ ...f, cerrado: CERRADOS.includes(f.estado), vencido: !CERRADOS.includes(f.estado) && !!f.fecha_hito && f.fecha_hito < hoy }));
}

const PESOS = [1, 2, 3, 5, 8];
const fhora = iso => iso ? fdia(iso) + ' ' + new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(iso)) : '';
const haceTxt = h => h == null ? 'sin avances' : h < 1 ? 'hace menos de 1 h' : h < 48 ? 'hace ' + Math.round(h) + ' h' : 'hace ' + Math.round(h / 24) + ' d';

export function pintarCronograma(filas, ahora = new Date(), opc = {}) {
  const m = modeloCronograma(filas, ahora);
  if (!m.length) return el('p', { class: 'mudo', text: 'Sin encargos en este proyecto' });
  return el('ol', { class: 'cronograma' }, m.map(f => el('li', { class: 'crono-item' + (f.cerrado ? ' hecho' : '') + (f.vencido ? ' vencido' : '') }, [
    el('span', { class: 'crono-fecha', text: f.fecha_hito ? fdia(f.fecha_hito) : 'sin fecha' }),
    el('span', { class: 'crono-estado', text: String(f.estado || '').replace(/_/g, ' ') }),
    opc.puedePeso && !f.cerrado ? selectorPeso(f, opc.cambiarPeso) : el('span', { class: 'crono-peso', text: 'peso ' + (f.peso || 1) }),
    el('p', { class: 'crono-texto', text: '#' + f.encargo_id + ' ' + (f.texto || '') }),
    f.proximo_hito ? el('p', { class: 'mudo', text: 'Hito: ' + f.proximo_hito }) : null,
    f.ultimo_avance ? el('p', { class: 'mudo', text: 'Último avance' + (f.fecha_avance ? ' ' + fdia(f.fecha_avance) : '') + ': ' + f.ultimo_avance }) : null,
    f.responsable ? el('p', { class: 'mudo', text: f.responsable }) : null,
  ])));
}

function selectorPeso(f, cambiar) {
  const sel = el('select', { class: 'crono-peso', 'aria-label': 'Peso del encargo ' + f.encargo_id }, PESOS.map(v => el('option', { value: String(v), text: 'peso ' + v })));
  sel.value = String(f.peso || 1);
  sel.addEventListener('change', async () => {
    const antes = f.peso || 1;
    try { await cambiar(f.encargo_id, Number(sel.value)); f.peso = Number(sel.value); }
    catch (e) { sel.value = String(antes); sel.title = 'No se pudo cambiar el peso'; }
  });
  return sel;
}

function filaProyecto(p, ahora, opc = {}) {
  const caja = el('div', { class: 'cronograma-caja' });
  const det = el('details', { class: 'vt-card compacta proyecto-fila' }, [
    el('summary', {}, [
      el('span', { class: 'punto ' + (p.semaforo || ''), 'aria-label': p.semaforo || '' }),
      el('strong', { text: ' ' + (p.nombre || '') }),
      el('span', { class: 'pct-grande' + (p.sin_pasos || p.pct == null ? ' gris' : ''), text: p.sin_pasos || p.pct == null ? 'sin pasos' : n(p.pct) + ' %' }),
      p.bloqueo ? el('span', { class: 'pill rojo', text: p.bloqueo }) : null,
    ]),
    el('p', { class: 'mudo', text: [p.semaforo_motivo, p.ultimo_avance ? 'último avance ' + haceTxt(p.horas_sin_avance) : 'sin avances'].filter(Boolean).join(' · ') }),
    el('p', { class: 'mudo', text: 'Dueño ' + (p.dueno || '-') + ' · ' + textoFin(p) + (p.inicio ? ' · inicio ' + fdia(p.inicio) : '') }),
    p.sin_pasos || p.pct == null ? null : el('div', { class: 'barra ' + (p.semaforo || ''), role: 'img', 'aria-label': n(p.pct) + ' %' }, [el('i', { style: 'width:' + Math.min(100, n(p.pct)) + '%' })]),
    el('p', { class: 'mudo', text: n(p.n_hechos) + ' de ' + n(p.n_total) + ' tareas' + (p.ponderado && !p.sin_pasos ? ' · ponderado' : '') }),
    el('p', { class: 'mudo ultimo-avance', text: p.ultimo_avance ? 'Último avance: ' + fhora(p.ultimo_avance) + ', ' + (p.ultimo_avance_quien || '-') + ': ' + (p.ultimo_avance_texto || '') : 'sin avances' }),
    p.tarea_en_curso ? el('p', { class: 'mudo', text: p.tarea_en_curso + (p.fecha_tarea ? ' · ' + fdia(p.fecha_tarea) : '') }) : null,
    caja,
  ]);
  let cargado = false;
  det.addEventListener('toggle', async () => {
    if (!det.open || cargado) return;
    cargado = true;
    caja.append(el('p', { class: 'mudo', text: 'Cargando...' }));
    try { const f = await cargadores.encargos(p.id); caja.innerHTML = ''; caja.append(pintarCronograma(f, ahora, opc)); }
    catch (e) { cargado = false; caja.innerHTML = ''; caja.append(el('p', { class: 'mudo', text: 'No se pudo cargar el cronograma: ' + (e.message || e) })); }
  });
  return det;
}

export function pintarProyectos(filas, ahora = new Date(), opc = {}) {
  if (!filas || !filas.length) return el('p', { class: 'mudo', text: 'Sin proyectos dados de alta' });
  const p0 = filas[0];
  const ley = p0.rojo_dias != null ? 'Rojo: fin o hito vencidos, o más de ' + p0.rojo_dias + ' días parado. Ámbar: más de ' + p0.ambar_dias + ' días parado o fin cerca con poco avance.' : '';
  return el('div', {}, [el('div', { class: 'vt-cards' }, filas.map(p => filaProyecto(p, ahora, opc))), ley ? el('p', { class: 'mudo leyenda', text: ley }) : null]);
}

// Procesos: filas de hq_v_procesos agrupadas por flujo (RPC hq_procesos, cuando exista el fdw a Windmill).
export function pintarProcesos(filas, ahora = new Date()) {
  if (filas == null) return el('p', { class: 'mudo', text: 'Procesos: pendiente de conexión con Windmill' });
  if (!filas.length) return el('p', { class: 'mudo', text: 'Sin procesos activos ni fallidos en 24 h' });
  const por = {};
  filas.forEach(f => (por[f.flujo] = por[f.flujo] || []).push(f));
  const hace = iso => { const m = Math.max(0, Math.round((ahora - new Date(iso)) / 60000)); return 'hace ' + (m < 90 ? m + ' min' : Math.round(m / 60) + ' h'); };
  return el('div', {}, Object.entries(por).map(([flujo, fs]) => el('section', { class: 'vt-card compacta' }, [
    el('h3', { text: flujo }),
    ...fs.map(f => el('p', { class: f.fallo ? 'proceso-fallo' : 'mudo', text: [f.caso, 'paso ' + n(f.paso_actual) + ' de ' + n(f.pasos_total), f.estado, f.fallo, f.actualizado ? hace(f.actualizado) : ''].filter(Boolean).join(' · ') })),
  ])));
}

export async function render(raiz, S, arg, filtros, ahora = new Date()) {
  raiz.append(el('h2', { text: 'En curso' }));
  const secP = el('section', { class: 'home-bloque' }, [el('h2', { text: 'Proyectos' }), el('p', { class: 'mudo', text: 'Cargando...' })]);
  const secW = el('section', { class: 'home-bloque' }, [el('h2', { text: 'Procesos' }), el('p', { class: 'mudo', text: 'Cargando...' })]);
  raiz.append(secP, secW);
  const poner = (sec, nodo) => { sec.querySelector('p, div').replaceWith(nodo); };
  const opc = { puedePeso: S?.datos?.rol === 'owner', cambiarPeso: async (id, v) => (await import('../api.js')).rpc('omc_encargo_peso', { p_id: id, p_peso: v }) };
  cargadores.proyectos().then(f => poner(secP, pintarProyectos(f, ahora, opc)))
    .catch(e => poner(secP, el('p', { class: 'mudo', text: 'Proyectos: no se pudo cargar (' + (e?.message || 'error') + ')' })));
  cargadores.procesos().then(f => poner(secW, pintarProcesos(f, ahora))).catch(() => poner(secW, pintarProcesos(null)));
}
