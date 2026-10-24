/**
 * Datos de la web en un solo sitio. Todo lo que cambie con el dominio,
 * el email o la sociedad se toca aquí y en ningún otro fichero.
 */
import { getRelativeLocaleUrl } from 'astro:i18n';
export const site = {
  nombre: '77 Delta',
  claim: 'Aplicamos la IA para ahorrar costes a tu empresa',
  claimCa: 'Apliquem la IA per estalviar costos a la teva empresa',
  claimEn: 'We apply AI to cut costs in your business',
  descripcion:
    'Consultora de inteligencia artificial para pymes en Barcelona. Diagnóstico gratuito, implantación con IA, ciberseguridad, identidad digital y espacios de datos.',
  descripcionCa:
    "Consultora d'intel·ligència artificial per a pimes a Barcelona. Diagnòstic gratuït, implantació amb IA, ciberseguretat, identitat digital i espais de dades.",
  descripcionEn:
    'Technology consultancy for small and mid-sized businesses. Free assessment, AI-driven operational transformation, AI assistant security audits and technology partnership. Barcelona.',
  ciudad: 'Barcelona',
  // Pendiente: activar el buzón cuando se compre el dominio.
  email: 'hola@77delta.com',
  calendario: 'https://calendar.app.google/ao7C7FPBjBN75rXEA',
  /** El mismo calendario en su forma incrustable, para el iframe de /contacto/. */
  calendarioIncrustado:
    'https://calendar.google.com/calendar/appointments/schedules/AcZssZ3pfbrqEtWjhAnykMUU6mUm29AMTInOz-4caDB41ZZdulctouHVZMdU-94Ou_JvoLRQRKeKY7Us?gv=true',
  /** Endpoint del formulario de contacto (carpeta api/ del repo). Si falla, el formulario cae a mailto. */
  formulario: 'https://api.77delta.com/contacto',
  linkedin: 'https://www.linkedin.com/in/torreslopezdiego',
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

/** Idiomas con versión completa de la web. */
export type Idioma = 'es' | 'ca' | 'en';
export const hreflangs: Record<Idioma, string> = { es: 'es-ES', ca: 'ca-ES', en: 'en' };
export const etiquetasIdioma: Record<Idioma, string> = { es: 'Castellano', ca: 'Català', en: 'English' };

/**
 * Rutas en inglés: slug propio por página, bajo /en/. Clave = ruta canónica en castellano.
 * Las páginas dinámicas (sectores, historias, productos) comparten slug con el castellano y van por prefijo.
 */
export const rutasEn: Record<string, string> = {
  '/': '/en/',
  '/servicios/': '/en/services/',
  '/servicios/director-ia/': '/en/ai-director/',
  '/servicios/diagnostico/': '/en/services/assessment/',
  '/servicios/transformacion/': '/en/services/transformation/',
  '/servicios/seguridad-ia/': '/en/services/ai-security/',
  '/servicios/partner/': '/en/services/technology-partner/',
  '/sectores/': '/en/sectors/',
  '/casos-de-uso/': '/en/use-cases/',
  '/historias-de-exito/': '/en/success-stories/',
  '/estudio-asistentes-ia/': '/en/ai-assistants-study/',
  '/proyectos-en-curso/': '/en/ongoing-projects/',
  '/productos/': '/en/products/',
  '/licita/': '/en/licita/',
  '/sobre-nosotros/': '/en/about/',
  '/contacto/': '/en/contact/',
  '/trabaja-con-nosotros/': '/en/work-with-us/',
  '/aviso-legal/': '/en/legal-notice/',
  '/politica-privacidad/': '/en/privacy-policy/',
  '/politica-cookies/': '/en/cookie-policy/',
  '/blog/': '/en/blog/',
};
const prefijosEn: readonly [string, string][] = [
  ['/sectores/', '/en/sectors/'],
  ['/historias-de-exito/', '/en/success-stories/'],
  ['/productos/', '/en/products/'],
];

/** Quita el `base` de Astro y deja la ruta con barra final (salvo la 404). */
function sinBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let r = base && pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  if (!r.startsWith('/')) r = `/${r}`;
  r = r.split(/[?#]/)[0];
  if (!r.endsWith('/') && !/\.[a-z0-9]+$/i.test(r)) r += '/';
  return r;
}

/** Idioma de una ruta por su prefijo. */
export function idiomaDeRuta(pathname: string): Idioma {
  const r = sinBase(pathname);
  if (/^\/ca(\/|$)/.test(r)) return 'ca';
  if (/^\/en(\/|$)/.test(r)) return 'en';
  return 'es';
}

/** Ruta canónica en castellano de cualquier ruta (es, ca o en). null si no existe equivalente (p. ej. slug inglés desconocido). */
export function rutaCanonicaEs(pathname: string): string | null {
  const r = sinBase(pathname);
  const idioma = idiomaDeRuta(r);
  if (idioma === 'es') return r;
  if (idioma === 'ca') {
    // Quita el prefijo y deshace los slugs propios del catalán (ciberseguretat -> ciberseguridad).
    const sinCa = traduceSlug(r.replace(/^\/ca(\/|$)/, '/'), slugsEs);
    return sinCa === '' ? '/' : sinCa;
  }
  const fija = Object.entries(rutasEn).find(([, en]) => en === r);
  if (fija) return fija[0];
  for (const [es, en] of prefijosEn) if (r.startsWith(en)) return es + r.slice(en.length);
  return null;
}

/** Ruta en inglés (con base) de una ruta canónica en castellano. null si esa página no tiene versión inglesa. */
function rutaEnDe(rutaEs: string): string | null {
  if (rutasEn[rutaEs]) return href(rutasEn[rutaEs]);
  for (const [es, en] of prefijosEn) if (rutaEs.startsWith(es) && rutaEs.length > es.length) return href(en + rutaEs.slice(es.length));
  return null;
}

/**
 * Ruta equivalente de la página actual en otro idioma, con base. null si no existe
 * (artículos del blog y ayuntamientos no tienen versión inglesa).
 */
export function equivalente(pathname: string, destino: Idioma): string | null {
  const es = rutaCanonicaEs(pathname);
  if (es === null) return null;
  if (destino === 'es') return equivalenteEs(es);
  if (destino === 'ca') return equivalenteCa(es);
  return rutaEnDe(es);
}

/**
 * Igual que `href`, para las páginas en inglés: recibe la ruta canónica en castellano
 * (p. ej. '/servicios/') y devuelve su URL inglesa. Si la página no tiene versión inglesa, enlaza a la castellana.
 * Los recursos estáticos se sirven sin prefijo de idioma. Usar en todos los enlaces internos de src/pages/en/.
 */
export function hrefEn(path: string): string {
  if (esRecursoEstatico(path) || /^https?:/.test(path) || path.startsWith('#')) return href(path);
  const [ruta, ancla] = path.split('#');
  const destino = ruta === '' ? href('/') : (rutaEnDe(sinBase(ruta)) ?? href(ruta));
  return ancla ? `${destino}#${ancla}` : destino;
}

/** Función de enlace interno según el idioma de la página. */
export function enlaceDe(idioma: Idioma): (path: string) => string {
  return idioma === 'ca' ? hrefCa : idioma === 'en' ? hrefEn : href;
}

/** Mismas rutas que `nav`, en inglés, para las páginas de /en/ (las rutas son las canónicas en castellano; `hrefEn` las traduce). */
export const navEn: readonly ItemNav[] = [
  {
    texto: 'Services',
    ruta: '/servicios/',
    hijos: [
      { texto: 'Fractional AI director', ruta: '/servicios/director-ia/', nota: 'From €1,200/month' },
      { texto: 'Assessment', ruta: '/servicios/diagnostico/', nota: 'Free' },
      { texto: 'Operational transformation', ruta: '/servicios/transformacion/' },
      { texto: 'AI security', ruta: '/servicios/seguridad-ia/' },
      { texto: 'Technology partner', ruta: '/servicios/partner/' },
    ],
  },
  { texto: 'Sectors', ruta: '/sectores/' },
  {
    texto: 'Results',
    ruta: '/historias-de-exito/',
    hijos: [
      { texto: 'Case studies', ruta: '/historias-de-exito/' },
      { texto: 'Use cases', ruta: '/casos-de-uso/' },
      { texto: 'Study: AI assistants', ruta: '/estudio-asistentes-ia/' },
      { texto: 'Ongoing projects', ruta: '/proyectos-en-curso/' },
    ],
  },
  { texto: 'Products', ruta: '/productos/' },
  { texto: 'Blog', ruta: '/blog/' },
  { texto: 'About us', ruta: '/sobre-nosotros/' },
];

export const ctaEn = { texto: 'Book a free assessment', ruta: '/contacto/' } as const;
