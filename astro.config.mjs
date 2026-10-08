// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lastmod } from './scripts/lastmod.mjs';

// Dominio propio (public/CNAME). Para una previsualización bajo otra ruta, exportar SITE_URL y SITE_BASE.
const site = process.env.SITE_URL ?? 'https://77delta.com';
const base = process.env.SITE_BASE ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  // La seguridad de IA vivió unas horas en la raíz antes de pasar a ser un servicio más.
  redirects: { '/seguridad-ia': '/servicios/seguridad-ia/' },
  build: { format: 'directory' },
  // Castellano en la raíz (no rompe URLs ya indexadas), catalán bajo /ca/.
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'ca'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/propuestas/'),
      serialize: (item) => {
        const f = lastmod(new URL(item.url).pathname);
        if (f) item.lastmod = f;
        return item;
      },
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-ES', ca: 'ca-ES' },
      },
    }),
    // GitHub Pages no admite redirecciones: /sitemap.xml sirve una copia del índice.
    {
      name: 'sitemap-xml',
      hooks: {
        'astro:build:done': ({ dir }) => {
          copyFileSync(
            fileURLToPath(new URL('sitemap-index.xml', dir)),
            fileURLToPath(new URL('sitemap.xml', dir)),
          );
        },
      },
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
