/**
 * Datos de la web en un solo sitio. Todo lo que cambie con el dominio,
 * el email o la sociedad se toca aquí y en ningún otro fichero.
 */
import { getRelativeLocaleUrl } from 'astro:i18n';
export const site = {
  nombre: '77 Delta',
  claim: 'Aplicamos la IA para ahorrar costes a tu empresa',
  claimCa: 'Apliquem la IA per estalviar costos a la teva empresa',
  descripcion:
    'Consultora de inteligencia artificial para pymes en Barcelona. Diagnóstico gratuito, implantación con IA, ciberseguridad, identidad digital y espacios de datos.',
  descripcionCa:
    "Consultora d'intel·ligència artificial per a pimes a Barcelona. Diagnòstic gratuït, implantació amb IA, ciberseguretat, identitat digital i espais de dades.",
  ciudad: 'Barcelona',
  // Pendiente: activar el buzón cuando se compre el dominio.
  email: 'hola@77delta.com',
  calendario: 'https://calendar.app.google/ao7C7FPBjBN75rXEA',
  /** El mismo calendario en su forma incrustable, para el iframe de /contacto/. */
  calendarioIncrustado:
    'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3pfbrqEtWjhAnykMUU6mUm29AMTInOz-4caDB41ZZdulctouHVZMdU-94Ou_JvoLRQRKeKY7Us?gv=true',
  /** Endpoint del formulario de contacto (carpeta api/ del repo). Si falla, el formulario cae a mailto. */
  formulario: 'https://api.77delta.com/contacto',
  linkedin: 'https://www.linkedin.com/in/diegotorreslopez',
  /** Con prefijo internacional, solo dígitos (34XXXXXXXXX). Vacío = sin botón flotante. */
  whatsapp: '34622436789',
  sociedad: 'Next Gen Academy SL',
  cif: 'B44861649',
  direccion: 'Carrer Penedès 27, 08184 Palau-solità i Plegamans, Barcelona',
  anio: 2026,
} as const;

/** Antepone el `base` de Astro a una ruta interna. Usar en todos los enlaces internos (páginas en castellano). */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (path === '/' || path === '') return `${base}/`;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Rutas de recursos estáticos (imágenes, iconos): no van bajo /ca/, son las mismas en los dos idiomas. */
const esRecursoEstatico = (path: string) => path.startsWith('/img/') || /\.(webp|png|svg|jpe?g|ico|pdf)$/i.test(path);

/**
 * Igual que `href`, pero para las páginas en catalán: antepone /ca/ (routing i18n de Astro,
 * prefixDefaultLocale: false). Usar en todos los enlaces internos de src/pages/ca/.
 * Los recursos estáticos (/img/...) se sirven igual que en castellano, sin prefijo de idioma.
 */
export function hrefCa(path: string): string {
  if (esRecursoEstatico(path)) return href(path);
  const limpio = path === '/' || path === '' ? '' : path.replace(/^\//, '');
  return getRelativeLocaleUrl('ca', limpio);
}

/** Slugs de primer nivel que cambian en catalán (reorden 2026-10). El resto comparte slug bajo /ca/. */
export const slugsCa: Readonly<Record<string, string>> = {
  'inteligencia-artificial': 'intel-ligencia-artificial',
  ciberseguridad: 'ciberseguretat',
  'identidad-digital': 'identitat-digital',
  'espacios-de-datos': 'espais-de-dades',
  herramientas: 'eines',
};
const slugsEs: Readonly<Record<string, string>> = Object.fromEntries(Object.entries(slugsCa).map(([es, ca]) => [ca, es]));
const traduceSlug = (pathname: string, mapa: Readonly<Record<string, string>>) =>
  pathname.replace(/^\/([^/]+)\//, (todo, slug) => (mapa[slug] ? `/${mapa[slug]}/` : todo));

/** Dado un pathname de castellano (p.ej. '/servicios/'), la ruta equivalente en catalán. */
export function equivalenteCa(pathnameEs: string): string {
  return hrefCa(traduceSlug(pathnameEs, slugsCa));
}

/** Dado un pathname de catalán bajo /ca/, la ruta equivalente en castellano. */
export function equivalenteEs(pathnameCa: string): string {
  const sinCa = traduceSlug(pathnameCa.replace(/^\/ca(\/|$)/, '/'), slugsEs);
  // La 404 en castellano es un fichero especial plano (dist/404.html, lo exige GitHub Pages),
  // no una carpeta: no lleva barra final como el resto de páginas.
  if (sinCa === '/404' || sinCa === '/404/') return href('/404.html');
  return href(sinCa === '' ? '/' : sinCa);
}

/** Entrada del menú. `hijos` pinta un desplegable al pasar el ratón (y el bloque anidado en el menú móvil). */
export interface ItemNav {
  texto: string;
  ruta: string;
  /** Texto corto en mono bajo el nombre, dentro del desplegable (p. ej. el precio desde). */
  nota?: string;
  hijos?: readonly ItemNav[];
}

/**
 * Menú principal (reorden 2026-10): Qué hacemos (4 líneas: IA, ciberseguridad, identidad digital,
 * espacios de datos), para quién (Sectores), pruebas (Resultados), Blog y Sobre nosotros. Contacto va en el botón "Reservar diagnóstico" y en el pie.
 */
export const nav: readonly ItemNav[] = [
  {
    texto: 'Qué hacemos',
    ruta: '/inteligencia-artificial/',
    hijos: [
      { texto: 'Inteligencia artificial', ruta: '/inteligencia-artificial/' },
      { texto: 'Ciberseguridad', ruta: '/ciberseguridad/' },
      { texto: 'Identidad digital', ruta: '/identidad-digital/' },
      { texto: 'Espacios de datos', ruta: '/espacios-de-datos/' },
    ],
  },
  { texto: 'Sectores', ruta: '/sectores/' },
  {
    texto: 'Resultados',
    ruta: '/historias-de-exito/',
    hijos: [
      { texto: 'Historias de éxito', ruta: '/historias-de-exito/' },
      { texto: 'Casos de uso', ruta: '/casos-de-uso/' },
      { texto: 'Proyectos en curso', ruta: '/proyectos-en-curso/' },
    ],
  },
  { texto: 'Blog', ruta: '/blog/' },
  { texto: 'Sobre nosotros', ruta: '/sobre-nosotros/' },
];

/** Analítica sin cookies (Umami). Vacío = sin script. */
export const umami = {
  script: 'https://stats.77delta.com/script.js',
  websiteId: '0847eaa4-a0ce-47ee-9acf-8e796160bdd9',
} as const;

/** Verificación de Google Search Console. En cuanto haya token, se pega aquí. */
export const searchConsole = '';

export const cta = { texto: 'Reservar diagnóstico', ruta: '/contacto/' } as const;

/** Mismas rutas que `nav`, en catalán, para las páginas de /ca/. */
export const navCa: readonly ItemNav[] = [
  {
    texto: 'Què fem',
    ruta: '/intel-ligencia-artificial/',
    hijos: [
      { texto: 'Intel·ligència artificial', ruta: '/intel-ligencia-artificial/' },
      { texto: 'Ciberseguretat', ruta: '/ciberseguretat/' },
      { texto: 'Identitat digital', ruta: '/identitat-digital/' },
      { texto: 'Espais de dades', ruta: '/espais-de-dades/' },
    ],
  },
  { texto: 'Sectors', ruta: '/sectores/' },
  {
    texto: 'Resultats',
    ruta: '/historias-de-exito/',
    hijos: [
      { texto: 'Històries d’èxit', ruta: '/historias-de-exito/' },
      { texto: 'Casos d’ús', ruta: '/casos-de-uso/' },
      { texto: 'Projectes en curs', ruta: '/proyectos-en-curso/' },
    ],
  },
  { texto: 'Blog', ruta: '/blog/' },
  { texto: 'Sobre nosaltres', ruta: '/sobre-nosotros/' },
];

export const ctaCa = { texto: 'Reservar diagnòstic', ruta: '/contacto/' } as const;
