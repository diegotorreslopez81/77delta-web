// Avisos (#2159): lo que ha llegado por notificación push al móvil o al navegador, del más nuevo al más viejo.
// Sirve para releer un aviso que se cerró o se perdió. Sin datos o sin IndexedDB se dice claro, no se deja vacío.
import { el, fecha } from '../ui.js';
import { listar, marcarLeido, marcarTodosLeidos, vaciar, sinLeer, enlaceApp } from '../avisos.js';

const ACCIONES = { listar, marcarLeido, marcarTodosLeidos, vaciar };
let acciones = ACCIONES;
export function usarAcciones(a) { acciones = a ? { ...ACCIONES, ...a } : ACCIONES; }

let pintado = 0;   // main.js vacía la vista en cada recarga: solo la última pintura en vuelo escribe

function fila(a) {
  const t = new Date(a.t);
  return el('li', { class: 'aviso' + (a.leido ? '' : ' sin-leer') }, [
    el('div', { class: 'aviso-cab' }, [
      a.leido ? null : el('span', { class: 'pill aviso-nuevo', text: 'nuevo' }),
      el('b', { class: 'aviso-titulo', text: a.title || 'HQ' }),
      el('span', { class: 'sub aviso-hora', text: Number.isFinite(t.getTime()) ? fecha(t.toISOString(), { hora: true }) : '' })]),
    a.body ? el('p', { class: 'aviso-cuerpo', text: a.body }) : null,
    el('a', { class: 'aviso-abrir', href: enlaceApp(a.url), text: 'Abrir', onclick: () => { acciones.marcarLeido(a.n).catch(() => {}); } })]);
}

export async function render(raiz, S, arg, filtros, ahora = new Date()) {
  const mio = ++pintado;
  let avisos;
  try { avisos = await acciones.listar(); } catch (e) {
    if (mio !== pintado) return;
    raiz.append(el('section', { class: 'avisos' }, [el('h2', { text: 'Avisos' }), el('p', { class: 'error', text: 'No se pueden leer los avisos guardados en este navegador: ' + (e && e.message || e) })]));
    return;
  }
  if (mio !== pintado) return;
  const nuevos = sinLeer(avisos);
  const recargar = () => { raiz.innerHTML = ''; return render(raiz, S, arg, filtros, ahora); };
  const cab = el('div', { class: 'avisos-cab' }, [
    el('h2', { text: 'Avisos' }),
    el('span', { class: 'sub', text: avisos.length ? `${nuevos} sin leer de ${avisos.length}` : '' }),
    nuevos ? el('button', { class: 'btn', type: 'button', text: 'Marcar todo leído', onclick: () => acciones.marcarTodosLeidos().then(recargar).catch(() => {}) }) : null,
    avisos.length ? el('button', { class: 'btn peligro', type: 'button', text: 'Vaciar', onclick: () => acciones.vaciar().then(recargar).catch(() => {}) }) : null]);
  raiz.append(el('section', { class: 'avisos' }, [
    cab,
    avisos.length
      ? el('ul', { class: 'avisos-lista' }, avisos.map(fila))
      : el('p', { class: 'sub', text: 'Sin avisos todavía. Cada notificación que llegue a este navegador se guarda aquí.' })]));
}
