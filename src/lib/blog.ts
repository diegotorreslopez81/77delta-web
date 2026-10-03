import { getCollection, type CollectionEntry } from 'astro:content';

export type Idioma = 'es' | 'ca';
export type Entrada = CollectionEntry<'blog'> | CollectionEntry<'blogCa'>;

export const clusters = {
  es: { 'ia-pymes': 'IA en pymes industriales', automatizacion: 'Automatización de procesos', ayudas: 'Ayudas y financiación' },
  ca: { 'ia-pymes': 'IA a pimes industrials', automatizacion: 'Automatització de processos', ayudas: 'Ajuts i finançament' },
} as const;

/** Entradas publicadas (sin borradores), más recientes primero. */
export async function entradas(idioma: Idioma): Promise<Entrada[]> {
  const lista = idioma === 'ca' ? await getCollection('blogCa') : await getCollection('blog');
  return lista.filter((e) => !e.data.draft).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export const fecha = (d: Date, idioma: Idioma) =>
  d.toLocaleDateString(idioma === 'ca' ? 'ca-ES' : 'es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
