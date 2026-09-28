// Tanda 4 (LICITA-SPEC.md 5, 6.2, 6.3): botones de transicion de una licitacion, compartidos por la card
// de Operacion/Licitaciones (app/vistas/licitaciones.js) y la ficha de decisiones.js. Unico camino de
// escritura: omc_licitacion_transicion (api.js:transicionLicitacion). Se retiran omc_licitacion_decidir
// y omc_licitacion_cribar (decision-lic.js:28 y api.js:27 en el codigo anterior a esta tanda).
import { transicionLicitacion, catalogoDescarte, claveSobre } from './api.js';
import { el, modal, toast, pedirTexto, campoTexto } from './ui.js';
import { transicionesValidas } from './licitaciones.js';
import { S } from './estado.js';
import { conSalida, transicionLocal, permanece } from './salida.js';

// H4: catalogo cerrado de motivos de descarte. Se pide en vivo a omc_motivos_no() (nunca copiado a mano)
// y se cachea en memoria de pestana; si la RPC falla, el modal deja escribir solo la nota y avisa.
let catalogoCache = null;
async function catalogo() {
  if (catalogoCache) return catalogoCache;
  catalogoCache = await catalogoDescarte().catch(() => null);
  return catalogoCache;
}

// H4: motivo de un catalogo cerrado con seleccion unica (radio); nota obligatoria solo si el motivo es 'Otro'.
// Cancelar resuelve null. Distinto de ui.js:pedirMotivos (esa es multiseleccion, para las etiquetas de C1/kpis.js).
function pedirMotivoDescarte(titulo, motivos) {
  return new Promise(res => {
    if (!motivos || !motivos.length) {
      // Catalogo no disponible (RPC caida): no se inventa una lista a mano, se deja solo la nota libre.
      pedirTexto(titulo, 'Motivo (catalogo no disponible, describe por que)', true).then(t => res(t == null ? null : { motivo: null, nota: t }));
      return;
    }
    let elegido = null;
    const errorVisible = el('p', { class: 'ayuda', role: 'alert', style: 'color:var(--error)' });
    const fallo = texto => { errorVisible.textContent = texto; };
    const elegir = (motivo, btn) => {
      for (const b of radios) b.setAttribute('aria-pressed', 'false'), b.classList.remove('activo');
      btn.setAttribute('aria-pressed', 'true'); btn.classList.add('activo');
      elegido = motivo; fallo('');
    };
    // Un motivo escrito solo como nota (sin chip) marca 'Otro' en vez de dejar el boton muerto (#2118, 1743).
    const marcarOtroSiHayNota = () => {
      if (elegido || !nota.value.trim()) return;
      const i = motivos.indexOf('Otro');
      if (i >= 0) elegir('Otro', radios[i]);
    };
    const nota = campoTexto({ rows: 2, placeholder: 'Nota', oninput: marcarOtroSiHayNota });
    const avisoOtro = el('p', { class: 'ayuda', text: "Nota obligatoria cuando el motivo es 'Otro'." });
    const guardar = el('button', { class: 'btn primario', text: 'Descartar', onclick: () => {
      marcarOtroSiHayNota();
      if (!elegido) { fallo('Elige un motivo, o escribe una nota y se marca Otro.'); return; }
      if (elegido === 'Otro' && !nota.value.trim()) { fallo("El motivo 'Otro' exige una nota."); nota.focus(); return; }
      m.cerrar(); res({ motivo: elegido, nota: nota.value.trim() });
    } });
    const radios = motivos.map(motivo => {
      const btn = el('button', { class: 'chip', type: 'button', 'aria-pressed': 'false', text: motivo, onclick: () => elegir(motivo, btn) });
      return btn;
    });
    const m = modal({ titulo, cuerpo: [el('div', { class: 'chips' }, radios), avisoOtro, nota, errorVisible],
      acciones: [el('button', { class: 'btn', text: 'Cancelar', onclick: () => { m.cerrar(); res(null); } }), guardar] });
  });
}

// P2: justificante de presentacion, pegado como enlace (Drive u otro); sin subida de fichero desde HQ.
// Se exige antes de pasar a Presentada porque la guardia de BD rechaza el cambio sin justificante_drive.
function pedirJustificante(expediente) {
  return pedirTexto('Justificante de presentacion ' + expediente, 'Enlace del justificante (Drive, correo...)', true);
}

// salida = { nodo, pintar }: la tarjeta que se desvanece al confirmarse la transicion y el repintado local
// (main.js:render). Sin salida se recarga desde la red, como antes.
export async function ejecutarTransicion(l, destino, recargar, salida = {}) {
  let motivo = null, nota = '', justificante = null;
  if (destino === 'Descartada') {
    const r = await pedirMotivoDescarte('Descartar ' + l.expediente, await catalogo());
    if (r == null) return;
    ({ motivo, nota } = r);
  } else if (destino === 'Presentada') {
    const j = await pedirJustificante(l.expediente);
    if (j == null) return;
    if (!j.trim()) { toast('Presentada exige el enlace del justificante'); return; }
    justificante = j.trim();
  } else {
    const t = await pedirTexto(destino + ' ' + l.expediente, 'Nota (opcional)', false);
    if (t == null) return;
    nota = t;
  }
  try {
    await conSalida(permanece(S, l, destino) ? null : salida.nodo, () => transicionLicitacion(l.id, destino, { motivo, nota, justificante }), {
      local: () => { transicionLocal(S, l, destino); toast(l.expediente + ': ' + destino); },
      pintar: salida.pintar, recargar });
  } catch (err) {
    // H4 (24-sep): si el catalogo fallo justo al abrir el modal, motivo llega null y HQ rechaza el
    // descarte sin guardar nada; antes esto se perdia en un toast de 4s. Ahora dura mas, ofrece
    // reintentar sin perder lo escrito y fuerza recargar el catalogo por si ya esta disponible.
    catalogoCache = null;
    toast('HQ rechaza ' + l.expediente + ': ' + err.message, 'Reintentar', () => ejecutarTransicion(l, destino, recargar, salida), 12000);
  }
}

// Un boton por destino valido (tabla 5.3 filtrada por rol, licitaciones.js:transicionesValidas). Descartar
// siempre en rojo; el resto, primario si es el avance natural (el primero de la lista), secundario si no.
// Card (Diego 23-sep): 'Cerrada sin presentar' solo tiene sentido con el cierre ya pasado.
export function botonesTransicion(l, recargar, rol, ahora = new Date(), pintar = null) {
  const cerro = l.cierre && String(l.cierre).slice(0, 10) < ahora.toISOString().slice(0, 10);
  return transicionesValidas(l, rol).filter(d => d !== 'Cerrada sin presentar' || cerro).map((destino, i) => el('button', {
    class: 'btn' + (destino === 'Descartada' ? ' peligro' : i === 0 ? ' primario' : ''),
    text: destino,
    onclick: ev => ejecutarTransicion(l, destino, recargar, { nodo: ev?.currentTarget?.closest?.('[data-sale]'), pintar }),
  }));
}

// P1: clave de sobre, solo owner. Se pide al vuelo (nunca se guarda en localStorage ni en S.datos) y se
// muestra en un toast largo; al cerrarlo desaparece de la pantalla igual que del navegador.
const CON_SOBRE = new Set(['En redacción', 'Por presentar', 'Presentada', 'Subsanación']);
export function botonClaveSobre(l, rol) {
  if (rol !== 'owner' || !CON_SOBRE.has(l.estado)) return null;
  return el('button', { class: 'btn', text: 'Clave de sobre', onclick: async () => {
    try {
      const r = await claveSobre(l.id);
      const clave = r?.clave || r?.p_clave || (typeof r === 'string' ? r : null);
      toast(clave ? 'Clave: ' + clave : 'Sin clave guardada', null, null, 15000);
    } catch (err) { toast('HQ rechaza: ' + err.message); }
  } });
}

// A5: checklist de los documentos que exige el pliego. schema-v20-licita-checklist.sql (tanda 5, ya en
// produccion en paralelo a esta tanda) anadio la columna real omc_licitaciones.checklist ([{doc, ok}]) y
// las RPC omc_licitacion_checklist_set/revisar; se prefiere ese campo cuando trae filas. ficha.documentos
// queda como fallback de solo lectura para filas antiguas que aun no tienen checklist real. Sigue sin
// escritura desde aqui: falta wirear los botones de checklist_set/revisar (tanda 5, pendiente).
export function checklistA5(l) {
  const docs = Array.isArray(l?.checklist) && l.checklist.length ? l.checklist : l?.ficha?.documentos;
  if (!Array.isArray(docs) || !docs.length) return null;
  const items = docs.map(d => {
    const nombre = typeof d === 'string' ? d : (d?.nombre || d?.doc || JSON.stringify(d));
    const ok = typeof d === 'object' && (d?.ok === true || d?.estado === 'ok' || d?.listo === true);
    return el('li', { class: ok ? 'ok' : 'pendiente' }, [el('span', { text: (ok ? '[x] ' : '[ ] ') + nombre })]);
  });
  return el('ul', { class: 'checklist-a5' }, items);
}
