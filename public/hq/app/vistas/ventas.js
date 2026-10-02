// Visor CRM del embudo de ventas privadas (encargo #2239 de Carla dir-sales, decision HQ #295, sustituye a #2236).
// Contrato: hq-ventas-diseno.md. Todo lo pintado sale de columnas ven_* (RPC ven_hq, schema-v138) que escriben
// los agentes; la vista solo resta fechas y cuenta. Sin umbrales, sin tasas, sin datos de correo. Solo lectura.
import { el } from '../ui.js';

let carga = async () => (await import('../api.js')).rpc('ven_hq');
export function usarCargador(fn) { if (fn) carga = fn; }

// Mismo orden y mismos nombres que el enum ven_etapa.
export const ETAPAS = ['lista', 'contactada', 'respondio', 'reunion_agendada', 'reunion_hecha', 'propuesta_enviada', 'ganada', 'perdida', 'baja'];
export const ABIERTAS = ETAPAS.slice(0, 6);
const CERRADAS = ETAPAS.slice(6);
export const NOMBRE = { lista: 'Lista', contactada: 'Contactada', respondio: 'Respondió', reunion_agendada: 'Reunión agendada', reunion_hecha: 'Reunión hecha', propuesta_enviada: 'Propuesta enviada', ganada: 'Ganada', perdida: 'Perdida', baja: 'Baja' };
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

function tarjeta(o, ahora, abrir) {
  const t = pendiente(o), u = o.ultima;
  return el('button', { type: 'button', class: 'vt-card', onclick: () => abrir(o) }, [
    el('div', { class: 'vt-cab' }, [el('b', { text: o.empresa }), el('span', { class: 'vt-dias', text: o.etapa && abierta(o) ? enEtapa(o, ahora) : '' })]),
    el('div', { class: 'vt-dom', text: o.dominio }),
    el('div', { class: 'vt-fila' }, [el('span', { class: 'vt-e', text: o.motivo_cierre && !abierta(o) ? 'Cierre' : 'Último' }),
      el('span', { text: !abierta(o) && o.motivo_cierre ? o.motivo_cierre : u ? `${u.motivo || 'sin motivo'} · ${u.quien} · ${fhora(u.cuando)}` : 'sin movimientos' })]),
    !abierta(o) ? null : el('div', { class: 'vt-fila' }, [el('span', { class: 'vt-e', text: 'Siguiente' }),
      t ? el('span', { class: 'vt-sig' + (vencida(t, ahora) ? ' vencida' : ''), text: `${t.accion}${t.vence ? ' · vence ' + fdia(t.vence) : ''}${t.quien ? ' · ' + t.quien : ''}` })
        : el('span', { class: 'vt-sig nada', text: 'sin tarea asignada' })]),
    !o.slug ? null : el('a', { class: 'vt-chip', href: urlPagina(o.slug), target: '_blank', rel: 'noopener', text: 'página personalizada', onclick: ev => ev.stopPropagation() }),
  ]);
}

function ficha(o, cerrar, ahora) {
  const t = pendiente(o), dl = el('dl', { class: 'vt-dl' });
  const par = (k, v) => { if (v) dl.append(el('dt', { text: k }), el('dd', {}, v)); };
  par('Buzón', o.buzon && el('span', { text: o.buzon }));
  par('Página', o.slug && el('a', { href: urlPagina(o.slug), target: '_blank', rel: 'noopener', text: '77delta.com/propuestas/' + o.slug }));
  par('Importe', o.importe != null ? el('span', { text: Number(o.importe).toLocaleString('es-ES') + ' €' }) : el('span', { class: 'mudo', text: 'sin importe' }));
  par('En etapa desde', fEtapa(o) && el('span', { text: fhora(fEtapa(o)) }));
  par('Motivo de cierre', o.motivo_cierre && el('span', { text: o.motivo_cierre }));
  const f = ETAPAS.map(e => [e, o['f_' + e]]).filter(([, v]) => v);
  return el('aside', { class: 'vt-ficha', role: 'dialog', 'aria-label': o.empresa }, [
    el('button', { type: 'button', class: 'vt-cerrar', text: 'Cerrar', onclick: cerrar }),
    el('h2', { text: o.empresa }), el('div', { class: 'vt-dom', text: `${o.dominio} · ${nombre(o.etapa)}` }), dl,
    ...(abierta(o) ? [el('h3', { text: 'Siguiente acción' }), el('p', { class: t ? '' : 'mudo', text: t ? `${t.accion}${t.vence ? ' · vence ' + fdia(t.vence) : ''}${t.quien ? ' · ' + t.quien : ''}` : 'Sin tarea asignada' })] : []),
    f.length ? el('h3', { text: 'Fechas por etapa' }) : null,
    f.length ? el('p', { class: 'vt-fechas', text: f.map(([e, v]) => `${nombre(e)} ${fhora(v)}`).join(' · ') }) : null,
    el('h3', { text: 'Cronología' }),
    el('ol', { class: 'vt-cron' }, cronologia(o).map(e => el('li', {}, [el('span', { class: 'vt-h', text: `${fhora(e.cuando)} · ${e.quien || '-'}` }), textoEvento(e)]))),
  ]);
}

function franja(ops, meta, filtro, elegir) {
  const n = e => ops.filter(o => o.etapa === e).length, ganadas = n('ganada');
  return el('div', { class: 'vt-franja' }, [
    ...ABIERTAS.map(e => el('button', { type: 'button', class: 'vt-etapa' + (filtro === e ? ' activa' : ''), 'aria-pressed': String(filtro === e), onclick: () => elegir(e) }, [el('span', { class: 'vt-n', text: String(n(e)) }), el('span', { class: 'vt-l', text: nombre(e) })])),
    el('div', { class: 'vt-meta', text: `Ganadas ${ganadas}${meta?.n ? ' de ' + meta.n : ''}${meta?.fecha ? ' · meta ' + fdia(meta.fecha) + '-' + meta.fecha.slice(0, 4) : ''}` }),
  ]);
}

function pintarTablero(raiz, d, ahora, estado, redibujar) {
  const ops = d.oportunidades, a = alertas(ops, ahora), abrir = o => { estado.ficha = o.id; redibujar(); };
  const nodos = [franja(ops, d.meta, estado.etapa, e => { estado.etapa = estado.etapa === e ? null : e; redibujar(); })];
  const av = [];
  if (a.sinTarea.length) av.push(el('div', { class: 'vt-alerta', text: `${a.sinTarea.length} ${a.sinTarea.length === 1 ? 'abierta sin siguiente acción' : 'abiertas sin siguiente acción'}` }));
  if (a.vencidas.length) av.push(el('div', { class: 'vt-alerta critico', text: `${a.vencidas.length} ${a.vencidas.length === 1 ? 'tarea vencida' : 'tareas vencidas'}: ` + a.vencidas.map(o => o.empresa).join(', ') }));
  if (av.length) nodos.push(el('div', { class: 'vt-alertas' }, av));
  const cols = ABIERTAS.map(e => {
    const l = ordenColumna(ops.filter(o => o.etapa === e), ahora);
    return el('section', { class: 'vt-col' + (estado.etapa === e ? ' activa' : '') }, [
      el('h2', {}, [el('span', { text: nombre(e) }), el('span', { class: 'vt-k', text: String(l.length) })]),
      l.length ? el('div', { class: 'vt-cards' }, l.map(o => tarjeta(o, ahora, abrir))) : el('p', { class: 'vt-vacio', text: 'Ninguna todavía' })]);
  });
  const cerr = ops.filter(o => CERRADAS.includes(o.etapa)).sort((x, y) => String(y.f_cierre).localeCompare(String(x.f_cierre)));
  cols.push(el('section', { class: 'vt-col' }, [el('h2', {}, [el('span', { text: 'Cerradas' }), el('span', { class: 'vt-k', text: String(cerr.length) })]),
    cerr.length ? el('details', {}, [el('summary', { text: `Ganadas ${cerr.filter(o => o.etapa === 'ganada').length} · Perdidas ${cerr.filter(o => o.etapa === 'perdida').length} · Baja ${cerr.filter(o => o.etapa === 'baja').length}` }), el('div', { class: 'vt-cards' }, cerr.map(o => tarjeta(o, ahora, abrir)))])
      : el('p', { class: 'vt-vacio', text: 'Ganadas, perdidas y bajas aparecen aquí, con el motivo de cierre.' })]));
  nodos.push(el('div', { class: 'vt-tablero' }, cols));
  raiz.append(...nodos);
}

function pintarActividad(raiz, d, estado, redibujar) {
  const act = d.actividad || [];
  const emp = [...new Set(act.map(e => e.empresa))].sort(), quien = [...new Set(act.map(e => e.quien).filter(Boolean))].sort();
  const sel = (clave, todos, valores) => el('select', { 'aria-label': todos, onchange: ev => { estado[clave] = ev.target.value; redibujar(); } },
    [el('option', { value: '', text: todos }), ...valores.map(v => el('option', { value: v, text: v, selected: estado[clave] === v }))]);
  const vis = act.filter(e => (!estado.fEmpresa || e.empresa === estado.fEmpresa) && (!estado.fQuien || e.quien === estado.fQuien));
  const grupos = agruparPorDia(vis);
  raiz.append(el('div', { class: 'vt-filtros' }, [sel('fEmpresa', 'Todas las empresas', emp), sel('fQuien', 'Todos los autores', quien)]),
    el('div', { class: 'vt-feed' }, grupos.length ? grupos.map(([dd, l]) => el('section', {}, [
      el('h3', { text: `${fdia(dd)} · ${l.length} ${l.length === 1 ? 'movimiento' : 'movimientos'}` }),
      el('ul', {}, l.map(e => el('li', {}, [el('span', { class: 'vt-h', text: hhmm(e.cuando) }), el('span', {}, [el('b', { text: e.empresa + ' ' }), textoEvento(e) + ' ', el('span', { class: 'vt-q', text: '· ' + (e.quien || '-') })])])))]))
      : [el('p', { class: 'vt-vacio', text: 'Sin movimientos.' })]));
}

export async function render(raiz, ahora = new Date()) {
  raiz.append(el('h1', { text: 'Ventas' }));
  const caja = el('div', { class: 'ventas' });
  raiz.append(caja);
  caja.append(el('p', { class: 'cargando', text: 'Cargando el embudo de ventas...' }));
  try {
    const d = await carga();
    if (!d || typeof d !== 'object' || !Array.isArray(d.oportunidades)) throw new Error('respuesta vacía');
    const estado = { tab: 'tablero', etapa: null, ficha: null, fEmpresa: '', fQuien: '' };
    const redibujar = () => {
      caja.innerHTML = '';
      caja.append(el('div', { class: 'vt-tabs', role: 'tablist' }, ['tablero', 'actividad'].map(t => el('button', { type: 'button', role: 'tab', 'aria-selected': String(estado.tab === t), text: t === 'tablero' ? 'Tablero' : 'Actividad', onclick: () => { estado.tab = t; redibujar(); } }))));
      if (estado.tab === 'tablero') pintarTablero(caja, d, ahora, estado, redibujar); else pintarActividad(caja, d, estado, redibujar);
      const o = d.oportunidades.find(x => x.id === estado.ficha);
      if (o) { const cerrar = () => { estado.ficha = null; redibujar(); }; caja.append(el('div', { class: 'vt-velo', onclick: ev => { if (ev.target === ev.currentTarget) cerrar(); } }, ficha(o, cerrar, ahora))); }
    };
    redibujar();
  } catch (e) {
    caja.innerHTML = '';
    caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: 'No se pudo leer el embudo de ventas (' + (e?.message || 'error') + '). Prueba a recargar; si sigue igual, avisa a Pol-Operaciones.' }));
  }
}
