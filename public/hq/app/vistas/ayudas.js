// Ayudas pedidas (#2585, D4): lee hq_ayudas (v182). El total y el recuento vienen hechos de la RPC; aquí solo se pinta.
import { el } from '../ui.js';

let carga = async () => (await import('../api.js')).rpc('hq_ayudas');
export function usarCargador(fn) { if (fn) carga = fn; }
export const cargarAyudas = () => carga();

const euros = x => Math.round(Number(x) || 0).toLocaleString('es-ES', { useGrouping: 'always' }) + ' €';
const fdia = iso => iso ? iso.slice(8, 10) + '-' + iso.slice(5, 7) + '-' + iso.slice(0, 4) : '';
const soloHttps = u => /^https:\/\//i.test(String(u || ''));

export const textoAyudas = r => 'Ayudas pedidas: ' + (Number(r && r.pedidas_n) || 0) + ' · ' + euros(r && r.pedidas_importe);

// Fila de la home, bajo el Pipeline: abre la lista.
export const filaAyudas = r => el('a', { class: 'vt-card hoy-neg ayudas-fila', href: '#operacion/ventas?bloque=ayudas' }, [el('span', { class: 'neg-detalle', text: textoAyudas(r) })]);

export function vistaAyudas(raiz, r) {
  const filas = (r && r.ayudas) || [];
  raiz.append(el('h2', { text: textoAyudas(r) }));
  if (!filas.length) { raiz.append(el('p', { class: 'vt-nota', text: 'Ninguna ayuda registrada todavía.' })); return; }
  raiz.append(el('table', { class: 'vt-tabla' }, [
    el('tr', {}, ['Organismo', 'Convocatoria', 'Importe', 'Estado', 'Fecha'].map(h => el('th', { text: h }))),
    ...filas.map(a => el('tr', {}, [
      el('td', {}, [soloHttps(a.url) ? el('a', { href: a.url, target: '_blank', rel: 'noopener', text: a.organismo }) : String(a.organismo || '')]),
      el('td', { text: String(a.convocatoria || '') }), el('td', { text: euros(a.importe_pedido) }),
      el('td', { text: String(a.estado || '') }), el('td', { text: fdia(a.fecha_presentacion) })])),
  ]));
}
