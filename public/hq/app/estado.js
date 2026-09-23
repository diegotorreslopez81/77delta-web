// Estado en memoria y funciones puras de la interfaz. Sin DOM: se prueba con node --test.
// (ui.js solo aporta `horas`; su ámbito de módulo no toca el DOM, así que importarlo aquí es seguro.)
import { horas } from './ui.js';
// 2.0.20: fuera `columnaMovil`. La columna que se ve en el Tablero viaja en la ruta (?estado=<columna>),
// no en memoria, para que un enlace lleve siempre al mismo sitio.
export const S ={ datos: null, filtros: { frente: null, bloque: null, agente: null, texto: '', etiqueta: null } };
export const COLUMNAS = [['backlog', 'Backlog'], ['por_hacer', 'Por hacer'], ['en_curso', 'En curso'], ['bloqueado', 'Bloqueado'], ['hecho', 'Hecho']];
export function poner(datos) { S.datos = datos; S.derivado = derivar(datos); }
export function sinAcentos(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
// T4-c (ruling del controlador, 2026-09-16): omc_hq_v2 no expone 'yo' en la raíz. Con null la base
// resuelve la identidad del token (coalesce a 'agente' genérico); solo owner tiene un nombre fijo ('diego').
export const yo = S => S.datos?.rol === 'owner' ? 'diego' : null;

// #1170 (spec-frescura-home-1170): una actividad del plan está AL DÍA si es sql, o si es manual, se tocó hace menos de 7 días
// y su hito no ha vencido; si no, está VENCIDA. Sin updated_at ni fuente en el payload (RPC anterior a schema-v11) no se
// puede saber: null, nunca rojo por defecto. El hito caducado manda sobre "sin tocar" en el texto porque es el dato accionable.
export const DIAS_SIN_TOCAR = 7;
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const diaMesCorto = iso => { const d = new Date(iso); return String(d.getUTCDate()).padStart(2, '0') + '-' + MESES[d.getUTCMonth()]; };
export function frescuraFrente(f, ahora = new Date()) {
  if (!f || (!f.fuente && !f.updated_at)) return null;
  if (f.fuente === 'sql') return { vencida: false, texto: 'sql' };
  const quien = f.actualizado_por || 'sin dato';
  const base = 'manual · ' + (f.updated_at ? diaMesCorto(f.updated_at) : 'sin fecha') + ' · ' + quien;
  const hoy = Date.parse(ahora.toISOString().slice(0, 10) + 'T00:00:00Z');
  const caducado = f.fecha_hito ? Math.round((hoy - Date.parse(String(f.fecha_hito).slice(0, 10) + 'T00:00:00Z')) / 864e5) : 0;
  const sinTocar = f.updated_at ? Math.floor((ahora - new Date(f.updated_at)) / 864e5) : null;
  if (caducado > 0) return { vencida: true, texto: base + ' · hito caducado hace ' + caducado + ' d' };
  if (sinTocar == null || sinTocar >= DIAS_SIN_TOCAR) return { vencida: true, texto: base + (sinTocar == null ? ' · sin tocar' : ' · sin tocar ' + sinTocar + ' d') };
  return { vencida: false, texto: base };
}
// Recuento para las cabeceras: `m` cuenta solo las actividades de las que hay dato (todas, en cuanto schema-v11 esté aplicado).
export function frescuraPlan(frentes, ahora = new Date()) {
  let m = 0, alDia = 0;
  for (const f of frentes || []) { const r = frescuraFrente(f, ahora); if (r) { m++; if (!r.vencida) alDia++; } }
  return { m, alDia, vencidas: m - alDia };
}

// #1170 (cards de abajo del Home): antigüedades en días y agente normalizado. `iso` puede ser fecha (YYYY-MM-DD, se cuenta por
// día natural) o instante; null si no hay dato o no se entiende, nunca 0 inventado.
export function diasDesde(iso, ahora = new Date()) {
  if (!iso) return null;
  const t = String(iso);
  if (t.length === 10) { const d = Date.parse(t + 'T00:00:00Z'); return Number.isNaN(d) ? null : Math.round((Date.parse(ahora.toISOString().slice(0, 10) + 'T00:00:00Z') - d) / 864e5); }
  const d = Date.parse(t);
  return Number.isNaN(d) ? null : Math.floor((ahora - d) / 864e5);
}
// Nombre de un agente tal como lo tiene omc_agentes (id, nombre o primer segmento del nombre); un valor que no resuelve
// (compuesto, persona sin puesto) se deja como viene: mejor el dato crudo que uno inventado.
export function nombreAgente(valor, agentes) {
  const v = sinAcentos(valor).trim();
  if (!v) return '';
  const a = (agentes || []).find(x => x && (sinAcentos(x.id) === v || sinAcentos(x.nombre) === v || sinAcentos(x.nombre).split(/[\s-]/)[0] === v));
  return a ? (a.nombre || a.id) : String(valor).trim();
}
export const HORAS_SESION_ROJO = 48;
export const DIAS_LICITACION_SIN_TOCAR = 3;
// Sesiones no cerradas en sus dos grupos, la más antigua primero. Antigüedad desde `abierta` (o `created_at` si aún es solicitud);
// roja pasadas 48 h. Nunca se cierra nada aquí: es lectura.
export function sesionesPorGrupo(sesiones, ahora = new Date()) {
  const fila = x => {
    const desde = x.abierta || x.created_at, ms = desde ? ahora - new Date(desde) : NaN;
    const ok = !Number.isNaN(ms);
    return { ...x, desde: ok ? diaMesCorto(desde) : null, dias: ok ? Math.max(0, Math.floor(ms / 864e5)) : null, roja: ok && ms > HORAS_SESION_ROJO * 36e5, _t: ok ? new Date(desde).getTime() : Infinity };
  };
  const vivas = (sesiones || []).filter(x => x && x.estado !== 'cerrada').map(fila).sort((a, b) => a._t - b._t);
  return { abiertas: vivas.filter(x => x.estado !== 'solicitada'), solicitadas: vivas.filter(x => x.estado === 'solicitada') };
}

export function derivar(datos) {
  const porBloque = {};
  for (const f of datos.frentes || []) (porBloque[f.bloque_letra] ||= []).push(f);
  const rojosPorBloque = {};
  for (const e of datos.encargos || []) if (e.rojo) rojosPorBloque[e.bloque_letra] = (rojosPorBloque[e.bloque_letra] || 0) + 1;
  const bloques = (datos.bloques || []).map(b => ({ ...b, frentes: (porBloque[b.letra] || []).sort((x, y) => x.codigo.localeCompare(y.codigo)), abiertos: b.encargos_abiertos, rojos: rojosPorBloque[b.letra] || 0 }));
  return { objetivos: datos.objetivos || [], bloques };
}

export function filtrar(encargos, f = {}) {
  const t = sinAcentos(f.texto || '');
  return (encargos || []).filter(e =>
    (!f.frente || e.codigo === f.frente) && (!f.bloque || e.bloque_letra === f.bloque) &&
    // NIT #5 (parado en la revision, aplicado aqui por ser trivial): .includes() sobre e.agente dejaba
    // que un id de agente que fuera substring de otro (p. ej. 'ana' dentro de 'ariadna') colase en el
    // filtro; se compara con igualdad exacta, igual que ya se hacia con e.responsable.
    (!f.agente || sinAcentos(e.agente) === sinAcentos(f.agente) || sinAcentos(e.responsable) === sinAcentos(f.agente)) &&
    (!f.etiqueta || (e.etiquetas || []).includes(f.etiqueta)) &&
    (!t || sinAcentos([e.texto, e.interpretacion, e.origen, e.id].join(' ')).includes(t)));
}

const ordenKanban = (a, b) => (a.orden_kanban ?? 1e9) - (b.orden_kanban ?? 1e9) || String(a.fecha_hito || '9999').localeCompare(String(b.fecha_hito || '9999')) || a.id - b.id;
export function kanban(encargos, filtros = {}) {
  const k = Object.fromEntries(COLUMNAS.map(c => [c[0], []]));
  for (const e of filtrar(encargos, filtros)) (k[e.columna] || k.backlog).push(e);
  for (const c of Object.values(k)) c.sort(ordenKanban);
  return k;
}

export function semana(encargos, ahora = new Date()) {
  const desde = new Date(ahora.getTime() - 7 * 864e5);
  const pedidos = (encargos || []).filter(e => sinAcentos(e.origen).startsWith('diego') && new Date(e.fecha) >= desde);
  return { hechos: pedidos.filter(e => e.estado === 'hecho'), parados: pedidos.filter(e => e.rojo), en_curso: pedidos.filter(e => e.estado !== 'hecho' && e.estado !== 'descartado' && !e.rojo) };
}

// Plan 3a (tanda 1): funciones puras del shell y de Dirección/Objetivo.
// prorrateo: parte de la meta anual que tocaría a la fecha, por día natural (Europe/Madrid no importa:
// se usa la fecha UTC del instante, la diferencia de un día en el cambio de año es irrelevante aquí).
export function prorrateo(meta, horizonte, ahora = new Date()) {
  const m = Number(meta) || 0, y = ahora.getUTCFullYear();
  if (horizonte > y) return 0;
  if (horizonte < y) return m;
  const inicio = Date.UTC(y, 0, 1), fin = Date.UTC(y + 1, 0, 1);
  const dias = Math.round((fin - inicio) / 864e5), dia = Math.floor((ahora.getTime() - inicio) / 864e5) + 1;
  return dia >= dias ? m : m * dia / dias;
}
export function enCurso(encargos) { return (encargos || []).filter(e => e.estado === 'en_curso'); }
// Hoy como cuadro de mando (plan 3a, orden de Diego 17-sep): encargos con hito en los próximos `dias`
// días, nunca hecho/descartado, ordenados por fecha_hito ascendente. Pura, sin DOM.
export function cierres(encargos, ahora = new Date(), dias = 7) {
  const desde = ahora.getTime(), hasta = desde + dias * 864e5;
  return (encargos || [])
    .filter(e => e.fecha_hito && e.estado !== 'hecho' && e.estado !== 'descartado')
    .filter(e => { const t = new Date(e.fecha_hito).getTime(); return t >= desde && t <= hasta; })
    .sort((a, b) => new Date(a.fecha_hito) - new Date(b.fecha_hito));
}
// contador de la barra superior. El token de agente no sabe quién es (omc_hq_v2 no expone la identidad,
// ver T4-c), así que cuenta lo que hay en curso en vez de "sus" tarjetas.
export function contador(datos) {
  if (datos?.rol === 'owner') return { texto: 'Depende de ti', n: (datos.pendientes || []).length, href: '#hoy' };
  return { texto: 'En curso', n: enCurso(datos?.encargos).length, href: '#operacion/tablero' };
}
// Latido compartido (2.0.20): el punto verde del organigrama, el "activo ahora" de decidirSesion en
// expedientes y el recuento de agentes activos de Home salían de dos sitios distintos. Ahora hay una
// sola función y `vistas/equipo.js` la reexporta como `tramo` para no cambiar sus llamadas. Cuatro
// tramos: activo (menos de 1 h), hoy (menos de 24 h), dormido (más de 24 h), sin latido.
export function tramoLatido(a, ahora = new Date()) {
  const h = horas(a?.ultima_actividad, ahora);
  return h == null ? 'sin' : h < 1 ? 'activo' : h < 24 ? 'hoy' : 'dormido';
}
// "Qué se está haciendo ahora mismo" (orden de Diego 19-sep): única fuente de la verdad para la pill de
// Home y para la cabecera del Tablero con estado=en_curso. Activo = el agente no está dado de baja y su
// latido es reciente. `encargo` es el encargo en curso más reciente que tiene asignado, si lo hay.
export function agentesActivos(agentes, encargos, ahora = new Date()) {
  const curso = enCurso(encargos);
  const suyo = id => curso.filter(e => e.agente === id || (!e.agente && e.responsable === id))
    .sort((a, b) => String(b.fecha_estado || b.fecha || '').localeCompare(String(a.fecha_estado || a.fecha || '')) || (b.id - a.id))[0] || null;
  const activos = (agentes || []).filter(a => a && a.activo !== false && tramoLatido(a, ahora) === 'activo');
  return { n: activos.length, agentes: activos.map(a => { const e = suyo(a.id); return { id: a.id, nombre: a.nombre || a.id, encargo: e ? { id: e.id, titulo: e.texto || '' } : null }; }) };
}
// semáforo de cuentas: `cuentas` viene en el payload desde el lote 1e (#1054, RPC omc_cuentas_estado, solo owner);
// sin datos devuelve null y la barra no pinta nada. Una cuenta se bloquea por cualquiera de sus dos límites, así
// que cuenta el mayor de % ventana (5 h) y % semana. Umbrales de la spec 2.1: verde < 80, ámbar 80-94, rojo >= 95.
export function semaforoCuentas(datos) {
  const cs = (datos?.cuentas || []).filter(c => c && (c.pct_ventana != null || c.pct_semana != null))
    .map(c => {
      const ventana = Number(c.pct_ventana) || 0, semana = Number(c.pct_semana) || 0;
      // tramo: cuál de los dos manda (2.0.22, revisión del chief): el texto del semáforo decía siempre
      // "de la ventana" aunque lo saturado fuera la cuota semanal, que es el caso habitual de team@.
      return { cuenta: c.cuenta, pct: Math.max(ventana, semana), tramo: semana > ventana ? 'semana' : 'ventana' };
    });
  if (!cs.length) return null;
  const peor = cs.reduce((a, b) => (b.pct > a.pct ? b : a));
  return { color: peor.pct >= 95 ? 'rojo' : peor.pct >= 80 ? 'ambar' : 'verde', pct: peor.pct, cuenta: peor.cuenta, tramo: peor.tramo };
}
