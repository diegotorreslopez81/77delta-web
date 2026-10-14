// Progreso de Windmill/Twenty (Diego 14-10): la página pública /hq/windmill/ (progreso.json) dentro de HQ, en iframe.
import { el } from '../ui.js';

export function render(raiz) {
  raiz.append(el('h2', { text: 'Progreso' }),
    el('iframe', { src: '/hq/windmill/', title: 'Progreso de Windmill y Twenty', class: 'marco-progreso', loading: 'lazy' }));
}
