// Buscador global (plan 3a): busca sobre el payload ya cargado, nunca llama a la BD. Sin DOM.
// Un número encuentra por id exacto en todas las fuentes (licitación: id de omc_licitaciones); un texto busca sin acentos en id y título (licitación: expediente, objeto y órgano).
// Minor 10 (revision final): comentario corregido, licitaciones ya entraron (fuente de mas abajo).
import { sinAcentos } from './estado.js';

const FUENTES = [
  // Petición y encargo comparten numeración: la petición pendiente a Diego va primero (Enter abre #hoy/<id>).
  ['petición', d => d.pendientes, p => p.id, p => p.titulo, p => '#hoy/' + p.id],
  ['encargo', d => d.encargos, e => e.id, e => e.texto, e => '#operacion/tablero/' + e.id],
  ['expediente', d => d.expedientes, x => x.id, x => x.nombre, x => '#operacion/expedientes/' + x.id],
  ['agente', d => d.agentes, a => a.id, a => a.nombre, a => '#equipo/agente/' + a.id],
  ['frente', d => d.frentes, f => f.codigo, f => f.linea, f => '#operacion/tablero?frente=' + f.codigo],
  // I3 (revision final): la ficha completa de una licitacion vive en Operacion/Licitaciones, no en
  // Reglas/Decisiones (que solo lista las decidibles); un resultado de busqueda debe llevar ahi.
  ['licitación', d => d.licitaciones, l => l.id ?? l.expediente, l => [l.expediente, l.resumen_corto || l.objeto, l.organo].filter(Boolean).join(' · '), l => '#operacion/licitaciones' + (l.id != null ? '/' + l.id : '')],
];

export function buscar(datos, consulta, max = 12) {
  let q = sinAcentos(consulta).trim().replace(/^#/, '');
  // #2210: 'L-793' (o 'L793') busca solo licitaciones por id; el número a secas sigue buscando en todas las fuentes.
  const soloLic = /^l-?\d+$/i.test(q);
  if (soloLic) q = q.replace(/^l-?/i, '');
  if (!q) return [];
  const num = /^\d+$/.test(q) ? Number(q) : null;
  // Important 2 de la revisión final: reparto por fuente con un cupo propio para que un tipo con muchas
  // coincidencias (frecuente en encargos, la lista más larga) no agote el tope y deje fuera a los demás
  // (decisiones, expedientes, agentes...). Cada fuente aporta hasta `cupo`; lo que sobre de hueco se
  // rellena después con el resto de cada fuente, respetando el orden de FUENTES.
  const porTipo = [];
  for (const [tipo, lista, id, titulo, href] of FUENTES) {
    if (soloLic && tipo !== 'licitación') { porTipo.push([]); continue; }
    const hits = (lista(datos || {}) || [])
      .filter(x => num != null ? Number(id(x)) === num : sinAcentos([id(x), titulo(x)].join(' ')).includes(q))
      .map(x => ({ tipo, id: id(x), titulo: String(titulo(x) || ''), href: href(x) }));
    porTipo.push(hits);
  }
  if (soloLic && num != null && !porTipo.some(h => h.length)) porTipo.push([{ tipo: 'licitación', id: num, titulo: 'Abrir la licitación L-' + num, href: '#operacion/licitaciones/' + num }]);
  const cupo = Math.max(2, Math.floor(max / FUENTES.length));
  return [...porTipo.flatMap(h => h.slice(0, cupo)), ...porTipo.flatMap(h => h.slice(cupo))].slice(0, max);
}
