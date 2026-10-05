// Transforma el HTML renderizado del artículo: iconos en h2, llamadas (> **Dato:** ...) y un diagrama a mitad de artículo.
import { porPalabra } from './iconos.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plano = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
const llamadas = { dato: 'dato', dada: 'dato', ojo: 'alerta', compte: 'alerta', ejemplo: 'ejemplo', exemple: 'ejemplo' };

function diagrama(d) {
  if (d.tipo === 'antes-despues') {
    const col = (c, clase, ico) =>
      `<div class="dg-col ${clase}"><p class="dg-tit"><span class="dg-ico i-${ico}"></span>${esc(c.titulo)}</p><ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`;
    return `<figure class="diagrama dg-ad" role="group" aria-label="${esc(d.titulo)}"><figcaption>${esc(d.titulo)}</figcaption><div class="dg-cols">${col(d.antes, 'dg-antes', 'cruz')}<span class="dg-flecha i-flecha"></span>${col(d.despues, 'dg-despues', 'check')}</div></figure>`;
  }
  return `<figure class="diagrama dg-pasos" role="group" aria-label="${esc(d.titulo)}"><figcaption>${esc(d.titulo)}</figcaption><ol>${d.items
    .map((p, k) => `<li><span class="dg-n">${k + 1}</span><strong>${esc(p.t)}</strong><span>${esc(p.d ?? '')}</span></li>`)
    .join('')}</ol></figure>`;
}

/** Id ASCII: sin acentos ni signos. */
export const idAscii = (id) => id.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase();

export function transformar(html, d) {
  const mapa = d.iconos ?? {};
  let pendiente = false;
  // h2 e inserción del diagrama al final de la sección indicada
  let out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (m, attrs, inner) => {
    const t = plano(inner);
    let previo = '';
    if (pendiente) { previo = diagrama(d.diagrama); pendiente = false; }
    if (d.diagrama && t === d.diagrama.ubicacion) pendiente = true;
    const ico = mapa[t] ?? porPalabra.find(([re]) => re.test(t))?.[1];
    return previo + (ico ? `<h2${attrs} class="h2-ico i-${ico}">${inner}</h2>` : m);
  });
  if (pendiente) out += diagrama(d.diagrama);
  // llamadas
  out = out.replace(/<blockquote>(\s*<p><strong>([^<]*)<\/strong>)/g, (m, resto, clave) => {
    const k = llamadas[clave.toLowerCase().replace(/[:.\s]/g, '')];
    return k ? `<blockquote class="llamada ll-${k} i-${k}">${resto}` : m;
  });
  out = out.replace(/<(h[23])([^>]*?) id="([^"]+)"/g, (m, h, a, id) => `<${h}${a} id="${idAscii(id)}"`);
  return out;
}
