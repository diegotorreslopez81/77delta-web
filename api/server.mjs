// api.77delta.com · formulario de contacto de 77delta.com y avisos push de HQ.
// POST /contacto {nombre, empresa, email, sector, mensaje, web(honeypot)} -> email a MAIL_TO por SMTP.
// Sin SMTP configurado, el lead se guarda en LEADS_FILE y en el log, y se responde 200 igualmente.
// POST /docureal {email, empresa, tipo, idioma, candidaturas_mes, ya_me_paso, preferencia_precio, comentario, origen, web(honeypot)} -> LEADS_FILE, Supabase docureal_lista_espera y correo a MAIL_TO.
// POST /verifix {email, empresa, tipo gestoria|empresa, idioma, ya_me_ha_pasado y programa opcionales, web(honeypot)} -> LEADS_FILE, Supabase verifix_lista_espera y correo a MAIL_TO.
// GET /hiring -> {mcp_url}. POST /hiring {campos del formulario, token del reto MCP, web(honeypot)} -> Windmill f/hiring/alta.
// GET /hq/vapid -> clave pública VAPID. POST /hq/notificar {token, id} -> push a los móviles del owner de esa empresa.
// Tras cada envío con éxito de /contacto, /hiring y /docureal se registra un evento en Umami (form-contacto, form-empleo, form-docureal) vía UMAMI_URL/api/send.
import http from 'node:http';
import { appendFile } from 'node:fs/promises';
import nodemailer from 'nodemailer';
import webpush from 'web-push';
import { preparar as prepararHiring, reenviar as reenviarHiring, MAX_CUERPO as MAX_HIRING } from './hiring.mjs';
import { validar as validarVerifix, insertarSupabase, correo as correoVerifix } from './verifix.mjs';
import { validar as validarDocureal, insertarSupabase as insertarDocureal, correo as correoDocureal } from './docureal.mjs';

const PORT = Number(process.env.PORT || 3000);
const ORIGENES = (process.env.CORS_ORIGINS || 'https://77delta.com,https://www.77delta.com,https://verifix.77delta.com,https://docureal.77delta.com').split(',').map((s) => s.trim());
const MAIL_TO = process.env.MAIL_TO || 'hola@77delta.com';
const MAIL_FROM = process.env.MAIL_FROM || process.env.SMTP_USER || MAIL_TO;
const LEADS_FILE = process.env.LEADS_FILE || '/data/leads.jsonl';
const SMTP_OK = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
// Eventos de conversión en Umami (envíos con éxito de formularios). Sin cookies ni datos personales:
// solo nombre del evento, origen e idioma. UMAMI_URL vacío desactiva el envío.
const UMAMI = {
  url: (process.env.UMAMI_URL || 'https://stats.77delta.com').replace(/\/$/, ''),
  web: process.env.UMAMI_WEBSITE_77DELTA || '0847eaa4-a0ce-47ee-9acf-8e796160bdd9',
  docureal: process.env.UMAMI_WEBSITE_DOCUREAL || '',
};

// HQ: Supabase propio (anon para validar tokens por RPC, service para leer suscripciones) y claves VAPID.
const HQ = {
  url: (process.env.HQ_SUPABASE_URL || '').replace(/\/$/, ''),
  anon: process.env.HQ_SUPABASE_ANON || '',
  service: process.env.HQ_SUPABASE_SERVICE || '',
  app: process.env.HQ_APP_URL || 'https://77delta.com/hq/',
};
const VAPID_OK = Boolean(process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE && HQ.url && HQ.anon && HQ.service);
// Dictado de HQ: el móvil graba y aquí se transcribe con Mistral (Voxtral), que es EU y sigue el formato OpenAI de /audio/transcriptions.
const STT_OK = Boolean(process.env.MISTRAL_API_KEY && HQ.url && HQ.anon);
const STT_MODEL = process.env.STT_MODEL || 'voxtral-mini-latest';
if (VAPID_OK) webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hola@77delta.com', process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

const transporte = SMTP_OK
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE || 'true') !== 'false',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Tiempos cortos: si el SMTP no responde, no bloquea al visitante (el envío es asíncrono).
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
  : null;

// Límite sencillo por IP: 5 envíos cada 10 minutos.
const cubos = new Map();
function permitido(ip, ambito = '') {
  const clave = ambito + ip;
  const ahora = Date.now();
  const c = (cubos.get(clave) || []).filter((t) => ahora - t < 600_000);
  if (c.length >= 5) return false;
  c.push(ahora);
  cubos.set(clave, c);
  return true;
}

const limpiar = (v, max) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function cors(req, res) {
  const origen = req.headers.origin;
  if (origen && ORIGENES.includes(origen)) res.setHeader('Access-Control-Allow-Origin', origen);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-HQ-Token, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function responder(res, codigo, cuerpo) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(cuerpo));
}

async function leerJson(req, max = 20_000) {
  let datos = '';
  for await (const trozo of req) {
    datos += trozo;
    if (datos.length > max) throw new Error('demasiado grande');
  }
  return JSON.parse(datos || '{}');
}

async function leerBinario(req, max = 12_000_000) {
  const trozos = [];
  let total = 0;
  for await (const trozo of req) {
    total += trozo.length;
    if (total > max) throw new Error('audio demasiado grande');
    trozos.push(trozo);
  }
  return Buffer.concat(trozos);
}

async function transcribir(audio, tipo) {
  const ext = /mp4|m4a|aac/.test(tipo) ? 'm4a' : /webm/.test(tipo) ? 'webm' : /ogg|opus/.test(tipo) ? 'ogg' : /wav/.test(tipo) ? 'wav' : 'mp3';
  const form = new FormData();
  form.append('file', new Blob([audio], { type: tipo || 'application/octet-stream' }), `nota.${ext}`);
  form.append('model', STT_MODEL);
  form.append('language', 'es');
  const r = await fetch('https://api.mistral.ai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MISTRAL_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(60_000),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`mistral ${r.status} ${texto.slice(0, 200)}`);
  const json = JSON.parse(texto);
  return String(json.text || '').trim();
}

async function guardar(lead) {
  try {
    await appendFile(LEADS_FILE, JSON.stringify(lead) + '\n');
  } catch (e) {
    console.error('no se pudo escribir', LEADS_FILE, e.message);
  }
}

// ---- HQ ----
/**
 * Registra un evento en Umami desde el servidor (POST /api/send). Nunca bloquea la respuesta
 * al visitante: se lanza después de responder y los fallos solo se registran en el log.
 * sitio: 'web' (77delta.com) o 'docureal' (docureal.77delta.com, con su propio website en Umami).
 */
function eventoUmami(nombre, { sitio = 'web', url = '/', datos = {} } = {}) {
  if (!UMAMI.url) return;
  const website = sitio === 'docureal' && UMAMI.docureal ? UMAMI.docureal : UMAMI.web;
  const hostname = sitio === 'docureal' ? 'docureal.77delta.com' : '77delta.com';
  const payload = { type: 'event', payload: { website, hostname, url, name: nombre, language: datos.idioma || 'es', data: datos } };
  fetch(`${UMAMI.url}/api/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  })
    .then((r) => (r.ok ? console.log('umami', nombre) : console.error('umami error', nombre, r.status)))
    .catch((e) => console.error('umami error', nombre, e.message));
}

async function supa(ruta, opciones = {}, clave = HQ.anon) {
  const r = await fetch(HQ.url + ruta, {
    ...opciones,
    headers: { apikey: clave, Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json', ...(opciones.headers || {}) },
    signal: AbortSignal.timeout(15_000),
  });
  const texto = await r.text();
  let json = null;
  try { json = texto ? JSON.parse(texto) : null; } catch { json = texto; }
  if (!r.ok) throw new Error(`${ruta} ${r.status} ${typeof json === 'object' && json?.message ? json.message : String(texto).slice(0, 200)}`);
  return json;
}
const rpc = (fn, args) => supa(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
const TIPO = { gasto: 'Gasto', contacto: 'Contacto', publicacion: 'Publicación', estrategia: 'Estrategia', duda: 'Duda', accion: 'Acción humana', otro: 'Aprobación' };

// #2694 (decisión #718): push solo para acciones de Diego. Lista única en hq_parametros (la usa también hq-notificar.py).
const WEB_HQ = 'https://77delta.com/hq/';
async function tiposAccion() {
  const f = await supa('/rest/v1/hq_parametros?clave=eq.push_tipos_accion&select=texto', {}, HQ.service);
  return String(f?.[0]?.texto || '').split(',').map((x) => x.trim()).filter(Boolean);
}
// Todo lo que entra por /hq/notificar y /hq/notificar-lic queda en la pestaña Avisos, con push o sin él.
async function registrarAviso(empresa, tipo, texto, url, push) {
  try {
    await supa('/rest/v1/omc_avisos', { method: 'POST', body: JSON.stringify({ empresa, tipo, texto: String(texto).slice(0, 400), url, push }) }, HQ.service);
  } catch (e) { console.error('aviso no registrado', e.message); }
}
const SIN_PUSH = (motivo) => ({ push: false, motivo, enviados: 0, fallidos: 0, dispositivos: 0 });

async function notificar(token, id, texto = '') {
  const info = await rpc('omc_token_info', { p_token: token });
  const s = await rpc('omc_estado', { p_token: token, p_id: id });
  const urlTarjeta = `${WEB_HQ}#hoy/${s.id}`;
  if (!(await tiposAccion()).includes(s.tipo)) {
    await registrarAviso(info.empresa, 'tarjeta', `${TIPO[s.tipo] || 'HQ'} · ${s.agente}: ${texto || s.titulo}`, urlTarjeta, false);
    return SIN_PUSH('informativo');
  }
  if (s.notificado_push) return SIN_PUSH('repetido');
  const subs = await supa(`/rest/v1/omc_push?empresa=eq.${encodeURIComponent(info.empresa)}&select=id,endpoint,sub`, {}, HQ.service);
  let importe = s.importe;
  if (importe == null) {
    // Sin importe explícito: se busca la licitación citada por expediente en el título o el detalle.
    try {
      const lics = await supa(`/rest/v1/omc_licitaciones?empresa=eq.${encodeURIComponent(info.empresa)}&select=expediente,importe`, {}, HQ.service);
      const txt = `${s.titulo} ${s.detalle}`.toLowerCase();
      const l = (lics || []).find((x) => x.expediente && x.expediente.length > 4 && txt.includes(String(x.expediente).toLowerCase()));
      if (l && l.importe != null) importe = l.importe;
    } catch {}
  }
  const extra = [importe != null ? `${Number(importe).toLocaleString('es-ES')} €` : '', s.vence ? `vence ${new Date(s.vence).toLocaleString('es-ES', { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''].filter(Boolean).join(' · ');
  const carga = JSON.stringify({
    title: texto ? `${s.agente} responde · #${s.id}` : `${TIPO[s.tipo] || 'HQ'} · ${s.agente}`,
    body: texto ? String(texto).slice(0, 300) : s.titulo + (extra ? `\n${extra}` : ''),
    url: urlTarjeta,
    tag: `hq-${s.id}`,
    renotify: false,
    id: s.id,
  });
  let enviados = 0, fallidos = 0;
  for (const fila of subs) {
    try {
      await webpush.sendNotification(fila.sub, carga, { TTL: 3600, urgency: 'high' });
      enviados++;
    } catch (e) {
      fallidos++;
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supa(`/rest/v1/omc_push?id=eq.${fila.id}`, { method: 'DELETE' }, HQ.service).catch(() => {});
      } else console.error('push error', e.statusCode, e.message);
    }
  }
  if (enviados) {
    await supa(`/rest/v1/omc_solicitudes?id=eq.${s.id}&empresa=eq.${encodeURIComponent(info.empresa)}`, { method: 'PATCH', body: JSON.stringify({ notificado_push: true }) }, HQ.service).catch((e) => console.error('notificado_push', e.message));
  }
  await registrarAviso(info.empresa, 'tarjeta', `${TIPO[s.tipo] || 'HQ'} · ${s.agente}: ${texto || s.titulo}`, urlTarjeta, enviados > 0);
  return { enviados, fallidos, dispositivos: subs.length };
}

// Mismo patrón que notificar(), pero para el hilo de una licitación (no tiene solicitud asociada): la resuelve por expediente.
// #2694: solo hay push con motivo 'adjudicacion' o 'requerimiento_diego'; el resto (plazos, modificaciones, aperturas, envíos incompletos) queda en Avisos.
const MOTIVOS_LIC = ['adjudicacion', 'requerimiento_diego'];
async function notificarLic(token, expediente, texto = '', motivo = '') {
  const info = await rpc('omc_token_info', { p_token: token });
  const lics = await supa(`/rest/v1/omc_licitaciones?empresa=eq.${encodeURIComponent(info.empresa)}&expediente=eq.${encodeURIComponent(expediente)}&select=expediente,organo,importe`, {}, HQ.service);
  const l = lics[0];
  if (!l) throw new Error('licitación no encontrada');
  const urlLic = `${WEB_HQ}#operacion/licitaciones?lic=${encodeURIComponent(l.expediente)}`;
  if (!MOTIVOS_LIC.includes(motivo)) {
    await registrarAviso(info.empresa, 'licitacion', `Licitación ${l.expediente}: ${texto || l.organo || 'aviso'}`, urlLic, false);
    return SIN_PUSH('informativo');
  }
  const subs = await supa(`/rest/v1/omc_push?empresa=eq.${encodeURIComponent(info.empresa)}&select=id,endpoint,sub`, {}, HQ.service);
  const extra = l.importe != null ? `${Number(l.importe).toLocaleString('es-ES')} €` : '';
  const carga = JSON.stringify({
    title: `Licitación ${l.expediente} responde`,
    body: texto ? String(texto).slice(0, 300) : (l.organo || l.expediente) + (extra ? `\n${extra}` : ''),
    url: urlLic,
    tag: `hq-lic-${l.expediente}`,
    renotify: false,
    lic: l.expediente,
  });
  let enviados = 0, fallidos = 0;
  for (const fila of subs) {
    try {
      await webpush.sendNotification(fila.sub, carga, { TTL: 3600, urgency: 'high' });
      enviados++;
    } catch (e) {
      fallidos++;
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supa(`/rest/v1/omc_push?id=eq.${fila.id}`, { method: 'DELETE' }, HQ.service).catch(() => {});
      } else console.error('push error', e.statusCode, e.message);
    }
  }
  await registrarAviso(info.empresa, 'licitacion', `Licitación ${l.expediente} (${motivo}): ${texto || l.organo || ''}`, urlLic, enviados > 0);
  return { enviados, fallidos, dispositivos: subs.length };
}

// Push agrupado (8-sep, ruido de notificaciones): un único aviso cuando hq-notificar.py encuentra varias
// tarjetas pendientes sin notificar a la vez, en vez de una por tarjeta. tag fijo 'hq-lote' para que un
// segundo aviso agrupado sustituya al anterior en vez de apilarse en la bandeja del móvil.
async function notificarLote(token, ids) {
  const info = await rpc('omc_token_info', { p_token: token });
  const subs = await supa(`/rest/v1/omc_push?empresa=eq.${encodeURIComponent(info.empresa)}&select=id,endpoint,sub`, {}, HQ.service);
  const filtro = ids.map((x) => Number(x)).filter(Number.isInteger).join(',');
  const tipos = await tiposAccion();
  const todas = await supa(`/rest/v1/omc_solicitudes?empresa=eq.${encodeURIComponent(info.empresa)}&id=in.(${filtro})&select=id,tipo,titulo,agente,notificado_push&order=created_at.asc`, {}, HQ.service);
  const filas = (todas || []).filter((f) => tipos.includes(f.tipo) && !f.notificado_push);
  if (!filas.length) return { ...SIN_PUSH('informativo'), tarjetas: 0 };
  const resumen = (filas || []).slice(0, 4).map((f) => `${TIPO[f.tipo] || f.tipo} · ${f.agente}: ${f.titulo}`).join('\n');
  const carga = JSON.stringify({
    title: `${filas.length} tarjetas pendientes de tu decisión`,
    body: resumen + (filas.length > 4 ? `\n… y ${filas.length - 4} más` : ''),
    url: `${WEB_HQ}#hoy`,
    tag: 'hq-lote',
    renotify: false,
  });
  let enviados = 0, fallidos = 0;
  for (const fila of subs) {
    try {
      await webpush.sendNotification(fila.sub, carga, { TTL: 3600, urgency: 'high' });
      enviados++;
    } catch (e) {
      fallidos++;
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supa(`/rest/v1/omc_push?id=eq.${fila.id}`, { method: 'DELETE' }, HQ.service).catch(() => {});
      } else console.error('push error', e.statusCode, e.message);
    }
  }
  if (enviados) {
    await supa(`/rest/v1/omc_solicitudes?empresa=eq.${encodeURIComponent(info.empresa)}&id=in.(${filas.map((f) => f.id).join(',')})`, { method: 'PATCH', body: JSON.stringify({ notificado_push: true }) }, HQ.service).catch((e) => console.error('notificado_push', e.message));
  }
  return { enviados, fallidos, dispositivos: subs.length, tarjetas: filas.length };
}

// ---- HQ: tareas pendientes de Diego (Windmill f/google/tareas_pendientes, solo lectura) ----
const TAREAS_RUTA = '/api/w/' + encodeURIComponent(process.env.WM_WORKSPACE || '') + '/jobs/run_wait_result/p/f/google/tareas_pendientes'; // ruta fija: no viene de la petición
const TAREAS_OK = Boolean(process.env.WM_URL && process.env.WM_WORKSPACE && process.env.WM_TOKEN_TAREAS && process.env.WM_TAREAS_RECURSO);
const TAREAS_ORIGEN = 'https://77delta.com';
const TAREAS_CACHE_MS = 60_000;
const TAREAS_LIMITE = 6; // por minuto
let tareasCache = { hasta: 0, valor: null };
let tareasVentana = [];
const tareasFallos = new Map(); // ip -> marcas de tiempo de fallos de auth
const TAREAS_LIMITE_FALLOS = 10; // fallos de auth por minuto y por IP
// IP del cliente: la última de X-Forwarded-For la añade el proxy (Coolify); sin proxy, la del socket.
const ipCliente = (req) => String(req.headers['x-forwarded-for'] || '').split(',').pop().trim().slice(0, 64) || req.socket.remoteAddress || '?';
const entero = (v) => (Number.isInteger(v) && v >= 0 ? v : null);
function tareasSaneadas(j) {
  const proximo = typeof j?.proximo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(j.proximo) ? j.proximo : null;
  const r = { abiertas: entero(j?.abiertas), sin_fecha: entero(j?.sin_fecha), vencidas: entero(j?.vencidas), hoy: entero(j?.hoy), proximo, ts: typeof j?.ts === 'string' ? j.ts.slice(0, 40) : null };
  if ([r.abiertas, r.sin_fecha, r.vencidas, r.hoy].includes(null)) throw new Error('respuesta no válida');
  return r;
}
async function tareasPendientes() {
  if (tareasCache.valor && Date.now() < tareasCache.hasta) return tareasCache.valor;
  const r = await fetch(process.env.WM_URL.replace(/\/$/, '') + TAREAS_RUTA, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.WM_TOKEN_TAREAS}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ google_tasks: process.env.WM_TAREAS_RECURSO }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!r.ok) throw new Error('windmill ' + r.status);
  const valor = tareasSaneadas(await r.json());
  tareasCache = { hasta: Date.now() + TAREAS_CACHE_MS, valor };
  return valor;
}

const servidor = http.createServer(async (req, res) => {
  cors(req, res);
  const ruta = new URL(req.url, 'http://x').pathname;
  if (req.method === 'OPTIONS') return void res.writeHead(204).end();
  if (req.method === 'GET' && (ruta === '/' || ruta === '/health')) return responder(res, 200, { ok: true, smtp: SMTP_OK, push: VAPID_OK, stt: STT_OK });

  if (ruta === '/hq/transcribir' && req.method === 'POST') {
    if (!STT_OK) return responder(res, 503, { ok: false, error: 'dictado no configurado' });
    const token = limpiar(req.headers['x-hq-token'], 120);
    if (!token) return responder(res, 401, { ok: false, error: 'falta token' });
    try {
      const info = await rpc('omc_token_info', { p_token: token });
      if (info.rol !== 'owner') return responder(res, 403, { ok: false, error: 'solo owner' });
      const audio = await leerBinario(req);
      if (audio.length < 1000) return responder(res, 400, { ok: false, error: 'audio vacío' });
      const text = await transcribir(audio, String(req.headers['content-type'] || ''));
      console.log('hq stt', audio.length, 'bytes ->', text.length, 'chars');
      return responder(res, 200, { ok: true, text });
    } catch (e) {
      console.error('hq transcribir', e.message);
      return responder(res, /token/i.test(e.message) ? 403 : 502, { ok: false, error: e.message });
    }
  }

  if (ruta === '/hq/tareas' && req.method === 'GET') {
    // CORS solo desde 77delta.com (sin www); errores genéricos, sin token ni cuerpo en logs.
    if (req.headers.origin !== TAREAS_ORIGEN) res.removeHeader('Access-Control-Allow-Origin');
    if (!TAREAS_OK || !HQ.url || !HQ.anon) return responder(res, 503, { ok: false, error: 'no disponible' });
    const ahora = Date.now();
    // Fallos de auth: tope por IP (no gasta el cupo de Diego ni lo bloquea un anónimo).
    const ip = ipCliente(req);
    const marcas = (tareasFallos.get(ip) || []).filter((t) => ahora - t < 60_000);
    if (marcas.length >= TAREAS_LIMITE_FALLOS) return responder(res, 429, { ok: false, error: 'demasiadas peticiones' });
    const fallo = (codigo) => {
      if (tareasFallos.size > 5000) tareasFallos.clear();
      tareasFallos.set(ip, [...marcas, ahora]);
      return responder(res, codigo, { ok: false, error: 'no autorizado' });
    };
    const m = /^Bearer (\S{1,120})$/.exec(String(req.headers.authorization || ''));
    if (!m) return fallo(401);
    let info;
    try { info = await rpc('omc_token_info', { p_token: m[1] }); } catch { return fallo(403); }
    if (info?.rol !== 'owner') return fallo(403);
    // El límite de 6/min cuenta solo peticiones de un owner autenticado.
    tareasVentana = tareasVentana.filter((t) => ahora - t < 60_000);
    if (tareasVentana.length >= TAREAS_LIMITE) return responder(res, 429, { ok: false, error: 'demasiadas peticiones' });
    tareasVentana.push(ahora);
    try {
      return responder(res, 200, await tareasPendientes());
    } catch {
      console.error('hq tareas: fallo al consultar');
      return responder(res, 502, { ok: false, error: 'no disponible' });
    }
  }
  if (ruta === '/hq/config' && req.method === 'GET') {
    // Configuración pública de la app (URL y clave anon de Supabase): así el repo público no lleva ninguna clave.
    if (!HQ.url || !HQ.anon) return responder(res, 503, { ok: false, error: 'HQ no configurado' });
    return responder(res, 200, { ok: true, url: HQ.url, anon: HQ.anon, publicKey: process.env.VAPID_PUBLIC || null });
  }
  if (ruta === '/hq/vapid' && req.method === 'GET') {
    if (!VAPID_OK) return responder(res, 503, { ok: false, error: 'avisos no configurados' });
    return responder(res, 200, { ok: true, publicKey: process.env.VAPID_PUBLIC });
  }
  if (ruta === '/hq/notificar' && req.method === 'POST') {
    if (!VAPID_OK) return responder(res, 503, { ok: false, error: 'avisos no configurados' });
    let cuerpo;
    try { cuerpo = await leerJson(req); } catch { return responder(res, 400, { ok: false, error: 'Cuerpo no válido.' }); }
    const token = limpiar(cuerpo.token, 120), id = Number(cuerpo.id);
    if (!token || !Number.isInteger(id)) return responder(res, 400, { ok: false, error: 'Faltan token o id.' });
    try {
      const r = await notificar(token, id, String(cuerpo.texto ?? '').trim().slice(0, 300));
      console.log('hq push', id, JSON.stringify(r));
      return responder(res, 200, { ok: true, ...r });
    } catch (e) {
      console.error('hq notificar', e.message);
      return responder(res, /token|encontrada/i.test(e.message) ? 403 : 502, { ok: false, error: e.message });
    }
  }
  if (ruta === '/hq/notificar-lote' && req.method === 'POST') {
    // Lo llama solo hq-notificar.py (cron), nunca un agente directamente.
    if (!VAPID_OK) return responder(res, 503, { ok: false, error: 'avisos no configurados' });
    let cuerpo;
    try { cuerpo = await leerJson(req); } catch { return responder(res, 400, { ok: false, error: 'Cuerpo no válido.' }); }
    const token = limpiar(cuerpo.token, 120), ids = Array.isArray(cuerpo.ids) ? cuerpo.ids : [];
    if (!token || !ids.length) return responder(res, 400, { ok: false, error: 'Faltan token o ids.' });
    try {
      const r = await notificarLote(token, ids);
      console.log('hq push lote', ids.length, JSON.stringify(r));
      return responder(res, 200, { ok: true, ...r });
    } catch (e) {
      console.error('hq notificar-lote', e.message);
      return responder(res, /token/i.test(e.message) ? 403 : 502, { ok: false, error: e.message });
    }
  }
  if (ruta === '/hq/notificar-lic' && req.method === 'POST') {
    // Avisa a Diego cuando un agente responde en el hilo de una licitación (no tiene solicitud asociada, por eso va aparte de /hq/notificar).
    if (!VAPID_OK) return responder(res, 503, { ok: false, error: 'avisos no configurados' });
    let cuerpo;
    try { cuerpo = await leerJson(req); } catch { return responder(res, 400, { ok: false, error: 'Cuerpo no válido.' }); }
    const token = limpiar(cuerpo.token, 120), expediente = limpiar(cuerpo.expediente, 120);
    if (!token || !expediente) return responder(res, 400, { ok: false, error: 'Faltan token o expediente.' });
    try {
      const r = await notificarLic(token, expediente, String(cuerpo.texto ?? '').trim().slice(0, 300), limpiar(cuerpo.motivo, 40));
      console.log('hq push lic', expediente, JSON.stringify(r));
      return responder(res, 200, { ok: true, ...r });
    } catch (e) {
      console.error('hq notificar-lic', e.message);
      return responder(res, /token|encontrada/i.test(e.message) ? 403 : 502, { ok: false, error: e.message });
    }
  }

  // Hiring Argentina: GET da la URL del servidor MCP del reto; POST valida la forma del token y reenvia a Windmill.
  if (ruta === '/hiring' && req.method === 'GET') {
    return responder(res, 200, { ok: true, mcp_url: process.env.MCP_URL || '' });
  }
  if (ruta === '/hiring' && req.method === 'POST') {
    const ipH = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (!permitido(ipH, 'hiring')) return responder(res, 429, { ok: false, errores: ['demasiados_envios'] });
    let cuerpoH;
    try { cuerpoH = await leerJson(req, MAX_HIRING); } catch { return responder(res, 400, { ok: false, errores: ['cuerpo_invalido'] }); }
    const prep = prepararHiring(cuerpoH);
    if (prep.honeypot) return responder(res, 200, { ok: true });
    if (prep.error) return responder(res, 400, { ok: false, errores: [prep.error] });
    const r = await reenviarHiring(prep.payload, process.env);
    console.log('hiring', r.codigo);
    responder(res, r.codigo, r.cuerpo);
    if (r.codigo === 200) eventoUmami('form-empleo', { url: '/trabaja-con-nosotros/', datos: { origen: limpiar(cuerpoH.origen, 200) } });
    return;
  }

  if (ruta === '/verifix' && req.method === 'POST') {
    const ipv = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (!permitido(ipv, 'verifix:')) return responder(res, 429, { ok: false, error: 'Demasiados envíos. Prueba en unos minutos.' });
    let cuerpoV;
    try { cuerpoV = await leerJson(req); } catch { return responder(res, 400, { ok: false, error: 'Cuerpo no válido.' }); }
    const v = validarVerifix(cuerpoV, ipv, process.env.VERIFIX_IP_SALT || '');
    if (v.honeypot) return responder(res, 200, { ok: true });
    if (v.error) return responder(res, 400, { ok: false, error: v.error });
    await guardar({ tipo_lead: 'verifix', ...v.lead });
    console.log('lead verifix', JSON.stringify({ tipo: v.lead.tipo, idioma: v.lead.idioma }));
    const enBase = await insertarSupabase(v.lead, { url: HQ.url, service: HQ.service });
    responder(res, 200, { ok: true, enviado: Boolean(transporte), registrado: enBase });
    if (!transporte) return;
    transporte.sendMail(correoVerifix(v.lead, MAIL_FROM, MAIL_TO))
      .then((info) => console.log('smtp ok verifix', info.messageId))
      .catch((e) => console.error('smtp error verifix', e.message, '· lead guardado en', LEADS_FILE));
    return;
  }

  if (ruta === '/docureal' && req.method === 'POST') {
    const ipd = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
    if (!permitido(ipd, 'docureal:')) return responder(res, 429, { ok: false, error: 'Demasiados envíos. Prueba en unos minutos.' });
    let cuerpoD;
    try { cuerpoD = await leerJson(req); } catch { return responder(res, 400, { ok: false, error: 'Cuerpo no válido.' }); }
    const d = validarDocureal(cuerpoD, ipd, process.env.VERIFIX_IP_SALT || '');
    if (d.honeypot) return responder(res, 200, { ok: true });
    if (d.error) return responder(res, 400, { ok: false, error: d.error });
    await guardar({ tipo_lead: 'docureal', ...d.lead });
    console.log('lead docureal', JSON.stringify({ tipo: d.lead.tipo, idioma: d.lead.idioma }));
    const enBaseD = await insertarDocureal(d.lead, { url: HQ.url, service: HQ.service });
    responder(res, 200, { ok: true, enviado: Boolean(transporte), registrado: enBaseD });
    eventoUmami('form-docureal', { sitio: 'docureal', url: d.lead.idioma === 'es' ? '/' : `/${d.lead.idioma}/`, datos: { tipo: d.lead.tipo, idioma: d.lead.idioma, origen: d.lead.origen || '' } });
    if (!transporte) return;
    transporte.sendMail(correoDocureal(d.lead, MAIL_FROM, MAIL_TO))
      .then((info) => console.log('smtp ok docureal', info.messageId))
      .catch((e) => console.error('smtp error docureal', e.message, '· lead guardado en', LEADS_FILE));
    return;
  }

  if (req.method !== 'POST' || ruta !== '/contacto') return responder(res, 404, { ok: false, error: 'no encontrado' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (!permitido(ip)) return responder(res, 429, { ok: false, error: 'Demasiados envíos. Prueba en unos minutos.' });

  let cuerpo;
  try {
    cuerpo = await leerJson(req);
  } catch {
    return responder(res, 400, { ok: false, error: 'Cuerpo no válido.' });
  }

  // Honeypot: los bots rellenan el campo oculto.
  if (cuerpo.web) return responder(res, 200, { ok: true });

  const lead = {
    fecha: new Date().toISOString(),
    nombre: limpiar(cuerpo.nombre, 120),
    empresa: limpiar(cuerpo.empresa, 120),
    email: limpiar(cuerpo.email, 160),
    sector: limpiar(cuerpo.sector, 80),
    mensaje: String(cuerpo.mensaje ?? '').trim().slice(0, 5000),
    origen: limpiar(cuerpo.origen, 200),
    ip,
  };
  if (!lead.nombre || !lead.empresa || !lead.mensaje || !esEmail(lead.email)) {
    return responder(res, 400, { ok: false, error: 'Faltan datos o el email no es válido.' });
  }

  await guardar(lead);
  console.log('lead', JSON.stringify({ ...lead, mensaje: lead.mensaje.slice(0, 80) }));

  // El lead ya está a salvo: respondemos ya y el correo sale en segundo plano.
  responder(res, 200, { ok: true, enviado: Boolean(transporte) });
  eventoUmami('form-contacto', { url: '/contacto/', datos: { sector: lead.sector, origen: lead.origen || '' } });
  if (!transporte) return;

  const texto = [
    `Nombre: ${lead.nombre}`,
    `Empresa: ${lead.empresa}`,
    `Email: ${lead.email}`,
    `Sector: ${lead.sector}`,
    `Origen: ${lead.origen || '77delta.com/contacto'}`,
    '',
    lead.mensaje,
  ].join('\n');

  transporte
    .sendMail({
      from: `"77 Delta · web" <${MAIL_FROM}>`,
      to: MAIL_TO,
      replyTo: `"${lead.nombre}" <${lead.email}>`,
      subject: `Contacto web · ${lead.empresa}`,
      text: texto,
    })
    .then((info) => console.log('smtp ok', info.messageId, lead.email))
    .catch((e) => console.error('smtp error', e.message, '· lead guardado en', LEADS_FILE));
});

servidor.listen(PORT, () => console.log(`api.77delta.com en :${PORT} · smtp=${SMTP_OK} · push=${VAPID_OK} · leads=${LEADS_FILE}`));
