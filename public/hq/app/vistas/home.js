// Home de HQ v2 (spec 1, 18-10): cuatro bloques - Depende de ti, Proyectos, Tres cifras, Web.
// Solo pinta columnas de las vistas hq_v_* leídas por RPC con p_token (hq_home, hq_proyectos, hq_web).
// Sin umbrales ni cálculo propio: el rojo de edad usa umbral_decidir_h que devuelve la RPC (hq_parametros).
// Cada bloque carga y falla por separado: un bloque caído no tumba la home.
import { el, enlazar, toast, eur, fecha, provisional } from '../ui.js';
import { modeloWeb, separar } from './web.js';

let cargadores = {
  home: async () => (await import('../api.js')).rpc('hq_home'),
  proyectos: async () => (await import('../api.js')).rpc('hq_proyectos'),
  captacion: async () => (await import('../api.js')).rpc('hq_captacion'),
  productos: async () => (await import('../api.js')).rpc('hq_productos'),
  web: async () => (await import('../api.js')).rpc('hq_web', { p_dias: 30 }),
  resolver: async (id, estado) => (await import('../api.js')).rpc('omc_resolver', { p_id: id, p_estado: estado, p_respuesta: '' }),
};
export function usarCargadores(o) { cargadores = { ...cargadores, ...o }; }

const n = x => Number(x) || 0;
const fdia = iso => iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) : '';

function bloque(titulo, hijos, extra = '') {
  return el('section', { class: 'home-bloque' + extra }, [el('h2', { text: titulo }), ...[].concat(hijos)]);
}
const pendiente = texto => el('p', { class: 'mudo', text: texto });

// Bloque 1. Depende de ti.
export function modeloDecidir(h) {
  const dec = h?.decidir || [], fir = h?.firmar || [], pag = h?.pagar || [];
  return { primera: dec[0] || null, resto: Math.max(dec.length - 1, 0) + fir.length + pag.length, total: dec.length + fir.length + pag.length, umbral: n(h?.umbral_decidir_h) };
}
export function pintarDecidir(h, resolver = cargadores.resolver, repintar = () => {}) {
  const m = modeloDecidir(h);
  const kids = [];
  if (!m.total) return bloque('Depende de ti', pendiente('Nada depende de ti'));
  const p = m.primera;
  if (p) {
    const roja = m.umbral > 0 && n(p.edad_h) > m.umbral;
    const actuar = async estado => {
      try { await resolver(p.id, estado); toast('Hecho'); repintar(); } catch (e) { toast('No se pudo: ' + e.message); }
    };
    kids.push(el('div', { class: 'home-decidir' + (roja ? ' rojo' : '') }, [
      el('p', { class: 'titulo' }, enlazar(p.titulo)),
      p.recomendacion ? el('p', { class: 'mudo' }, enlazar(p.recomendacion)) : null,
      el('p', { class: 'mudo', text: [p.importe != null ? eur(p.importe) : null, p.vence ? 'vence ' + fecha(p.vence) : null].filter(Boolean).join(' · ') }),
      el('div', { class: 'home-botones' }, [
        el('button', { class: 'btn primario', text: 'Sí', onclick: () => actuar('aprobada') }),
        el('button', { class: 'btn peligro', text: 'No', onclick: () => actuar('rechazada') }),
      ]),
    ]));
  }
  if (m.resto > 0) kids.push(el('a', { class: 'btn home-mas', href: '#hoy/bandeja', text: 'y ' + m.resto + ' más' }));
  return bloque('Depende de ti', kids);
}

// Bloque 2. Proyectos (hq_v_proyectos ya viene ordenado por la columna orden).
export function pintarProyectos(filas) {
  if (filas == null) return bloque('Proyectos', pendiente('Proyectos: pendiente de datos'));
  if (!filas.length) return bloque('Proyectos', pendiente('Sin proyectos activos'));
  const lista = filas.slice(0, 15).map(p => {
    const fin = p.fin_por_encargos && p.fin_prevista && p.fin_por_encargos > p.fin_prevista
      ? 'prevista ' + fdia(p.fin_prevista) + ', por encargos ' + fdia(p.fin_por_encargos)
      : (p.fin_prevista ? 'fin ' + fdia(p.fin_prevista) : (p.fin_por_encargos ? 'fin ' + fdia(p.fin_por_encargos) : ''));
    return el('a', { class: 'vt-card compacta home-proyecto', href: '#operacion/en-curso' }, [
      p.bloqueo ? el('span', { class: 'pill rojo', text: p.bloqueo }) : null,
      el('h3', { text: p.nombre || p.proyecto }),
      el('div', { class: 'barra ' + (p.semaforo || ''), role: 'img', 'aria-label': n(p.n_hechos) + ' de ' + n(p.n_total) }, [el('i', { style: 'width:' + Math.min(100, n(p.pct)) + '%' })]),
      el('p', { class: 'mudo', text: n(p.n_hechos) + ' de ' + n(p.n_total) + (fin ? ' · ' + fin : '') }),
      p.tarea_en_curso ? el('p', { class: 'mudo', text: p.tarea_en_curso + (p.fecha_tarea ? ' · ' + fdia(p.fecha_tarea) : '') }) : null,
      el('span', { class: 'semaforo-pill ' + (p.semaforo || ''), text: p.semaforo || '' }),
    ]);
  });
  return bloque('Proyectos', el('div', { class: 'vt-cards' }, lista));
}

const miles = v => Math.round(Number(v)).toLocaleString('es-ES', { useGrouping: 'always' });
export function valorCifra(x) {
  if (x.valor == null) return x.unidad === 'eur' ? 'sin dato' : '-';
  return x.unidad === 'eur' ? miles(x.valor) + ' €' : String(x.valor) + (x.unidad ? ' ' + x.unidad : '');
}

// Bloque 3. Tres cifras: las que fije hq_parametros (home_cifra_1..3), ya filtradas y ordenadas por la RPC.
export function pintarCifras(cifras) {
  const c = (cifras || []).slice(0, 3);
  if (!c.length) return bloque('Tres cifras', pendiente('Sin cifras configuradas'));
  return bloque('Tres cifras', el('div', { class: 'home-cifras' }, c.map(x =>
    el('a', { class: 'vt-card compacta home-cifra ' + (x.color || ''), href: x.enlace ? '#' + String(x.enlace).replace(/^#/, '') : '#hoy' }, [
      el('span', { class: 'valor', text: valorCifra(x) }),
      el('span', { class: 'mudo', text: x.etiqueta || x.clave }),
    ]))));
}

// Captación: cinco pasos con cifra y % sobre el paso anterior. Total arriba, producto debajo; 7 o 30 días.
// Nombres, periodos y cifras vienen de hq_v_captacion; solo se rotula.
const PASOS = [['enviados', 'Enviados'], ['respuestas', 'Respuestas'], ['visitas', 'Visitas'], ['clics_reservar', 'Reservar'], ['formularios', 'Formularios'], ['ganados', 'Ganados']];
const rotulo = p => p === 'total' ? 'Total' : p === 'sin_producto' ? 'Sin producto' : String(p).charAt(0).toUpperCase() + String(p).slice(1);
export function modeloCaptacion(filas, periodo) {
  const del = (filas || []).filter(f => n(f.periodo) === n(periodo));
  const orden = f => f.producto === 'total' ? 0 : 1;
  return del.slice().sort((a, b) => orden(a) - orden(b) || String(a.producto).localeCompare(String(b.producto))).map(f => {
    const pasos = PASOS.filter(([k]) => f.producto === 'total' || !['visitas', 'clics_reservar', 'formularios'].includes(k)).map(([k, t], i, arr) => {
      const prev = i ? n(f[arr[i - 1][0]]) : 0;
      return { clave: k, titulo: t, valor: n(f[k]), pct: i && prev ? Math.round(n(f[k]) / prev * 100) : null };
    });
    return { producto: f.producto, titulo: rotulo(f.producto), pasos };
  });
}
// #2676: columnas de envío que aún leen ven_*; visitas, reservar y formularios salen de Umami (fuente buena).
export const PROVISIONAL_CAPTACION = { enviados: '#2673', respuestas: '#2673', ganados: '#2673' };
export function pintarCaptacion(filas, periodo = 7, cambiar = () => {}) {
  if (filas == null) return bloque('Captación', pendiente('Captación: pendiente de datos'));
  const filasP = modeloCaptacion(filas, periodo);
  const periodos = [...new Set((filas || []).map(f => n(f.periodo)))].sort((a, b) => a - b);
  const sel = el('div', { class: 'home-botones' }, periodos.map(p => el('button', { class: 'btn' + (p === n(periodo) ? ' primario' : ''), text: p + ' días', onclick: () => cambiar(p) })));
  if (!filasP.length) return bloque('Captación', [sel, pendiente('Sin datos de captación')]);
  return bloque('Captación', [sel, ...filasP.map(f => el('div', { class: 'captacion-fila' }, [
    el('h3', { text: f.titulo }),
    el('div', { class: 'home-cifras' }, f.pasos.map(p => { const c = el('div', { class: 'vt-card compacta home-cifra' }, [
      el('span', { class: 'valor', text: String(p.valor) + (p.pct != null ? ' (' + p.pct + '%)' : '') }),
      el('span', { class: 'mudo', text: p.titulo }),
    ]); return PROVISIONAL_CAPTACION[p.clave] ? provisional(c, PROVISIONAL_CAPTACION[p.clave]) : c; })),
  ]))]);
}

// Productos: una fila por producto con su paso "3 de 6", días en etapa, siguiente paso y leads.
export function pintarProductos(datos) {
  if (datos == null) return bloque('Productos', pendiente('Productos: pendiente de datos'));
  const ps = datos.productos || [];
  if (!ps.length) return bloque('Productos', pendiente('Sin productos todavía'));
  return bloque('Productos', el('div', { class: 'vt-cards' }, ps.map(p => el('a', { class: 'vt-card compacta home-proyecto', href: '#productos' }, [
    el('h3', { text: p.producto }),
    el('p', { class: 'mudo', text: n(p.etapa_orden) + ' de ' + n(p.etapas_total) + ' · ' + p.etapa + ' · ' + n(p.dias_en_etapa) + ' d' }),
    p.siguiente_paso ? el('p', { class: 'mudo', text: p.siguiente_paso + (p.fecha_siguiente ? ' · ' + fdia(p.fecha_siguiente) : '') }) : null,
    el('p', { class: 'mudo', text: 'Leads abiertos ' + n(p.leads_abiertos) + ' · ganados ' + n(p.ganados) }),
    el('span', { class: 'semaforo-pill ' + (p.semaforo || ''), text: p.semaforo || '' }),
  ]))));
}

// Bloque 4. Web: suma de 7 días por sitio y hoy frente a ayer de 77delta.com. Sitios sin fila salen a 0.
export function modeloHomeWeb(filas, ahora = new Date()) {
  filas = separar(filas).dias;
  const sitios = modeloWeb(filas, ahora);
  const dia = d => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Madrid' }).format(new Date(ahora.getTime() - d * 86400000));
  const suma = (sitio, d) => (filas || []).filter(f => f.sitio === sitio && f.dia === dia(d)).reduce((a, f) => a + n(f.visitas), 0);
  const extra = {};
  (filas || []).forEach(f => {
    if (f.dia < dia(6)) return;
    const e = extra[f.sitio] || (extra[f.sitio] = { clics: 0, envios: 0 });
    e.clics += n(f.clics_reservar); e.envios += n(f.envios_contacto) + n(f.envios_empleo) + n(f.envios_docureal);
  });
  return {
    sitios: sitios.map(s => ({ sitio: s.sitio, visitas: s.s7.v, visitantes: s.s7.u, clics: extra[s.sitio]?.clics || 0, envios: extra[s.sitio]?.envios || 0 })),
    hoy: suma('77delta.com', 0), ayer: suma('77delta.com', 1),
  };
}
export function pintarWeb(filas, ahora = new Date()) {
  if (filas == null) return bloque('Web', pendiente('Web: sin datos'));
  filas = separar(filas).dias;
  const m = modeloHomeWeb(filas, ahora);
  const t = el('table', { class: 'tabla-lic web-tabla' }, [
    el('tr', {}, ['Sitio', 'Visitas', 'Visitantes', 'Reservar', 'Envíos'].map(x => el('th', { text: x }))),
    ...m.sitios.map(s => el('tr', {}, [s.sitio, s.visitas, s.visitantes, s.clics, s.envios].map(x => el('td', { text: String(x) })))),
  ]);
  return el('a', { class: 'home-bloque home-web', href: '#web' }, [el('h2', { text: 'Web (7 días)' }), t,
    el('p', { class: 'mudo', text: '77delta.com: hoy ' + m.hoy + ' visitas, ayer ' + m.ayer })]);
}

export function render(raiz, S, arg, filtros, ahora = new Date()) {
  const cont = el('div', { class: 'home' });
  const huecos = ['dec', 'pro', 'cif', 'cap', 'prd', 'web'].map(k => el('div', { 'data-b': k }, [el('p', { class: 'cargando', text: '...' })]));
  huecos.forEach(h => cont.append(h));
  raiz.append(cont);
  const poner = (i, nodo) => { if (huecos[i].isConnected) huecos[i].replaceWith(nodo); huecos[i] = nodo; };
  const repintar = () => render(Object.assign(raiz, { innerHTML: '' }), S, arg, filtros, ahora);
  const falla = (titulo, e) => bloque(titulo, pendiente(titulo + ': no se pudo cargar (' + (e?.message || 'error') + ')'));
  cargadores.home().then(h => { poner(0, pintarDecidir(h, cargadores.resolver, repintar)); poner(2, pintarCifras(h?.cifras)); })
    .catch(e => { poner(0, falla('Depende de ti', e)); poner(2, falla('Tres cifras', e)); });
  cargadores.proyectos().then(f => poner(1, pintarProyectos(f))).catch(() => poner(1, pintarProyectos(null)));
  const pintaCap = (filas, periodo) => poner(3, pintarCaptacion(filas, periodo, p => pintaCap(filas, p)));
  cargadores.captacion().then(f => pintaCap(f, 7)).catch(() => poner(3, pintarCaptacion(null)));
  cargadores.productos().then(d => poner(4, pintarProductos(d))).catch(() => poner(4, pintarProductos(null)));
  cargadores.web().then(f => poner(5, pintarWeb(f, ahora))).catch(() => poner(5, pintarWeb(null)));
}
