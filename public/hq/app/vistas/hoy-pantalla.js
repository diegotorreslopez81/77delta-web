// Pantalla Hoy de HQ v2 (spec 5, enmienda 4, 18-10): KPIs siempre visibles y bloques en acordeón, todos plegados por defecto.
// Orden: KPIs, Depende de ti (decidir y pagar), Correos, Web, Captación, Firmar. Sin proyectos ni productos (tienen pestaña).
// Solo pinta columnas de hq_v_hoy_* leídas por la RPC hq_hoy con p_token. Sin umbrales ni cálculo propio:
// el rojo sale de umbral_decidir_h y umbral_correo_h que devuelve la RPC (hq_parametros).
import { ICONOS_HOY } from '../iconos.js';
import { el, toast, eur, fecha, pedirTexto, modal, confirmar, provisional } from '../ui.js';
import { pintarCaptacion, valorCifra } from './home.js';
import { rejillaWeb } from './web.js';

let cargadores = {
  hoy: async () => (await import('../api.js')).rpc('hq_hoy'),
  web: async () => (await import('../api.js')).rpc('hq_web', { p_dias: 30 }),
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
// Celda Tareas (Google Tasks en vivo: GET api.77delta.com/hq/tareas, que ejecuta el script de Windmill): cifra = abiertas totales (#2584); color de urgencia: rojo con vencidas u hoy, ámbar con tareas sin fecha, verde sin nada.
// Cualquier fallo o respuesta sin recuentos numéricos da valor nulo y la celda sale gris; nunca un número viejo.
export function cifraTareas(t) {
  const base = { clave: 'tareas', etiqueta: 'Tareas', valor: null };
  if (!t || typeof t.abiertas !== 'number') return base;
  const v = n(t.vencidas), h = n(t.hoy), s = n(t.sin_fecha);
  return { ...base, valor: t.abiertas, color: v + h > 0 ? 'rojo' : s > 0 ? 'ambar' : 'verde' };
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
export function acordeon({ id, titulo, icono = '', cuenta, color = '', vacioTexto, abierto = false, contenido, almacen = globalThis.localStorage }) {
  const sec = el('section', { class: 'home-bloque hoy-bloque hoy-acordeon' + (cuenta === 0 ? ' gris' : '') + (color ? ' ' + color : ''), id });
  const texto = titulo;
  const ico = () => icono ? el('span', { class: 'cab-ico', html: icono }) : null;
  const pastilla = () => cuenta == null ? null : el('span', { class: 'pastilla ' + (color || ''), text: String(cuenta) });
  if (cuenta === 0) {
    sec.append(el('div', { class: 'hoy-acordeon-cab vacio' }, [ico(), el('span', { class: 'titulo', text: texto }), pastilla(), el('span', { class: 'mudo', text: vacioTexto || '' })]));
    return sec;
  }
  const visto = leerVisto(id, almacen);
  const nuevo = cuenta != null && visto != null && cuenta > visto;
  const chev = el('span', { class: 'chevron', 'aria-hidden': 'true', text: '▾' });
  const cab = el('button', { type: 'button', class: 'hoy-acordeon-cab', 'aria-expanded': 'false', 'aria-controls': id + '-cuerpo' }, [
    ico(), el('span', { class: 'titulo', text: texto }), pastilla(), nuevo ? el('span', { class: 'punto-nuevo ' + (color || ''), title: 'Ha subido desde tu última visita' }) : null, chev]);
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
function item(titulo, detalle, botones, { roja = false, destacada = false, id = null, aviso = '' } = {}) {
  const cab = el('button', { type: 'button', class: 'hoy-item-titulo', 'aria-expanded': 'false', text: titulo });
  const det = el('div', { class: 'hoy-item-detalle', hidden: '' }, lista(detalle));
  const raiz = el('div', { class: 'home-decidir hoy-tarjeta hoy-item' + (roja ? ' rojo' : '') + (destacada ? ' destacada' : ''), id, ...(aviso ? { title: aviso } : {}) }, [cab, det, botones]);
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
  const act = (fn, msg = 'Hecho') => async () => { try { await fn(); toast(msg); repintar(); } catch (e) { toast('No se pudo: ' + e.message); } };
  const posponer = () => {
    const o = opcionesPosponer();
    const campo = el('input', { type: 'date', class: 'campo', id: 'posponer-fecha', lang: 'es' });
    const hasta = iso => 'Pospuesta hasta ' + new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
    const opcion = (d, texto, iso) => el('button', { class: 'btn opcion-posponer', onclick: () => { m.cerrar(); act(() => cargadores.posponer(p.id, iso), hasta(iso))(); } }, [ico(d), el('span', { text: texto })]);
    const m = modal({ titulo: 'Posponer', cuerpo: [el('div', { class: 'posponer-hoja' }, [
      opcion('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', 'Mañana 09:00', o.manana),
      opcion('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', 'Lunes 09:00', o.lunes),
      el('label', { class: 'campo-l posponer-fecha' }, [el('span', { text: 'Otra fecha' }), campo]),
    ])], acciones: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.cerrar() }),
      el('button', { class: 'btn primario', text: 'Posponer a la fecha', onclick: () => {
        if (!campo.value) return;
        const iso = new Date(campo.value + 'T09:00:00').toISOString();
        m.cerrar(); act(() => cargadores.posponer(p.id, iso), hasta(iso))();
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
  // #2625: tarjetas tipo accion = acción de Diego sobre su tarea: Hecho / Descartar / Posponer / Copiar, una fila con icono.
  const copiar = async () => {
    try { await navigator.clipboard.writeText('#' + p.id + ' ' + (p.titulo || p.concepto || '') + '\n' + (p.detalle || '')); toast('Copiado: pégalo en el chat del chief'); }
    catch { toast('No se pudo copiar'); }
  };
  const ico = d => el('span', { class: 'ico', html: '<svg viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>' });
  const bi = (d, etiqueta, onclick, clase = '') => el('button', { class: 'btn btn-accion ' + clase, 'aria-label': etiqueta, title: etiqueta, onclick }, [ico(d)]);
  const botones = p.tipo === 'accion' && !pago
    ? el('div', { class: 'home-botones compacta' }, [
      bi('<path d="M5 12l5 5 9-10"/>', 'Hecho', act(() => cargadores.resolver(p.id, 'aprobada')), 'primario'),
      bi('<path d="M6 6l12 12M18 6L6 18"/>', 'Descartar', act(() => cargadores.resolver(p.id, 'rechazada'), 'Descartada'), 'peligro'),
      bi('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', 'Posponer', posponer),
      bi('<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/>', 'Copiar al chat', copiar),
    ])
    : el('div', { class: 'home-botones' }, [
      el('button', { class: 'btn primario', text: 'Sí', onclick: pago ? sipago : act(() => cargadores.resolver(p.id, 'aprobada')) }),
      el('button', { class: 'btn peligro', text: 'No', onclick: act(() => cargadores.resolver(p.id, 'rechazada')) }),
      el('button', { class: 'btn', text: 'Posponer', onclick: posponer }),
      el('button', { class: 'btn', text: 'Comentar', onclick: comentar }),
    ]);
  const detalle = [
    p.recomendacion ? el('p', { class: 'mudo', text: p.recomendacion }) : null,
    el('p', { class: 'mudo', text: [p.importe != null ? eur(p.importe) : null, p.edad_h != null ? hace(p.edad_h) : null, p.quien_pide ? 'pide ' + p.quien_pide : null, p.vence ? 'vence ' + fecha(p.vence) : null].filter(Boolean).join(' · ') }),
  ];
  return item(p.titulo || p.concepto, detalle, botones, { roja, destacada, id: 'hoy-' + p.id, aviso: roja ? 'Lleva más de ' + umbral + ' h sin decidir' : '' });
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
    return el('a', { class: 'vt-card compacta firmar-card' + (roja ? ' rojo' : ''), href: '#licitaciones?bloque=firmar' }, [
      el('span', { class: 'cab-ico', html: ICONOS_HOY.firmar }),
      el('div', { class: 'firmar-datos' }, [
        el('h3', { text: f.licitacion }),
        el('p', { class: 'mudo', text: [f.organo, f.paso].filter(Boolean).join(' · ') }),
        el('p', { class: 'firmar-meta' }, [el('strong', { text: f.importe != null ? eur(f.importe) : 'importe sin dato' }), f.plazo ? ' · plazo ' + fecha(f.plazo) : '']),
      ]),
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
  return [rejillaWeb(filas, ahora)];
}
// Bloque fijo (V1, #2584): cuatro tarjetas por sitio, 30 días, datos del resumen de hq_web; no se pliega.
function bloqueWeb() {
  const sec = el('section', { class: 'home-bloque home-web', id: 'hoy-web' }, [el('h2', {}, [el('span', { class: 'cab-ico', html: ICONOS_HOY.web }), 'Web (30 días)']), el('p', { class: 'mudo', text: 'Cargando...' })]);
  Promise.resolve().then(() => cargadores.web()).catch(() => cargadores.web()).then(f => sec.replaceChildren(el('h2', {}, [el('span', { class: 'cab-ico', html: ICONOS_HOY.web }), 'Web (30 días)']), ...pintarWeb7(f)))
    .catch(e => { console.error('hq_web', e); sec.replaceChildren(el('h2', {}, [el('span', { class: 'cab-ico', html: ICONOS_HOY.web }), 'Web (30 días)']), el('p', { class: 'mudo', text: 'Web: sin datos' + (e && e.message ? ' (' + String(e.message).slice(0, 80) + ')' : '') })); });
  return sec;
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
// Formato v181: detalle con clave. Cifra grande = facturado_2026, pequeño = mes en curso; el detalle solo muestra por facturar y cobrado.
function ingresosNueva(f) {
  const por = c => f.detalle.find(d => d && d.clave === c);
  const anio = por('facturado_2026');
  if (!anio) return null;
  const mes = String(f.periodo_texto || '');
  const fila = c => { const d = por(c); return d ? [{ etiqueta: sinAprox(d.etiqueta), valor: valorNegocio(d.valor, d.unidad) || 'sin dato' }] : []; };
  return {
    periodo: String(anio.etiqueta || '').match(/\d{4}/)?.[0] || '', principal: eurNegocio(anio.valor), principalTexto: 'Facturado ' + (String(anio.etiqueta || '').match(/\d{4}/)?.[0] || ''),
    secundario: (mes ? mes + ' ' : '') + eurNegocio(f.secundario ?? f.principal),
    detalle: [...fila('por_facturar'), ...fila('cobrado_2026')],
    lineas: Array.isArray(por('lineas_2026')?.lineas) ? por('lineas_2026').lineas.map(l => ({ clave: String(l.etiqueta).toLowerCase(), etiqueta: l.etiqueta, pct: Number(l.pct) || 0 })) : [],
  };
}
function ingresosVieja(f) {
  if (f?.clave !== 'ingresos' || !Array.isArray(f.detalle)) return {};
  const nueva = ingresosNueva(f);
  if (nueva) return nueva;
  const i = f.detalle.findIndex(d => d && !d.clave && /^\d{4}\s+facturado/i.test(d.etiqueta || ''));
  if (i < 0) return {};
  const anio = f.detalle[i], mes = String(f.periodo_texto || '');
  return {
    principal: eurNegocio(anio.valor), principalTexto: 'Facturado ' + String(anio.etiqueta).match(/\d{4}/)[0],
    secundario: (mes ? mes + ' ' : '') + eurNegocio(f.principal), periodo: '',
    detalle: f.detalle.filter((d, j) => j !== i).slice(0, 2).map(d => ({ etiqueta: sinAprox(d.etiqueta), valor: valorNegocio(d.valor, d.unidad) || 'sin dato' })),
  };
}
// #2677: importe corto de una línea del desglose de Pipeline: 999 €, 433,2 k€, 1,12 M€.
export function kEur(v) {
  const x = Number(v);
  if (v == null || !Number.isFinite(x)) return 'sin dato';
  const f = (n, d) => n.toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
  if (Math.abs(x) >= 1e6) return f(x / 1e6, 2) + ' M€';
  if (Math.abs(x) >= 1000) return f(x / 1e3, 1) + ' k€';
  return Math.round(x) + ' €';
}
// Pipeline (#2677) y Contratado (#2678): detalle con clave = tres líneas (licitaciones, propuestas, ayudas); cada una con importe, n y enlace.
// Contratado añade el porcentaje de conversión "(#n, p %)" y la barra por tipología (elemento "lineas" del detalle).
// #2692: enlace de línea. http(s) tal cual y en pestaña nueva (CRM); resto, hash interno; vacío, sin enlace.
export function enlaceLinea(e) {
  const v = String(e ?? '').trim();
  if (!v) return { enlace: '', externo: false };
  if (/^https?:\/\//i.test(v)) return { enlace: v, externo: true };
  return { enlace: '#' + v.replace(/^#\/?/, ''), externo: false };
}
const ETIQUETAS_LINEA = { licitaciones: 'Licitaciones', propuestas: 'Sales', ayudas: 'Ayudas', subvenciones: 'Subvenciones' };
function pipelineNueva(f) {
  if (!['pipeline', 'contratado'].includes(f?.clave) || !Array.isArray(f.detalle) || !f.detalle.some(d => d && d.clave)) return {};
  const conPct = f.clave === 'contratado', encargo = conPct ? '#2678' : '#2677';
  const lineasPipe = f.detalle.filter(d => d && d.clave && d.clave !== 'lineas').map(d => {
    const sinDato = d.provisional === true || d.valor == null;
    const pct = conPct && d.pct_conversion != null ? ', ' + Math.round(Number(d.pct_conversion)) + ' %' : '';
    const et = ETIQUETAS_LINEA[d.clave] || d.etiqueta || d.clave;
    return { clave: d.clave, valor: sinDato ? 0 : Number(d.valor) || 0, texto: sinDato ? et + ': pdte CRM' : et + ': ' + kEur(d.valor) + ' (#' + (d.n ?? 0) + pct + ')', ...enlaceLinea(d.enlace), provisional: sinDato };
  });
  return {
    periodo: '', principal: kEur(f.principal), principalTexto: f.principal_texto || (conPct ? 'concedido' : 'en juego'), secundario: '', detalle: [], encargo,
    lineas: lineasBarra(f.detalle, lineasPipe),
    lineasPipe,
  };
}
// #2695: barra y leyenda de Pipeline y Contratado. Si la vista trae "lineas" se usan; si no, se calculan del valor de las líneas.
const ETIQUETAS_CORTAS = { licitaciones: 'Licit.', propuestas: 'Sales', ayudas: 'Ayudas', subvenciones: 'Subv.' };
// #2707: orden fijo Licit., Sales, Ayudas, Subv. en la leyenda de Pipeline y Contratado.
const ORDEN_LINEAS = ['licitaciones', 'propuestas', 'ayudas', 'subvenciones'];
const posLinea = c => { const i = ORDEN_LINEAS.indexOf(c); return i < 0 ? ORDEN_LINEAS.length : i; };
const CLAVE_DE_ETIQUETA = { licita: 'licitaciones', licitaciones: 'licitaciones', sales: 'propuestas', propuestas: 'propuestas', ayudas: 'ayudas', subvenciones: 'subvenciones' };
export function lineasBarra(detalle, lineasPipe) {
  const barra = (detalle || []).find(d => d && d.clave === 'lineas');
  let l;
  if (Array.isArray(barra?.lineas) && barra.lineas.length) {
    l = barra.lineas.map(x => ({ clave: CLAVE_DE_ETIQUETA[String(x.etiqueta).toLowerCase()] || String(x.etiqueta).toLowerCase(), pct: Number(x.pct) || 0 }));
  } else {
    const suma = lineasPipe.reduce((a, x) => a + x.valor, 0);
    if (suma <= 0) return [];
    l = lineasPipe.map(x => ({ clave: x.clave, pct: Math.round(x.valor / suma * 100) }));
  }
  return l.map(x => ({ ...x, etiqueta: ETIQUETAS_CORTAS[x.clave] || x.clave })).sort((a, b) => posLinea(a.clave) - posLinea(b.clave));
}
// #2679: orden fijo de las casillas de Negocio; una clave que no esté va después, en el orden de la vista.
export const ORDEN_NEGOCIO = ['pipeline', 'contratado', 'ingresos', 'captacion_7d'];
const ETIQUETAS_NEGOCIO = { ingresos: 'Factura', captacion_7d: 'Captación' };
const posNegocio = c => { const i = ORDEN_NEGOCIO.indexOf(c); return i < 0 ? ORDEN_NEGOCIO.length : i; };
export function modeloNegocio(filas) {
  return (Array.isArray(filas) ? filas : []).filter(f => f && f.principal != null).map((f, i) => ({ f, i })).sort((a, b) => posNegocio(a.f.clave) - posNegocio(b.f.clave) || a.i - b.i).map(({ f }) => ({
    clave: f.clave, etiqueta: ETIQUETAS_NEGOCIO[f.clave] || f.etiqueta, color: f.color || '', enlace: '#' + String(f.enlace || 'hoy').replace(/^#\/?/, ''), periodo: f.periodo_texto || '',
    principal: valorNegocio(f.principal, f.principal_unidad),
    principalTexto: f.principal_texto || '',
    secundario: [valorNegocio(f.secundario, f.secundario_unidad), f.secundario_texto].filter(Boolean).join(' '),
    detalle: (Array.isArray(f.detalle) ? f.detalle : []).slice(0, 2).map(d => ({ etiqueta: sinAprox(d.etiqueta), valor: valorNegocio(d.valor, d.unidad) || 'sin dato' })),
    ...ingresosVieja(f),
    ...pipelineNueva(f),
  }));
}
// #2676: tarjetas de Negocio que aún leen tablas escritas por agentes; cada PR de migración quita la suya.
export const PROVISIONAL = { pipeline: '#2672', captacion_7d: '#2673', ingresos: '#2645' };
export function pintarNegocio(filas) {
  const m = modeloNegocio(filas);
  if (!m.length) return null;
  return el('div', { class: 'hoy-negocio' }, m.map(x => { const t = el('a', { class: 'vt-card hoy-neg ' + x.color + (x.lineasPipe ? ' pipeline' : ''), href: x.enlace }, [
    el('span', { class: 'mudo neg-etiqueta', text: x.etiqueta || x.clave }),
    x.periodo ? el('span', { class: 'mudo neg-periodo', text: x.periodo }) : null,
    el('span', { class: 'neg-principal' }, [x.principal, x.principalTexto ? el('small', { class: x.principalTexto.length > 20 ? 'bajo' : '', text: ' ' + x.principalTexto }) : null].filter(Boolean)),
    x.secundario ? el('span', { class: 'neg-secundario', text: x.secundario }) : null,
    ...x.detalle.map(d => el('span', { class: 'mudo neg-detalle', text: d.etiqueta + ': ' + d.valor })),
    ...(x.lineasPipe || []).map(l => { const n = el(l.enlace ? 'a' : 'span', { class: 'mudo neg-detalle neg-linea', ...(l.enlace ? { href: l.enlace } : {}), ...(l.externo ? { target: '_blank', rel: 'noopener' } : {}), text: l.texto }); return l.provisional ? provisional(n, x.encargo || '#2677') : n; }),
    x.lineas?.length ? el('span', { class: 'neg-barra', role: 'img', 'aria-label': 'Reparto por línea' }, x.lineas.filter(l => l.pct > 0).map(l => el('i', { class: 'neg-tramo l-' + l.clave, style: 'width:' + l.pct + '%' }))) : null,
    x.lineas?.length ? el('div', { class: 'mudo neg-detalle neg-leyenda' }, x.lineas.map(l => el('span', {}, [el('i', { class: 'neg-punto l-' + l.clave }), l.etiqueta + ' ' + l.pct + ' %']))) : null,
  ].filter(Boolean)); return PROVISIONAL[x.clave] && !x.lineasPipe ? provisional(t, PROVISIONAL[x.clave]) : t; }));
}

// #2678: si hq_hoy_negocio falla, el bloque no desaparece: una línea con el motivo.
export function bloqueNegocio(filas) {
  if (filas?.errorNegocio) return el('p', { class: 'error', text: 'No se pudo cargar Negocio (' + (filas.errorNegocio?.message || 'error') + ')' });
  return pintarNegocio(filas);
}

export function render(raiz, S, arg, filtros) {
  const cont = el('div', { class: 'home hoy' }, [el('p', { class: 'cargando', text: '...' })]);
  raiz.append(cont);
  const destacado = arg && arg !== 'bandeja' ? arg : null;
  const pedido = filtros?.bloque ? 'hoy-' + filtros.bloque : null;
  const repintar = () => render(Object.assign(raiz, { innerHTML: '' }), S, arg, filtros);
  Promise.all([cargadores.hoy(), Promise.resolve().then(() => cargadores.negocio()).catch(e => ({ errorNegocio: e }))]).then(([h, filasNeg]) => {
    const neg = bloqueNegocio(filasNeg);
    const cifras = h?.cifras || [];
    const dec = recuento(cifras, ['decidir', 'pagar'], (h?.decidir || []).length + (h?.pagar || []).length);
    const fir = recuento(cifras, ['firmar'], (h?.firmar || []).length);
    const web = recuento(cifras, ['web'], null), cap = recuento(cifras, ['captacion'], null);
    if (window.HQ_DATOS?.rol === 'owner') { window.HQ_DATOS.depende_n = dec.n; window.HQ_PINTAR?.(); }
    const idsDecidir = [...(h?.decidir || []), ...(h?.pagar || [])].map(p => String(p.id));
    const aviso = destacado && !idsDecidir.includes(String(destacado)) ? el('p', { class: 'aviso', text: 'La tarjeta ' + destacado + ' ya no está pendiente' }) : null;
    const abre = id => (destacado && id === 'hoy-decidir') || pedido === id;
    const bloques = [
      acordeon({ id: 'hoy-decidir', titulo: 'Depende de ti', icono: ICONOS_HOY.decidir, cuenta: dec.n, color: dec.color, vacioTexto: 'Nada depende de ti', abierto: abre('hoy-decidir') || leerAbierto('hoy-decidir'), contenido: () => pintarDecidir(h, repintar, destacado, filtros?.filtro) }),
      bloqueWeb(),
      acordeon({ id: 'hoy-captacion', titulo: 'Captación', icono: ICONOS_HOY.captacion, cuenta: cap.n, color: cap.color, abierto: abre('hoy-captacion') || leerAbierto('hoy-captacion'), contenido: async () => {
        const filas = await cargadores.captacion();
        const caja = el('div', {});
        const pinta = (f, p) => caja.replaceChildren(pintarCaptacion(f, p, q => pinta(f, q)));
        pinta(filas, 7);
        return caja;
      } }),
      acordeon({ id: 'hoy-firmar', titulo: 'Firmar', icono: ICONOS_HOY.firmar, cuenta: fir.n, color: fir.color, vacioTexto: 'Nada que firmar', abierto: abre('hoy-firmar') || leerAbierto('hoy-firmar'), contenido: () => pintarFirmar(h) }),
    ];
    const pon = x => { const c = cabecera([...cifras.filter(y => y.clave !== 'tareas'), x]); cont.querySelector('.home-cifras')?.replaceWith(c); };
    cargadores.tareas().then(t => pon(cifraTareas(t))).catch(() => {});
    cont.replaceChildren(...(neg ? [neg] : []), cabecera(cifras), ...(aviso ? [aviso] : []), ...bloques);
    if (pedido) document.getElementById(pedido)?.scrollIntoView?.({ block: 'start' });
    if (destacado) setTimeout(() => cont.querySelector('.hoy-item.destacada')?.classList.remove('destacada'), 4000);
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
