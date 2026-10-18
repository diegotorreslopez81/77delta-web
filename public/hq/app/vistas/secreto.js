// Enviar secreto (spec 6, 18-10): cifra en el navegador con NaCl box (tweetnacl vendorizado, sin CDN) y envía solo el cifrado.
// El valor nunca se guarda, se registra ni se muestra de nuevo: el campo se vacía al enviar. Sin trazas ni Umami.
import { el, fecha } from '../ui.js';

let cargadores = {
  config: async () => (await fetch('/hq/secretos-pubkey.json', { cache: 'no-store' })).json(),
  lista: async () => (await import('../api.js')).rpc('omc_secreto_lista'),
  enviar: async a => (await import('../api.js')).rpc('omc_secreto_enviar', a),
  nacl: () => new Promise((ok, ko) => {
    if (globalThis.nacl) return ok(globalThis.nacl);
    const s = document.createElement('script');
    s.src = '/hq/vendor/nacl-fast.min.js';
    s.onload = () => ok(globalThis.nacl); s.onerror = () => ko(new Error('nacl'));
    document.head.append(s);
  }),
};
export function usarCargadores(o) { cargadores = { ...cargadores, ...o }; }

const b64 = u8 => { let s = ''; u8.forEach(b => { s += String.fromCharCode(b); }); return btoa(s); };
const deB64 = t => Uint8Array.from(atob(t), c => c.charCodeAt(0));
export const normalizaVariable = v => String(v || '').toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/^[^A-Z]+/, '').slice(0, 64);

// NaCl box con par efímero: la privada efímera se descarta al salir; solo la clave del servidor puede descifrar.
export async function huella(pubkeyB64) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', deB64(pubkeyB64)));
  return Array.from(h.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}

// Destino y variable van DENTRO del cifrado (requisito 2 de Pere); las columnas de la tabla son solo informativas.
export function cifrar(nacl, pubkeyB64, { destino, variable, valor }) {
  const pub = deB64(pubkeyB64);
  if (pub.length !== 32) throw new Error('clave');
  const par = nacl.box.keyPair(), nonce = nacl.randomBytes(24);
  const id = b64(nacl.randomBytes(12));
  const c = nacl.box(new TextEncoder().encode(JSON.stringify({ destino, variable, valor, id, ts: new Date().toISOString() })), nonce, pub, par.secretKey);
  par.secretKey.fill(0);
  return { p_cifrado: b64(c), p_nonce: b64(nonce), p_pubkey_efimera: b64(par.publicKey) };
}

export function pintarLista(filas) {
  if (!filas?.length) return el('p', { class: 'mudo', text: 'Nada enviado todavía' });
  return el('ul', { class: 'secreto-lista' }, filas.map(f => el('li', {}, [
    el('span', { text: f.variable + ' · ' + f.destino + ' · ' + fecha(f.creado_en, { hora: true }) }),
    el('span', { class: 'pill ' + (f.recogido_en ? 'verde' : 'ambar'), text: f.recogido_en ? 'recogido ' + fecha(f.recogido_en, { hora: true }) : 'pendiente' }),
  ])));
}

export function render(raiz, S) {
  const cont = el('section', { class: 'home-bloque secreto' }, [el('h2', { text: 'Enviar secreto' })]);
  raiz.append(cont);
  if (S?.datos?.rol !== 'owner') { cont.append(el('p', { class: 'mudo', text: 'Solo Diego' })); return; }
  const huellaP = el('p', { class: 'mudo' });
  const msg = el('p', { class: 'mudo', role: 'status' });
  const listaBox = el('div');
  const destino = el('select', { 'aria-label': 'Destino', class: 'campo' });
  const variable = el('input', { type: 'text', class: 'campo', placeholder: 'VARIABLE', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Variable' });
  const valor = el('input', { type: 'password', class: 'campo', placeholder: 'Valor', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Valor' });
  const nota = el('input', { type: 'text', class: 'campo', placeholder: 'Nota (opcional)', autocomplete: 'off', maxlength: '200', 'aria-label': 'Nota' });
  const ver = el('button', { type: 'button', class: 'btn', text: 'Ver' });
  const mostrar = on => { valor.type = on ? 'text' : 'password'; };
  ['pointerdown', 'touchstart'].forEach(e => ver.addEventListener(e, ev => { ev.preventDefault(); mostrar(true); }));
  ['pointerup', 'pointerleave', 'pointercancel', 'touchend', 'touchcancel'].forEach(e => ver.addEventListener(e, () => mostrar(false)));
  const pegar = el('button', { type: 'button', class: 'btn', text: 'Pegar' });
  pegar.addEventListener('click', async () => {
    try { valor.value = await navigator.clipboard.readText(); msg.textContent = ''; actualizar(); } catch { msg.textContent = 'Pega a mano'; }
  });
  const enviar = el('button', { type: 'button', class: 'btn primario', text: 'Enviar cifrado', disabled: 'disabled' });
  const actualizar = () => { enviar.disabled = !(destino.value && variable.value && valor.value); };
  variable.addEventListener('input', () => { const n = normalizaVariable(variable.value); if (n !== variable.value) variable.value = n; actualizar(); });
  [valor, destino].forEach(c => c.addEventListener('input', actualizar));
  const recargarLista = () => cargadores.lista().then(f => listaBox.replaceChildren(pintarLista(f))).catch(() => listaBox.replaceChildren(el('p', { class: 'mudo', text: 'No se pudo cargar la lista' })));
  let pubkey = null;
  cargadores.config().then(c => {
    pubkey = c?.pubkey || null;
    (c?.destinos || []).forEach(d => destino.append(el('option', { value: d, text: d })));
    if (!pubkey) msg.textContent = 'No se puede cifrar: falta la clave del servidor, avisa al chief';
    else huella(pubkey).then(h => { huellaP.textContent = 'Huella de la clave: ' + h; });
    actualizar();
  }).catch(() => { msg.textContent = 'No se pudo cargar la configuración'; });
  enviar.addEventListener('click', async () => {
    if (!pubkey) { msg.textContent = 'No se puede cifrar: falta la clave del servidor, avisa al chief'; return; }
    enviar.disabled = true;
    try {
      const nacl = await cargadores.nacl();
      const c = cifrar(nacl, pubkey, { destino: destino.value, variable: variable.value, valor: valor.value });
      valor.value = ''; mostrar(false);
      await cargadores.enviar({ p_destino: destino.value, p_variable: variable.value, p_nota: nota.value || null, ...c });
      variable.value = ''; nota.value = '';
      msg.textContent = 'Enviado. Se recoge en la máquina de los agentes en minutos';
      recargarLista();
    } catch { valor.value = ''; msg.textContent = 'No enviado, vuelve a intentarlo'; }
    actualizar();
  });
  cont.append(
    el('label', {}, ['Destino', destino]), el('label', {}, ['Variable', variable]),
    el('div', { class: 'home-botones' }, [valor, ver, pegar]), el('label', {}, ['Nota', nota]),
    enviar, el('p', { class: 'mudo', text: 'Se cifra en tu móvil; el servidor solo ve el cifrado' }), huellaP, msg,
    el('h3', { text: 'Enviados' }), listaBox);
  recargarLista();
}
