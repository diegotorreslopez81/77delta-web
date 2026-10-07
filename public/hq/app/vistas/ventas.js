// Visor CRM del embudo de ventas privadas (encargo #2239 de Carla dir-sales, decision HQ #295, sustituye a #2236).
// Contrato: hq-ventas-diseno.md. Todo lo pintado sale de columnas ven_* (RPC ven_hq, schema-v138) que escriben
// los agentes; la vista solo resta fechas y cuenta. Sin umbrales, sin tasas, sin datos de correo. Solo lectura.
import { el } from '../ui.js';

let carga = async () => (await import('../api.js')).rpc('ven_hq');
export function usarCargador(fn) { if (fn) carga = fn; }

// Mismo orden y mismos nombres que el enum ven_etapa.
export const ETAPAS = ['lista', 'contactada', 'respondio', 'reunion_agendada', 'reunion_hecha', 'propuesta_redaccion', 'propuesta_enviada', 'negociacion', 'ganada', 'perdida', 'baja'];
export const ABIERTAS = ETAPAS.slice(0, 8);
const CERRADAS = ETAPAS.slice(8);
export const NOMBRE = { lista: 'Lista', contactada: 'Contactada', respondio: 'Respondió', reunion_agendada: 'Reunión agendada', reunion_hecha: 'Reunión hecha', propuesta_redaccion: 'Propuesta en redacción', propuesta_enviada: 'Propuesta enviada', negociacion: 'Negociación', ganada: 'Ganada', perdida: 'Perdida', baja: 'Baja' };
const nombre = e => NOMBRE[e] || e || '?';

const dia = iso => (iso || '').slice(0, 10);
const hoyMadrid = ahora => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(ahora);
const fdia = iso => iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) : '';
const fhora = (iso, tz = 'Europe/Madrid') => iso ? new Intl.DateTimeFormat('es-ES', { timeZone: tz, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)).replace(',', '') : '';
const hhmm = iso => iso ? new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(iso)) : '';
const diaMadrid = iso => iso ? hoyMadrid(new Date(iso)) : '';

export const abierta = o => ABIERTAS.includes(o.etapa);
export const fEtapa = o => o['f_' + o.etapa] || o.f_lista;
export function pendiente(o) {
  return (o.tareas || []).filter(t => !t.hecha_en).sort((a, b) => (a.vence || '9999').localeCompare(b.vence || '9999'))[0] || null;
}
export const vencida = (t, ahora) => !!(t && t.vence && t.vence < hoyMadrid(ahora));
export function alertas(ops, ahora) {
  const ab = ops.filter(abierta);
  return { sinTarea: ab.filter(o => !pendiente(o)), vencidas: ab.filter(o => vencida(pendiente(o), ahora)) };
}
export function enEtapa(o, ahora) {
  const f = fEtapa(o); if (!f) return '';
  const ms = ahora - new Date(f), d = Math.floor(ms / 864e5);
  return d >= 1 ? `${d} d en etapa` : `${Math.max(0, Math.floor(ms / 36e5))} h en etapa`;
}
// Orden en la columna: tarea vencida, tarea más próxima, más tiempo en la etapa; sin tarea al final.
export function ordenColumna(lista, ahora) {
  const clave = o => { const t = pendiente(o); return [t ? (vencida(t, ahora) ? 0 : 1) : 2, t?.vence || '', fEtapa(o) || '']; };
  return lista.slice().sort((a, b) => { const x = clave(a), y = clave(b); return x[0] - y[0] || x[1].localeCompare(y[1]) || x[2].localeCompare(y[2]); });
}
export function textoEvento(e) {
  if (e.tipo === 'transicion') return `${nombre(e.de)} a ${nombre(e.a)}${e.motivo ? ': ' + e.motivo : ''}`;
  if (e.tipo === 'tarea_creada') return `tarea creada: ${e.accion}${e.vence ? ' (vence ' + fdia(e.vence) + ')' : ''}`;
  if (e.tipo === 'tarea_hecha') return 'tarea hecha: ' + e.accion;
  if (e.tipo === 'cambio') return `${e.campo}: ${e.antes ?? '-'} a ${e.despues ?? '-'}`;
  return e.tipo || '';
}
// Cronología de la ficha: se arma con las filas de la propia oportunidad (no depende del tope de 100 del feed).
export function cronologia(o) {
  const ev = [];
  for (const t of o.transiciones || []) ev.push({ tipo: 'transicion', cuando: t.cuando, quien: t.quien, de: t.de, a: t.a, motivo: t.motivo });
  for (const k of o.tareas || []) {
    ev.push({ tipo: 'tarea_creada', cuando: k.creado, quien: k.quien, accion: k.accion, vence: k.vence });
    if (k.hecha_en) ev.push({ tipo: 'tarea_hecha', cuando: k.hecha_en, quien: k.quien, accion: k.accion });
  }
  for (const c of o.cambios || []) ev.push({ tipo: 'cambio', cuando: c.cuando, quien: c.quien, campo: c.campo, antes: c.antes, despues: c.despues });
  return ev.sort((a, b) => String(b.cuando).localeCompare(String(a.cuando)));
}
export function agruparPorDia(eventos) {
  const m = new Map();
  for (const e of eventos) { const d = diaMadrid(e.cuando); if (!m.has(d)) m.set(d, []); m.get(d).push(e); }
  return [...m.entries()];
}

const urlPagina = slug => 'https://77delta.com/propuestas/' + slug;

const TABS = ['hoy', 'pipeline', 'campanas'];
const TAB_NOMBRE = { hoy: 'Hoy', pipeline: 'Pipeline', campanas: 'Campañas' };
const ESTADO_ENVIO = { enviado: 'enviado', aprobado: 'en cola', redactado: 'pendiente de OK', redactar: 'por redactar', cancelado: 'cancelado', error: 'error' };
const irTab = t => { if (typeof location !== 'undefined') location.hash = '#operacion/ventas/' + t; };
const humana = t => t && t.quien === 'diego';
const euros = n => Number(n).toLocaleString('es-ES') + ' €';
const pildora = (texto, tono = '') => el('span', { class: 'vt-pil' + (tono ? ' ' + tono : ''), text: texto });
const envios = ops => ops.flatMap(o => (o.envios || []).map(e => ({ ...e, o })));

function ficha(o, cerrar, ahora, ir) {
  const t = pendiente(o), dl = el('dl', { class: 'vt-dl' });
  const par = (k, v) => { if (v) dl.append(el('dt', { text: k }), el('dd', {}, v)); };
  par('Campaña', o.campana && el('span', { text: o.campana }));
  par('Último movimiento', o.ultima && el('span', { text: `${o.ultima.motivo || 'sin motivo'} · ${fhora(o.ultima.cuando)}` }));
  par('Página', o.slug && el('a', { href: urlPagina(o.slug), target: '_blank', rel: 'noopener', text: '77delta.com/propuestas/' + o.slug }));
  par('Importe', o.importe != null ? el('span', { text: euros(o.importe) }) : el('span', { class: 'mudo', text: 'sin importe' }));
  par('En etapa desde', fEtapa(o) && el('span', { text: fhora(fEtapa(o)) }));
  par('Motivo de cierre', o.motivo_cierre && el('span', { text: o.motivo_cierre }));
  const f = ETAPAS.map(e => [e, o['f_' + e]]).filter(([, v]) => v);
  const env = (o.envios || []).slice().sort((a, b) => String(a.enviado_en || a.programado || '').localeCompare(String(b.enviado_en || b.programado || '')));
  const linea = e => `${fdia(dia(e.enviado_en || e.programado)) || 'sin fecha'} · Toque ${e.toque ?? '-'} · ${ESTADO_ENVIO[e.estado] || e.estado}${e.respondido_en ? ' · respondió ' + fdia(dia(e.respondido_en)) : ''}${e.rebote_en ? ' · rebotó ' + fdia(dia(e.rebote_en)) : ''}`;
  const tareas = (o.tareas || []).slice().sort((a, b) => String(a.vence || '').localeCompare(String(b.vence || '')));
  return el('aside', { class: 'vt-ficha', role: 'dialog', 'aria-label': o.empresa }, [
    el('button', { type: 'button', class: 'vt-cerrar', text: 'Cerrar', onclick: cerrar }),
    el('div', { class: 'vt-volver' }, [el('button', { type: 'button', text: 'Volver a Hoy', onclick: () => ir('hoy') }), el('button', { type: 'button', text: 'Volver al Pipeline', onclick: () => ir('pipeline') })]),
    el('h2', { text: o.empresa }), el('div', { class: 'vt-dom', text: `${o.dominio} · ${nombre(o.etapa)}` }), dl,
    ...(o.carpeta_url ? [el('h3', { text: 'Carpeta del cliente en Drive' }), el('p', {}, [el('a', { class: 'vt-boton', href: o.carpeta_url, target: '_blank', rel: 'noopener', text: 'Abrir carpeta' })])] : []),
    ...(abierta(o) ? [el('h3', { text: 'Siguiente acción' }), el('p', { class: t ? '' : 'mudo', text: t ? `${t.accion}${t.vence ? ' · vence ' + fdia(t.vence) : ''}${t.quien ? ' · ' + t.quien : ''}` : 'Sin tarea asignada' })] : []),
    f.length ? el('h3', { text: 'Recorrido' }) : null,
    f.length ? el('p', { class: 'vt-fechas', text: f.map(([e, v]) => `${nombre(e)} ${fhora(v)}`).join(' · ') }) : null,
    env.length ? el('h3', { text: 'Correos' }) : null,
    env.length ? el('ul', { class: 'vt-lista' }, env.map(e => el('li', { text: linea(e) }))) : null,
    tareas.length ? el('h3', { text: 'Tareas' }) : null,
    tareas.length ? el('ul', { class: 'vt-lista' }, tareas.map(k => el('li', { text: `${k.hecha_en ? 'Hecha' : 'Pendiente'} · ${k.accion}${k.vence ? ' · vence ' + fdia(k.vence) : ''}` }))) : null,
    el('h3', { text: 'Cronología' }),
    el('ol', { class: 'vt-cron' }, cronologia(o).length ? cronologia(o).map(e => el('li', {}, [el('span', { class: 'vt-h', text: `${fhora(e.cuando)} · ${e.quien || '-'}` }), textoEvento(e)])) : [el('li', { class: 'mudo', text: 'Sin movimientos' })]),
  ]);
}

// Embudo por campaña (v143, HQ #358): etapas {etapa: n} y ritmo de envíos. Solo conteos, fechas y claves.
export function modeloCampana(c = {}) {
  const pe = c.etapas || {}, n = e => Number(pe[e]) || 0;
  return { clave: c.clave || '', nombre: c.nombre || c.clave || '', activa: c.activa !== false,
    etapas: ETAPAS.slice(0, 9).map(e => ({ etapa: e, nombre: nombre(e), n: n(e) })), perdidas: n('perdida'), bajas: n('baja'),
    abiertas: Number(c.abiertas) || 0, ganadas: Number(c.ganadas) || 0, importe: Number(c.importe_ganado) || 0, aprobados: Number(c.aprobados) || 0,
    proximo: c.proximo_envio || '', ultimo: c.ultimo_envio || '', vencidas: Number(c.tareas_vencidas) || 0 };
}

function cabecera(d, tab, ahora) {
  const ganadas = d.oportunidades.filter(o => o.etapa === 'ganada').length, m = d.meta;
  return el('div', { class: 'vt-cabecera' }, [
    el('div', { class: 'vt-tabs', role: 'tablist' }, TABS.map(t => el('a', { role: 'tab', href: '#operacion/ventas/' + t, 'aria-selected': String(tab === t), text: TAB_NOMBRE[t] }))),
    el('div', { class: 'vt-meta', text: `Ganadas ${ganadas}${m?.n ? ' de ' + m.n : ''}${m?.fecha ? ' · meta ' + fdia(m.fecha) + '-' + m.fecha.slice(0, 4) : ''} · datos de ${hhmm(ahora.toISOString())}` }),
  ]);
}

export function estadoRail(c, ops, ahora) {
  const hoy = hoyMadrid(ahora), h = Number(hhmm(ahora.toISOString()).slice(0, 2)), f = c.franja || [8, 19];
  const mios = envios(ops.filter(o => o.campana === c.clave));
  const pend = mios.filter(e => e.estado === 'aprobado' && diaMadrid(e.programado) && diaMadrid(e.programado) <= hoy).length;
  const previstos = Math.min(mios.filter(e => e.estado === 'aprobado' && diaMadrid(e.programado) === hoy).length, Number(c.tope_dia) || 1e9);
  const errores = mios.filter(e => e.estado === 'error' && diaMadrid(e.enviado_en || e.programado) === hoy).length;
  const enviados = Number(c.enviados_hoy) || 0;
  const estado = errores ? 'Parado' : h < f[0] ? 'En espera' : h >= f[1] ? (pend ? 'Parado' : 'Hecho') : pend ? 'Enviando' : (enviados || previstos ? 'Hecho' : 'En espera');
  return { estado, previstos, enviados, errores, franja: `${String(f[0]).padStart(2, '0')}:00-${String(f[1]).padStart(2, '0')}:00` };
}

export function personas(ops, ahora) {
  const hoy = hoyMadrid(ahora);
  return ops.filter(abierta).flatMap(o => (o.tareas || []).filter(t => !t.hecha_en && humana(t) && t.vence && t.vence <= hoy).map(t => ({ o, t })))
    .sort((a, b) => a.t.vence.localeCompare(b.t.vence));
}
export function contadores(ops) {
  const env = envios(ops);
  const sinContestar = ops.filter(o => abierta(o) && (o.envios || []).some(e => e.respondido_en && !(o.tareas || []).some(t => t.hecha_en && t.hecha_en > e.respondido_en)));
  return { respuestas: sinContestar.length, reuniones: ops.filter(o => o.etapa === 'reunion_agendada').length,
    textos: env.filter(e => e.estado === 'redactado').length, rebotes: ops.filter(o => o.etapa === 'contactada' && (o.envios || []).some(e => e.rebote_en)).length };
}
export function ultimos(ops, n = 8) {
  const ev = [];
  for (const o of ops) {
    for (const t of o.transiciones || []) ev.push({ cuando: t.cuando, empresa: o.empresa, texto: `${nombre(t.de)} a ${nombre(t.a)}${t.motivo ? ': ' + t.motivo : ''}` });
    for (const e of o.envios || []) {
      if (e.respondido_en) ev.push({ cuando: e.respondido_en, empresa: o.empresa, texto: `respondió (toque ${e.toque ?? '-'})` });
      if (e.rebote_en) ev.push({ cuando: e.rebote_en, empresa: o.empresa, texto: `correo rebotado (toque ${e.toque ?? '-'})` });
    }
  }
  return ev.sort((a, b) => String(b.cuando).localeCompare(String(a.cuando))).slice(0, n);
}

function pintarHoy(raiz, d, ahora, abrir) {
  const ops = d.oportunidades, hoy = hoyMadrid(ahora), ps = personas(ops, ahora), k = contadores(ops);
  const filas = ps.length ? ps.map(({ o, t }) => el('div', { class: 'vt-tarea' }, [
    pildora(t.vence < hoy ? 'Vencida' : nombre(o.etapa), t.vence < hoy ? 'rojo' : 'oro'),
    el('div', { class: 'vt-tx' }, [el('b', { text: o.empresa }), o.campana ? el('span', { class: 'vt-camp', text: ' · ' + o.campana }) : null, el('div', { text: `${t.accion} · ${fdia(t.vence)}` })]),
    el('button', { type: 'button', class: 'vt-boton', text: 'Abrir ficha', onclick: () => abrir(o) })]))
    : [el('p', { class: 'vt-vacio', text: 'Nada pendiente de una persona hoy.' })];
  const cont = [['Respuestas sin contestar', k.respuestas], ['Reuniones agendadas', k.reuniones], ['Textos pendientes de OK', k.textos], ['Rebotes sin alternativa', k.rebotes]];
  raiz.append(
    el('section', { class: 'vt-bloque' }, [el('h2', { text: 'Necesita a una persona' }), ...filas,
      el('div', { class: 'vt-contadores' }, cont.map(([l, n]) => el('div', { class: 'vt-cont' }, [el('span', { class: 'vt-n', text: String(n) }), el('span', { class: 'vt-l', text: l })])))]),
    el('section', { class: 'vt-bloque' }, [el('h2', { text: 'Sale solo hoy' }),
      ...((d.campanas || []).filter(c => c.activa !== false).map(c => { const r = estadoRail(c, ops, ahora);
        return el('div', { class: 'vt-rail' }, [el('b', { text: c.nombre || c.clave }), el('span', { class: 'vt-camp', text: r.franja }),
          el('span', { text: `previstos ${r.previstos} · enviados ${r.enviados} · errores ${r.errores}` }), pildora(r.estado, r.estado === 'Parado' ? 'rojo' : r.estado === 'Hecho' ? 'verde' : '')]); }))]),
    el('section', { class: 'vt-bloque' }, [el('h2', { text: 'Lo último que ha pasado' }),
      ...(ultimos(ops).map(e => el('div', { class: 'vt-ult' }, [el('span', { class: 'vt-h', text: fhora(e.cuando) }), el('span', {}, [el('b', { text: e.empresa + ' ' }), e.texto])])))]));
}

const COLUMNAS = [['Respondió', ['respondio']], ['Reunión', ['reunion_agendada', 'reunion_hecha']], ['Propuesta', ['propuesta_redaccion', 'propuesta_enviada']], ['Negociación', ['negociacion']], ['Ganada', ['ganada']]];
export function indicadores(ops, meta) {
  const juego = ops.filter(o => ['propuesta_redaccion', 'propuesta_enviada', 'negociacion'].includes(o.etapa)).reduce((s, o) => s + (Number(o.importe) || 0), 0);
  const cont = ops.filter(o => o.f_contactada).length, resp = ops.filter(o => o.f_contactada && o.f_respondio).length;
  const dias = ops.filter(o => o.f_contactada && o.f_respondio).map(o => (new Date(o.f_respondio) - new Date(o.f_contactada)) / 864e5).sort((a, b) => a - b);
  const mediana = dias.length ? (dias.length % 2 ? dias[(dias.length - 1) / 2] : (dias[dias.length / 2 - 1] + dias[dias.length / 2]) / 2) : null;
  return { juego, tasa: cont ? Math.round(100 * resp / cont) : null, mediana, ganadas: ops.filter(o => o.etapa === 'ganada').length, meta: meta?.n || null };
}

function pintarPipeline(raiz, d, ahora, estado, abrir, redibujar) {
  const camps = (d.campanas || []).filter(c => c.activa !== false);
  const ops = d.oportunidades.filter(o => !estado.camp || o.campana === estado.camp), n = e => ops.filter(o => o.etapa === e).length;
  const ind = indicadores(ops, d.meta);
  const tarjetaP = o => el('button', { type: 'button', class: 'vt-card compacta', onclick: () => abrir(o) }, [
    el('div', { class: 'vt-cab' }, [el('b', { text: o.empresa }), el('span', { class: 'vt-dias', text: o.importe != null ? euros(o.importe) : '' })]),
    el('div', { class: 'vt-fila' }, [o.campana ? el('span', { class: 'vt-chip vt-camp', text: o.campana }) : null, el('span', { class: 'vt-sig', text: fhora(fEtapa(o)) }), o.carpeta_url ? el('span', { class: 'vt-chip', text: 'Carpeta' }) : null])]);
  const perdidas = ops.filter(o => o.etapa === 'perdida').sort((a, b) => String(b.f_cierre).localeCompare(String(a.f_cierre)));
  raiz.append(
    el('div', { class: 'vt-filtros' }, [{ clave: '', nombre: 'Todas' }, ...camps].map(c => el('button', { type: 'button', class: 'vt-filtro' + ((estado.camp || '') === c.clave ? ' activa' : ''), 'aria-pressed': String((estado.camp || '') === c.clave), text: c.nombre || c.clave, onclick: () => { estado.camp = c.clave; redibujar(); } }))),
    el('div', { class: 'vt-franja' }, ETAPAS.slice(0, 9).map(e => el('div', { class: 'vt-etapa' }, [el('span', { class: 'vt-n', text: String(n(e)) }), el('span', { class: 'vt-l', text: nombre(e) })]))),
    el('div', { class: 'vt-indicadores' }, [['Importe en juego', euros(ind.juego)], ['Tasa de respuesta', ind.tasa == null ? 'sin datos' : ind.tasa + ' %'],
      ['Hasta la primera respuesta', ind.mediana == null ? 'sin datos' : (ind.mediana < 1 ? '< 1 día' : Math.round(ind.mediana) + ' d')], ['Ganadas sobre meta', `${ind.ganadas}${ind.meta ? ' de ' + ind.meta : ''}`]]
      .map(([l, v]) => el('div', { class: 'vt-cont' }, [el('span', { class: 'vt-n', text: v }), el('span', { class: 'vt-l', text: l })]))),
    el('div', { class: 'vt-tablero' }, COLUMNAS.map(([t, es]) => { const l = ordenColumna(ops.filter(o => es.includes(o.etapa)), ahora);
      return el('section', { class: 'vt-col' }, [el('h2', {}, [el('span', { text: t }), el('span', { class: 'vt-k', text: String(l.length) })]),
        l.length ? el('div', { class: 'vt-cards' }, l.map(tarjetaP)) : el('p', { class: 'vt-vacio', text: 'Ninguna todavía' })]); })),
    el('section', { class: 'vt-bloque' }, [el('h2', { text: `Perdidas (${perdidas.length})` }),
      perdidas.length ? el('table', { class: 'vt-tabla' }, [el('tr', {}, ['Empresa', 'Campaña', 'Fecha', 'Motivo'].map(h => el('th', { text: h }))),
        ...perdidas.map(o => el('tr', { onclick: () => abrir(o) }, [o.empresa, o.campana || '', fdia(dia(o.f_cierre)), o.motivo_cierre || 'sin motivo'].map(x => el('td', { text: x }))))]) : el('p', { class: 'vt-vacio', text: 'Ninguna perdida.' })]));
}

function pintarCampanas(raiz, d, ahora) {
  const hoy = hoyMadrid(ahora), todas = d.campanas || [], activas = todas.filter(c => c.activa !== false), inactivas = todas.filter(c => c.activa === false);
  const tarj = c => {
    const m = modeloCampana(c), ev = c.envios || {}, f = c.franja || [8, 19], mios = envios(d.oportunidades.filter(o => o.campana === c.clave));
    const sal = new Map(); for (const e of mios.filter(e => e.estado === 'aprobado' && e.programado)) { const k = diaMadrid(e.programado); sal.set(k, (sal.get(k) || 0) + 1); }
    const textos = []; for (let i = 2; i <= (Number(c.toques) || 0); i++) textos.push((c.plantillas_aprobadas || {})[i] ? pildora(`Texto ${i} aprobado`, 'verde') : pildora(`Texto ${i} pendiente de OK`, 'rojo'));
    const col = (t, ...hs) => el('div', { class: 'vt-colc' }, [el('h3', { text: t }), ...hs]);
    const p = txt => el('p', { text: txt });
    return el('section', { class: 'vt-bloque vt-camp-tarjeta' }, [el('h2', { text: m.nombre }), el('div', { class: 'vt-cuatro' }, [
      col('Reglas', p(`Firma: ${c.firmante || 'sin firmante'}`), p(`Tope: ${c.tope_dia ?? '-'} al día`), p(`Franja: ${String(f[0]).padStart(2, '0')}:00-${String(f[1]).padStart(2, '0')}:00`), p(`Toques: ${c.toques ?? '-'}${(c.dias_toque || []).length ? ' (días ' + c.dias_toque.join(', ') + ')' : ''}`), ...textos),
      col('Empresas', ...m.etapas.filter(x => x.n).map(x => p(`${x.nombre}: ${x.n}`)), p(`Perdidas: ${m.perdidas} · Bajas: ${m.bajas}`)),
      col('Correos', p(`Enviados: ${ev.enviado || 0}`), p(`En cola: ${ev.aprobado || 0}`), p(`Rebotes: ${m.rebotes ?? c.rebotes ?? 0}`), p(`Por redactar: ${(ev.redactar || 0) + (ev.redactado || 0)}`)),
      col('Próximas salidas', ...(sal.size ? [...sal.entries()].sort().map(([k, n]) => p(`${fdia(k)}: ${n}`)) : [p('Nada programado')]))])]);
  };
  raiz.append(...(activas.length ? activas.map(tarj) : [el('p', { class: 'vt-vacio', text: 'Sin campañas activas.' })]),
    inactivas.length ? el('details', { class: 'vt-bloque' }, [el('summary', { text: `Campañas inactivas (${inactivas.length})` }),
      el('table', { class: 'vt-tabla' }, [el('tr', {}, ['Firma', 'Empresas', 'Enviados', 'Respuestas', 'Perdidas', 'Resultado'].map(h => el('th', { text: h }))),
        ...inactivas.map(c => el('tr', {}, [c.nombre || c.clave, c.oportunidades ?? 0, (c.envios || {}).enviado || 0, c.respondidos ?? 0, (c.etapas || {}).perdida || 0, `${c.ganadas || 0} ganadas`].map(x => el('td', { text: String(x) }))))])]) : null,
    el('div', { class: 'vt-notas' }, [el('p', { text: 'Una persona: contesta las respuestas, agenda reuniones y da el OK a los textos.' }), el('p', { text: 'El raíl: programa y envía los correos dentro de la franja, reintenta y mueve las etapas.' }), el('p', { text: 'La IA: redacta los textos y propone el siguiente paso; no envía sin OK.' })]));
}

// main.js llama render(raiz, S, arg, filtros): el 2º parámetro solo cuenta como reloj si es una Date (tests).
export async function render(raiz, reloj, arg) {
  const ahora = reloj instanceof Date ? reloj : new Date();
  const tab = TABS.includes(arg) ? arg : 'hoy';
  raiz.append(el('h1', { text: 'Ventas' }));
  const caja = el('div', { class: 'ventas' });
  raiz.append(caja);
  caja.append(el('p', { class: 'cargando', text: 'Cargando el embudo de ventas...' }));
  try {
    const d = await carga();
    if (!d || typeof d !== 'object' || !Array.isArray(d.oportunidades)) throw new Error('respuesta vacía');
    const estado = { camp: '', ficha: null };
    const redibujar = () => {
      caja.innerHTML = '';
      const abrir = o => { estado.ficha = o.id; redibujar(); };
      caja.append(cabecera(d, tab, ahora));
      if (tab === 'hoy') pintarHoy(caja, d, ahora, abrir); else if (tab === 'pipeline') pintarPipeline(caja, d, ahora, estado, abrir, redibujar); else pintarCampanas(caja, d, ahora);
      const o = d.oportunidades.find(x => x.id === estado.ficha);
      if (o) { const cerrar = () => { estado.ficha = null; redibujar(); }; caja.append(el('div', { class: 'vt-velo', onclick: ev => { if (ev.target === ev.currentTarget) cerrar(); } }, ficha(o, cerrar, ahora, t => { cerrar(); if (t !== tab) irTab(t); }))); }
    };
    redibujar();
  } catch (e) {
    caja.innerHTML = '';
    caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: 'No se pudo leer el embudo de ventas (' + (e?.message || 'error') + '). Prueba a recargar; si sigue igual, avisa a Pol-Operaciones.' }));
  }
}
