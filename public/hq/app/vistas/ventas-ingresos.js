// Pestaña Ingresos de Ventas (encargo #2693): facturas del año de omc_ingresos, solo lectura, filtros estado y mes en el hash.
// Fuente provisional (#2645) mientras la facturación no salga de FacturaScripts o de las cuotas de Twenty; los enlaces no cambian.
import { el } from '../ui.js';

let carga = async () => (await import('../api.js')).rpc('hq_ingresos_lista');
export function usarCargador(fn) { if (fn) carga = fn; }
export const cargarIngresos = async () => carga();

const ESTADOS = ['facturado', 'cobrado'];
const euros = n => Number(n).toLocaleString('es-ES', { maximumFractionDigits: 2, minimumFractionDigits: 0 }) + ' €';
const fdia = f => (f ? String(f).slice(0, 10).split('-').reverse().join('-') : '');
const filasDe = r => (Array.isArray(r) ? r : Array.isArray(r?.filas) ? r.filas : []);

// filtros: estado ('facturado' | 'cobrado') y mes ('YYYY-MM'); un valor que no encaja no filtra.
export function filtrarIngresos(filas, filtros = {}) {
  const estado = ESTADOS.includes(filtros.estado) ? filtros.estado : '';
  const mes = /^\d{4}-\d{2}$/.test(filtros.mes || '') ? filtros.mes : '';
  return filasDe(filas).filter(f => (!estado || f.estado === estado) && (!mes || String(f.fecha || '').slice(0, 7) === mes));
}

export function vistaIngresos(raiz, r, filtros = {}) {
  const todas = filasDe(r), filas = filtrarIngresos(r, filtros);
  const activo = (clave, valor) => (filtros[clave] || '') === valor;
  const chip = (texto, hash, on) => el('a', { class: 'chip' + (on ? ' activo' : ''), href: '#operacion/ventas/ingresos' + hash, 'aria-pressed': String(on), text: texto });
  raiz.append(el('p', { class: 'vt-nota', text: 'Provisional #2645: facturas de omc_ingresos del año (facturado y cobrado), mantenidas por agentes.' }));
  raiz.append(el('div', { class: 'chips' }, [chip('Todas', '', !filtros.estado && !filtros.mes), ...ESTADOS.map(e => chip(e[0].toUpperCase() + e.slice(1), '?estado=' + e, activo('estado', e)))]));
  if (filtros.mes) raiz.append(el('p', { class: 'vt-nota', text: 'Mes: ' + filtros.mes }));
  const total = filas.reduce((a, f) => a + (Number(f.importe) || 0), 0);
  raiz.append(el('p', { class: 'vt-nota', text: filas.length + ' de ' + todas.length + ' facturas · ' + euros(total) }));
  if (!filas.length) { raiz.append(el('p', { class: 'vt-nota', text: 'Sin facturas con este filtro.' })); return; }
  raiz.append(el('table', { class: 'vt-tabla' }, [el('tr', {}, ['Fecha', 'Cliente', 'Concepto', 'Importe', 'Estado'].map(h => el('th', { text: h }))),
    ...filas.map(f => el('tr', {}, [fdia(f.fecha), f.cliente || '', f.concepto || '', euros(f.importe || 0), f.estado || ''].map(x => el('td', { text: String(x) }))))]));
}
