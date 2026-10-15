// POST /verifix: alta en la lista de espera de Verifix (verifix.77delta.com).
// Lógica pura y con dependencias inyectadas para poder probarla sin red ni SMTP.
import { createHash } from 'node:crypto';

export const TIPOS = ['gestoria', 'empresa'];
export const IDIOMAS = ['es', 'en', 'ca'];
export const ASUNTO = 'Verifix: alta en la lista de espera';
export const TABLA = 'verifix_lista_espera';

const limpiar = (v, max) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Devuelve {honeypot:true}, {error} o {lead}. La IP no se guarda en claro: solo su hash.
export function validar(cuerpo, ip, sal = '') {
  if (cuerpo && cuerpo.web) return { honeypot: true };
  const email = limpiar(cuerpo?.email, 160).toLowerCase();
  const empresa = limpiar(cuerpo?.empresa, 120);
  const tipo = limpiar(cuerpo?.tipo, 20).toLowerCase();
  const idiomaIn = limpiar(cuerpo?.idioma, 5).toLowerCase();
  const idioma = IDIOMAS.includes(idiomaIn) ? idiomaIn : 'es';
  if (!esEmail(email) || !empresa || !TIPOS.includes(tipo)) {
    return { error: 'Faltan datos o el email no es válido.' };
  }
  const ya_me_ha_pasado = cuerpo?.ya_me_ha_pasado === true || cuerpo?.ya_me_ha_pasado === 'true';
  const programa = limpiar(cuerpo?.programa, 40);
  const origen = limpiar(cuerpo?.origen, 200) || 'verifix.77delta.com';
  const ip_hash = createHash('sha256').update(`${sal}|${ip}`).digest('hex');
  return { lead: { fecha: new Date().toISOString(), email, empresa, tipo, idioma, ya_me_ha_pasado, programa, origen, ip_hash } };
}

// Fila para Supabase: solo las columnas de la tabla (id y created_at los pone la base).
export const fila = (lead) => ({
  email: lead.email, empresa: lead.empresa, tipo: lead.tipo, idioma: lead.idioma, ya_me_ha_pasado: lead.ya_me_ha_pasado, programa: lead.programa, origen: lead.origen, ip_hash: lead.ip_hash,
});

// Alta en Supabase sin duplicar: si el email ya existe actualiza empresa, tipo, idioma, ya_me_ha_pasado y
// programa de esa fila (created_at, origen e ip_hash se conservan); si no, inserta.
// Fallo blando: nunca lanza, devuelve true/false.
export async function insertarSupabase(lead, { url, service }, http = fetch) {
  if (!url || !service) return false;
  const headers = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };
  const base = `${url}/rest/v1/${TABLA}`;
  try {
    const { empresa, tipo, idioma, ya_me_ha_pasado, programa } = fila(lead);
    const u = await http(`${base}?email=eq.${encodeURIComponent(lead.email)}&select=id`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ empresa, tipo, idioma, ya_me_ha_pasado, programa }),
      signal: AbortSignal.timeout(10_000),
    });
    if (u.ok) {
      const filas = await u.json().catch(() => []);
      if (Array.isArray(filas) && filas.length > 0) return true;
    } else {
      console.error('verifix supabase patch', u.status);
    }
    const r = await http(base, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(fila(lead)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) console.error('verifix supabase', r.status);
    return r.ok;
  } catch (e) {
    console.error('verifix supabase', e.message);
    return false;
  }
}

export function correo(lead, de, para) {
  return {
    from: `"77 Delta · Verifix" <${de}>`,
    to: para,
    replyTo: lead.email,
    subject: ASUNTO,
    text: [`Email: ${lead.email}`, `Empresa: ${lead.empresa}`, `Tipo: ${lead.tipo}`, `Idioma: ${lead.idioma}`, `Ya me ha pasado: ${lead.ya_me_ha_pasado ? 'sí' : 'no'}`, `Programa: ${lead.programa || '-'}`, `Origen: ${lead.origen}`].join('\n'),
  };
}
