// lastmod del sitemap: fecha real del último cambio del contenido de cada URL.
// Blog: updatedDate o pubDate del frontmatter. Resto: último commit de la página y de sus datos.
// Si no hay fuente fiable no se devuelve fecha (mejor sin lastmod que uno falso).
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const datosPor = [
  [/^\/(ca\/)?servicios\//, ['src/data/servicios.ts', 'src/data/servicios.ca.ts']],
  [/^\/(ca\/)?sectores\//, ['src/data/sectores.ts', 'src/data/sectores.ca.ts']],
  [/^\/(ca\/)?productos\//, ['src/data/productos.ts']],
];

const git = (ficheros) => {
  const f = ficheros.filter(existsSync);
  if (!f.length) return null;
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI', '--', ...f], { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
};

export function lastmod(pathname) {
  const p = pathname.replace(/\/$/, '');
  const blog = /^(\/ca)?\/blog\/([^/]+)$/.exec(p);
  if (blog) {
    const f = `src/content/blog/${blog[1] ? 'ca/' : ''}${blog[2]}.md`;
    if (!existsSync(f)) return null;
    const fm = readFileSync(f, 'utf8').split('---')[1] ?? '';
    const m = /^updatedDate:\s*(\S+)/m.exec(fm) ?? /^pubDate:\s*(\S+)/m.exec(fm);
    return m ? new Date(m[1].replace(/['"]/g, '')).toISOString() : null;
  }
  const base = p || '/index';
  const paginas = [`src/pages${base}.astro`, `src/pages${base}/index.astro`, `src/pages${base.replace(/\/[^/]+$/, '')}/[slug].astro`];
  const datos = datosPor.find(([re]) => re.test(pathname))?.[1] ?? [];
  const fecha = git([...paginas, ...datos]);
  return fecha;
}
