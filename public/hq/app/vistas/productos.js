// Productos (menú de seis, 18-10): hasta que exista hq_v_productos (spec 4) la entrada abre un resumen honesto
// con enlaces a lo que ya existe. Sin nombres de producto ni cifras: cuando haya vista, se pintan sus columnas.
import { el } from '../ui.js';

export function render(raiz) {
  raiz.append(el('section', { class: 'home-bloque' }, [
    el('h2', { text: 'Productos' }),
    el('p', { class: 'mudo', text: 'Productos: pendiente de datos (vista en preparación).' }),
    el('div', { class: 'home-botones' }, [
      el('a', { class: 'btn', href: '#operacion/ventas', text: 'Ventas' }),
      el('a', { class: 'btn', href: '#web', text: 'Web' }),
    ]),
  ]));
}
