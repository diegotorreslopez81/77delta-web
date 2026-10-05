import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const esquema = z.object({
  title: z.string(),
  /** Título SEO corto (<title> y og:title). Con ' · 77 Delta' no pasa de 60. El H1 sigue siendo title. */
  tituloSeo: z.string().max(49).optional(),
  description: z.string().max(170),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  cluster: z.enum(['ia-pymes', 'automatizacion', 'ayudas']),
  /** Palabra clave objetivo del brief. No se muestra. */
  keyword: z.string(),
  /** Idioma declarado en el frontmatter de los artículos (la colección ya lo fija). */
  lang: z.string().optional(),
  /** "En 3 puntos": caja de resumen tras el título (3 frases cortas). */
  puntos: z.array(z.string()).max(4).default([]),
  /** Imagen de cabecera 1200x630 (ruta bajo /public). Si falta, se usa la del cluster. */
  imagen: z.string().optional(),
  imagenAlt: z.string().default(''),
  /** Icono por h2: {"Cómo funciona": "flujo"}. Ver src/lib/iconos.ts. */
  iconos: z.record(z.string()).default({}),
  /** Hasta 3 cifras clave, solo con fuente ya citada en el artículo. */
  cifras: z.array(z.object({ valor: z.string(), texto: z.string(), fuente: z.string() })).max(3).default([]),
  /** Diagrama a mitad de artículo, al final de la sección `ubicacion` (texto exacto del h2). */
  diagrama: z
    .object({
      tipo: z.enum(['pasos', 'antes-despues']),
      titulo: z.string(),
      ubicacion: z.string(),
      items: z.array(z.object({ t: z.string(), d: z.string().optional() })).optional(),
      antes: z.object({ titulo: z.string(), items: z.array(z.string()) }).optional(),
      despues: z.object({ titulo: z.string(), items: z.array(z.string()) }).optional(),
    })
    .optional(),
  draft: z.boolean().default(false),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  fuentes: z.array(z.object({ titulo: z.string(), url: z.string().url() })).default([]),
});

// Castellano en src/content/blog/<slug>.md, catalán en src/content/blog/ca/<slug>.md (mismo slug).
export const collections = {
  blog: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/blog' }), schema: esquema }),
  blogCa: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/blog/ca' }), schema: esquema }),
};
