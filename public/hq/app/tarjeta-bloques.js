// Regla 54 (Diego, 20-sep, tarjeta #864; encargo #1120): el detalle de una tarjeta de decision lleva tres bloques,
// Resumen / Datos / Que tienes que hacer. hq.py los exige al crear (scripts/hq/hq.py, partir_bloques: mismos
// marcadores y mismo orden) y aqui se pintan como tres secciones con titulo. Una tarjeta vieja, sin los tres
// marcadores, devuelve null y la vista la pinta como siempre (texto plano con enlaces).
import { el, enlazar } from './ui.js';

const MARCADORES = [['resumen', /^\s*Resumen\s*:/im], ['datos', /^\s*Datos\s*:/im], ['pasos', /^\s*Qu[eé] tienes que hacer\s*:/im]];

// -> { resumen: string, datos: string[], pasos: string[] } o null si faltan marcadores o no van en orden.
export function partirBloques(detalle) {
  const texto = String(detalle || '');
  const pos = [];
  for (const [, re] of MARCADORES) {
    const m = re.exec(texto);
    if (!m) return null;
    pos.push([m.index, m.index + m[0].length]);
  }
  if (pos[0][0] > pos[1][0] || pos[1][0] > pos[2][0]) return null;
  const cola = (i) => texto.slice(pos[i][1], i < 2 ? pos[i + 1][0] : texto.length).split('\n').map(l => l.trim()).filter(Boolean);
  return {
    resumen: cola(0).join(' '),
    datos: cola(1).map(l => l.replace(/^[-·*•]\s*/, '')),
    pasos: cola(2).map(l => l.replace(/^\d+[.)]\s*/, '')),
  };
}

// Nodo con las tres secciones, o null (el llamante cae al texto plano). Los enlaces salen clicables via enlazar().
export function pintarBloques(detalle) {
  const b = partirBloques(detalle);
  if (!b) return null;
  const seccion = (clase, titulo, cuerpo) => el('section', { class: 'bloque ' + clase }, [el('h4', { text: titulo }), cuerpo]);
  return el('div', { class: 'detalle bloques' }, [
    seccion('bloque-resumen', 'Resumen', el('p', {}, enlazar(b.resumen))),
    seccion('bloque-datos', 'Datos', el('ul', {}, b.datos.map(d => el('li', {}, enlazar(d))))),
    seccion('bloque-pasos', 'Qué tienes que hacer', el('ol', {}, b.pasos.map(p => el('li', {}, enlazar(p))))),
  ]);
}
