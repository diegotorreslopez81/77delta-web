// O13a (D69, tanda E bis, encargo #2080): panel de administración genérico de D9 sobre las 15 tablas
// de catálogo/config que versiona lic_versionar (schema-v61). Solo owner: las 6 RPC lic_admin_* ya
// exigen ese rol server-side (42501 si no), aquí se repite en el cliente para no pintar nada que vaya
// a rebotar. Guardar sube versión y escribe en lic_config_historial/lic_criterios_historial vía el
// propio trigger; sin DELETE real (las tablas ya traen activo/activa para eso con un UPDATE normal).
import { el, campoTexto, modal, toast } from '../ui.js';

let cargaTablas = async () => (await import('../api.js')).licAdminTablas();
let cargaColumnas = async tabla => (await import('../api.js')).licAdminColumnas(tabla);
let cargaFilas = async tabla => (await import('../api.js')).licAdminFilas(tabla);
let ejecutaGuardar = async (tabla, clave, cambios, motivo) => (await import('../api.js')).licAdminGuardar(tabla, clave, cambios, motivo);
let ejecutaAlta = async (tabla, fila, motivo) => (await import('../api.js')).licAdminAlta(tabla, fila, motivo);
let cargaHistorial = async (tabla, clave) => (await import('../api.js')).licAdminHistorial(tabla, clave);
export function usarCargadores({ tablas, columnas, filas, guardar, alta, historial } = {}) {
  if (tablas) cargaTablas = tablas;
  if (columnas) cargaColumnas = columnas;
  if (filas) cargaFilas = filas;
  if (guardar) ejecutaGuardar = guardar;
  if (alta) ejecutaAlta = alta;
  if (historial) cargaHistorial = historial;
}

const CACHE_MS = 30e3;
let cacheTablas = null;        // { datos, t }
const cacheTabla = new Map();  // tabla -> { columnas, filas, t }
export function restablecer() { cacheTablas = null; cacheTabla.clear(); }

function esVacio(v) { return v === undefined || v === null || v === ''; }
export function iguales(a, b) { return JSON.stringify(a ?? null) === JSON.stringify(b ?? null); }

// Un input por columna, tipado por el `tipo` de information_schema (lic_admin_columnas, schema-v61).
export function campoValor(col, valor) {
  if (col.tipo === 'boolean') return el('input', { type: 'checkbox', 'data-col': col.columna, checked: !!valor });
  if (col.tipo === 'jsonb' || col.tipo === 'json') return campoTexto({ rows: 3, 'data-col': col.columna }, [valor == null ? '' : JSON.stringify(valor, null, 2)]);
  if (col.tipo === 'ARRAY') return el('input', { class: 'campo', 'data-col': col.columna, value: Array.isArray(valor) ? valor.join(', ') : (esVacio(valor) ? '' : valor) });
  return el('input', { class: 'campo', 'data-col': col.columna, value: esVacio(valor) ? '' : valor });
}
// Lee el valor tipado de vuelta del input/checkbox/textarea que puso campoValor(). Vacío = null (no
// cadena vacía): las 15 tablas son catálogo, no hay columna de texto donde "" y null deban distinguirse.
export function leerValor(nodo, tipo) {
  if (tipo === 'boolean') return !!nodo.checked;
  if (tipo === 'jsonb' || tipo === 'json') { const t = nodo.value.trim(); return t ? JSON.parse(t) : null; }
  if (tipo === 'ARRAY') return nodo.value.split(',').map(s => s.trim()).filter(Boolean);
  const t = nodo.value.trim(); return t === '' ? null : t;
}
// Solo las columnas que de verdad cambiaron: lic_versionar sube versión y vigente_desde en cualquier
// UPDATE, cambie algo o no, así que un Guardar sin cambios no debe llegar a llamar a la RPC.
export function leerCambios(fila, nodos, editables) {
  const cambios = {};
  for (const c of editables) {
    const v = leerValor(nodos.get(c.columna), c.tipo);
    if (!iguales(v, fila[c.columna])) cambios[c.columna] = v;
  }
  return cambios;
}

function panelHistorial(tabla, entradas) {
  if (!entradas.length) return el('p', { class: 'mudo', text: 'Sin historial todavía.' });
  return el('ul', { class: 'admin-historial' }, entradas.map(h => {
    const cuando = h.fecha || h.vigente_desde || '';
    const cambio = tabla === 'lic_criterios' ? JSON.stringify(h.fila)
      : (Object.keys(h.despues || h.antes || {}).map(k => k + ': ' + JSON.stringify(h.antes?.[k]) + ' -> ' + JSON.stringify(h.despues?.[k])).join(' · ') || '(sin campos)');
    return el('li', { class: 'admin-historial-fila' }, [
      el('p', {}, [el('b', { text: 'v' + h.version }), ' · ' + (h.cambiado_por || '?') + (h.motivo_cambio ? ' · ' + h.motivo_cambio : '') + (cuando ? ' · ' + cuando : '')]),
      el('p', { class: 'sub', text: cambio }),
    ]);
  }));
}
async function verHistorial(tabla, clave) {
  const cuerpo = el('div', {}, [el('p', { class: 'cargando', text: 'Cargando historial...' })]);
  const m = modal({ titulo: 'Historial · ' + clave, cuerpo: [cuerpo], acciones: [el('button', { class: 'btn', text: 'Cerrar', onclick: () => m.cerrar() })] });
  try {
    const entradas = await cargaHistorial(tabla, clave);
    cuerpo.innerHTML = ''; cuerpo.append(panelHistorial(tabla, Array.isArray(entradas) ? entradas : []));
  } catch (e) { cuerpo.innerHTML = ''; cuerpo.append(el('p', { class: 'aviso rojo', role: 'alert', text: 'No se pudo leer el historial: ' + (e?.message || 'error') })); }
}

// + Nueva fila (D9, "editor genérico"): único modal, con el motivo plegado en el propio formulario en
// vez de encadenar un segundo modal() (solo puede haber uno abierto a la vez, ver ui.js `modal()`).
function alta(tabla, columnas, refrescar) {
  const editables = columnas.filter(c => !c.control);
  const nodos = new Map();
  const campos = editables.map(c => {
    const n = campoValor(c, null);
    nodos.set(c.columna, n);
    return el('label', { class: 'admin-campo' }, [el('span', { class: 'sub', text: c.columna + (c.clave ? ' (clave)' : '') + (c.nulo || c.clave ? '' : ' *') }), n]);
  });
  const motivo = campoTexto({ rows: 2, placeholder: 'Motivo (opcional)' });
  const m = modal({
    titulo: 'Nueva fila · ' + tabla, cuerpo: [...campos, motivo],
    acciones: [
      el('button', { class: 'btn', text: 'Cancelar', onclick: () => m.cerrar() }),
      el('button', {
        class: 'btn primario', text: 'Crear', onclick: async () => {
          const fila = {};
          for (const c of editables) {
            const v = leerValor(nodos.get(c.columna), c.tipo);
            if (!esVacio(v)) fila[c.columna] = v;
            else if (!c.nulo && !c.clave) { toast(c.columna + ' es obligatorio'); return; }
          }
          try { await ejecutaAlta(tabla, fila, motivo.value.trim() || null); m.cerrar(); toast('fila creada'); await refrescar(); }
          catch (e) { toast('HQ rechaza: ' + (e?.message || 'error')); }
        },
      }),
    ],
  });
}

function fila(tabla, columnas, f, editables, claveCol, refrescar) {
  const nodos = new Map();
  const campos = editables.map(c => {
    const n = campoValor(c, f[c.columna]);
    nodos.set(c.columna, n);
    return el('label', { class: 'admin-campo' }, [el('span', { class: 'sub', text: c.columna }), n]);
  });
  const control = columnas.filter(c => c.control);
  const motivo = campoTexto({ rows: 2, placeholder: 'Motivo (opcional)' });
  const guardar = el('button', {
    class: 'btn primario', text: 'Guardar', onclick: async () => {
      const cambios = leerCambios(f, nodos, editables);
      if (!Object.keys(cambios).length) { toast('sin cambios'); return; }
      try { await ejecutaGuardar(tabla, f[claveCol.columna], cambios, motivo.value.trim() || null); toast('guardado'); await refrescar(); }
      catch (e) { toast('HQ rechaza: ' + (e?.message || 'error')); }
    },
  });
  const historial = el('button', { class: 'btn', text: 'Historial', onclick: () => verHistorial(tabla, f[claveCol.columna]) });
  return el('details', { class: 'admin-fila' }, [
    el('summary', {}, [el('b', { text: String(f[claveCol.columna]) })]),
    el('div', { class: 'admin-campos' }, campos),
    control.length ? el('p', { class: 'sub', text: control.map(c => c.columna + ': ' + JSON.stringify(f[c.columna])).join(' · ') }) : null,
    el('div', { class: 'fila admin-acciones' }, [motivo, guardar, historial]),
  ]);
}

async function pintarLista(raiz) {
  raiz.append(el('h1', { text: 'Admin' }));
  raiz.append(el('p', { class: 'mudo', text: 'Editor genérico de las tablas de catálogo (D9). Supabase Studio solo de respaldo.' }));
  const caja = el('div', { class: 'admin-lista' });
  raiz.append(caja);
  const pintar = datos => {
    caja.innerHTML = '';
    caja.append(el('ul', { class: 'admin-tablas' }, (datos.tablas || []).map(t =>
      el('li', {}, [el('a', { href: '#operacion/admin/' + t.tabla, class: 'btn-enlace', text: t.tabla })]))));
  };
  if (cacheTablas) pintar(cacheTablas.datos);
  else caja.append(el('p', { class: 'cargando', text: 'Cargando tablas...' }));
  if (cacheTablas && Date.now() - cacheTablas.t < CACHE_MS) return;
  try { const datos = await cargaTablas(); cacheTablas = { datos, t: Date.now() }; pintar(datos); }
  catch (e) { if (!cacheTablas) { caja.innerHTML = ''; caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: 'No se pudo leer la lista de tablas: ' + (e?.message || 'error') })); } }
}

async function pintarTabla(raiz, tabla) {
  raiz.append(el('a', { href: '#operacion/admin', class: 'btn-enlace', text: '← Admin' }));
  raiz.append(el('h1', { text: tabla }));
  const caja = el('div', { class: 'admin-tabla' });
  raiz.append(caja);
  const pintar = (columnas, filas) => {
    const claveCol = columnas.find(c => c.clave);
    const editables = columnas.filter(c => !c.clave && !c.control);
    caja.innerHTML = '';
    caja.append(el('button', { class: 'btn primario', text: '+ Nueva fila', onclick: () => alta(tabla, columnas, () => cargarYPintar(true)) }));
    caja.append(el('ul', { class: 'admin-filas' }, filas.map(f => fila(tabla, columnas, f, editables, claveCol, () => cargarYPintar(true)))));
  };
  async function cargarYPintar(forzar) {
    const cacheado = cacheTabla.get(tabla);
    if (cacheado) pintar(cacheado.columnas, cacheado.filas);
    else { caja.innerHTML = ''; caja.append(el('p', { class: 'cargando', text: 'Cargando ' + tabla + '...' })); }
    if (cacheado && !forzar && Date.now() - cacheado.t < CACHE_MS) return;
    try {
      const [columnas, filas] = await Promise.all([cargaColumnas(tabla), cargaFilas(tabla)]);
      cacheTabla.set(tabla, { columnas, filas, t: Date.now() });
      pintar(columnas, filas);
    } catch (e) {
      const msg = 'No se pudo leer ' + tabla + ': ' + (e?.message || 'error');
      if (cacheado) toast(msg);
      else { caja.innerHTML = ''; caja.append(el('p', { class: 'aviso rojo', role: 'alert', text: msg })); }
    }
  }
  await cargarYPintar(false);
}

export async function render(raiz, S, arg) {
  if (S?.datos?.rol !== 'owner') { raiz.append(el('p', { class: 'aviso rojo', role: 'alert', text: 'Solo owner.' })); return; }
  if (!arg) await pintarLista(raiz);
  else await pintarTabla(raiz, arg);
}
