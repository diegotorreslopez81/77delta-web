import type { APIRoute } from 'astro';
import base from '../lib/llms-base.txt?raw';
import { entradas } from '../lib/blog';

const sitio = 'https://77delta.com';

// Sección Blog generada desde la colección: se actualiza sola al publicar.
export const GET: APIRoute = async () => {
  const es = await entradas('es');
  const ca = await entradas('ca');
  const linea = (e: (typeof es)[number], prefijo: string) =>
    `- [${e.data.title}](${sitio}${prefijo}/blog/${e.id.replace(/^ca\//, '')}/): ${e.data.description}`;
  const bloque = es.length + ca.length === 0
    ? ''
    : [
        '## Blog',
        '',
        `- [Blog](${sitio}/blog/): guías prácticas de IA aplicada a la pyme industrial.`,
        ...es.map((e) => linea(e, '')),
        ...(ca.length ? [`- [Blog en catalán](${sitio}/ca/blog/)`, ...ca.map((e) => linea(e, '/ca'))] : []),
        '',
        '',
      ].join('\n');
  const texto = base.replace('## Empresa', `${bloque}## Empresa`);
  return new Response(texto, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
