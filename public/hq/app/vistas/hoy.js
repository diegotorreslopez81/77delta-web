// Hoy (#1057 tarea 29, orden de Diego 19-sep): Home deja de ser un cuadro de KPIs (eso vive en KPIs)
// y vuelve a ser una lista de lo que toca actuar hoy. Owner: la franja de alertas, la bandeja de
// decisiones justo debajo (lo primero que se lee) y dos paneles compactos de lo que se sale de madre
// si no se mira: licitaciones que cierran esta semana y sesiones abiertas.
// Los diez paneles agregados (Objetivo, Pipeline, Embudo, Expedientes, Frentes, Encargos, Cierres,
// Equipo, Consumo) se fueron a #kpis; aquí no se calcula ni se pinta ningún agregado, solo lo accionable.
// #2118 (orden de Diego 27-sep): la Home solo enseña lo que a Diego le toca decidir o hacer; el
// semáforo de seis filas y el contador de encargos vencidos/parados son salud del engranaje, no
// decisiones suyas, así que se fueron a la vista Salud (que vigilan chief y coo).
import { el, fecha } from '../ui.js';
import { enCurso, agentesActivos, frescuraPlan, diasDesde, nombreAgente, sesionesPorGrupo, DIAS_LICITACION_SIN_TOCAR } from '../estado.js';
import { tarjetaEncargo } from '../tarjeta.js';
import { panel, cifra } from '../cuadro.js';
import { urgeTercera } from './recursos.js';
import { estadoDe, estadoBase, transicionesValidas } from '../licitaciones.js';
import { ejecutarTransicion } from '../decision-lic.js';
import { recargar, render as repintar } from '../main.js';
import * as decisiones from './decisiones.js';
import { tieneFila } from '../semaforo.js';

const DIA = 864e5;
function bloque(titulo, kids, vacio) { return el('section', { class: 'seccion' }, [el('h2', { text: titulo }), ...(kids.length ? kids : [el('p', { class: 'mudo', text: vacio })])]); }
function corto(t, n = 60) { t = String(t || ''); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
// Valor numérico de un KPI del payload (`kpis[clave] = {valor, texto, updated_at}`); null si no viaja.
function kpi(clave, kpis) { const k = (kpis || {})[clave]; return k && k.valor != null ? Number(k.valor) : null; }
const dia = t => new Date(t).toISOString().slice(0, 10);

// Franja de semáforos: lo que pide atención ahora, una píldora por alerta (o "sin alertas" en verde).
// 2.0.20 (orden de Diego 19-sep): la primera píldora es siempre "N agentes activos", que sale de
// agentesActivos() en estado.js, la misma fuente que la cabecera del Tablero. Nunca coste aquí.
export function franja(d, urg, ahora = new Date()) {
  const sesiones = (d.sesiones || []).filter(x => x.estado !== 'cerrada').length;
  const correo = kpi('correo.pendientes.n', d.kpis) || 0;
  const tercera = kpi('cuentas.urge_tercera', d.kpis) === 1 || urgeTercera(d.cuentas);
  // Cada píldora lleva a su sitio (feedback de Diego, iPhone 19-sep): "urgentes tuyas" baja al bloque
  // de urgentes de la propia Home (sin cambio de hash, por eso lleva su propio onclick con
  // preventDefault + scrollIntoView); el resto navega a la ruta que de verdad filtra por esa alerta.
  const bajarAUrgentes = ev => { ev.preventDefault(); document.getElementById('urgentes')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' }); };
  // #1281: cada cifra se pinta solo si tiene fila en omc_datos (home.*); sin fila se omite, y sin alertas visibles por eso no se dice "sin alertas".
  const fila = k => tieneFila(d.claves_datos, k);
  const omitidas = [!fila('home.cuentas.saturadas') && tercera, !fila('home.correo.sin_contestar') && correo, !fila('home.sesiones.abiertas') && sesiones].some(Boolean);
  const pills = [
    urg ? ['rojo', urg + ' urgentes tuyas', '#hoy', bajarAUrgentes] : null,
    tercera && fila('home.cuentas.saturadas') ? ['rojo', 'cuentas saturadas', '#recursos/computo'] : null,
    correo && fila('home.correo.sin_contestar') ? ['ambar', correo + ' correos sin contestar', '#operacion/expedientes'] : null,
    sesiones && fila('home.sesiones.abiertas') ? ['ambar', sesiones + ' sesiones abiertas', '#operacion/expedientes?tipo=todos&sesion=abierta'] : null,
  ].filter(Boolean);
  const act = agentesActivos(d.agentes, d.encargos, ahora);
  const todas = [
    !fila('home.agentes.activos') ? null : act.n ? ['verde', act.n + (act.n === 1 ? ' agente activo' : ' agentes activos'), '#operacion/tablero?estado=en_curso']
      : ['neutro-2', 'ningún agente activo', '#operacion/tablero?estado=en_curso'],
    ...(pills.length ? pills : omitidas ? [] : [['verde', 'sin alertas', '#operacion/tablero']]),
  ].filter(Boolean);
  return el('div', { class: 'franja' }, todas.map(([c, t, h, onclick]) => el('a', { class: 'semaforo-pill ' + c, href: h, onclick }, [el('i', { class: 'punto g-' + c }), el('span', { text: t })])));
}

export function urgentes(pendientes, ahora = new Date()) {
  const limite = ahora.getTime() + 24 * 36e5;
  return (pendientes || []).filter(p => {
    const pr = Number(p.prioridad);
    return (pr >= 1 && pr <= 2) || (p.vence && new Date(p.vence).getTime() <= limite);
  }).sort((a, b) => ((Number(a.prioridad) || 9) - (Number(b.prioridad) || 9)) || String(a.vence || '9').localeCompare(String(b.vence || '9')));
}

// Licitaciones aprobadas o presentadas cuyo cierre cae en los próximos `dias` días. Se compara por día natural: la que cierra hoy
// sigue dentro (es la más urgente), aunque su cierre sea una fecha a las 00:00Z y ya haya pasado esa hora.
export function proximosCierres(licitaciones, ahora = new Date(), dias = 7) {
  const desde = dia(ahora.getTime()), hasta = dia(ahora.getTime() + dias * DIA);
  return (licitaciones || [])
    .filter(l => ['Aprobada', 'Presentada'].includes(estadoDe(l)) && l.cierre)
    .filter(l => { const c = String(l.cierre).slice(0, 10); return c >= desde && c <= hasta; })
    .sort((a, b) => String(a.cierre).localeCompare(String(b.cierre)));
}

const rojo = texto => el('span', { class: 'rojo', text: texto });

// D75 (Diego 28-sep): las licitaciones en Por presentar salen solas, sin OK previo. Aquí solo se ve
// cuáles son y se puede Rechazar (Descartada con motivo) mientras no se hayan presentado. Cierre más cercano primero.
export function porPresentar(licitaciones) {
  return (licitaciones || []).filter(l => estadoBase(l) === 'Por presentar')
    .sort((a, b) => String(a.cierre || '9').localeCompare(String(b.cierre || '9')));
}

function panelPorPresentar(licitaciones, ahora, alRechazar, pintar = null) {
  const ls = porPresentar(licitaciones);
  if (!ls.length) return null;
  const fila = l => {
    const faltan = l.cierre ? -diasDesde(String(l.cierre).slice(0, 10), ahora) : null;
    const cierre = l.cierre ? ' · cierra ' + fecha(l.cierre) + (faltan === 0 ? ' (hoy)' : faltan > 0 ? ' (en ' + faltan + ' d)' : '') : '';
    return el('li', { 'data-sale': '1' }, [
      el('span', { text: l.expediente + ' ' + corto(l.resumen_corto || l.objeto || '', 32) + cierre }),
      faltan != null && faltan < 0 ? el('span', {}, [' · ', rojo('cierre pasado')]) : null,
      transicionesValidas(l, 'owner').includes('Descartada')
        ? el('button', { class: 'btn peligro', type: 'button', text: 'Rechazar', onclick: ev => ejecutarTransicion(l, 'Descartada', alRechazar, { nodo: ev?.currentTarget?.closest?.('[data-sale]'), pintar }) })
        : null,
    ]);
  };
  return panel('Se presentan solas', '#operacion/licitaciones', [
    cifra(String(ls.length), ls.length === 1 ? 'licitación por presentar, sin esperar tu OK' : 'licitaciones por presentar, sin esperar tu OK'),
    el('ul', { class: 'lista-corta' }, ls.map(fila)),
  ]);
}

function panelProximosCierres(licitaciones, ahora) {
  const cs = proximosCierres(licitaciones, ahora);
  const fila = l => {
    const faltan = -diasDesde(String(l.cierre).slice(0, 10), ahora);
    const sin = l.toque ? diasDesde(l.toque, ahora) : null;
    return el('li', {}, [l.expediente + ' ' + corto(l.resumen_corto || l.objeto || '', 32) + ' · cierra ' + fecha(l.cierre) + (faltan === 0 ? ' (hoy)' : ' (en ' + faltan + ' d)'),
      sin != null && sin >= DIAS_LICITACION_SIN_TOCAR ? el('span', {}, [' · ', rojo('sin tocar ' + sin + ' d')]) : null]);
  };
  return panel('Próximos cierres', '#operacion/licitaciones', [
    cifra(String(cs.length), cs.length === 1 ? 'licitación cierra esta semana' : 'licitaciones cierran esta semana'),
    cs.length ? el('ul', { class: 'lista-corta' }, cs.map(fila)) : null,
  ]);
}

function panelSesiones(sesiones, agentes, ahora, conRojas = true) {
  const { abiertas, solicitadas } = sesionesPorGrupo(sesiones, ahora);
  const fila = x => el('li', { class: x.roja ? 'rojo' : '' }, [(x.nombre || 'Expediente') + ' · ' + (nombreAgente(x.agente, agentes) || 'sin agente') + (x.desde ? ' · desde ' + x.desde + ' · ' + x.dias + ' d' : ''), x.roja ? rojo(' · +48 h') : null]);
  const grupo = (titulo, xs) => xs.length ? [el('p', { class: 'grupo-tit', text: titulo + ' (' + xs.length + ')' }), el('ul', { class: 'lista-corta' }, xs.map(fila))] : [];
  const n = abiertas.length + solicitadas.length, rojas = conRojas ? [...abiertas, ...solicitadas].filter(x => x.roja).length : 0;
  return panel('Sesiones', '#operacion/expedientes', [
    cifra(String(n), n ? (rojas ? rojas + ' con más de 48 h' : 'abiertas o por atender') : 'ninguna abierta'),
    ...grupo('abiertas', abiertas), ...grupo('solicitadas sin atender', solicitadas),
  ], rojas ? 'alerta' : '');
}

// #1170: si hay actividades del plan vencidas (manuales sin tocar 7 d o con hito caducado) una línea bajo la franja que lleva al plan.
export function avisoPlan(d, ahora = new Date()) {
  if (!tieneFila(d.claves_datos, 'home.plan.vencidas')) return null;
  const fr = frescuraPlan(d.frentes, ahora);
  return fr.vencidas ? el('a', { class: 'aviso rojo aviso-plan', href: '#direccion/objetivo', text: 'Plan: ' + fr.vencidas + (fr.vencidas === 1 ? ' actividad vencida' : ' actividades vencidas') + ' (' + fr.alDia + ' de ' + fr.m + ' al día)' }) : null;
}

export function render(raiz, S, arg, filtros, ahora = new Date()) {
  const d = S.datos || {};
  if (d.rol === 'owner') {
    raiz.append(franja(d, urgentes(d.pendientes, ahora).length, ahora));
    const plan = avisoPlan(d, ahora); if (plan) raiz.append(plan);
    // Ancla de la píldora "N urgentes tuyas" (feedback de Diego, iPhone 19-sep): la bandeja de
    // decisiones (decisiones.montar, justo debajo) es lo primero que hay que mirar, así que este div
    // marca el punto exacto al que baja el scroll suave sin tocar el id 'bandeja' que ya usa
    // decisiones.js para su propio scroll desde la campana.
    raiz.append(el('div', { id: 'urgentes' }));
    decisiones.montar(raiz, S, arg);
    const fila = k => tieneFila(d.claves_datos, k);
    raiz.append(el('div', { class: 'cuadro' }, [panelPorPresentar(d.licitaciones, ahora, recargar, repintar), fila('home.licitaciones.cierran_semana') ? panelProximosCierres(d.licitaciones, ahora) : null,
      fila('home.sesiones.abiertas') ? panelSesiones(d.sesiones, d.agentes, ahora, fila('home.sesiones.mas_48h')) : null]));
  } else {
    // El token de agente no conoce su identidad en el payload (T4-c): d.encargos ya viaja recortado a
    // lo suyo, así que "ver las restantes" enlaza sin filtro extra a Operación/Tablero.
    const enc = enCurso(d.encargos), primeras = enc.slice(0, 10), resto = enc.length - primeras.length;
    raiz.append(bloque('Tus tarjetas', primeras.map(e => tarjetaEncargo(e)), 'nada en curso'));
    if (resto > 0 && tieneFila(d.claves_datos, 'home.encargos.en_curso')) raiz.append(el('p', { class: 'mudo' }, [el('a', { href: '#operacion/tablero', text: 'ver las ' + resto + ' restantes' })]));
    const ses = (d.sesiones || []).filter(x => x.estado !== 'cerrada');
    raiz.append(bloque('Sesiones abiertas', ses.map(x => el('a', { class: 'tarjeta enlace', href: '#operacion/expedientes/' + x.expediente_id }, [
      el('p', { class: 'titulo', text: x.nombre + ' con ' + x.agente }), el('p', { class: 'mudo', text: x.estado + ' · ' + fecha(x.abierta || x.created_at, { hora: true }) })])), 'ninguna'));
  }
}
