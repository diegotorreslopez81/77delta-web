import test from 'node:test';
import assert from 'node:assert/strict';
import { DECIDIBLES, ABIERTAS, pendiente, porDecidir, enCriba, porElegible, solvenciaTexto, embudo, estadoDe, tipologiaOrgano, TIPOLOGIAS, tipologia, sinSolvencia, filtrar, MOTIVOS_NO, motivosNo, enlacesLic, decisionDe, vencida, cierrePasado, esperandoResolucion, conBotones, sinPresentarUrgente, ESTADOS_H1, TRANSICIONES_5_3, rolPermite, transicionesValidas } from '../app/licitaciones.js';

// Fixture de 8 licitaciones (Task 1, plan 3b): cubre decidibles, criba, descartada, aprobada por
// decision sin ser decidible, presentada y contratada con importe.
// Reloj fijo: las fechas de cierre de los fixtures son de 2026 y, con el reloj real, pasan a vencidas (#1238) y salen de los conteos.
const AHORA = new Date('2026-08-15T10:00:00Z');
const lics = [
  { expediente: 'E1', elegible: 'Probable', estado: 'Nueva', decision: null, cierre: '2026-10-05', importe: null },
  { expediente: 'E2', elegible: 'Dudosa', estado: 'Por decidir', decision: '', cierre: null, importe: null },
  { expediente: 'E3', elegible: 'Revisar', estado: 'Nueva', decision: null, cierre: null, importe: null },
  { expediente: 'E4', elegible: 'No viable', estado: 'Nueva', decision: null, cierre: '2026-09-25', importe: null },
  { expediente: 'E5', elegible: 'Probable', estado: 'Descartada', decision: null, cierre: '2026-09-10', importe: '5000' },
  { expediente: 'E6', elegible: 'Probable', estado: 'Nueva', decision: 'OK', cierre: '2026-09-15', importe: '12000' },
  { expediente: 'E7', elegible: null, estado: 'Presentada', decision: 'OK', cierre: '2026-09-12', importe: '30000' },
  { expediente: 'E8', elegible: null, estado: 'Adjudicada', decision: 'OK', cierre: '2026-08-01', importe: '45000.5' },
];

test('DECIDIBLES y ABIERTAS son los conjuntos esperados', () => {
  assert.deepEqual([...DECIDIBLES], ['Probable', 'Dudosa']);
  assert.deepEqual([...ABIERTAS], ['Nueva', 'Por decidir']);
});

// C1 (revision final del controlador): estado '' (cadena vacia, valor por defecto de la columna en
// BD) se trata como 'Nueva' en todo el modulo.
test('estadoDe: cadena vacia o solo espacios cae a Nueva; un estado real se respeta tal cual', () => {
  assert.equal(estadoDe({ estado: '' }), 'Nueva');
  assert.equal(estadoDe({ estado: '   ' }), 'Nueva');
  assert.equal(estadoDe({}), 'Nueva');
  assert.equal(estadoDe({ estado: null }), 'Nueva');
  assert.equal(estadoDe({ estado: 'Presentada' }), 'Presentada');
});

test('C1: una fila con estado vacio, elegible Probable y decision null es pendiente y cuenta en por_decidir', () => {
  const fila = { expediente: 'EVACIO', elegible: 'Probable', estado: '', decision: null, cierre: '2026-10-01', importe: '1000' };
  assert.ok(pendiente(fila));
  assert.ok(porDecidir([fila]).some(l => l.expediente === 'EVACIO'), 'estado vacio debe tratarse como Nueva (abierta) y entrar en por_decidir');
  const e = embudo([fila]);
  assert.equal(e.find(f => f.clave === 'por_decidir').n, 1);
});

test('pendiente: decision null, vacia o Pendiente; OK y No no son pendientes', () => {
  assert.equal(pendiente({ decision: null }), true);
  assert.equal(pendiente({ decision: '' }), true);
  assert.equal(pendiente({ decision: 'Pendiente' }), true);
  assert.equal(pendiente({}), true);
  assert.equal(pendiente({ decision: 'OK' }), false);
  assert.equal(pendiente({ decision: 'No' }), false);
});

test('porDecidir: Probable/Nueva y Dudosa/Por decidir pendientes entran, ordenadas por cierre asc con nulls last', () => {
  const pd = porDecidir(lics);
  assert.deepEqual(pd.map(l => l.expediente), ['E1', 'E2']);
});

test('enCriba: Revisar/Nueva y No viable/Nueva pendientes entran, no decidibles, mismo orden', () => {
  const ec = enCriba(lics);
  assert.deepEqual(ec.map(l => l.expediente), ['E4', 'E3']);
});

test('Descartada queda fuera de porDecidir y enCriba aunque sea Probable y pendiente', () => {
  assert.ok(!porDecidir(lics).some(l => l.expediente === 'E5'));
  assert.ok(!enCriba(lics).some(l => l.expediente === 'E5'));
});

test('decision OK saca la fila de porDecidir/enCriba aunque sea elegible y este abierta', () => {
  assert.ok(!porDecidir(lics).some(l => l.expediente === 'E6'));
  assert.ok(!enCriba(lics).some(l => l.expediente === 'E6'));
});

test('porDecidir/enCriba: empate de cierre (incluidos ambos null) desempata por expediente', () => {
  const empatadas = [
    { expediente: 'Z9', elegible: 'Probable', estado: 'Nueva', decision: null, cierre: '2026-09-01' },
    { expediente: 'A1', elegible: 'Probable', estado: 'Nueva', decision: null, cierre: '2026-09-01' },
    { expediente: 'B2', elegible: 'Probable', estado: 'Nueva', decision: null, cierre: null },
    { expediente: 'A3', elegible: 'Probable', estado: 'Nueva', decision: null, cierre: null },
  ];
  assert.deepEqual(porDecidir(empatadas, AHORA).map(l => l.expediente), ['A1', 'Z9', 'A3', 'B2']);
});

test('porElegible: agrupa por elegible (o Sin clasificar) y ordena por tamano desc', () => {
  const grupos = porElegible(lics);
  // Minor 11 (revision final): la asercion original se comparaba consigo misma
  // (assert.deepEqual(grupos[0], ['Probable', grupos[0][1]])), siempre en verde. Se sustituye por el
  // valor esperado real: Probable agrupa E1, E5 y E6 (por orden de insercion).
  assert.equal(grupos[0][0], 'Probable');
  assert.deepEqual(grupos[0][1].map(l => l.expediente), ['E1', 'E5', 'E6']);
  assert.equal(grupos[0][1].length, 3);
  assert.equal(grupos[1][0], 'Sin clasificar');
  assert.equal(grupos[1][1].length, 2);
  assert.equal(grupos.length, 5);
  assert.equal(grupos.reduce((n, g) => n + g[1].length, 0), 8);
});

test('solvenciaTexto: vacio, ausente o que empieza por ? es sin dato', () => {
  assert.equal(solvenciaTexto({ solvencia: '' }), 'sin dato');
  assert.equal(solvenciaTexto({ solvencia: null }), 'sin dato');
  assert.equal(solvenciaTexto({}), 'sin dato');
  assert.equal(solvenciaTexto({ solvencia: '? no se pudo determinar la solvencia' }), 'sin dato');
});

test('solvenciaTexto: texto normal se devuelve tal cual', () => {
  assert.equal(solvenciaTexto({ solvencia: 'Alta, sin incidencias declaradas' }), 'Alta, sin incidencias declaradas');
});

test('solvenciaTexto: recorte a 160 caracteres mas el caracter de elipsis U+2026', () => {
  const largo = 'a'.repeat(200);
  const r = solvenciaTexto({ solvencia: largo });
  assert.equal(r.length, 161);
  assert.equal(r.slice(0, 160), 'a'.repeat(160));
  assert.equal(r.slice(160), '…');
  assert.equal(r.includes('...'), false);
});

test('embudo sin kpis: no hay fila detectadas ni analizadas', () => {
  const e = embudo(lics);
  // I1 (revision final): fila pausadas anadida entre presentadas y adjudicadas.
  assert.deepEqual(e.map(f => f.clave), ['por_decidir', 'en_criba', 'aprobadas', 'presentadas', 'pausadas', 'adjudicadas', 'contratadas', 'descartadas', 'cerradas']);
});

test('embudo con kpis.lic.detectadas.n: primera fila detectadas con n 1500 y eur null', () => {
  const e = embudo(lics, { 'lic.detectadas.n': { valor: 1500 } });
  assert.equal(e[0].clave, 'detectadas');
  assert.equal(e[0].n, 1500);
  assert.equal(e[0].eur, null);
  assert.equal(e.some(f => f.clave === 'analizadas'), false);
});

test('embudo con detectadas y analizadas: ambas delante, en ese orden', () => {
  const e = embudo(lics, { 'lic.detectadas.n': { valor: 1500 }, 'lic.analizadas.n': { valor: 300 } });
  assert.deepEqual(e.slice(0, 2).map(f => f.clave), ['detectadas', 'analizadas']);
  assert.equal(e[1].n, 300);
});

test('embudo: cuenta por_decidir y en_criba igual que las funciones puras', () => {
  const e = embudo(lics);
  const pd = e.find(f => f.clave === 'por_decidir'), ec = e.find(f => f.clave === 'en_criba');
  assert.equal(pd.n, 2); assert.equal(pd.eur, 0);
  assert.equal(ec.n, 2); assert.equal(ec.eur, 0);
});

test('embudo: aprobadas cuenta estado Aprobada y decision OK fuera de Presentada/Adjudicada/Contratada, una vez cada fila', () => {
  const e = embudo(lics, {}, {}, AHORA);
  const ap = e.find(f => f.clave === 'aprobadas');
  assert.equal(ap.n, 1); // solo E6
  assert.equal(ap.eur, 12000);
  const ambas = [...lics, { expediente: 'E9', estado: 'Aprobada', decision: 'OK', importe: '100' }];
  assert.equal(embudo(ambas, {}, {}, AHORA).find(f => f.clave === 'aprobadas').n, 2);
});

// H1 (tanda 4): 'Contratada' ya no existe en BD (traducida a Adjudicada); E8 usa el estado vivo.
test('embudo: presentadas y adjudicadas por estado exacto; contratadas (estado muerto) siempre en cero desde el array', () => {
  const e = embudo(lics);
  assert.equal(e.find(f => f.clave === 'presentadas').n, 1);
  assert.equal(e.find(f => f.clave === 'presentadas').eur, 30000);
  assert.equal(e.find(f => f.clave === 'adjudicadas').n, 1);
  assert.equal(e.find(f => f.clave === 'adjudicadas').eur, 45000.5);
  assert.equal(e.find(f => f.clave === 'contratadas').n, 0);
  assert.equal(e.find(f => f.clave === 'contratadas').eur, 0);
});

test('embudo: No adjudicada no cuenta como adjudicada', () => {
  const conNoAdjudicada = [...lics, { expediente: 'E10', estado: 'No adjudicada', decision: 'OK', importe: '9999' }];
  assert.equal(embudo(conNoAdjudicada).find(f => f.clave === 'adjudicadas').n, 1); // solo E8, no suma E10
});

test('embudo: descartadas por estado que empieza por Descartada o decision No, una vez por fila', () => {
  const e = embudo(lics);
  const de = e.find(f => f.clave === 'descartadas');
  assert.equal(de.n, 1); assert.equal(de.eur, 5000);
  const conNo = [...lics, { expediente: 'E11', estado: 'Nueva', decision: 'No', importe: '10' }, { expediente: 'E12', estado: 'Descartada por chief', decision: 'No', importe: '20' }];
  assert.equal(embudo(conNo).find(f => f.clave === 'descartadas').n, 3);
});

test('embudo: cerradas solo con estado Cerrada sin presentar', () => {
  const e = embudo(lics);
  assert.equal(e.find(f => f.clave === 'cerradas').n, 0);
  const conCerrada = [...lics, { expediente: 'E13', estado: 'Cerrada sin presentar', importe: '0' }];
  assert.equal(embudo(conCerrada).find(f => f.clave === 'cerradas').n, 1);
});

// Ruling del controlador (17-sep): el payload real ya no trae en 'licitaciones' las filas cerradas
// (Descartada, Cerrada sin presentar, Adjudicada, Contratada): esas se sirven agregadas en
// 'lic_resumen' ({ total, descartadas, cerradas, adjudicadas, no_adjudicadas, contratadas }, cada una
// { n, eur }). embudo(lics, kpis, resumen) usa resumen[clave] cuando existe para esas cuatro filas en
// vez de contar el array, y resumen.total para la fila detectadas cuando no hay kpis.

test('embudo con resumen: adjudicadas/contratadas/descartadas/cerradas usan resumen en vez de contar el array', () => {
  const resumen = {
    total: { n: 1500, eur: 9000000 },
    descartadas: { n: 900, eur: 4000000 },
    cerradas: { n: 200, eur: 1000000 },
    adjudicadas: { n: 50, eur: 500000 },
    no_adjudicadas: { n: 30, eur: 300000 },
    contratadas: { n: 20, eur: 200000 },
  };
  const e = embudo(lics, {}, resumen, AHORA);
  assert.deepEqual(e.find(f => f.clave === 'descartadas'), { clave: 'descartadas', nombre: 'Descartadas', n: 900, eur: 4000000 });
  assert.deepEqual(e.find(f => f.clave === 'cerradas'), { clave: 'cerradas', nombre: 'Cerradas sin presentar', n: 200, eur: 1000000 });
  assert.deepEqual(e.find(f => f.clave === 'adjudicadas'), { clave: 'adjudicadas', nombre: 'Adjudicadas', n: 50, eur: 500000 });
  assert.deepEqual(e.find(f => f.clave === 'contratadas'), { clave: 'contratadas', nombre: 'Contratadas', n: 20, eur: 200000 });
  // aprobadas y presentadas no tienen clave en lic_resumen: se siguen contando del array, sin cambios.
  assert.equal(e.find(f => f.clave === 'aprobadas').n, 1);
  assert.equal(e.find(f => f.clave === 'presentadas').n, 1);
});

test('embudo con resumen: detectadas usa resumen.total cuando no hay kpis.lic.detectadas.n', () => {
  const e = embudo(lics, {}, { total: { n: 1500, eur: 9000000 } });
  assert.equal(e[0].clave, 'detectadas');
  assert.equal(e[0].n, 1500);
  assert.equal(e[0].eur, null);
});

test('embudo: kpis.lic.detectadas.n tiene prioridad sobre resumen.total', () => {
  const e = embudo(lics, { 'lic.detectadas.n': { valor: 1600 } }, { total: { n: 1500, eur: 9000000 } });
  assert.equal(e[0].clave, 'detectadas');
  assert.equal(e[0].n, 1600);
});

test('embudo: sin resumen (por defecto {}) sigue contando el array como antes, sin romper', () => {
  const e = embudo(lics);
  assert.equal(e.find(f => f.clave === 'adjudicadas').n, 1);
  assert.equal(e.find(f => f.clave === 'adjudicadas').eur, 45000.5);
  assert.equal(e.find(f => f.clave === 'contratadas').n, 0);
  assert.equal(e.some(f => f.clave === 'detectadas'), false);
});

test('embudo con resumen: eur y n se leen con Number y por defecto 0 si faltan', () => {
  const e = embudo(lics, {}, { adjudicadas: { n: 3 } });
  const adj = e.find(f => f.clave === 'adjudicadas');
  assert.equal(adj.n, 3);
  assert.equal(adj.eur, 0);
});

// I1 (revision final): fila pausadas, misma logica que aprobadas/presentadas (array o resumen).
test('embudo: pausadas cuenta por estado Pausada, del array cuando no hay resumen.pausadas', () => {
  const conPausada = [...lics, { expediente: 'E14', estado: 'Pausada', decision: 'OK', importe: '7000' }];
  const e = embudo(conPausada);
  const pa = e.find(f => f.clave === 'pausadas');
  assert.equal(pa.n, 1);
  assert.equal(pa.eur, 7000);
});

test('embudo: pausadas usa resumen.pausadas cuando existe (C2)', () => {
  const e = embudo(lics, {}, { pausadas: { n: 4, eur: 25000 } });
  assert.deepEqual(e.find(f => f.clave === 'pausadas'), { clave: 'pausadas', nombre: 'Pausadas', n: 4, eur: 25000 });
});

// C2 (revision final): aprobadas y presentadas tambien pueden venir de lic_resumen (el corte de 7
// dias por cierre ya no aplica a estos dos estados en el SQL, pero lic_resumen sigue siendo la fuente
// completa sin el limite de pestana/30 dias de omc_hq).
test('embudo: aprobadas y presentadas usan resumen cuando existe (C2)', () => {
  const e = embudo(lics, {}, { aprobadas: { n: 10, eur: 90000 }, presentadas: { n: 5, eur: 45000 } });
  assert.deepEqual(e.find(f => f.clave === 'aprobadas'), { clave: 'aprobadas', nombre: 'Aprobadas', n: 10, eur: 90000 });
  assert.deepEqual(e.find(f => f.clave === 'presentadas'), { clave: 'presentadas', nombre: 'Presentadas', n: 5, eur: 45000 });
});

// tarjetas ricas (encargo #1057): tipologiaOrgano deriva la categoria del organo por texto libre;
// TIPOLOGIAS es la lista de opciones del selector, TIPOLOGIA_RE de licitaciones.js mas 'Otro'.
// Brief 2023: renombrada desde 'tipologia' para dejar ese nombre libre a la clasificacion por contenido.
test('tipologiaOrgano: reconoce cada categoria por patron en el texto del organo', () => {
  assert.equal(tipologiaOrgano('Ajuntament de Sabadell'), 'Ayuntamiento');
  assert.equal(tipologiaOrgano('Ayuntamiento de Madrid'), 'Ayuntamiento');
  assert.equal(tipologiaOrgano('Concello de Vigo'), 'Ayuntamiento');
  assert.equal(tipologiaOrgano('Diputación de Barcelona'), 'Diputación');
  assert.equal(tipologiaOrgano('Consell Insular de Menorca'), 'Diputación');
  assert.equal(tipologiaOrgano('Consorci Sanitari de Terrassa'), 'Consorcio');
  assert.equal(tipologiaOrgano('Generalitat de Catalunya'), 'Autonómica');
  assert.equal(tipologiaOrgano('Servei Català de la Salut'), 'Autonómica');
  assert.equal(tipologiaOrgano('Servicio Extremeño de Salud'), 'Autonómica');
  assert.equal(tipologiaOrgano('Ministerio de Sanidad'), 'Estatal');
  assert.equal(tipologiaOrgano('Universidad Politécnica de Madrid'), 'Universidad');
  assert.equal(tipologiaOrgano('Aigües de Barcelona, S.A.'), 'Empresa pública');
  assert.equal(tipologiaOrgano('Texto sin patron reconocido'), 'Otro');
  assert.equal(tipologiaOrgano(null), 'Otro');
  assert.equal(tipologiaOrgano(undefined), 'Otro');
  assert.deepEqual(TIPOLOGIAS[TIPOLOGIAS.length - 1], 'Otro');
  assert.ok(TIPOLOGIAS.includes('Ayuntamiento') && TIPOLOGIAS.includes('Diputación'));
});

// Brief 2023 (tags de tipologia por contenido, pedido repetido de Diego): tipologia(l) clasifica por
// palabras clave sobre objeto/resumen_corto/motivo_auto/tipo, sin acentos, maximo 4 etiquetas.
test('tipologia: plataforma de gestion del desempeño da software', () => {
  const claves = tipologia({ objeto: 'Suministro de una plataforma informática de gestión de la evaluación del desempeño del personal municipal' }).map(t => t.clave);
  assert.ok(claves.includes('software'));
});
test('tipologia: SaaS PRL/CAE da saas y software', () => {
  const claves = tipologia({ resumen_corto: 'Contratación de una aplicación SaaS de gestión PRL/CAE en modalidad servicio' }).map(t => t.clave);
  assert.ok(claves.includes('saas'));
  assert.ok(claves.includes('software'));
});
test('tipologia: curso presencial da formacion y presencial', () => {
  const claves = tipologia({ objeto: 'Curso de formación presencial en las instalaciones del ayuntamiento' }).map(t => t.clave);
  assert.deepEqual(claves, ['formacion', 'presencial']);
});
test('tipologia: texto vacio o sin campos da lista vacia', () => {
  assert.deepEqual(tipologia({ objeto: '' }), []);
  assert.deepEqual(tipologia({}), []);
});
test('tipologia: nulos en todos los campos no rompen y dan lista vacia', () => {
  assert.deepEqual(tipologia({ objeto: null, resumen_corto: null, motivo_auto: null, tipo: null }), []);
  assert.deepEqual(tipologia(null), []);
  assert.deepEqual(tipologia(undefined), []);
});
test('tipologia: ERP con contabilidad y nominas da erp', () => {
  const claves = tipologia({ objeto: 'Implantación de un ERP de gestión económica, contabilidad y nóminas' }).map(t => t.clave);
  assert.ok(claves.includes('erp'));
});
test('tipologia: CRM de atencion ciudadana da crm', () => {
  const claves = tipologia({ objeto: 'Suministro de un CRM para la atención ciudadana del ayuntamiento' }).map(t => t.clave);
  assert.ok(claves.includes('crm'));
});
test('tipologia: cuadro de mando y business intelligence da datos', () => {
  const claves = tipologia({ objeto: 'Desarrollo de un cuadro de mando de business intelligence sobre los datos municipales' }).map(t => t.clave);
  assert.ok(claves.includes('datos'));
});
test('tipologia: chatbot con inteligencia artificial da ia', () => {
  const claves = tipologia({ objeto: 'Implantación de un asistente virtual con inteligencia artificial (chatbot) de atención' }).map(t => t.clave);
  assert.ok(claves.includes('ia'));
});
test('tipologia: suministro de servidores y equipamiento da hardware', () => {
  const claves = tipologia({ objeto: 'Suministro de equipos y servidores para la renovación del centro de datos' }).map(t => t.clave);
  assert.ok(claves.includes('hardware'));
});
test('tipologia: auditoria ENS de seguridad da ciberseguridad', () => {
  const claves = tipologia({ objeto: 'Auditoría de seguridad de la información y adecuación al ENS' }).map(t => t.clave);
  assert.ok(claves.includes('ciberseguridad'));
});
test('tipologia: maximo 4 etiquetas aunque el texto matchee mas categorias', () => {
  const l = { objeto: 'Software SaaS de CRM y ERP con módulo de datos, business intelligence, formación presencial, mantenimiento y soporte, más consultoría de implantación' };
  const r = tipologia(l);
  assert.ok(r.length <= 4);
});
test('tipologia: cada etiqueta trae clave, texto y color', () => {
  const r = tipologia({ objeto: 'Curso de formación online' });
  for (const t of r) { assert.ok(t.clave); assert.ok(t.texto); assert.ok(t.color); }
});

test('sinSolvencia: exencion 159.6, "no exige" o "sin acreditaci" es sin solvencia; texto normal exige', () => {
  assert.equal(sinSolvencia({ solvencia: 'Exenta por el articulo 159.6 LCSP' }), true);
  assert.equal(sinSolvencia({ solvencia: 'No exige solvencia especifica' }), true);
  assert.equal(sinSolvencia({ solvencia: 'Sin acreditacion de solvencia' }), true);
  assert.equal(sinSolvencia({ solvencia: 'Clasificacion grupo G, subgrupo 6' }), false);
  assert.equal(sinSolvencia({}), false);
  assert.equal(sinSolvencia({ solvencia: null }), false);
});

test('filtrar: cada dimension es opcional y se combinan con AND', () => {
  const rows = [
    { expediente: 'F1', organo: 'Ajuntament de Reus', solvencia: 'no exige', pestana: 'PLACSP', tipo: 'obras', estado: 'Nueva' },
    { expediente: 'F2', organo: 'Ministerio de Defensa', solvencia: 'Grupo A', pestana: 'Gencat', tipo: 'servicios', estado: 'Cerrada sin presentar' },
    { expediente: 'F3', organo: 'Ajuntament de Reus', solvencia: 'Grupo A', pestana: 'PLACSP', tipo: 'servicios', estado: 'Nueva' },
  ];
  assert.deepEqual(filtrar(rows, {}).map(l => l.expediente), ['F1', 'F2', 'F3']);
  assert.deepEqual(filtrar(rows, { tipologia: 'Ayuntamiento' }).map(l => l.expediente), ['F1', 'F3']);
  assert.deepEqual(filtrar(rows, { tipologia: 'Estatal' }).map(l => l.expediente), ['F2']);
  assert.deepEqual(filtrar(rows, { solvencia: 'todas' }).map(l => l.expediente), ['F1', 'F2', 'F3']);
  assert.deepEqual(filtrar(rows, { solvencia: 'sin solvencia' }).map(l => l.expediente), ['F1']);
  assert.deepEqual(filtrar(rows, { solvencia: 'exige' }).map(l => l.expediente), ['F2', 'F3']);
  assert.deepEqual(filtrar(rows, { fuente: 'PLACSP' }).map(l => l.expediente), ['F1', 'F3']);
  assert.deepEqual(filtrar(rows, { tipo: 'servicios' }).map(l => l.expediente), ['F2', 'F3']);
  assert.deepEqual(filtrar(rows, { desiertas: true }).map(l => l.expediente), ['F2']);
  assert.deepEqual(filtrar(rows, { tipologia: 'Ayuntamiento', tipo: 'servicios' }).map(l => l.expediente), ['F3']);
  assert.deepEqual(filtrar(null, {}), []);
});

// Motivos de NO (encargo #1063): catalogo cerrado, mismo orden que omc_motivos_no() en SQL y
// MOTIVOS_NO en scripts/hq/hq.py.
test('MOTIVOS_NO: 10 elementos en el orden exacto del catalogo', () => {
  assert.deepEqual(MOTIVOS_NO, ['Fuera de España', 'Suministro/hardware', 'No TIC ni formación', 'Solvencia/clasificación',
    'Presencial', 'Sin pliego', 'Plazo corto', 'Importe bajo', 'Competencia/consorcio', 'Duplicada']);
  assert.equal(MOTIVOS_NO.length, 10);
});

test('motivosNo: solo devuelve los elementos de l.motivos que estan en el catalogo', () => {
  assert.deepEqual(motivosNo({ motivos: ['Sin pliego', 'Plazo corto'] }), ['Sin pliego', 'Plazo corto']);
  // una aprobada/presentada trae motivos de SI (texto libre de Sales), ajenos al catalogo de NO.
  assert.deepEqual(motivosNo({ motivos: ['Buen encaje con el equipo', 'Cliente conocido'] }), []);
  assert.deepEqual(motivosNo({ motivos: [] }), []);
  assert.deepEqual(motivosNo({}), []);
  assert.deepEqual(motivosNo({ motivos: null }), []);
});

test('filtrar con motivo: pasa las filas cuyo motivosNo incluye el motivo pedido', () => {
  const rows = [
    { expediente: 'M1', estado: 'Descartada', motivos: ['Sin pliego'] },
    { expediente: 'M2', estado: 'Descartada', motivos: ['Plazo corto', 'Sin pliego'] },
    { expediente: 'M3', estado: 'Descartada', motivos: [] },
    { expediente: 'M4', estado: 'Aprobada', motivos: ['Cliente conocido'] },
  ];
  assert.deepEqual(filtrar(rows, { motivo: 'Sin pliego' }).map(l => l.expediente), ['M1', 'M2']);
  assert.deepEqual(filtrar(rows, { motivo: 'Plazo corto' }).map(l => l.expediente), ['M2']);
  assert.deepEqual(filtrar(rows, {}).map(l => l.expediente), ['M1', 'M2', 'M3', 'M4']);
});

test('filtrar con motivo "sin": solo descartadas sin ningun motivo del catalogo', () => {
  const rows = [
    { expediente: 'M1', estado: 'Descartada', motivos: ['Sin pliego'] },
    { expediente: 'M2', estado: 'Descartada', motivos: [] },
    { expediente: 'M3', estado: 'Descartada', motivos: null },
    { expediente: 'M4', estado: 'Aprobada', motivos: [] },
  ];
  assert.deepEqual(filtrar(rows, { motivo: 'sin' }).map(l => l.expediente), ['M2', 'M3']);
});

test('enlacesLic prefiere los pliegos de Drive y cae al portal si no hay copia', () => {
  const con = { enlace: 'https://p.example/1', carpeta: 'https://drive.google.com/drive/folders/abc', ppt: 'https://p.example/ppt', pcap: 'https://p.example/pcap', ppt_drive: 'https://drive.google.com/file/d/PPT1/view', pcap_drive: '' };
  assert.deepEqual(enlacesLic(con), [['Perfil', 'https://p.example/1'], ['Carpeta', 'https://drive.google.com/drive/folders/abc'], ['PPT', 'https://drive.google.com/file/d/PPT1/view'], ['PCAP', 'https://p.example/pcap']]);
  assert.deepEqual(enlacesLic({ enlace: 'https://p.example/2' }), [['Perfil', 'https://p.example/2']]);
});

// 2.0.20: estado sucio ('Descartada: motivo libre'), presencialidad y buscador como filtro.
test('estadoPartido y estadoBase: separan el motivo que viene pegado al estado', async () => {
  const { estadoPartido, estadoBase } = await import('../app/licitaciones.js');
  assert.deepEqual(estadoPartido({ estado: 'Descartada: solo viable en UTE' }), { estado: 'Descartada', motivo: 'solo viable en UTE' });
  assert.deepEqual(estadoPartido({ estado: 'Aprobada' }), { estado: 'Aprobada', motivo: '' });
  assert.equal(estadoBase({ estado: 'Descartada: sin pliego' }), 'Descartada');
  assert.equal(estadoBase({}), 'Nueva', 'sin estado, Nueva, igual que estadoDe');
});

test('presencial: lo detecta por el motivo de NO y por el texto de la licitacion', async () => {
  const { presencial } = await import('../app/licitaciones.js');
  assert.equal(presencial({ motivos: ['Presencial'] }), true);
  assert.equal(presencial({ motivo_auto: 'Requiere trabajo presencial en Bilbao' }), true);
  assert.equal(presencial({ objeto: 'Soporte IN SITU en las oficinas' }), true);
  assert.equal(presencial({ objeto: 'Servicio remoto de consultoria' }), false);
  assert.equal(presencial({}), false);
});

test('filtrar con presencial y texto: sin acentos y sobre expediente, objeto, organo y provincia', async () => {
  const { filtrar, coincideTexto } = await import('../app/licitaciones.js');
  const rows = [
    { expediente: 'P1', objeto: 'Auditoría de IA', organo: 'Ajuntament de Girona', provincia: 'Girona', motivos: ['Presencial'] },
    { expediente: 'P2', objeto: 'Formación en remoto', organo: 'Diputación de Málaga', provincia: 'Málaga', motivos: [] },
  ];
  assert.deepEqual(filtrar(rows, { presencial: 'si' }).map(l => l.expediente), ['P1']);
  assert.deepEqual(filtrar(rows, { presencial: 'no' }).map(l => l.expediente), ['P2']);
  assert.deepEqual(filtrar(rows, { texto: 'girona' }).map(l => l.expediente), ['P1']);
  assert.deepEqual(filtrar(rows, { texto: 'MALAGA' }).map(l => l.expediente), ['P2']);
  assert.deepEqual(filtrar(rows, { texto: 'auditoria de ia' }).map(l => l.expediente), ['P1']);
  assert.deepEqual(filtrar(rows, { texto: '  ' }).map(l => l.expediente), ['P1', 'P2']);
  assert.equal(coincideTexto(rows[0], 'zzz'), false);
});

// #1238: decisionDe con los valores reales de omc_licitaciones.decision.
test('decisionDe: OK y OK (auto) son go; No, NOK y Descartado/a son nogo; null, Pendiente y valores raros son pendiente', () => {
  for (const [d, esp] of [['OK', 'go'], ['ok ', 'go'], ['OK (auto)', 'go'], ['ok(auto)', 'go'], ['No', 'nogo'], ['NOK', 'nogo'], ['Descartado', 'nogo'],
    ['Descartada', 'nogo'], [null, 'pendiente'], [undefined, 'pendiente'], ['', 'pendiente'], ['Pendiente', 'pendiente'], ['quizas', 'pendiente'], ['OKAY', 'pendiente']])
    assert.equal(decisionDe({ decision: d }), esp, String(d));
});

test('vencida: cierre anterior a hoy y estado no final; hoy y futuro no; sin cierre no; Presentada y finales nunca', () => {
  const A = new Date('2026-09-20T10:00:00Z');
  const v = (estado, cierre) => vencida({ estado, cierre }, A);
  assert.equal(v('Aprobada', '2026-09-18'), true);
  assert.equal(v('Por decidir', '2026-09-19'), true);
  assert.equal(v('Pausada', '2026-09-19'), true);
  assert.equal(v('Nueva', '2026-09-19'), true);
  assert.equal(v('Aprobada', '2026-09-20'), false);
  assert.equal(v('Aprobada', '2026-09-21'), false);
  assert.equal(v('Aprobada', null), false);
  // H1: 'Contratada' y 'Retirada' son nombres muertos (BD ya no los usa, traducidos a Adjudicada/Descartada);
  // si aparecieran sueltos ya no cuentan como finales, por eso quedan fuera de esta lista.
  for (const e of ['Presentada', 'Adjudicada', 'No adjudicada', 'Descartada', 'Cerrada sin presentar']) assert.equal(v(e, '2026-09-01'), false, e);
  assert.equal(cierrePasado({ cierre: '2026-09-19T00:00:00' }, A), true);
});

test('esperandoResolucion: solo Presentada con el cierre pasado', () => {
  const A = new Date('2026-09-20T10:00:00Z');
  assert.equal(esperandoResolucion({ estado: 'Presentada', cierre: '2026-09-10' }, A), true);
  assert.equal(esperandoResolucion({ estado: 'Presentada', cierre: '2026-09-25' }, A), false);
  assert.equal(esperandoResolucion({ estado: 'Aprobada', cierre: '2026-09-10' }, A), false);
});

test('conBotones: vivas pendientes con botones; vencidas, finales y Aprobadas decididas sin ellos', () => {
  const A = new Date('2026-09-20T10:00:00Z');
  const b = (o) => conBotones({ cierre: '2026-10-10', decision: null, ...o }, A);
  // H1: 'Pausada' ya no existe en BD (traducida a Por decidir); se prueba el estado vivo.
  assert.equal(b({ estado: 'Por decidir' }), true);
  assert.equal(b({ estado: 'Por decidir', decision: '' }), true);
  assert.equal(b({ estado: 'Por decidir', decision: 'OK (auto)' }), true);
  assert.equal(b({ estado: 'Nueva', elegible: 'Probable' }), true);
  assert.equal(b({ estado: 'Nueva', elegible: 'No viable' }), false);
  assert.equal(b({ estado: 'Por decidir', decision: 'NOK' }), false);
  assert.equal(b({ estado: 'Aprobada', decision: 'OK' }), false);
  assert.equal(b({ estado: 'Presentada' }), false);
  assert.equal(b({ estado: 'Por decidir', cierre: '2026-09-18' }), false);   // vencida: no se decide, se cierra
});

test('porDecidir y enCriba dejan fuera las vencidas sin resolver', () => {
  const A = new Date('2026-09-20T10:00:00Z');
  const ls = [{ expediente: 'V', elegible: 'Probable', estado: 'Por decidir', decision: null, cierre: '2026-09-18' },
    { expediente: 'W', elegible: 'Probable', estado: 'Por decidir', decision: null, cierre: '2026-09-30' }];
  assert.deepEqual(porDecidir(ls, A).map(l => l.expediente), ['W']);
});

test('sinPresentarUrgente: Aprobada u OK a <= 2 dias del cierre sin presentar; Presentada, No, lejanas y vencidas no', () => {
  const A = new Date('2026-09-20T10:00:00Z');
  const u = (o) => sinPresentarUrgente({ estado: 'Aprobada', decision: 'OK', cierre: '2026-09-22', ...o }, A);
  assert.equal(u({}), true);
  assert.equal(u({ cierre: '2026-09-20' }), true);
  assert.equal(u({ cierre: '2026-09-23' }), false);
  assert.equal(u({ cierre: '2026-09-19' }), false);
  assert.equal(u({ estado: 'Presentada' }), false);
  assert.equal(u({ estado: 'Por decidir', decision: 'OK (auto)' }), true);
  assert.equal(u({ estado: 'Por decidir', decision: null }), false);
  assert.equal(u({ estado: 'Aprobada', decision: null }), true);
  assert.equal(u({ decision: 'No', estado: 'Por decidir' }), false);
  assert.equal(u({ cierre: null }), false);
});

// Tanda 4 (H1, tabla 5.3 de LICITA-SPEC.md): los 12 estados canonicos y el grafo de transiciones que
// valida omc_licitaciones_guardia() en BD. Estas pruebas fijan el contrato entre la vista, decision-lic.js
// y el trigger, para que un cambio en el grafo de aqui obligue a revisar tambien la SQL.
test('ESTADOS_H1: los 12 estados canonicos, en el mismo orden que omc_lic_estados()', () => {
  assert.deepEqual(ESTADOS_H1, ['Nueva', 'Por decidir', 'Aprobada', 'En redacción', 'Por presentar', 'Presentada',
    'Subsanación', 'Propuesta de adjudicación', 'Adjudicada', 'No adjudicada', 'Descartada', 'Cerrada sin presentar']);
  assert.equal(ESTADOS_H1.length, 12);
});

test('TRANSICIONES_5_3: todo destino de todo estado es el mismo un estado valido de ESTADOS_H1', () => {
  for (const [de, destinos] of Object.entries(TRANSICIONES_5_3)) {
    assert.ok(ESTADOS_H1.includes(de), 'origen ' + de);
    for (const a of destinos) assert.ok(ESTADOS_H1.includes(a), de + ' -> ' + a);
  }
});

test('TRANSICIONES_5_3: los cinco rollbacks de la tabla 5.3', () => {
  assert.ok(TRANSICIONES_5_3['En redacción'].includes('Aprobada'));
  assert.ok(TRANSICIONES_5_3['Por presentar'].includes('En redacción'));
  assert.ok(TRANSICIONES_5_3['Subsanación'].includes('Presentada'));
  assert.ok(TRANSICIONES_5_3['Descartada'].includes('Por decidir'));
  assert.ok(TRANSICIONES_5_3['Cerrada sin presentar'].includes('Nueva'));
});

test('TRANSICIONES_5_3: los estados finales de la maquina (Adjudicada, No adjudicada) no tienen salida', () => {
  assert.equal(TRANSICIONES_5_3['Adjudicada'], undefined);
  assert.equal(TRANSICIONES_5_3['No adjudicada'], undefined);
});

test('rolPermite: owner puede cualquier movimiento de la tabla', () => {
  assert.equal(rolPermite('Por decidir', 'Aprobada', 'owner'), true);
  assert.equal(rolPermite('Aprobada', 'Descartada', 'owner'), true);
  assert.equal(rolPermite('Descartada', 'Por decidir', 'owner'), true);
});

test('rolPermite: agente no aprueba, no descarta salvo desde Nueva, y no recupera una Descartada', () => {
  assert.equal(rolPermite('Por decidir', 'Aprobada', 'agente'), false, 'solo Diego aprueba');
  assert.equal(rolPermite('Nueva', 'Descartada', 'agente'), true, 'descartar una Nueva si vale para agente');
  assert.equal(rolPermite('Por decidir', 'Descartada', 'agente'), false, 'descartar desde Por decidir exige owner');
  assert.equal(rolPermite('Aprobada', 'Descartada', 'agente'), false);
  assert.equal(rolPermite('Descartada', 'Por decidir', 'agente'), false, 'solo Diego recupera una descartada');
  assert.equal(rolPermite('Aprobada', 'En redacción', 'agente'), true, 'el resto del grafo vale igual para agente');
});

test('transicionesValidas: interseccion de la tabla 5.3 con la guardia de rol', () => {
  assert.deepEqual(transicionesValidas({ estado: 'Por decidir' }, 'owner'), ['Aprobada', 'Descartada', 'Cerrada sin presentar']);
  assert.deepEqual(transicionesValidas({ estado: 'Por decidir' }, 'agente'), ['Cerrada sin presentar']);
  assert.deepEqual(transicionesValidas({ estado: 'Descartada' }, 'agente'), []);
  assert.deepEqual(transicionesValidas({ estado: 'Descartada' }, 'owner'), ['Por decidir']);
  assert.deepEqual(transicionesValidas({ estado: 'Adjudicada' }, 'owner'), [], 'estado final sin salida');
  assert.deepEqual(transicionesValidas({ estado: '' }, 'agente'), transicionesValidas({ estado: 'Nueva' }, 'agente'), 'estado vacio cae a Nueva (estadoBase)');
});
