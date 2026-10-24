// Regla 54 (Diego, 20-sep, tarjeta #864; encargo #1120): el detalle de una tarjeta de decision lleva tres bloques,
// Resumen / Datos / Que tienes que hacer. hq.py los exige al crear (scripts/hq/hq.py, partir_bloques: mismos
// marcadores y mismo orden) y aqui se pintan como tres secciones con titulo. Una tarjeta vieja, sin los tres
// marcadores, devuelve null y la vista la pinta como siempre (texto plano con enlaces).
import { el, enlazar } from './ui.js';

// Plantilla #602 (hq.py partir_bloques, mismos marcadores): Resumen / [Datos] / Pasos o "Qué tienes que hacer" / Tiempo / Vence / Si no.
// Resumen y Pasos son obligatorios; Datos, Tiempo, Vence y Si no se pintan si estan.
const MARCADORES = [['resumen', /^\s*Resumen\s*:/im], ['datos', /^\s*Datos\s*:/im], ['pasos', /^\s*(?:Pasos|Qu[eé] tienes que hacer)\s*:/im],
  ['tiempo', /^\s*Tiempo\s*:/im], ['vence', /^\s*Vence\s*:/im], ['si_no', /^\s*Si no\s*:/im]];

// -> { resumen, datos: string[], pasos: string[], tiempo, vence, si_no } o null si faltan Resumen o Pasos, o no van en orden.
export function partirBloques(detalle) {
  const texto = String(detalle || '');
  const hallados = [];
  for (const [clave, re] of MARCADORES) {
    const m = re.exec(texto);
    if (m) hallados.push({ clave, ini: m.index, fin: m.index + m[0].length });
  }
  const claves = hallados.map(h => h.clave);
  if (!claves.includes('resumen') || !claves.includes('pasos')) return null;
  for (let i = 1; i < hallados.length; i++) if (hallados[i].ini < hallados[i - 1].ini) return null;
  const cola = (clave) => {
    const i = hallados.findIndex(h => h.clave === clave);
    if (i < 0) return [];
    return texto.slice(hallados[i].fin, i + 1 < hallados.length ? hallados[i + 1].ini : texto.length).split('\n').map(l => l.trim()).filter(Boolean);
  };
  return {
    resumen: cola('resumen').join(' '),
    datos: cola('datos').map(l => l.replace(/^[-·*•]\s*/, '')),
    pasos: cola('pasos').map(l => l.replace(/^\d+[.)]\s*/, '')),
    tiempo: cola('tiempo').join(' '),
    vence: cola('vence').join(' '),
    si_no: cola('si_no').join(' '),
  };
}

// Nodo con las secciones, o null (el llamante cae al texto plano). Los enlaces salen clicables via enlazar().
export function pintarBloques(detalle) {
  const b = partirBloques(detalle);
  if (!b) return null;
  const seccion = (clase, titulo, cuerpo) => el('section', { class: 'bloque ' + clase }, [el('h4', { text: titulo }), cuerpo]);
  return el('div', { class: 'detalle bloques' }, [
    seccion('bloque-resumen', 'Resumen', el('p', {}, enlazar(b.resumen))),
    b.datos.length ? seccion('bloque-datos', 'Datos', el('ul', {}, b.datos.map(d => el('li', {}, enlazar(d))))) : null,
    seccion('bloque-pasos', 'Pasos', el('ol', {}, b.pasos.map(p => el('li', {}, enlazar(p))))),
    b.tiempo ? seccion('bloque-tiempo', 'Tiempo', el('p', {}, enlazar(b.tiempo))) : null,
    b.vence ? seccion('bloque-vence', 'Vence', el('p', {}, enlazar(b.vence))) : null,
    b.si_no ? seccion('bloque-sino', 'Si no', el('p', {}, enlazar(b.si_no))) : null,
  ]);
}
