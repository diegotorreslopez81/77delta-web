// Productos (spec 4, 18-10): ficha por producto y línea de tiempo de etapas, todo de hq_v_productos y el historial.
// Sin nombres ni cifras en el JS: se pinta lo que devuelve hq_productos.
import { el, fecha } from '../ui.js';

let cargar = async () => (await import('../api.js')).rpc('hq_productos');
export function usarCargador(f) { cargar = f; }

const n = x => Number(x) || 0;

export function pintarFichas(datos) {
  const ps = datos?.productos || [], hist = datos?.historial || [];
  if (!ps.length) return el('p', { class: 'mudo', text: 'Sin productos todavía' });
  return el('div', { class: 'vt-cards' }, ps.map(p => {
    const h = hist.filter(x => x.producto_id === p.id);
    return el('div', { class: 'vt-card' }, [
      el('h3', { text: p.producto }),
      el('p', { class: 'mudo', text: n(p.etapa_orden) + ' de ' + n(p.etapas_total) + ' · ' + p.etapa + ' · ' + n(p.dias_en_etapa) + ' d · dueño ' + (p.dueno || '-') }),
      p.siguiente_paso ? el('p', { text: p.siguiente_paso + (p.fecha_siguiente ? ' · ' + fecha(p.fecha_siguiente) : '') }) : null,
      el('p', { class: 'mudo', text: 'Leads abiertos ' + n(p.leads_abiertos) + ' · ganados ' + n(p.ganados) + (p.waitlist_n != null ? ' · lista de espera ' + n(p.waitlist_n) : '') }),
      p.landing_url ? el('a', { class: 'btn', href: p.landing_url, target: '_blank', rel: 'noopener', text: 'Landing' }) : null,
      h.length ? el('ul', { class: 'mudo' }, h.map(x => el('li', { text: x.etapa + ' · ' + fecha(x.fecha) + (x.fuente ? ' · ' + x.fuente : '') }))) : null,
      el('span', { class: 'semaforo-pill ' + (p.semaforo || ''), text: p.semaforo || '' }),
    ]);
  }));
}

export function render(raiz) {
  const cont = el('section', { class: 'home-bloque' }, [el('h2', { text: 'Productos' }), el('p', { class: 'cargando', text: '...' })]);
  raiz.append(cont);
  cargar().then(d => { cont.replaceChildren(el('h2', { text: 'Productos' }), pintarFichas(d)); })
    .catch(e => { cont.replaceChildren(el('h2', { text: 'Productos' }), el('p', { class: 'mudo', text: 'Productos: no se pudo cargar (' + (e?.message || 'error') + ')' })); });
}
