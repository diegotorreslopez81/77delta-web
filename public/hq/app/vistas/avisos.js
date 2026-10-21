// Avisos (#2694): lo informativo de las últimas 24 h, leído de omc_avisos_24h. Sin push, sin badge ni banner.
// Cada aviso lleva enlace a su destino; "leído" se guarda en el servidor (omc_aviso_leido).
import { el, fecha } from '../ui.js';
import { avisos24h, avisoLeido } from '../api.js';
import { enlaceApp } from '../avisos.js';

const ACCIONES = { listar: avisos24h, marcarLeido: avisoLeido };
let acciones = ACCIONES;
export function usarAcciones(a) { acciones = a ? { ...ACCIONES, ...a } : ACCIONES; }

const TIPOS = { tarjeta: 'Tarjeta', licitacion: 'Licitación', sistema: 'Sistema' };

// Filas de omc_avisos_24h a modelo de pintura: sin leer primero, luego del más nuevo al más viejo.
export function modeloAvisos(filas) {
  const l = (Array.isArray(filas) ? filas : []).map(f => ({
    id: f.id, t: Date.parse(f.ts), tipo: TIPOS[f.tipo] || 'Aviso', texto: String(f.texto || ''),
    enlace: enlaceApp(f.url), leido: !!f.leido_en }));
  l.sort((a, b) => (a.leido - b.leido) || ((b.t || 0) - (a.t || 0)));
  return { avisos: l, sinLeer: l.filter(a => !a.leido).length };
}

let pintado = 0;   // main.js vacía la vista en cada recarga: solo la última pintura en vuelo escribe

function fila(a, marcar) {
  return el('li', { class: 'aviso' + (a.leido ? '' : ' sin-leer') }, [
    el('div', { class: 'aviso-cab' }, [
      a.leido ? null : el('span', { class: 'pill aviso-nuevo', text: 'nuevo' }),
      el('b', { class: 'aviso-titulo', text: a.tipo }),
      el('span', { class: 'sub aviso-hora', text: Number.isFinite(a.t) ? fecha(new Date(a.t).toISOString(), { hora: true }) : '' })]),
    a.texto ? el('p', { class: 'aviso-cuerpo', text: a.texto }) : null,
    el('a', { class: 'aviso-abrir', href: a.enlace, text: 'Abrir', onclick: () => { if (!a.leido) marcar(a.id); } })]);
}

export async function render(raiz, S, arg, filtros) {
  const mio = ++pintado;
  let m;
  try { m = modeloAvisos(await acciones.listar()); } catch (e) {
    if (mio !== pintado) return;
    raiz.append(el('section', { class: 'avisos' }, [el('h2', { text: 'Avisos' }), el('p', { class: 'error', text: 'No se pueden leer los avisos: ' + (e && e.message || e) })]));
    return;
  }
  if (mio !== pintado) return;
  const marcar = id => { Promise.resolve(acciones.marcarLeido(id)).catch(() => {}); };
  const recargar = () => { raiz.innerHTML = ''; return render(raiz, S, arg, filtros); };
  raiz.append(el('section', { class: 'avisos' }, [
    el('div', { class: 'avisos-cab' }, [
      el('h2', { text: 'Avisos' }),
      el('span', { class: 'sub', text: m.avisos.length ? `${m.sinLeer} sin leer de ${m.avisos.length} · últimas 24 h` : '' }),
      m.sinLeer ? el('button', { class: 'btn', type: 'button', text: 'Marcar todo leído', onclick: () => Promise.all(m.avisos.filter(a => !a.leido).map(a => acciones.marcarLeido(a.id))).then(recargar).catch(() => {}) }) : null]),
    m.avisos.length
      ? el('ul', { class: 'avisos-lista' }, m.avisos.map(a => fila(a, marcar)))
      : el('p', { class: 'sub', text: 'Sin avisos en las últimas 24 h. Lo informativo llega aquí sin avisar al móvil.' })]));
}
