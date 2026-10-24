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
  build: { format: 'directory' },
  // Castellano en la raíz (no rompe URLs ya indexadas), catalán bajo /ca/ e inglés bajo /en/ (rutas en inglés, mapa en lib/site.ts).
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'ca', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      // Fuera del sitemap: propuestas y los puentes de la reordenación (no deben indexarse por sí mismos).
      filter: (page) => {
        const ruta = new URL(page).pathname;
        return (
          !ruta.includes('/propuestas/') &&
          !/^\/(ca\/)?productos\//.test(ruta) &&
          !/^\/en\/products\//.test(ruta) &&
          !/^\/(ca\/)?servicios\/(seguridad-ia\/)?$/.test(ruta) &&
          !/^\/en\/services\/(ai-security\/)?$/.test(ruta) &&
          ruta !== '/seguridad-ia/'
        );
      },
      serialize: (item) => {
        const f = lastmod(new URL(item.url).pathname);
        if (f) item.lastmod = f;
        return item;
      },
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-ES', ca: 'ca-ES', en: 'en' },
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
