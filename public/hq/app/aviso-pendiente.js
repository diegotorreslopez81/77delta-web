// C1/C3 (18-10, ronda 2): iOS puede abrir la PWA al tocar un aviso SIN entregar notificationclick al sw (push 300,
// 12:54). Fallback que no depende del toque: al arrancar o volver visible la página lee los avisos guardados por
// sw.js en IndexedDB y enseña un banner fijo con el último sin leer. Misma vía traza pagina_* y banner_* en omc_push_traza.
// Pura: { aviso, total } con el más reciente sin leer y cuántos hay sin leer (criterio C1 ronda 2: sin límite de edad,
// nada se pierde). Mismo desempate por n.
export function decidirAviso(avisos) {
  const sin = (avisos || []).filter(a => a && !a.leido).sort((a, b) => b.t - a.t || b.n - a.n);
  return { aviso: sin[0] || null, total: sin.length };
}
// "hace 5 min" / "hace 2 h" / "hace 3 d".
export function haceCuanto(t, ahora = Date.now()) {
  const m = Math.max(0, Math.floor((ahora - t) / 60000));
  return m < 1 ? 'hace un momento' : m < 60 ? 'hace ' + m + ' min' : m < 1440 ? 'hace ' + Math.floor(m / 60) + ' h' : 'hace ' + Math.floor(m / 1440) + ' d';
}

// Hash seguro de un aviso: solo mismo origen y ruta /hq/. null si no vale.
export function hashDeAviso(aviso, origen) {
  try { const u = new URL(aviso.url, origen); return u.origin === origen && u.pathname.startsWith('/hq/') && u.hash ? u.hash : null; } catch { return null; }
}

// Traza desde la página a la misma RPC que usa sw.js (omc_push_traza, autenticada con el endpoint). Nunca lanza.
export async function trazarPagina(evento, datos, { reg, cfg, fetchFn = globalThis.fetch } = {}) {
  try {
    if (!cfg || !cfg.url || !cfg.anon || !reg) return null;
    const sub = await reg.pushManager.getSubscription();
    if (!sub || !sub.endpoint) return null;
    return await fetchFn(cfg.url + '/rest/v1/rpc/omc_push_traza', { method: 'POST', keepalive: true,
      headers: { 'Content-Type': 'application/json', apikey: cfg.anon, Authorization: 'Bearer ' + cfg.anon },
      body: JSON.stringify({ p_endpoint: sub.endpoint, p_evento: evento, p_datos: { origen: 'pagina', t: Date.now(), ...datos } }) });
  } catch { return null; }
}
