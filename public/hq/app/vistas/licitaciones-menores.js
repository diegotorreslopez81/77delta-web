// Cabecera "Fuentes N/M" (#1001), compartida por Operación/Licitaciones. Tanda 4 (H5, LICITA-SPEC.md):
// se retira la tabla dedicada de menores de 20k (?vista=menores, ESTADOS_MENORES con 'Analizada' y las
// demas piezas de este fichero: leerVista/guardarVista, filtroServidor, filtrarLocal, tablaMenores,
// render) porque Menor pasa a ser un filtro mas (menor=1, importe_max 20000) de la vista unica de los 12
// estados en vistas/licitaciones.js. Solo queda cabeceraFuentes(), que esa vista sigue usando tal cual.
import { el } from '../ui.js';

let cargaFuentes = async () => (await import('../api.js')).rpc('omc_fuentes_resumen', { p_todas: false });
export function usarCargadores({ fuentes } = {}) { if (fuentes) cargaFuentes = fuentes; }

const CACHE_MS = 5 * 60e3;
const corto = (t, n) => { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

// Sale arriba de Licitaciones. Mientras carga no pinta nada (no estorba); si falla, una línea muda.
// <details> con las no activas: nombre, estado y motivo.
export function cabeceraFuentes(S) {
  const caja = el('div', { class: 'fuentes-cab' });
  const pintar = r => {
    caja.innerHTML = '';
    if (!r || r.total == null) return;
    const no = Array.isArray(r.no_activas) ? r.no_activas : [];
    const cuerpo = no.length
      ? el('details', { class: 'fuentes-det' }, [
        el('summary', { text: `Fuentes ${r.activas}/${r.total}` + (r.rotas ? ` · ${r.rotas} rotas` : '') + (r.pendientes ? ` · ${r.pendientes} pendientes` : '') }),
        ...no.map(x => el('p', { class: 'sub' }, [
          el('span', { class: 'pill tag-' + (x.estado === 'rota' ? 'ambar' : 'gris'), text: x.estado }), ' ', x.nombre + (x.motivo ? ' · ' + corto(x.motivo, 200) : ''),
        ])),
      ])
      : el('p', { class: 'sub', text: `Fuentes ${r.activas}/${r.total}` });
    caja.append(cuerpo);
  };
  const c = S.cacheFuentes;
  if (c && Date.now() - c.ts < CACHE_MS) { pintar(c.r); return caja; }
  Promise.resolve().then(cargaFuentes).then(r => {
    if (!r || typeof r !== 'object') return;
    S.cacheFuentes = { r, ts: Date.now() };
    pintar(r);
  }).catch(() => { /* sin cabecera: la vista sigue */ });
  return caja;
}
