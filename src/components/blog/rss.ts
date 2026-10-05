import { entradas, type Idioma } from '../../lib/blog';
import { site } from '../../lib/site';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** RSS 2.0 a mano: sin dependencias nuevas. */
export async function rss(idioma: Idioma, origen: URL | undefined) {
  const base = new URL(idioma === 'ca' ? '/ca/blog/' : '/blog/', origen);
  const lista = await entradas(idioma);
  const items = lista
    .map((e) => {
      const url = new URL(`${e.id}/`, base).href;
      return `<item><title>${esc(e.data.title)}</title><link>${url}</link><guid>${url}</guid><pubDate>${e.data.pubDate.toUTCString()}</pubDate><description>${esc(e.data.description)}</description></item>`;
    })
    .join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(site.nombre)} - Blog</title><link>${base.href}</link><description>${esc(site.descripcion)}</description><language>${idioma === 'ca' ? 'ca-ES' : 'es-ES'}</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
