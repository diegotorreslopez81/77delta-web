// Hiring Argentina: filtro y reenvio del formulario a Windmill f/hiring/alta.
// La clave de Windmill vive aqui, en el servidor; el navegador solo lleva el token de un solo uso del reto MCP.
// La validacion real del token (hash, caducidad, un solo uso) la hace f/hiring/alta en la base.
export const CAMPOS = ['nombre', 'email', 'pais', 'perfil', 'anios', 'enlace', 'uso_ia', 'tarifa_hora', 'idioma', 'origen', 'cv_nombre', 'cv_base64'];
export const MAX_CUERPO = 8_000_000; // CV de 5 MB en base64 mas el resto de campos
const FORMA_TOKEN = /^[A-Za-z0-9_-]{32,64}$/;

export function preparar(cuerpo) {
  if (cuerpo.web) return { honeypot: true };
  if (!FORMA_TOKEN.test(String(cuerpo.token ?? ''))) return { error: 'token_invalido' };
  const payload = { token: cuerpo.token, consentimiento: cuerpo.consentimiento === true };
  for (const c of CAMPOS) payload[c] = String(cuerpo[c] ?? '');
  return { payload };
}

// Devuelve {codigo, cuerpo}. Nunca reenvia texto del candidato ni errores internos de Windmill al navegador.
export async function reenviar(payload, env, fetchFn = fetch) {
  if (!env.WM_URL || !env.WM_WORKSPACE || !env.WM_ALTA_TOKEN) return { codigo: 503, cuerpo: { ok: false, errores: ['servicio'] } };
  try {
    const r = await fetchFn(`${env.WM_URL.replace(/\/$/, '')}/api/w/${env.WM_WORKSPACE}/jobs/run_wait_result/p/f/hiring/alta`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WM_ALTA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok || !j || typeof j.ok !== 'boolean') return { codigo: 502, cuerpo: { ok: false, errores: ['servicio'] } };
    if (j.ok) return { codigo: 200, cuerpo: { ok: true } };
    const errores = Array.isArray(j.errores) ? j.errores.filter((e) => /^[a-z_]{1,40}$/.test(e)) : [];
    return { codigo: 400, cuerpo: { ok: false, errores } };
  } catch {
    return { codigo: 502, cuerpo: { ok: false, errores: ['servicio'] } };
  }
}
