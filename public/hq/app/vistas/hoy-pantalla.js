// Pantalla Hoy de HQ v2 (spec 5, enmienda 4, 18-10): KPIs siempre visibles y bloques en acordeón, todos plegados por defecto.
// Orden: KPIs, Depende de ti (decidir y pagar), Correos, Web, Captación, Firmar. Sin proyectos ni productos (tienen pestaña).
// Solo pinta columnas de hq_v_hoy_* leídas por la RPC hq_hoy con p_token. Sin umbrales ni cálculo propio:
// el rojo sale de umbral_decidir_h y umbral_correo_h que devuelve la RPC (hq_parametros).
import { el, toast, eur, fecha, pedirTexto, modal, confirmar } from '../ui.js';
import { pintarCaptacion, valorCifra } from './home.js';

let cargadores = {
  hoy: async () => (await import('../api.js')).rpc('hq_hoy'),
  web: async () => (await import('../api.js')).rpc('hq_web', { p_dias: 14 }),
  captacion: async () => (await import('../api.js')).rpc('hq_captacion'),
  negocio: async () => (await import('../api.js')).rpc('hq_hoy_negocio'),
  tareas: async () => (await import('../api.js')).leerVivo('/hq/tareas'),
  resolver: async (id, estado) => (await import('../api.js')).rpc('omc_resolver', { p_id: id, p_estado: estado, p_respuesta: '' }),
  posponer: async (id, hasta) => (await import('../api.js')).rpc('omc_posponer', { p_id: id, p_hasta: hasta }),
  comentar: async (id, texto) => (await import('../api.js')).rpc('omc_comentar', { p_id: id, p_texto: texto }),
};
export function usarCargadores(o) { cargadores = { ...cargadores, ...o }; }

const n = x => Number(x) || 0;
const vacio = texto => el('p', { class: 'mudo', text: texto });
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

// Tres celdas (#2584, Diego: Correos fuera de la home): decidir (suma decidir y pagar, listas disjuntas en hq_v_hoy_*), firmar y tareas. Decidir abre Depende de ti;
// firmar abre la pestaña de Licitaciones con las filas de hq_v_hoy_firmar. Tareas y caja, grises hasta que tengan fuente.
export const CELDAS = ['decidir', 'firmar', 'tareas'];
export function enlaceCifra(x) {
  const e = { decidir: '#hoy?bloque=decidir', pagar: '#hoy?bloque=decidir&filtro=pagar', correos: '#hoy?bloque=correos', firmar: '#licitaciones?bloque=firmar', tareas: 'https://tasks.google.com' }[x.clave];
  return e || (x.enlace ? '#' + String(x.enlace).replace(/^#/, '') : '#hoy');
}
// Gris y sin acción: sin dato (tareas, caja) o recuento 0 en pagar.
export function celdaGris(x) {
  return x.valor == null || (x.clave === 'pagar' && Number(x.valor) === 0);
}
// Celda Tareas (Google Tasks en vivo: GET api.77delta.com/hq/tareas, que ejecuta el script de Windmill): rojo con vencidas u hoy, ámbar con tareas sin fecha, verde sin nada.
// Cualquier fallo o respuesta sin recuentos numéricos da valor nulo y la celda sale gris; nunca un número viejo.
export function cifraTareas(t) {
  const base = { clave: 'tareas', etiqueta: 'Tareas', valor: null };
  if (!t || typeof t.abiertas !== 'number') return base;
  const v = n(t.vencidas), h = n(t.hoy), s = n(t.sin_fecha);
  return { ...base, valor: v + h + s, color: v + h > 0 ? 'rojo' : s > 0 ? 'ambar' : 'verde' };
}
export function celdasCabecera(cifras) {
  const por = Object.fromEntries((cifras || []).map(x => [x.clave, x]));
  if (por.decidir && por.pagar) por.decidir = { ...por.decidir, valor: n(por.decidir.valor) + n(por.pagar.valor), color: n(por.decidir.valor) + n(por.pagar.valor) > 0 ? 'ambar' : por.decidir.color };
  return CELDAS.map(k => {
    const x = por[k] || { clave: k, etiqueta: k === 'caja' ? 'Caja' : k === 'tareas' ? 'Tareas' : k, valor: null };
    return celdaGris(x) ? { ...x, color: 'gris', gris: true } : x;
  });
}
export function cabecera(cifras) {
  return el('div', { class: 'home-cifras' }, celdasCabecera(cifras).map(x => {
    const cuerpo = [
      el('span', { class: 'valor', text: x.valor == null ? 'sin dato' : x.unidad === 'eur' ? valorCifra(x) : String(x.valor) }),
      el('span', { class: 'mudo', text: x.etiqueta || x.clave }),
    ];
    if (x.gris) return el('div', { class: 'vt-card compacta home-cifra gris' }, cuerpo);
    const ext = x.clave === 'tareas';
    return el('a', { class: 'vt-card compacta home-cifra ' + (x.color || ''), href: enlaceCifra(x), ...(ext ? { target: '_blank', rel: 'noopener' } : {}) }, cuerpo);
  }));
}

const lista = nodos => [].concat(nodos).filter(Boolean);

// Estado recordado por bloque en el dispositivo; sin storage (privado, bloqueado) todo queda plegado.
const clave = id => 'hq.hoy.' + id;
export function leerAbierto(id, almacen = globalThis.localStorage) {
  try { return almacen?.getItem(clave(id)) === '1'; } catch { return false; }
}
export function guardarAbierto(id, abierto, almacen = globalThis.localStorage) {
  try { almacen?.setItem(clave(id), abierto ? '1' : '0'); } catch { /* sin storage */ }
}
function leerVisto(id, almacen = globalThis.localStorage) {
  try { const v = almacen?.getItem(clave(id) + '.n'); return v == null ? null : n(v); } catch { return null; }
}
function guardarVisto(id, cuenta, almacen = globalThis.localStorage) {
  try { almacen?.setItem(clave(id) + '.n', String(cuenta)); } catch { /* sin storage */ }
}

// Recuento de la cabecera: sale de hq_v_hoy_cifras (clave) y, si falta, de la longitud de la lista.
export function recuento(cifras, claves, respaldo) {
  const hay = (cifras || []).filter(c => claves.includes(c.clave));
  if (hay.length) return { n: hay.reduce((a, c) => a + n(c.valor), 0), color: hay.map(c => c.color).find(c => c && c !== 'verde') || hay[0].color || '' };
  return respaldo == null ? { n: null, color: '' } : { n: n(respaldo), color: '' };
}

// Acordeón: cabecera de 44 px con "Título (N)" y chevron. Con 0 queda gris y sin chevron. El contenido se pide al abrir (una vez).
export function acordeon({ id, titulo, cuenta, color = '', vacioTexto, abierto = false, contenido, almacen = globalThis.localStorage }) {
  const sec = el('section', { class: 'home-bloque hoy-bloque hoy-acordeon' + (cuenta === 0 ? ' gris' : '') + (color ? ' ' + color : ''), id });
  const texto = titulo + (cuenta == null ? '' : ' (' + cuenta + ')');
  if (cuenta === 0) {
    sec.append(el('div', { class: 'hoy-acordeon-cab vacio' }, [el('span', { class: 'titulo', text: texto }), el('span', { class: 'mudo', text: vacioTexto || '' })]));
    return sec;
  }
  const visto = leerVisto(id, almacen);
  const nuevo = cuenta != null && visto != null && cuenta > visto;
  const chev = el('span', { class: 'chevron', 'aria-hidden': 'true', text: '▾' });
  const cab = el('button', { type: 'button', class: 'hoy-acordeon-cab', 'aria-expanded': 'false', 'aria-controls': id + '-cuerpo' }, [
    el('span', { class: 'titulo', text: texto }), nuevo ? el('span', { class: 'punto-nuevo ' + (color || ''), title: 'Ha subido desde tu última visita' }) : null, chev]);
  const cuerpo = el('div', { class: 'hoy-acordeon-cuerpo', id: id + '-cuerpo', hidden: '' });
  let cargado = false;
  const fijar = (abrir, guardar = true) => {
    cab.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    sec.classList.toggle('abierto', abrir);
    if (abrir) cuerpo.removeAttribute('hidden'); else cuerpo.setAttribute('hidden', '');
    if (abrir && !cargado) {
      cargado = true;
      cuerpo.replaceChildren(el('p', { class: 'cargando', text: '...' }));
      sec.carga = Promise.resolve().then(contenido).then(nodos => cuerpo.replaceChildren(...lista(nodos)))
        .catch(e => { cargado = false; cuerpo.replaceChildren(vacio('No se pudo cargar (' + (e?.message || 'error') + ')')); });
    }
    if (guardar) { guardarAbierto(id, abrir, almacen); if (abrir && cuenta != null) guardarVisto(id, cuenta, almacen); }
  };
  cab.addEventListener('click', () => fijar(cab.getAttribute('aria-expanded') !== 'true'));
  sec.append(cab, cuerpo);
  sec.abrir = () => fijar(true, false);
  if (abierto) fijar(true, false);
  return sec;
}

// Ítem de lista: plegado enseña título y botones; al tocar el título se abre el detalle y se pliega el resto de ítems de su bloque.
function item(titulo, detalle, botones, { roja = false, destacada = false, id = null } = {}) {
  const cab = el('button', { type: 'button', class: 'hoy-item-titulo', 'aria-expanded': 'false', text: titulo });
  const det = el('div', { class: 'hoy-item-detalle', hidden: '' }, lista(detalle));
  const raiz = el('div', { class: 'home-decidir hoy-tarjeta hoy-item' + (roja ? ' rojo' : '') + (destacada ? ' destacada' : ''), id }, [cab, det, botones]);
  raiz.alternar = abrir => {
    cab.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    if (abrir) det.removeAttribute('hidden'); else det.setAttribute('hidden', '');
  };
  cab.addEventListener('click', () => {
    const abrir = cab.getAttribute('aria-expanded') !== 'true';
    raiz.parentNode?.querySelectorAll?.('.hoy-item').forEach(o => o.alternar?.(false));
    raiz.alternar(abrir);
  });
  return raiz;
}

// Tarjeta con Sí / No / Posponer / Comentar.
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
  const botones = el('div', { class: 'home-botones' }, [
    el('button', { class: 'btn primario', text: 'Sí', onclick: pago ? sipago : act(() => cargadores.resolver(p.id, 'aprobada')) }),
    el('button', { class: 'btn peligro', text: 'No', onclick: act(() => cargadores.resolver(p.id, 'rechazada')) }),
    el('button', { class: 'btn', text: 'Posponer', onclick: posponer }),
    el('button', { class: 'btn', text: 'Comentar', onclick: comentar }),
  ]);
  const detalle = [
    p.recomendacion ? el('p', { class: 'mudo', text: p.recomendacion }) : null,
    el('p', { class: 'mudo', text: [p.importe != null ? eur(p.importe) : null, p.edad_h != null ? hace(p.edad_h) : null, p.quien_pide ? 'pide ' + p.quien_pide : null, p.vence ? 'vence ' + fecha(p.vence) : null].filter(Boolean).join(' · ') }),
  ];
  return item(p.titulo || p.concepto, detalle, botones, { roja, destacada, id: 'hoy-' + p.id });
}

export function pintarDecidir(h, repintar = () => {}, destacado = null, filtro = null) {
  const filas = filtro === 'pagar' ? [] : (h?.decidir || []).slice(0, n(h?.max_filas) || 50);
  const pagos = h?.pagar || [];
  return [
    ...filas.map(p => tarjeta(p, n(h.umbral_decidir_h), repintar, { destacada: String(p.id) === String(destacado) })),
    ...pagos.map(p => tarjeta({ ...p, titulo: p.concepto }, 0, repintar, { pago: true, destacada: String(p.id) === String(destacado) })),
  ];
}

export function pintarFirmar(h, ahora = new Date()) {
  const filas = (h?.firmar || []).slice().sort((a, b) => String(a.plazo || '9999').localeCompare(String(b.plazo || '9999'))).slice(0, n(h?.max_filas) || 50);
  return filas.map(f => {
    const roja = f.plazo && new Date(f.plazo) < ahora;
    return el('a', { class: 'vt-card compacta' + (roja ? ' rojo' : ''), href: '#licitaciones?bloque=firmar' }, [
      el('h3', { text: f.licitacion }),
      el('p', { class: 'mudo', text: [f.organo, f.importe != null ? eur(f.importe) : null, f.plazo ? 'plazo ' + fecha(f.plazo) : null, f.paso].filter(Boolean).join(' · ') }),
    ]);
  });
}

export function pintarCorreos(h) {
  const umbral = n(h?.umbral_correo_h);
  return (h?.correos || []).slice(0, n(h?.max_filas) || 50).map(c => {
    const roja = umbral > 0 && n(c.horas_sin_respuesta) > umbral;
    const txt = [c.remitente, c.asunto, c.expediente].filter(Boolean).join(' · ');
    return el('div', { class: 'vt-card compacta' + (roja ? ' rojo' : '') }, [
      el('p', { text: txt || 'Correo sin contestar' }),
      el('p', { class: 'mudo', text: n(c.horas_sin_respuesta) + ' h sin respuesta' }),
    ]);
  });
}

// Web 7 días, una tarjeta por sitio, con variación de visitas frente a los 7 días anteriores.
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
  if (filas == null) return [vacio('Web: sin datos')];
  const m = modeloWeb7(filas, ahora);
  if (!m.length) return [vacio('Web: sin visitas')];
  return [el('div', { class: 'vt-cards' }, m.map(s => el('a', { class: 'vt-card compacta web-tarjeta', href: '#ventas?bloque=web' }, [
    el('h3', { text: s.sitio }),
    el('p', { text: s.visitas + ' visitas' + (s.variacion != null ? ' (' + (s.variacion > 0 ? '+' : '') + s.variacion + '%)' : '') }),
    el('p', { class: 'mudo', text: s.visitantes + ' visitantes · ' + s.clics + ' Reservar · ' + s.formularios + ' formularios' }),
  ])))];
}

// Aviso y apertura por #hoy/N o ?bloque=: el bloque pedido se abre aunque estuviera plegado.
// Spec 9: bloque Negocio (hq_hoy_negocio, solo propietario). Las cifras vienen hechas de la vista; aquí solo se formatea.
// Euros con punto de miles y sin decimales; desde 1.000.000, "1,12 M €". Sin principal (caja) no se pinta la tarjeta.
export function eurNegocio(v) {
  const x = Number(v);
  if (v == null || !Number.isFinite(x)) return 'sin dato';
  if (Math.abs(x) >= 1e6) return (x / 1e6).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' M €';
  return Math.round(x).toLocaleString('es-ES', { useGrouping: 'always' }) + ' €';
}
const valorNegocio = (v, unidad) => v == null ? '' : unidad === 'eur' ? eurNegocio(v) : String(v) + (unidad && unidad !== 'n' ? ' ' + unidad : '');
// Ingresos (#2584): cifra grande = facturado del año (detalle "2026 facturado"), debajo el mes en pequeño; sin "(aprox.)" en etiquetas.
const sinAprox = e => String(e || '').replace(/\s*\(aprox\.?\)/i, '');
function ingresosVieja(f) {
  if (f?.clave !== 'ingresos' || !Array.isArray(f.detalle)) return {};
  const i = f.detalle.findIndex(d => d && !d.clave && /^\d{4}\s+facturado/i.test(d.etiqueta || ''));
  if (i < 0) return {};
  const anio = f.detalle[i], mes = String(f.periodo_texto || '');
  return {
    principal: eurNegocio(anio.valor), principalTexto: 'Facturado ' + String(anio.etiqueta).match(/\d{4}/)[0],
    secundario: (mes ? mes + ' ' : '') + eurNegocio(f.principal), periodo: '',
    detalle: f.detalle.filter((d, j) => j !== i).slice(0, 2).map(d => ({ etiqueta: sinAprox(d.etiqueta), valor: valorNegocio(d.valor, d.unidad) || 'sin dato' })),
  };
}
export function modeloNegocio(filas) {
  return (Array.isArray(filas) ? filas : []).filter(f => f && f.principal != null).map(f => ({
    clave: f.clave, etiqueta: f.etiqueta, color: f.color || '', enlace: '#' + String(f.enlace || 'hoy').replace(/^#\/?/, ''), periodo: f.periodo_texto || '',
    principal: valorNegocio(f.principal, f.principal_unidad),
    principalTexto: f.principal_texto || '',
    secundario: [valorNegocio(f.secundario, f.secundario_unidad), f.secundario_texto].filter(Boolean).join(' '),
    detalle: (Array.isArray(f.detalle) ? f.detalle : []).slice(0, 2).map(d => ({ etiqueta: sinAprox(d.etiqueta), valor: valorNegocio(d.valor, d.unidad) || 'sin dato' })),
    ...ingresosVieja(f),
  }));
}
export function pintarNegocio(filas) {
  const m = modeloNegocio(filas);
  if (!m.length) return null;
  return el('div', { class: 'hoy-negocio' }, m.map(x => el('a', { class: 'vt-card hoy-neg ' + x.color, href: x.enlace }, [
    el('span', { class: 'mudo neg-etiqueta', text: x.etiqueta || x.clave }),
    x.periodo ? el('span', { class: 'mudo neg-periodo', text: x.periodo }) : null,
    el('span', { class: 'neg-principal' }, [x.principal, x.principalTexto ? el('small', { text: ' ' + x.principalTexto }) : null].filter(Boolean)),
    x.secundario ? el('span', { class: 'neg-secundario', text: x.secundario }) : null,
    ...x.detalle.map(d => el('span', { class: 'mudo neg-detalle', text: d.etiqueta + ': ' + d.valor })),
  ].filter(Boolean))));
}

export function render(raiz, S, arg, filtros) {
  const cont = el('div', { class: 'home hoy' }, [el('p', { class: 'cargando', text: '...' })]);
  raiz.append(cont);
  const destacado = arg && arg !== 'bandeja' ? arg : null;
  const pedido = filtros?.bloque ? 'hoy-' + filtros.bloque : null;
  const repintar = () => render(Object.assign(raiz, { innerHTML: '' }), S, arg, filtros);
  Promise.all([cargadores.hoy(), Promise.resolve().then(() => cargadores.negocio()).catch(() => null)]).then(([h, filasNeg]) => {
    const neg = pintarNegocio(filasNeg);
    const cifras = h?.cifras || [];
    const dec = recuento(cifras, ['decidir', 'pagar'], (h?.decidir || []).length + (h?.pagar || []).length);
    const fir = recuento(cifras, ['firmar'], (h?.firmar || []).length);
    const web = recuento(cifras, ['web'], null), cap = recuento(cifras, ['captacion'], null);
    if (window.HQ_DATOS?.rol === 'owner') { window.HQ_DATOS.depende_n = dec.n; window.HQ_PINTAR?.(); }
    const idsDecidir = [...(h?.decidir || []), ...(h?.pagar || [])].map(p => String(p.id));
    const aviso = destacado && !idsDecidir.includes(String(destacado)) ? el('p', { class: 'aviso', text: 'La tarjeta ' + destacado + ' ya no está pendiente' }) : null;
    const abre = id => (destacado && id === 'hoy-decidir') || pedido === id;
    const bloques = [
      acordeon({ id: 'hoy-decidir', titulo: 'Depende de ti', cuenta: dec.n, color: dec.color, vacioTexto: 'Nada depende de ti', abierto: abre('hoy-decidir') || leerAbierto('hoy-decidir'), contenido: () => pintarDecidir(h, repintar, destacado, filtros?.filtro) }),
      acordeon({ id: 'hoy-web', titulo: 'Web', cuenta: web.n, color: web.color, abierto: abre('hoy-web') || leerAbierto('hoy-web'), contenido: async () => pintarWeb7(await cargadores.web()) }),
      acordeon({ id: 'hoy-captacion', titulo: 'Captación', cuenta: cap.n, color: cap.color, abierto: abre('hoy-captacion') || leerAbierto('hoy-captacion'), contenido: async () => {
        const filas = await cargadores.captacion();
        const caja = el('div', {});
        const pinta = (f, p) => caja.replaceChildren(pintarCaptacion(f, p, q => pinta(f, q)));
        pinta(filas, 7);
        return caja;
      } }),
      acordeon({ id: 'hoy-firmar', titulo: 'Firmar', cuenta: fir.n, color: fir.color, vacioTexto: 'Nada que firmar', abierto: abre('hoy-firmar') || leerAbierto('hoy-firmar'), contenido: () => pintarFirmar(h) }),
    ];
    const pon = x => { const c = cabecera([...cifras.filter(y => y.clave !== 'tareas'), x]); cont.querySelector('.home-cifras')?.replaceWith(c); };
    cargadores.tareas().then(t => pon(cifraTareas(t))).catch(() => {});
    cont.replaceChildren(...(neg ? [neg] : []), cabecera(cifras), ...(aviso ? [aviso] : []), ...bloques);
    if (pedido) document.getElementById(pedido)?.scrollIntoView?.({ block: 'start' });
    if (destacado) {
      // El ítem existe solo cuando el bloque está cargado: se espera a su carga antes de abrirlo y hacer scroll.
      const bloqueDecidir = bloques[0];
      Promise.resolve(bloqueDecidir.carga).then(() => {
        const t = document.getElementById('hoy-' + destacado);
        if (t) { t.alternar?.(true); t.scrollIntoView?.({ block: 'start' }); }
      });
    }
  }).catch(e => cont.replaceChildren(el('section', { class: 'home-bloque hoy-bloque', id: 'hoy-error' }, [el('h2', { text: 'Hoy' }), vacio('No se pudo cargar (' + (e?.message || 'error') + ')')])));
}
