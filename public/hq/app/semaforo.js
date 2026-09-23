// Semáforo de control (encargo #1281, 21-sep-2026, Pol-Operaciones con po-hq): seis filas (Correo, Licitación, Encargo,
// Tarjeta, Contacto, Dato/fuente/cron) con el nº de rojos y el enlace a la lista, arriba del Home y de Salud. Los datos salen
// de la RPC omc_semaforo (schema-v14): api.js los adjunta al payload como `semaforo`. Gris = sin medir (el objeto aún no
// tiene regla calculable): nunca verde ni "0 rojos". Nunca solo color: cada fila lleva su texto.
//
// Regla de las cifras (spec-omc-datos-1281): todo número del Home sale de una fila de omc_datos; sin fila no se pinta.
// `tieneFila(claves, clave)` la aplica. `claves` es la lista de claves activas que adjunta api.js como `claves_datos`; si no
// se pudo leer (null) no sabemos qué falta y se pinta todo, para que una red caída no borre la pantalla.
import { el } from './ui.js';
import { nombreAgente } from './estado.js';

const ETIQUETA = { correo: 'Correo', licitacion: 'Licitación', encargo: 'Encargo', tarjeta: 'Tarjeta', contacto: 'Contacto', dato: 'Dato, fuente y cron' };
const plural = (k, uno, varios) => `${k} ${k === 1 ? uno : varios}`;

export function tieneFila(claves, clave) {
  if (!Array.isArray(claves)) return true;
  return claves.includes(clave);
}

// Color y texto de una fila: sin medir = gris; con rojos = rojo; sin rojos = verde.
export function estadoFila(f) {
  if (!f || f.sin_medir) return { color: 'gris', texto: 'sin medir' };
  const r = Number(f.rojos) || 0;
  return { color: r > 0 ? 'rojo' : 'verde', texto: plural(r, 'rojo', 'rojos') };
}
// "Pol 3 · Guillem 1": los rojos por dueño, los que más primero. Vacío si no hay rojos.
export function textoDuenos(f, agentes) {
  const xs = (f?.por_dueno || []).filter(d => Number(d.rojos) > 0).sort((a, b) => Number(b.rojos) - Number(a.rojos));
  return xs.map(d => (nombreAgente(d.dueno, agentes) || d.dueno) + ' ' + d.rojos).join(' · ');
}
export function fila(f, agentes) {
  const { color, texto } = estadoFila(f), duenos = color === 'rojo' ? textoDuenos(f, agentes) : '';
  const kids = [el('b', { text: f.nombre || ETIQUETA[f.objeto] || f.objeto }), el('span', { class: 'sem-estado', text: texto }),
    duenos ? el('span', { class: 'sem-duenos', text: duenos }) : null,
    color === 'gris' && f.nota ? el('span', { class: 'sem-duenos', text: f.nota }) : null];
  return el(f.enlace ? 'a' : 'div', { class: 'sem-fila ' + color, href: f.enlace || undefined }, kids);
}
// Las seis filas en el orden que manda la RPC. Sin dato (RPC caída o sin cargar) no se pinta nada.
export function bloque(semaforo, agentes) {
  const filas = Array.isArray(semaforo?.filas) ? semaforo.filas : [];
  if (!filas.length) return null;
  return el('section', { class: 'semaforo-seis', 'aria-label': 'Semáforo de control' }, filas.map(f => fila(f, agentes)));
}
