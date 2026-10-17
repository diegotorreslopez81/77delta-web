// POST /docureal: alta en la lista de demo de DocuReal (docureal.77delta.com).
// Calco de verifix.mjs: logica pura con dependencias inyectadas para probarla sin red ni SMTP.
import { createHash } from 'node:crypto';

export const TIPOS = ['agencia', 'administrador', 'aseguradora', 'otro'];
export const IDIOMAS = ['es', 'en', 'ca', 'eu', 'gl', 'va'];
export const CANDIDATURAS = ['', 'menos-5', '5-20', '21-50', 'mas-50'];
export const PREFERENCIAS = ['49-mes', 'por-verificacion', 'no-se'];
export const ASUNTO = 'DocuReal: petición de demo';
export const TABLA = 'docureal_lista_espera';

const limpiar = (v, max) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, max);
const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

// Devuelve {honeypot:true}, {error} o {lead}. La IP no se guarda en claro: solo su hash.
export function validar(cuerpo, ip, sal = '') {
  if (cuerpo && cuerpo.web) return { honeypot: true };
  const email = limpiar(cuerpo?.email, 160).toLowerCase();
  const empresa = limpiar(cuerpo?.empresa, 120);
  const tipo = limpiar(cuerpo?.tipo, 20).toLowerCase();
  if (!esEmail(email) || !empresa || !TIPOS.includes(tipo)) return { error: 'Faltan datos o el email no es válido.' };
  const idiomaIn = limpiar(cuerpo?.idioma, 5).toLowerCase();
  const idioma = IDIOMAS.includes(idiomaIn) ? idiomaIn : 'es';
  const candIn = limpiar(cuerpo?.candidaturas_mes, 10);
  const candidaturas_mes = CANDIDATURAS.includes(candIn) ? candIn : '';
  const prefIn = limpiar(cuerpo?.preferencia_precio, 20);
  const preferencia_precio = PREFERENCIAS.includes(prefIn) ? prefIn : 'no-se';
  const ya_me_paso = cuerpo?.ya_me_paso === true || cuerpo?.ya_me_paso === 'true';
  const comentario = String(cuerpo?.comentario ?? '').replace(/[\r\t]+/g, ' ').trim().slice(0, 1000);
  const origen = limpiar(cuerpo?.origen, 200) || 'docureal.77delta.com';
  const ip_hash = createHash('sha256').update(`${sal}|${ip}`).digest('hex');
  return { lead: { fecha: new Date().toISOString(), email, empresa, tipo, idioma, candidaturas_mes, ya_me_paso, preferencia_precio, comentario, origen, ip_hash } };
}

export const fila = (lead) => ({
  email: lead.email, empresa: lead.empresa, tipo: lead.tipo, idioma: lead.idioma, candidaturas_mes: lead.candidaturas_mes,
  ya_me_paso: lead.ya_me_paso, preferencia_precio: lead.preferencia_precio, comentario: lead.comentario, origen: lead.origen, ip_hash: lead.ip_hash,
});

// Alta sin duplicar (el paso 2 de la landing reenvia el mismo email con comentario): si el email existe actualiza
// los datos de esa fila (created_at, origen e ip_hash se conservan); si no, inserta. Fallo blando: devuelve true/false.
export async function insertarSupabase(lead, { url, service }, http = fetch) {
  if (!url || !service) return false;
  const headers = { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json' };
  const base = `${url}/rest/v1/${TABLA}`;
  try {
    const { empresa, tipo, idioma, candidaturas_mes, ya_me_paso, preferencia_precio, comentario } = fila(lead);
    const u = await http(`${base}?email=eq.${encodeURIComponent(lead.email)}&select=id`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ empresa, tipo, idioma, candidaturas_mes, ya_me_paso, preferencia_precio, comentario }),
      signal: AbortSignal.timeout(10_000),
    });
    if (u.ok) {
      const filas = await u.json().catch(() => []);
      if (Array.isArray(filas) && filas.length > 0) return true;
    } else {
      console.error('docureal supabase patch', u.status);
    }
    const r = await http(base, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(fila(lead)),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) console.error('docureal supabase', r.status);
    return r.ok;
  } catch (e) {
    console.error('docureal supabase', e.message);
    return false;
  }
}

export function correo(lead, de, para) {
  return {
    from: `"77 Delta · DocuReal" <${de}>`,
    to: para,
    replyTo: lead.email,
    subject: ASUNTO,
    text: [`Email: ${lead.email}`, `Empresa: ${lead.empresa}`, `Tipo: ${lead.tipo}`, `Idioma: ${lead.idioma}`,
      `Candidaturas al mes: ${lead.candidaturas_mes || '-'}`, `Ya le colaron un documento falso: ${lead.ya_me_paso ? 'sí' : 'no'}`,
      `Preferencia de precio: ${lead.preferencia_precio}`, `Comentario: ${lead.comentario || '-'}`, `Origen: ${lead.origen}`].join('\n'),
  };
}
