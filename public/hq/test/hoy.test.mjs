import test from 'node:test';
import assert from 'node:assert/strict';

// Hoy (#1057 tarea 29): render() ahora monta decisiones.montar() (que a su vez importa main.js), asi
// que la cadena de imports es la misma que decisiones.test.mjs/tablero.test.mjs: shim completo con
// classList, getAttribute y prepend (cablearShell() los usa al importar main.js).
function crearNodo(tag) {
  const n = {
    tag, nodeType: 1, children: [], attrs: {}, className: '', _text: '', _html: '', listeners: {}, parent: null,
    classList: { toggle(c, on) { const s = new Set(this._n.className.split(' ').filter(Boolean)); on ? s.add(c) : s.delete(c); this._n.className = [...s].join(' '); return on; }, contains(c) { return this._n.className.split(' ').includes(c); }, add(c) { this.toggle(c, true); }, remove(c) { this.toggle(c, false); } },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return this.attrs[k] ?? null; },
    addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); },
    append(...kids) { for (const k of kids) { if (k == null) continue; k.parent = this; this.children.push(k); } },
    prepend(...kids) { for (const k of kids.reverse()) { if (k == null) continue; k.parent = this; this.children.unshift(k); } },
    remove() { if (this.parent) { const i = this.parent.children.indexOf(this); if (i >= 0) this.parent.children.splice(i, 1); this.parent = null; } },
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; this.children = []; },
    querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; },
  };
  n.classList._n = n;
  return n;
}
globalThis.document = {
  createElement: (tag) => crearNodo(tag),
  createTextNode: (data) => ({ nodeType: 3, data }),
  getElementById: () => crearNodo('div'),
  body: crearNodo('body'),
  addEventListener: () => {},
};
globalThis.location = { hash: '', search: '', pathname: '/hq/' };
globalThis.history = { replaceState: () => {} };
globalThis.window = { addEventListener: () => {} };
globalThis.HQ_VERSION = { v: 'test' };
if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
}

const { render, urgentes, vencidosYParados, proximosCierres, avisoPlan } = await import('../app/vistas/hoy.js');
const { enCurso } = await import('../app/estado.js');

const ahora = new Date('2026-09-17T07:00:00Z');
const secciones = raiz => raiz.children.filter(c => c.tag === 'section');
const titulos = raiz => secciones(raiz).map(s => s.children[0].textContent);
const buscarNodos = (n, pred, out = []) => { if (n.nodeType === 1) { if (pred(n)) out.push(n); n.children.forEach(c => buscarNodos(c, pred, out)); } return out; };
const hrefs = raiz => buscarNodos(raiz, n => n.tag === 'a').map(a => a.attrs.href);
const paneles = raiz => buscarNodos(raiz, n => n.tag === 'section' && /panel-kpi/.test(n.className));
const panel = (raiz, titulo) => paneles(raiz).find(p => p.children[0].textContent.startsWith(titulo));

// Fixture con la forma real del payload owner (mismo patrón que el 2.0.10 anterior).
const datosOwner = {
  rol: 'owner',
  pendientes: [
    { id: 635, titulo: 'Responder a Guillem', agente: 'sales-licita', prioridad: 1, vence: '2026-09-17T18:00:00Z' }, // vence hoy y prioridad 1: urgente
    { id: 640, titulo: 'Otra', agente: 'coo', prioridad: 4, vence: '2026-09-20T10:00:00Z' }, // ni urge ni vence hoy
  ],
  encargos: [
    { id: 1, columna: 'en_curso', estado: 'en_curso', texto: 'Cierre A', fecha_hito: '2026-09-10', agente: 'Ariadna', rojo: false }, // vencido (hito pasado)
    { id: 2, columna: 'en_curso', estado: 'en_curso', texto: 'Cierre B '.repeat(10), fecha_hito: '2026-09-19', agente: 'Guillem', rojo: true }, // parado
    { id: 3, columna: 'hecho', estado: 'hecho', texto: 'Cierre C', fecha_hito: '2026-09-01', agente: 'Ona', rojo: false }, // hecho: no cuenta aunque tenga hito pasado
  ],
  licitaciones: [
    { expediente: 'L1', estado: 'Presentada', cierre: '2026-09-20', resumen_corto: 'Resumen L1' }, // dentro de 7 días
    { expediente: 'L2', estado: 'Aprobada', cierre: '2026-09-30', objeto: 'Objeto L2' }, // fuera de 7 días
    { expediente: 'L3', estado: 'Nueva', cierre: '2026-09-18', resumen_corto: 'No cuenta' }, // estado no elegible
  ],
  agentes: [{ id: 'ariadna', nombre: 'Ariadna', activo: true }],
  kpis: {
    'correo.pendientes.n': { valor: 2, texto: '', updated_at: '2026-09-17T06:50:00Z' },
    'cuentas.urge_tercera': { valor: 1, texto: 'diego@ 93 % · team@ 97 %', updated_at: '2026-09-17T06:45:00Z' },
  },
  cuentas: [{ clave: 'principal', cuenta: 'diego@', pct_ventana: 12, pct_semana: 93, saturada: true }],
  sesiones: [{ id: 1, expediente_id: 9, nombre: 'Cíclica', agente: 'cupones', estado: 'abierta', abierta: ahora.toISOString() }],
};
const pintar = (datos = datosOwner) => { const raiz = crearNodo('main'); render(raiz, { datos, filtros: {} }, undefined, {}, ahora); return raiz; };

test('urgentes: prioridad 1-2 o vencimiento en menos de 24 h, ordenadas por prioridad y vencimiento', () => {
  const ps = [
    { id: 1, prioridad: 4, vence: '2026-09-25T10:00:00Z' }, // no
    { id: 2, prioridad: 2, vence: null }, // prioridad
    { id: 3, prioridad: 5, vence: '2026-09-17T20:00:00Z' }, // vence en 13 h
    { id: 4, prioridad: 5, vence: '2026-09-10T20:00:00Z' }, // ya vencida
    { id: 5, prioridad: 1, vence: '2026-09-30T20:00:00Z' }, // prioridad 1, primera
    { id: 6, prioridad: null, vence: null }, // no
  ];
  assert.deepEqual(urgentes(ps, ahora).map(p => p.id), [5, 2, 4, 3]);
  assert.deepEqual(urgentes(undefined, ahora), []);
});

test('vencidosYParados: hito pasado sin cerrar o rojo, hecho fuera, parados primero y luego lo más vencido, tope 8', () => {
  const es = vencidosYParados(datosOwner.encargos, ahora);
  assert.deepEqual(es.map(e => e.id), [2, 1]); // #2 parado primero, luego #1 vencido; #3 esta hecho y no cuenta
  assert.deepEqual(vencidosYParados(undefined, ahora), []);
  const muchos = Array.from({ length: 12 }, (_, i) => ({ id: i, columna: 'en_curso', rojo: true }));
  assert.equal(vencidosYParados(muchos, ahora).length, 8);
});

test('proximosCierres: aprobadas o presentadas que cierran en los próximos 7 días, ordenadas por fecha', () => {
  const cs = proximosCierres(datosOwner.licitaciones, ahora);
  assert.deepEqual(cs.map(l => l.expediente), ['L1']); // L2 cierra fuera de la ventana, L3 no es Aprobada/Presentada
  assert.deepEqual(proximosCierres(undefined, ahora), []);
});

test('owner: franja primero, luego el ancla de urgentes, la bandeja de decisiones y por último los tres paneles accionables', () => {
  const raiz = pintar();
  assert.equal(raiz.children[0].className, 'franja');
  // Brief B (19-sep): ancla para el scroll de la píldora "N urgentes tuyas", justo antes de la bandeja
  // (lo primero que se lee), sin tocar el id 'bandeja' que decisiones.js ya usa para su propio scroll.
  assert.equal(raiz.children[1].attrs.id, 'urgentes');
  assert.equal(raiz.children[2].className, 'seccion bandeja');
  assert.deepEqual(paneles(raiz).map(p => p.children[0].textContent), ['Vencidos y parados · 2 de 2', 'Próximos cierres', 'Sesiones']);
  assert.deepEqual(paneles(raiz).map(p => p.children[0].children[0].attrs.href), ['#operacion/tablero', '#operacion/licitaciones', '#operacion/expedientes']);
  // nada de los diez paneles agregados del cuadro anterior (Objetivo, Pipeline, Embudo, Equipo...): eso vive en KPIs
  for (const t of ['Objetivo', 'Pipeline', 'Embudo', 'Frentes', 'Consumo']) assert.ok(!raiz.textContent.includes(t), t);
});

test('owner: la franja enciende urgentes, parados, cuentas y correo; sin nada, "sin alertas" en verde', () => {
  const t = pintar().children[0].textContent;
  for (const x of ['1 urgentes tuyas', '1 encargos parados', 'cuentas saturadas', '2 correos sin contestar']) assert.ok(t.includes(x), x);
  const raiz = pintar({ rol: 'owner' });
  assert.ok(raiz.children[0].textContent.endsWith('sin alertas'));
  assert.match(raiz.children[0].children.at(-1).className, /verde/);
});

// Brief B (19-sep, feedback móvil de Diego: "los bullets deberían llevarte a su sitio"): cada píldora
// enlaza a la vista ya filtrada por esa misma alerta, no a una ruta genérica.
test('franja: "parados" y "sesiones" abren la vista ya filtrada; "urgentes" conserva #hoy como respaldo', () => {
  const raiz = pintar();
  const pills = raiz.children[0].children;
  const porTexto = t => pills.find(a => a.textContent.includes(t));
  assert.equal(porTexto('encargos parados').attrs.href, '#operacion/tablero?estado=parados');
  assert.equal(porTexto('sesiones abiertas').attrs.href, '#operacion/expedientes?tipo=todos&sesion=abierta');
  assert.equal(porTexto('correos sin contestar').attrs.href, '#operacion/expedientes', 'esta píldora no cambia (brief B)');
  assert.equal(porTexto('urgentes tuyas').attrs.href, '#hoy', 'respaldo si el onclick no llega a dispararse');
});

test('franja: la píldora "N urgentes tuyas" no navega por hash, evita el salto y baja al ancla #urgentes', () => {
  const raiz = pintar();
  const urg = raiz.children[0].children.find(a => a.textContent.includes('urgentes tuyas'));
  let prevenido = false, opciones = null;
  const espia = { scrollIntoView: (o) => { opciones = o; } };
  const original = document.getElementById;
  document.getElementById = (id) => (id === 'urgentes' ? espia : original(id));
  try { urg.listeners.click[0]({ preventDefault: () => { prevenido = true; } }); }
  finally { document.getElementById = original; }
  assert.ok(prevenido, 'debe evitar el salto brusco del href');
  assert.deepEqual(opciones, { behavior: 'smooth', block: 'start' });
});

// 2.0.20 punto 4: la primera pill de la franja es "N agentes activos", de agentesActivos().
test('owner: la franja abre con los agentes activos y enlaza al tablero en curso; nunca coste en Home', () => {
  const con = { ...datosOwner, agentes: [
    { id: 'ariadna', nombre: 'Ariadna', activo: true, ultima_actividad: '2026-09-17T06:40:00Z' },
    { id: 'guillem', nombre: 'Guillem', activo: true, ultima_actividad: '2026-09-15T06:40:00Z' }] };
  const primera = pintar(con).children[0].children[0];
  assert.equal(primera.textContent, '1 agente activo');
  assert.equal(primera.attrs.href, '#operacion/tablero?estado=en_curso');
  assert.match(primera.className, /verde/);
  // Sin nadie con latido reciente, pill neutra pero con el mismo enlace.
  const sin = pintar().children[0].children[0];
  assert.equal(sin.textContent, 'ningún agente activo');
  assert.match(sin.className, /neutro-2/);
  assert.equal(sin.attrs.href, '#operacion/tablero?estado=en_curso');
  assert.ok(!/EUR|USD|\$|€/.test(pintar(con).textContent), 'Home nunca habla de coste');
});

test('owner: Vencidos y parados marca alerta y lista lo peor primero', () => {
  const p = panel(pintar(), 'Vencidos y parados');
  assert.match(p.className, /alerta/);
  assert.ok(p.textContent.startsWith('Vencidos y parados · 2 de 22'), p.textContent);
  assert.ok(p.textContent.includes('#2') && p.textContent.indexOf('#2') < p.textContent.indexOf('#1'));
});

test('owner: Próximos cierres cuenta solo lo que cierra esta semana', () => {
  const p = panel(pintar(), 'Próximos cierres');
  assert.ok(p.textContent.startsWith('Próximos cierres1licitación cierra esta semana'), p.textContent);
  assert.ok(p.textContent.includes('L1'));
});

test('owner: Sesiones cuenta las no cerradas, con agente, expediente y antigüedad', () => {
  const p = panel(pintar(), 'Sesiones');
  assert.ok(p.textContent.startsWith('Sesiones1abiertas o por atender'), p.textContent);
  assert.ok(p.textContent.includes('Cíclica · cupones · desde 17-sep · 0 d'), p.textContent);
  assert.ok(!/rojo/.test(buscarNodos(p, n => n.tag === 'li').map(n => n.className).join(' ')));
});

test('owner: vacíos no rompen y no marcan alerta', () => {
  const raiz = pintar({ rol: 'owner' });
  assert.equal(paneles(raiz).length, 3);
  assert.ok(panel(raiz, 'Vencidos y parados · 0 de 0').textContent.includes('nada parado'));
  assert.ok(!/alerta/.test(panel(raiz, 'Vencidos y parados').className));
  assert.ok(!/alerta/.test(panel(raiz, 'Sesiones').className));
  assert.ok(panel(raiz, 'Próximos cierres').textContent.includes('0licitaciones cierran esta semana'));
  assert.ok(panel(raiz, 'Sesiones').textContent.includes('ninguna abierta'));
});

test('agente: "Tus tarjetas" con lo en curso y sesiones abiertas; nada de franja ni bandeja', () => {
  const raiz = pintar({ ...datosOwner, rol: 'agente', pendientes: [] });
  assert.deepEqual(titulos(raiz), ['Tus tarjetas', 'Sesiones abiertas']);
  const ids = buscarNodos(raiz, n => n.className.includes('encargo')).map(t => t.attrs['data-id'] || t.textContent);
  assert.equal(ids.length, enCurso(datosOwner.encargos).length);
  assert.ok(hrefs(raiz).includes('#operacion/expedientes/9'));
  assert.ok(!raiz.textContent.includes('correos sin contestar'));
});

test('agente: "Tus tarjetas" se corta en 10 con enlace a las restantes', () => {
  const muchos = Array.from({ length: 13 }, (_, i) => ({ id: i, columna: 'en_curso', estado: 'en_curso', texto: 'Tarea ' + i }));
  const raiz = pintar({ rol: 'agente', encargos: muchos, sesiones: [] });
  assert.equal(buscarNodos(raiz, n => n.className.includes('encargo')).length, 10);
  const enlace = buscarNodos(raiz, n => n.tag === 'a' && n.textContent === 'ver las 3 restantes')[0];
  assert.ok(enlace, 'debe enlazar a las 3 restantes');
  assert.equal(enlace.attrs.href, '#operacion/tablero');
});

test('agente: con 10 o menos no aparece el enlace de "ver más"', () => {
  const raiz = pintar({ rol: 'agente', encargos: [{ id: 1, columna: 'en_curso', estado: 'en_curso', texto: 'Uno' }], sesiones: [] });
  assert.equal(buscarNodos(raiz, n => n.tag === 'a' && /restantes/.test(n.textContent)).length, 0);
});

test('agente: sin datos en las listas pinta los textos vacíos', () => {
  const t = pintar({ rol: 'agente' }).textContent;
  assert.ok(t.includes('nada en curso'));
  assert.ok(t.includes('ninguna'));
});

test('#1170: aviso de plan en la Home solo si hay actividades vencidas, con enlace a #direccion/objetivo', () => {
  const ahora = new Date('2026-09-20T22:00:00Z');
  const ok = { fuente: 'manual', updated_at: '2026-09-19T10:00:00Z', actualizado_por: 'chief', fecha_hito: '2026-09-30' };
  const a = avisoPlan({ frentes: [ok, { ...ok, fecha_hito: '2026-09-10' }, { fuente: 'sql' }] }, ahora);
  assert.equal(a.attrs.href, '#direccion/objetivo');
  assert.equal(a.textContent, 'Plan: 1 actividad vencida (2 de 3 al día)');
  assert.equal(avisoPlan({ frentes: [ok, { fuente: 'sql' }] }, ahora), null);
  assert.equal(avisoPlan({ frentes: [{ codigo: 'A1' }] }, ahora), null);
  assert.equal(avisoPlan({}, ahora), null);
});

test('#1170 Vencidos y parados: cada fila con «hito hace N d» o «sin avance N d», agente normalizado y «N de M» con M = abiertos', () => {
  const agentes = [{ id: 'sales-licita', nombre: 'Guillem' }, { id: 'operaciones', nombre: 'Pol' }];
  const encargos = [
    { id: 1, columna: 'en_curso', texto: 'Hito caducado', fecha_hito: '2026-09-10', agente: 'sales-licita' },
    { id: 2, columna: 'bloqueado', texto: 'Parado con avance', rojo: true, fecha_avance: '2026-09-12T10:00:00Z', agente: 'operaciones' },
    { id: 3, columna: 'por_hacer', texto: 'Sano', fecha_hito: '2026-09-30', agente: 'Ariadna' },
    { id: 4, columna: 'hecho', texto: 'Hecho', fecha_hito: '2026-09-01' },
  ];
  const p = panel(pintar({ rol: 'owner', encargos, agentes }), 'Vencidos y parados');
  assert.ok(p.textContent.startsWith('Vencidos y parados · 2 de 32'), p.textContent);            // 2 vencidos/parados de 3 abiertos (el hecho no cuenta)
  assert.ok(p.textContent.includes('#2 Parado con avance · Pol · sin avance 4 d'), p.textContent);
  assert.ok(p.textContent.includes('#1 Hito caducado · Guillem · hito hace 7 d'), p.textContent);
  assert.equal(buscarNodos(p, n => n.tag === 'span' && /rojo/.test(n.className)).length, 2);
  const muchos = Array.from({ length: 12 }, (_, i) => ({ id: i, columna: 'en_curso', rojo: true }));
  assert.ok(panel(pintar({ rol: 'owner', encargos: muchos }), 'Vencidos y parados').textContent.startsWith('Vencidos y parados · 12 de 12'));  // la cuenta no se corta a los 8 listados
});

test('#1170 Próximos cierres: días hasta el cierre y «sin tocar N d» en rojo desde 3 d; sin dato de toque, nada', () => {
  const licitaciones = [
    { expediente: 'C-hoy', estado: 'Presentada', cierre: '2026-09-17', resumen_corto: 'Cierra hoy', toque: '2026-09-17T06:00:00Z' },
    { expediente: 'C-viejo', estado: 'Aprobada', cierre: '2026-09-20', resumen_corto: 'Sin tocar', toque: '2026-09-13T10:00:00Z' },
    { expediente: 'C-justo', estado: 'Aprobada', cierre: '2026-09-21', resumen_corto: 'Justo 3 d', toque: '2026-09-14T07:00:00Z' },
    { expediente: 'C-2d', estado: 'Aprobada', cierre: '2026-09-22', resumen_corto: 'Tocado', toque: '2026-09-15T12:00:00Z' },
    { expediente: 'C-null', estado: 'Aprobada', cierre: '2026-09-23', resumen_corto: 'Sin dato' },
  ];
  assert.deepEqual(proximosCierres(licitaciones, ahora).map(l => l.expediente), ['C-hoy', 'C-viejo', 'C-justo', 'C-2d', 'C-null']);   // la que cierra hoy no se pierde
  const p = panel(pintar({ rol: 'owner', licitaciones }), 'Próximos cierres');
  const filas = buscarNodos(p, n => n.tag === 'li').map(n => n.textContent);
  assert.ok(filas[0].includes('(hoy)') && !filas[0].includes('sin tocar'), filas[0]);
  assert.ok(filas[1].includes('(en 3 d)') && filas[1].endsWith('sin tocar 3 d'), filas[1]);
  assert.ok(filas[2].endsWith('sin tocar 3 d'), filas[2]);
  assert.ok(!filas[3].includes('sin tocar') && !filas[4].includes('sin tocar'), filas.slice(3).join('|'));
  assert.equal(buscarNodos(p, n => n.tag === 'span' && /rojo/.test(n.className)).length, 2);
});

test('#1170 Sesiones: dos grupos, antigüedad por fila y rojo pasadas 48 h', () => {
  const agentes = [{ id: 'sales-licita', nombre: 'Guillem' }];
  const sesiones = [
    { id: 1, nombre: 'Aresa', agente: 'sales-licita', estado: 'abierta', abierta: '2026-09-14T07:00:00Z' },        // 3 d: roja
    { id: 2, nombre: 'Epic', agente: 'coo', estado: 'abierta', abierta: '2026-09-16T12:00:00Z' },                 // 19 h: no
    { id: 3, nombre: 'Cíclica', agente: 'cupones', estado: 'solicitada', created_at: '2026-09-15T07:00:00Z' },    // 2 d exactos (48 h): no roja
    { id: 4, nombre: 'Vieja', agente: 'ariadna', estado: 'solicitada', created_at: '2026-09-15T06:00:00Z' },      // 49 h: roja
    { id: 5, nombre: 'Cerrada', agente: 'x', estado: 'cerrada', abierta: '2026-09-01T00:00:00Z' },
  ];
  const p = panel(pintar({ rol: 'owner', sesiones, agentes }), 'Sesiones');
  assert.ok(p.textContent.startsWith('Sesiones4'), p.textContent);
  assert.ok(p.textContent.includes('2 con más de 48 h'), p.textContent);
  assert.ok(/alerta/.test(p.className));
  const textos = buscarNodos(p, n => n.tag === 'p' && /grupo-tit/.test(n.className)).map(n => n.textContent);
  assert.deepEqual(textos, ['abiertas (2)', 'solicitadas sin atender (2)']);
  const filas = buscarNodos(p, n => n.tag === 'li');
  assert.deepEqual(filas.map(f => f.className.includes('rojo')), [true, false, true, false]);   // más antigua primero en cada grupo
  assert.ok(filas[0].textContent.startsWith('Aresa · Guillem · desde 14-sep · 3 d'), filas[0].textContent);
  assert.ok(!p.textContent.includes('Cerrada'));
});

// #1281: semáforo primero en la rama owner y regla de las cifras (sin fila en omc_datos no se pinta).
const SEM1281 = { filas: ['correo', 'licitacion', 'encargo', 'tarjeta', 'contacto', 'dato'].map(o => ({ objeto: o, nombre: o, total: 1, rojos: 0, sin_medir: false, enlace: '#hoy', por_dueno: [] })) };
const TODAS = ['home.agentes.activos', 'home.sesiones.abiertas', 'home.encargos.parados', 'home.correo.sin_contestar', 'home.cuentas.saturadas', 'home.plan.vencidas',
  'home.encargos.abiertos_hito_pasado', 'home.licitaciones.cierran_semana', 'home.sesiones.mas_48h', 'home.encargos.en_curso', 'home.tarjetas.depende_de_ti', 'home.tarjetas.pospuestas',
  'home.licitaciones.por_decidir', 'home.licitaciones.en_criba_guillem'];
test('#1281 owner: el semáforo de seis filas va antes que la franja; sin semáforo la franja sigue primera', () => {
  const con = pintar({ ...datosOwner, semaforo: SEM1281, claves_datos: TODAS });
  assert.equal(con.children[0].className, 'semaforo-seis');
  assert.equal(con.children[0].children.length, 6);
  assert.equal(con.children[1].className, 'franja');
  assert.equal(pintar().children[0].className, 'franja');
});
test('#1281 owner: clave inexistente no se pinta (panel de sesiones y de cierres fuera), claves cargadas se pintan', () => {
  const textoDe = raiz => raiz.textContent;
  const todas = textoDe(pintar({ ...datosOwner, claves_datos: TODAS }));
  const sin = textoDe(pintar({ ...datosOwner, claves_datos: TODAS.filter(k => k !== 'home.sesiones.abiertas' && k !== 'home.licitaciones.cierran_semana') }));
  assert.match(todas, /Cíclica/); assert.match(todas, /Resumen L1/);
  assert.doesNotMatch(sin, /Cíclica/); assert.doesNotMatch(sin, /Resumen L1/);
  // claves null (aún no cargadas): se pinta todo, como antes
  assert.equal(textoDe(pintar({ ...datosOwner, claves_datos: null })), textoDe(pintar()));
});
