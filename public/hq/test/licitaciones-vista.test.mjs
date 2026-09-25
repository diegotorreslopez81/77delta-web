import test from 'node:test';
import assert from 'node:assert/strict';

// Tanda 4 (LICITA-SPEC.md 5, 6.2, 6.3): vista unica de los 12 estados de omc_licitaciones. Reemplaza
// el embudo viejo de 7 chips con recuento en vivo + ?vista=menores por: chips de ESTADOS_H1 sin
// recuento (el recuento exacto lo da la RPC por estado, pintarlo en cada chip pediria 12 llamadas),
// Menor como filtro (menor=1, importe_max 20000) y Descartada con el catalogo H4 (motivo_descarte
// crudo, no el motivos[]/MOTIVOS_NO viejo). Cada render() es asincrono (pide omc_licitaciones_tabla
// via usarCargador); antes solo 'descartadas' lo era.
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
    closest(sel) { let n2 = this; while (n2) { if (sel.split(',').map(s => s.trim()).includes(n2.tag)) return n2; n2 = n2.parent; } return null; },
    get textContent() { return this.children.length ? this.children.map(c => (c.nodeType === 3 ? c.data : c.textContent)).join('') : this._text; },
    set textContent(v) { this._text = v; this.children = []; },
    get innerHTML() { return this._html; },
    set innerHTML(v) { this._html = v; this.children = []; },
    scrollIntoView() {},
  };
  n.classList._n = n;
  return n;
}
globalThis.document = {
  createElement: (tag) => crearNodo(tag),
  createTextNode: (data) => ({ nodeType: 3, data }),
  getElementById: () => crearNodo('div'),
  body: crearNodo('body'),
  addEventListener() {}, removeEventListener() {},
};
globalThis.location = { hash: '', search: '', pathname: '/hq/' };
globalThis.history = { replaceState: () => {} };
globalThis.window = { addEventListener: () => {} };
globalThis.HQ_VERSION = { v: 'test' };
if (typeof globalThis.localStorage === 'undefined') {
  const mem = new Map();
  globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
}

const {
  render, tarjetaLic, usarCargador, estadoChip, construirRuta, filtroServidor, filtroCliente,
  ordenar, buscar, diasA, plazo, plazoConsumido, colorEstado, importeClase, colorOrgano, colorTextoPlazo,
} = await import('../app/vistas/licitaciones.js');

const buscarNodos = (n, pred, out = []) => { if (n.nodeType === 1) { if (pred(n)) out.push(n); n.children.forEach(c => buscarNodos(c, pred, out)); } return out; };
const clase = (n, c) => n.className && n.className.split(' ').includes(c);
const tarjetas = raiz => buscarNodos(raiz, n => clase(n, 'card-lic'));
const expedientes = raiz => tarjetas(raiz).map(t => t.attrs['data-expediente']);
// La barra de arriba pinta <a class="chip">; la hoja de filtros pinta <button class="chip"> por cada
// opcion de cada seccion (incluida Estado, que se oculta de la hoja con visible:()=>false para no
// duplicar los mismos 12 estados dos veces en pantalla). Distinguir por tag evita contar ambos a la vez.
const chips = raiz => buscarNodos(raiz, n => n.tag === 'a' && clase(n, 'chip'));
const raizVacia = () => crearNodo('div');
const abrirHoja = raiz => buscarNodos(raiz, n => clase(n, 'fab-filtros'))[0].listeners.click[0]();

const AHORA = new Date('2026-09-17T10:00:00Z');

// render() pide siempre a traves de cargador (usarCargador); nunca red real en tests.
async function pintar(filas, filtrosRuta = {}, opts = {}) {
  const raiz = raizVacia();
  const S = opts.S || { datos: { rol: opts.rol || 'owner' } };
  usarCargador(opts.cargador || (async () => ({ total: filas.length, filas })));
  await render(raiz, S, undefined, filtrosRuta, AHORA);
  return raiz;
}

test('estadoChip: alias de rutas viejas y los 12 estados de H1 tal cual; lo que no reconoce cae vacio', () => {
  assert.equal(estadoChip('activas'), 'Aprobada');
  assert.equal(estadoChip('criba'), 'Nueva');
  assert.equal(estadoChip('pausadas'), 'Por decidir');
  assert.equal(estadoChip('descartadas'), 'Descartada');
  assert.equal(estadoChip('redaccion'), 'En redacción');
  assert.equal(estadoChip('Subsanación'), 'Subsanación');
  assert.equal(estadoChip('Adjudicada'), 'Adjudicada');
  assert.equal(estadoChip('no-existe'), '');
  assert.equal(estadoChip(undefined), '');
});

test('construirRuta: solo escribe lo distinto del defecto', () => {
  assert.equal(construirRuta({}), '#operacion/licitaciones');
  assert.equal(construirRuta({ estado: 'Aprobada' }), '#operacion/licitaciones?estado=Aprobada');
  assert.equal(construirRuta({ estado: 'Por decidir', orden: 'importe', menor: '1' }), '#operacion/licitaciones?estado=Por+decidir&orden=importe&menor=1');
  assert.equal(construirRuta({ estado: 'Descartada', motivo: 'Sin solvencia' }), '#operacion/licitaciones?estado=Descartada&motivo=Sin+solvencia');
  assert.equal(construirRuta({ estado: 'Aprobada', abiertas: '0' }), '#operacion/licitaciones?estado=Aprobada&abiertas=0');
});

test('filtroServidor: Por decidir por defecto, solo abiertas; Menor y etiqueta pasan a la RPC', () => {
  const base = filtroServidor({}, AHORA);
  assert.equal(base.estados[0], 'Por decidir');
  assert.equal(base.cierre_desde, '2026-09-17');
  assert.equal(base.importe_max, undefined);
  const menor = filtroServidor({ estado: 'Aprobada', menor: '1', etiqueta: 'obra' }, AHORA);
  assert.equal(menor.importe_max, 20000);
  assert.deepEqual(menor.etiquetas, ['obra']);
  assert.equal(menor.estados[0], 'Aprobada');
  const abiertas = filtroServidor({ estado: 'Descartada', abiertas: '0' }, AHORA);
  assert.equal(abiertas.cierre_desde, undefined);
  assert.equal(filtroServidor({ estado: 'Nueva' }, AHORA).limite, 1000);
});

test('filtroCliente: no incluye motivo (se filtra aparte por motivo_descarte crudo)', () => {
  const v = filtroCliente({ tipologia: 'Obras', motivo: 'Sin solvencia', texto: 'x' });
  assert.equal(v.tipologia, 'Obras');
  assert.equal(v.texto, 'x');
  assert.equal('motivo' in v, false);
});

test('render: 13 chips de ESTADOS_H1 sin recuento, el actual con clase activo, alias de ruta vieja resuelve', async () => {
  const raiz = await pintar([], { estado: 'activas' });
  const cs = chips(raiz);
  assert.equal(cs.length, 13);
  assert.deepEqual(cs.map(c => c.textContent), ['Nueva', 'Criba de pliego', 'Por decidir', 'Aprobada', 'En redacción', 'Por presentar', 'Presentada', 'Subsanación', 'Propuesta de adjudicación', 'Adjudicada', 'No adjudicada', 'Descartada', 'Cerrada sin presentar']);
  const activo = cs.find(c => clase(c, 'activo'));
  assert.equal(activo.textContent, 'Aprobada');
  assert.equal(activo.attrs.href, '#operacion/licitaciones?estado=Aprobada');
});

test('render: sin estado en la ruta, o uno invalido, cae en Por decidir', async () => {
  const raiz1 = await pintar([], {});
  assert.ok(chips(raiz1).find(c => c.textContent === 'Por decidir' && clase(c, 'activo')));
  const raiz2 = await pintar([], { estado: 'no-existe' });
  assert.ok(chips(raiz2).find(c => c.textContent === 'Por decidir' && clase(c, 'activo')));
});

test('render: pide a la RPC con el filtro de servidor exacto para el estado de la ruta', async () => {
  let visto = null;
  await pintar([], { estado: 'Descartada', menor: '1' }, { cargador: async f => { visto = f; return { total: 0, filas: [] }; } });
  assert.deepEqual(visto.estados, ['Descartada']);
  assert.equal(visto.importe_max, 20000);
});

test('render: sin resultados muestra "nada con este filtro", con resultados pinta una tarjeta por fila', async () => {
  const vacio = await pintar([]);
  assert.match(vacio.textContent, /nada con este filtro/);
  const l = { id: 1, expediente: 'EXP-1', estado: 'Por decidir', objeto: 'Obra', importe: 1000, cierre: '2026-09-20' };
  const con = await pintar([l]);
  assert.deepEqual(expedientes(con), ['EXP-1']);
  assert.match(con.textContent, /(\d+) resultado/);
});

test('render: el resumen cuenta el total de la RPC, no solo las filas devueltas (limite)', async () => {
  const l = { id: 1, expediente: 'EXP-1', estado: 'Aprobada', importe: 1000 };
  const raiz = await pintar([l], { estado: 'Aprobada' }, { cargador: async () => ({ total: 500, filas: [l] }) });
  assert.match(raiz.textContent, /500 resultados/);
  assert.match(raiz.textContent, /mostrando 1/);
});

test('render: estado Nueva agrupa por elegible en vez de tarjetas', async () => {
  const l1 = { id: 1, expediente: 'N-1', estado: 'Nueva', elegible: true, objeto: 'A' };
  const l2 = { id: 2, expediente: 'N-2', estado: 'Nueva', elegible: false, objeto: 'B', motivo_auto: 'fuera de plazo' };
  const raiz = await pintar([l1, l2], { estado: 'Nueva' });
  assert.equal(tarjetas(raiz).length, 0);
  assert.match(raiz.textContent, /N-1/);
  assert.match(raiz.textContent, /N-2/);
});

test('render: hoja de filtros con Etiqueta y Tipo derivados de las filas, ausentes si no hay datos', async () => {
  const sinDatos = await pintar([{ id: 1, expediente: 'E1', estado: 'Aprobada' }]);
  assert.equal(buscarNodos(sinDatos, n => n._text === 'Etiqueta').length, 0);
  const conDatos = await pintar([{ id: 1, expediente: 'E1', estado: 'Aprobada', etiquetas: ['obra'], tipo: 'servicios' }]);
  abrirHoja(conDatos); // la hoja solo repinta su cuerpo al abrirse; usar() ya dejo las opciones derivadas listas
  assert.ok(buscarNodos(conDatos, n => n._text === 'Etiqueta').length >= 1);
  assert.ok(buscarNodos(conDatos, n => n._text === 'Tipo').length >= 1);
});

test('render: Motivo de NO solo aparece para Descartada, opciones derivadas de motivo_descarte + Sin motivo', async () => {
  const filas = [
    { id: 1, expediente: 'D1', estado: 'Descartada', motivo_descarte: 'Sin solvencia' },
    { id: 2, expediente: 'D2', estado: 'Descartada', motivo_descarte: null },
  ];
  const raiz = await pintar(filas, { estado: 'Descartada' });
  abrirHoja(raiz);
  assert.ok(buscarNodos(raiz, n => n._text === 'Motivo de NO').length >= 1);
  assert.ok(buscarNodos(raiz, n => n._text === 'Sin solvencia').length >= 1);
  assert.ok(buscarNodos(raiz, n => n._text === 'Sin motivo').length >= 1);
  const raizAprobada = await pintar([{ id: 1, expediente: 'A1', estado: 'Aprobada' }], { estado: 'Aprobada' });
  abrirHoja(raizAprobada);
  assert.equal(buscarNodos(raizAprobada, n => n._text === 'Motivo de NO').length, 0);
});

test('filtro de motivo: motivo=X deja solo esas, motivo=sin deja las que no tienen', async () => {
  const filas = [
    { id: 1, expediente: 'D1', estado: 'Descartada', motivo_descarte: 'Sin solvencia' },
    { id: 2, expediente: 'D2', estado: 'Descartada', motivo_descarte: 'Fuera de plazo' },
    { id: 3, expediente: 'D3', estado: 'Descartada', motivo_descarte: null },
  ];
  const raiz1 = await pintar(filas, { estado: 'Descartada', motivo: 'Sin solvencia' });
  assert.deepEqual(expedientes(raiz1), ['D1']);
  const raiz2 = await pintar(filas, { estado: 'Descartada', motivo: 'sin' });
  assert.deepEqual(expedientes(raiz2), ['D3']);
});

test('render: orden por importe ordena ascendente (C3); por cierre (defecto) ordena por cierre', async () => {
  const filas = [
    { id: 1, expediente: 'A', estado: 'Aprobada', importe: 1000, cierre: '2026-09-25' },
    { id: 2, expediente: 'B', estado: 'Aprobada', importe: 5000, cierre: '2026-09-20' },
  ];
  const porImporte = await pintar(filas, { estado: 'Aprobada', orden: 'importe' });
  assert.deepEqual(expedientes(porImporte), ['A', 'B']);
  const porCierre = await pintar(filas, { estado: 'Aprobada' });
  assert.deepEqual(expedientes(porCierre), ['B', 'A']);
});

test('render: cache por firma de filtro evita repetir la llamada; otro estado vuelve a llamar', async () => {
  let llamadas = 0;
  const S = { datos: { rol: 'owner' } };
  usarCargador(async () => { llamadas++; return { total: 0, filas: [] }; });
  const raiz1 = raizVacia();
  await render(raiz1, S, undefined, { estado: 'Aprobada' }, AHORA);
  const raiz2 = raizVacia();
  await render(raiz2, S, undefined, { estado: 'Aprobada' }, AHORA);
  assert.equal(llamadas, 1, 'mismo filtro: segunda vez sale de S.cacheLicTabla');
  const raiz3 = raizVacia();
  await render(raiz3, S, undefined, { estado: 'Presentada' }, AHORA);
  assert.equal(llamadas, 2, 'estado distinto: firma distinta, vuelve a llamar');
});

test('render: si el cargador falla, aviso en mudo y no rompe', async () => {
  const raiz = await pintar([], {}, { cargador: async () => { throw new Error('caido'); } });
  assert.match(raiz.textContent, /no se pudo cargar/);
});

test('render: enlace a KPIs y sin el cuadro de paneles (eso se queda en Operacion/KPIs)', async () => {
  const raiz = await pintar([]);
  const kpi = buscarNodos(raiz, n => n.tag === 'a' && n.attrs.href === '#kpis?grupo=licitaciones');
  assert.equal(kpi.length, 1);
  assert.equal(buscarNodos(raiz, n => clase(n, 'panel')).length, 0);
});

test('colorEstado/importeClase/colorOrgano/colorTextoPlazo: funciones puras de mapeo', () => {
  assert.equal(colorEstado('Aprobada'), 'verde');
  assert.equal(colorEstado('Descartada'), 'gris');
  assert.equal(importeClase(1000), 'imp-1');
  assert.equal(importeClase(20000), 'imp-2');
  assert.equal(importeClase(100000), 'imp-3');
  assert.equal(importeClase(500000), 'imp-4');
  assert.equal(colorOrgano('Ayuntamiento'), 'verde');
  assert.equal(colorOrgano('desconocido'), 'gris');
  assert.equal(colorTextoPlazo(null), 'neutro');
  assert.equal(colorTextoPlazo(2), 'rojo');
  assert.equal(colorTextoPlazo(5), 'ambar');
  assert.equal(colorTextoPlazo(20), 'neutro');
});

test('diasA, plazo y plazoConsumido: bordes de fecha', () => {
  assert.equal(diasA(null, AHORA), null);
  assert.equal(diasA('2026-09-20', AHORA), 3);
  assert.equal(diasA('2026-09-10', AHORA), -7);
  assert.equal(plazo(null, AHORA).texto, 'sin fecha de cierre');
  assert.match(plazo('2026-09-10', AHORA).texto, /cerró hace 7 d/);
  assert.equal(plazo('2026-09-17', AHORA).texto, 'cierra hoy');
  assert.equal(plazo('2026-09-20', AHORA).color, 'rojo');
  assert.equal(plazoConsumido({ detectada: '2026-09-10', cierre: '2026-09-20' }, AHORA), 74);
  assert.equal(plazoConsumido({ detectada: null, cierre: '2026-09-20' }, AHORA), null);
});

test('ordenar y buscar: funciones puras sobre arrays', () => {
  const filas = [{ expediente: 'A', importe: 100, cierre: '2026-09-25' }, { expediente: 'B', importe: 900, cierre: '2026-09-20' }];
  assert.deepEqual(ordenar(filas, 'importe').map(f => f.expediente), ['A', 'B']);
  assert.deepEqual(ordenar(filas, 'cierre').map(f => f.expediente), ['B', 'A']);
  assert.deepEqual(buscar(filas, 'a').map(f => f.expediente), ['A']);
});

test('tarjetaLic: colapsada por defecto, tags de estado/organo/importe/plazo y titulo/organo visibles', () => {
  const l = {
    id: 1, expediente: 'X1', estado: 'Aprobada', organo: 'Ajuntament', provincia: 'Barcelona',
    resumen_corto: 'Plataforma de gestión documental', objeto: 'Plataforma de gestión documental',
    importe: 227990, cierre: '2026-09-20', solvencia: null,
  };
  const t = tarjetaLic(l, AHORA, 'agente');
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  const txt = t.textContent;
  assert.match(txt, /Aprobada/);
  assert.match(txt, /Ayuntamiento/);
  assert.match(txt, /228 k EUR/);
  assert.match(txt, /sin IVA/);
  assert.match(txt, /cierra en 3 d/);
  assert.match(txt, /Plataforma de gestión documental/);
  assert.match(txt, /Ajuntament · Barcelona/);
  assert.match(txt, /Expediente X1/);
  const plazoSpan = buscarNodos(t, n => clase(n, 'plazo'))[0];
  assert.match(plazoSpan.children[0].className, /g-rojo/);
});

test('tarjetaLic: clic alterna aria-expanded; clic en un enlace interno no lo toca', () => {
  const l = { id: 1, expediente: 'X2', estado: 'Nueva', enlace: 'https://perfil/x' };
  const t = tarjetaLic(l, AHORA, 'agente');
  const enlace = buscarNodos(t, n => n.tag === 'a')[0];
  t.listeners.click[0]({ target: enlace, currentTarget: t });
  assert.equal(t.getAttribute('aria-expanded'), 'false', 'clic en un enlace no despliega la tarjeta');
  t.listeners.click[0]({ target: t, currentTarget: t });
  assert.equal(t.getAttribute('aria-expanded'), 'true');
  t.listeners.click[0]({ target: t, currentTarget: t });
  assert.equal(t.getAttribute('aria-expanded'), 'false');
});

test('tarjetaLic: Descartada pinta motivo_descarte como pill y en el detalle, no pasa por motivosNo()', () => {
  const l = { id: 1, expediente: 'D1', estado: 'Descartada', motivo_descarte: 'Fuera de plazo', origen_descarte: 'agente' };
  const t = tarjetaLic(l, AHORA, 'owner');
  assert.match(t.textContent, /Fuera de plazo/);
  assert.match(t.textContent, /Motivo: Fuera de plazo \(agente\)/);
});

test('tarjetaLic: enlaces validos primero (Perfil/Carpeta/PCAP), un enlace javascript: se descarta', () => {
  const l = { id: 1, expediente: 'X3', estado: 'Nueva', enlace: 'https://perfil/x', carpeta: 'https://drive/x', ppt: 'javascript:alert(1)', pcap: 'https://pcap/x' };
  const t = tarjetaLic(l, AHORA, 'agente');
  const enlaces = buscarNodos(t, n => n.tag === 'a').map(a => [a.textContent, a.attrs.href]);
  assert.deepEqual(enlaces, [['Perfil', 'https://perfil/x'], ['Carpeta', 'https://drive/x'], ['PCAP', 'https://pcap/x']]);
});

test('tarjetaLic: botones de transicion segun rol (5.3), owner ve el boton de clave de sobre y agente no', () => {
  const l = { id: 1, expediente: 'X4', estado: 'Aprobada' };
  const owner = tarjetaLic(l, AHORA, 'owner');
  const botonesOwner = buscarNodos(owner, n => n.tag === 'button').map(b => b.textContent);
  assert.ok(botonesOwner.includes('En redacción'));
  assert.ok(botonesOwner.includes('Descartada'));
  assert.equal(botonesOwner.includes('Clave de sobre'), false, 'Aprobada aún no tiene sobre');
  assert.ok(botonesOwner.includes('Copiar para el chat'));
  const red = buscarNodos(tarjetaLic({ ...l, estado: 'En redacción' }, AHORA, 'owner'), n => n.tag === 'button').map(b => b.textContent);
  assert.ok(red.includes('Clave de sobre'));
  const agente = tarjetaLic(l, AHORA, 'agente');
  const botonesAgente = buscarNodos(agente, n => n.tag === 'button').map(b => b.textContent);
  assert.ok(botonesAgente.includes('En redacción'));
  assert.equal(botonesAgente.includes('Descartada'), false, 'agente no puede descartar una Aprobada (solo owner puede pasar a Descartada)');
  assert.equal(botonesAgente.includes('Clave de sobre'), false);
});

test('tarjetaLic: checklist A5 se pinta cuando ficha.documentos existe', () => {
  const l = { id: 1, expediente: 'X5', estado: 'Por presentar', ficha: { documentos: ['DEUC', { nombre: 'Solvencia', ok: true }] } };
  const t = tarjetaLic(l, AHORA, 'owner');
  assert.match(t.textContent, /\[ \] DEUC/);
  assert.match(t.textContent, /\[x\] Solvencia/);
});

test('render: menor=1 pasa importe_max 20000 a la RPC de servidor (Menor como filtro, no como ruta)', async () => {
  let visto = null;
  await pintar([], { estado: 'Aprobada', menor: '1' }, { cargador: async f => { visto = f; return { total: 0, filas: [] }; } });
  assert.equal(visto.importe_max, 20000);
});

test('tarjetaLic: título de la ficha sin repetir el objeto, resumen de la ficha y texto para el chat', async () => {
  const { resumenFicha, textoChatLic } = await import('../app/vistas/licitaciones.js');
  const l = { id: 7, expediente: 'E7', estado: 'Por decidir', objeto: 'Servicio X.', importe: 7843, cierre: '2026-10-01',
    ficha: { objeto_real: 'Servicio X', plazo_ejecucion: '12 meses', criterios_adjudicacion: { peso_automatico: 100 }, solvencia: { tecnica: null, economica: null } } };
  assert.equal(resumenFicha(l), 'solo precio · 12 meses · el pliego no detalla solvencia');
  const textos = buscarNodos(tarjetaLic(l, AHORA, 'owner'), n => n.tag === 'p').map(n => n.textContent);
  assert.equal(textos.includes('Servicio X.'), false, 'el objeto igual al título no se repite');
  assert.ok(textoChatLic(l).startsWith('Licitación #7 · E7 · Servicio X'));
});
