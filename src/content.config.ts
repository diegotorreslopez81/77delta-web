import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const esquema = z.object({
  title: z.string(),
  description: z.string().max(170),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  cluster: z.enum(['ia-pymes', 'automatizacion', 'ayudas']),
  /** Palabra clave objetivo del brief. No se muestra. */
  keyword: z.string(),
  draft: z.boolean().default(false),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  fuentes: z.array(z.object({ titulo: z.string(), url: z.string().url() })).default([]),
});

// Castellano en src/content/blog/<slug>.md, catalán en src/content/blog/ca/<slug>.md (mismo slug).
export const collections = {
  blog: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/blog' }), schema: esquema }),
  blogCa: defineCollection({ loader: glob({ pattern: '*.md', base: './src/content/blog/ca' }), schema: esquema }),
};
