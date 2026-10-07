// #2178: logica pura del tablero de fases y chip de bloqueo (sin DOM).
// #2178: bloqueo por tarea (lic_tareas.espera_de) y tablero de fases con chip por causa y horas paradas.
export const BLOQUEO = {
  proveedor: 'Proveedor', tecnico: 'Herramienta/robot', revision: 'Revisión', tercero: 'Tercero', diego: 'Diego', agente: 'Agente',
};
export const FASES_TABLERO = [['extraccion', 'Criba de pliego'], ['redaccion', 'Redacción'], ['revision', 'Revisión D87'], ['presentacion', 'Presentación']];
export const nombreBloqueo = e => BLOQUEO[e] || 'Agente';
export const textoHoras = h => (h == null ? '' : h >= 48 ? Math.round(h / 24) + ' d' : Math.round(h) + ' h');
export function tableroFases(filas) {
  const lista = Array.isArray(filas) ? filas : [];
  return FASES_TABLERO.map(([fase, nombre]) => {
    const f = lista.filter(x => x.fase === fase);
    return { fase, nombre, total: f.reduce((s, x) => s + Number(x.n), 0), chips: f.map(x => ({ espera_de: x.espera_de, nombre: nombreBloqueo(x.espera_de), n: Number(x.n), horas: Number(x.horas_max) })) };
  });
}
