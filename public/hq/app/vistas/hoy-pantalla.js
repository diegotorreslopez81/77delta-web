// Pantalla Hoy de HQ v2 (spec 2, 18-10): cabecera de cifras y cuatro bloques - Depende de ti, Firmar, Pagar, Correos.
// Solo pinta columnas de hq_v_hoy_* leídas por la RPC hq_hoy con p_token. Sin umbrales ni cálculo propio:
// el rojo sale de umbral_decidir_h y umbral_correo_h que devuelve la RPC (hq_parametros).
import { el, toast, eur, fecha, pedirTexto, modal, confirmar } from '../ui.js';
import { pintarProyectos, pintarCaptacion, pintarProductos } from './home.js';

let cargadores = {
  hoy: async () => (await import('../api.js')).rpc('hq_hoy'),
  proyectos: async () => (await import('../api.js')).rpc('hq_proyectos'),
  web: async () => (await import('../api.js')).rpc('hq_web', { p_dias: 14 }),
  captacion: async () => (await import('../api.js')).rpc('hq_captacion'),
  productos: async () => (await import('../api.js')).rpc('hq_productos'),
  resolver: async (id, estado) => (await import('../api.js')).rpc('omc_resolver', { p_id: id, p_estado: estado, p_respuesta: '' }),
  posponer: async (id, hasta) => (await import('../api.js')).rpc('omc_posponer', { p_id: id, p_hasta: hasta }),
  comentar: async (id, texto) => (await import('../api.js')).rpc('omc_comentar', { p_id: id, p_texto: texto }),
};
export function usarCargadores(o) { cargadores = { ...cargadores, ...o }; }

const n = x => Number(x) || 0;
const vacio = texto => el('p', { class: 'mudo', text: texto });
const bloque = (id, titulo, hijos) => el('section', { class: 'home-bloque hoy-bloque', id }, [el('h2', { text: titulo }), ...[].concat(hijos)]);
const hace = h => 'hace ' + (n(h) >= 48 ? Math.floor(n(h) / 24) + ' d' : n(h) + ' h');

// Fechas de posponer: mañana 09:00 y lunes 09:00, hora de Madrid, como instante ISO.
export function opcionesPosponer(ahora = new Date()) {
  const ymd = d => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(d);
  const dow = new Date(ymd(ahora) + 'T12:00:00Z').getUTCDay();
  const sumar = k => new Date(new Date(ymd(ahora) + 'T12:00:00Z').getTime() + k * 864e5);
  const a9 = d => {
    const base = ymd(d) + 'T09:00:00';
    const off = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', timeZoneName: 'shortOffset' }).formatToParts(new Date(base + 'Z')).find(p => p.type === 'timeZoneName').value.replace('GMT', '') || '+0';
    const h = Number(off.split(':')[0]);
    return new Date(base + (h < 0 ? '-' : '+') + String(Math.abs(h)).padStart(2, '0') + ':00').toISOString();
  };
  const hastaLunes = ((8 - dow) % 7) || 7;
  return { manana: a9(sumar(1)), lunes: a9(sumar(hastaLunes)) };
}

export function cabecera(cifras) {
  if (!(cifras || []).length) return el('div', { class: 'home-cifras' }, [vacio('Sin cifras')]);
  return el('div', { class: 'home-cifras' }, cifras.map(x =>
    el('a', { class: 'vt-card compacta home-cifra ' + (x.color || ''), href: x.enlace ? '#' + String(x.enlace).replace(/^#/, '') : '#hoy' }, [
      el('span', { class: 'valor', text: String(x.valor ?? '-') + (x.unidad ? ' ' + x.unidad : '') }),
      el('span', { class: 'mudo', text: x.etiqueta || x.clave }),
    ])));
}

// Tarjeta con Sí / No / Posponer / Comentar. `botones` permite quitar Posponer en Pagar si no aplica.
function tarjeta(p, umbral, repintar, { destacada = false, pago = false } = {}) {
  const roja = umbral > 0 && n(p.edad_h) > umbral;
  const act = fn => async () => { try { await fn(); toast('Hecho'); repintar(); } catch (e) { toast('No se pudo: ' + e.message); } };
  const posponer = () => {
    const o = opcionesPosponer();
    const campo = el('input', { type: 'date' });
    const m = modal({ titulo: 'Posponer', cuerpo: [
      el('button', { class: 'btn', text: 'Mañana 09:00', onclick: () => { m.cerrar(); act(() => cargadores.posponer(p.id, o.manana))(); } }),
      el('button', { class: 'btn', text: 'Lunes 09:00', onclick: () => { m.cerrar(); act(() => cargadores.posponer(p.id, o.lunes))(); } }),
      campo,
    ], acciones: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.cerrar() }),
      el('button', { class: 'btn primario', text: 'Posponer a la fecha', onclick: () => {
        if (!campo.value) return;
        m.cerrar(); act(() => cargadores.posponer(p.id, new Date(campo.value + 'T09:00:00').toISOString()))();
      } }),
    ] });
  };
  const comentar = async () => {
    const t = await pedirTexto('Comentar', 'Comentario');
    if (t) await act(() => cargadores.comentar(p.id, t))();
  };
  // Pagar: segundo toque con el importe antes de aprobar (Pere).
  const sipago = async () => {
    const quien = p.quien_pide ? ' pedido por ' + p.quien_pide : '';
    if (await confirmar('Aprobar pago', 'Aprobar pago de ' + (p.importe != null ? eur(p.importe) : 'importe sin dato') + ' a ' + (p.titulo || p.concepto) + quien + '?', 'Sí, aprobar pago')) await act(() => cargadores.resolver(p.id, 'aprobada'))();
  };
  return el('div', { class: 'home-decidir hoy-tarjeta' + (roja ? ' rojo' : '') + (destacada ? ' destacada' : ''), id: 'hoy-' + p.id }, [
    el('p', { class: 'titulo', text: p.titulo || p.concepto }),
    p.recomendacion ? el('p', { class: 'mudo', text: p.recomendacion }) : null,
    el('p', { class: 'mudo', text: [p.importe != null ? eur(p.importe) : null, p.edad_h != null ? hace(p.edad_h) : null, p.quien_pide ? 'pide ' + p.quien_pide : null, p.vence ? 'vence ' + fecha(p.vence) : null].filter(Boolean).join(' · ') }),
    el('div', { class: 'home-botones' }, [
      el('button', { class: 'btn primario', text: 'Sí', onclick: pago ? sipago : act(() => cargadores.resolver(p.id, 'aprobada')) }),
      el('button', { class: 'btn peligro', text: 'No', onclick: act(() => cargadores.resolver(p.id, 'rechazada')) }),
      el('button', { class: 'btn', text: 'Posponer', onclick: posponer }),
      el('button', { class: 'btn', text: 'Comentar', onclick: comentar }),
    ]),
  ]);
}

export function pintarDecidir(h, repintar = () => {}, destacado = null) {
  const filas = (h?.decidir || []).slice(0, n(h?.max_filas) || 50);
  if (!filas.length) return bloque('hoy-decidir', 'Depende de ti', vacio('Nada depende de ti'));
  return bloque('hoy-decidir', 'Depende de ti', filas.map(p => tarjeta(p, n(h.umbral_decidir_h), repintar, { destacada: String(p.id) === String(destacado) })));
}

export function pintarFirmar(h, ahora = new Date()) {
  const filas = (h?.firmar || []).slice().sort((a, b) => String(a.plazo || '9999').localeCompare(String(b.plazo || '9999'))).slice(0, n(h?.max_filas) || 50);
  if (!filas.length) return bloque('hoy-firmar', 'Firmar', vacio('Nada que firmar'));
  return bloque('hoy-firmar', 'Firmar', filas.map(f => {
    const roja = f.plazo && new Date(f.plazo) < ahora;
    return el('a', { class: 'vt-card compacta' + (roja ? ' rojo' : ''), href: '#licitaciones' }, [
      el('h3', { text: f.licitacion }),
      el('p', { class: 'mudo', text: [f.organo, f.importe != null ? eur(f.importe) : null, f.plazo ? 'plazo ' + fecha(f.plazo) : null, f.paso].filter(Boolean).join(' · ') }),
    ]);
  }));
}

export function pintarPagar(h, repintar = () => {}) {
  const filas = h?.pagar || [];
  if (!filas.length) return bloque('hoy-pagar', 'Pagar', vacio('Nada que pagar'));
  return bloque('hoy-pagar', 'Pagar', filas.map(p => tarjeta({ ...p, titulo: p.concepto }, 0, repintar, { pago: true })));
}

export function pintarCorreos(h) {
  const filas = h?.correos || [];
  if (!filas.length) return bloque('hoy-correos', 'Correos sin contestar', vacio('Nada sin contestar'));
  const umbral = n(h.umbral_correo_h);
  return bloque('hoy-correos', 'Correos sin contestar', filas.map(c => {
    const roja = umbral > 0 && n(c.horas_sin_respuesta) > umbral;
    const txt = [c.remitente, c.asunto, c.expediente].filter(Boolean).join(' · ');
    return el('div', { class: 'vt-card compacta' + (roja ? ' rojo' : '') }, [
      el('p', { text: txt || 'Correo sin contestar' }),
      el('p', { class: 'mudo', text: n(c.horas_sin_respuesta) + ' h sin respuesta' }),
    ]);
  }));
}

// Spec 5: Proyectos que no van bien: rojo, ámbar o con bloqueo, máximo 5, en el orden de la vista.
export function proyectosMalos(filas, max = 5) {
  return (filas || []).filter(p => ['rojo', 'ambar'].includes(p.semaforo) || p.bloqueo).slice(0, max);
}
export function pintarProyectosMalos(filas) {
  if (filas == null) return bloque('hoy-proyectos', 'Proyectos', vacio('Proyectos: pendiente de datos'));
  const m = proyectosMalos(filas);
  if (!m.length) return bloque('hoy-proyectos', 'Proyectos', vacio('Todos los proyectos en verde'));
  const nodo = pintarProyectos(m);
  nodo.id = 'hoy-proyectos';
  return nodo;
}

// Spec 5: Web 7 días, una tarjeta por sitio, con variación de visitas frente a los 7 días anteriores.
export function modeloWeb7(filas, ahora = new Date()) {
  const dia = d => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(ahora.getTime() - d * 86400000));
  const ini = dia(6), antIni = dia(13);
  const sitios = {};
  (filas || []).forEach(f => {
    const s = sitios[f.sitio] || (sitios[f.sitio] = { sitio: f.sitio, visitas: 0, visitantes: 0, clics: 0, formularios: 0, antes: 0 });
    if (f.dia >= ini) {
      s.visitas += n(f.visitas); s.visitantes += n(f.visitantes); s.clics += n(f.clics_reservar);
      s.formularios += n(f.envios_contacto) + n(f.envios_empleo) + n(f.envios_docureal);
    } else if (f.dia >= antIni) s.antes += n(f.visitas);
  });
  return Object.values(sitios).map(s => ({ ...s, variacion: s.antes ? Math.round((s.visitas - s.antes) / s.antes * 100) : null }));
}
export function pintarWeb7(filas, ahora = new Date()) {
  if (filas == null) return bloque('hoy-web', 'Web 7 días', vacio('Web: sin datos'));
  const m = modeloWeb7(filas, ahora);
  if (!m.length) return bloque('hoy-web', 'Web 7 días', vacio('Web: sin visitas'));
  return bloque('hoy-web', 'Web 7 días', el('div', { class: 'vt-cards' }, m.map(s => el('a', { class: 'vt-card compacta web-tarjeta', href: '#operacion/ventas' }, [
    el('h3', { text: s.sitio }),
    el('p', { text: s.visitas + ' visitas' + (s.variacion != null ? ' (' + (s.variacion > 0 ? '+' : '') + s.variacion + '%)' : '') }),
    el('p', { class: 'mudo', text: s.visitantes + ' visitantes · ' + s.clics + ' Reservar · ' + s.formularios + ' formularios' }),
  ]))));
}

export function render(raiz, S, arg, filtros) {
  const cont = el('div', { class: 'home hoy' }, [el('p', { class: 'cargando', text: '...' })]);
  raiz.append(cont);
  const destacado = arg && arg !== 'bandeja' ? arg : null;
  const repintar = () => render(Object.assign(raiz, { innerHTML: '' }), S, arg, filtros);
  const cola = ['pro', 'prd', 'web', 'cap'].map(k => el('div', { 'data-b': k }));
  const poner = (i, nodo) => { if (cola[i].isConnected) cola[i].replaceWith(nodo); cola[i] = nodo; };
  cargadores.proyectos().then(f => poner(0, pintarProyectosMalos(f))).catch(() => poner(0, pintarProyectosMalos(null)));
  cargadores.productos().then(d => poner(1, pintarProductos(d))).catch(() => poner(1, pintarProductos(null)));
  cargadores.web().then(f => poner(2, pintarWeb7(f))).catch(() => poner(2, pintarWeb7(null)));
  const pintaCap = (filas, periodo) => poner(3, pintarCaptacion(filas, periodo, p => pintaCap(filas, p)));
  cargadores.captacion().then(f => pintaCap(f, 7)).catch(() => pintaCap(null, 7));
  cargadores.hoy().then(h => {
    cont.replaceChildren(cabecera(h?.cifras), pintarDecidir(h, repintar, destacado), pintarFirmar(h), pintarPagar(h, repintar), pintarCorreos(h), ...cola);
    if (destacado) document.getElementById('hoy-' + destacado)?.scrollIntoView?.({ block: 'start' });
  }).catch(e => cont.replaceChildren(bloque('hoy-error', 'Hoy', vacio('No se pudo cargar (' + (e?.message || 'error') + ')'))));
}
