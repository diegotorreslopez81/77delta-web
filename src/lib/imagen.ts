/**
 * Dimensiones intrínsecas de una imagen de `public/` leídas en tiempo de build, para
 * emitir `width` y `height` en las etiquetas <img> y evitar saltos de maquetación (CLS).
 * Sin dependencias: lee la cabecera de PNG y WebP y el `viewBox` o `width`/`height` de SVG.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface Dimensiones {
  width: number;
  height: number;
}

const cache = new Map<string, Dimensiones | null>();

function png(b: Buffer): Dimensiones | null {
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function webp(b: Buffer): Dimensiones | null {
  if (b.length < 30 || b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const tipo = b.toString('ascii', 12, 16);
  if (tipo === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (tipo === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (tipo === 'VP8X') return { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
  return null;
}

function svg(b: Buffer): Dimensiones | null {
  const s = b.toString('utf8', 0, Math.min(b.length, 4000));
  const vb = s.match(/viewBox="([\d.\-]+)[ ,]+([\d.\-]+)[ ,]+([\d.]+)[ ,]+([\d.]+)"/);
  if (vb) return { width: Math.round(Number(vb[3])), height: Math.round(Number(vb[4])) };
  const w = s.match(/<svg[^>]*\swidth="([\d.]+)/);
  const h = s.match(/<svg[^>]*\sheight="([\d.]+)/);
  return w && h ? { width: Math.round(Number(w[1])), height: Math.round(Number(h[1])) } : null;
}

/** `ruta` es la ruta pública, por ejemplo `/img/logos/accio.png`. Devuelve null si no se puede leer. */
export function dimensiones(ruta: string): Dimensiones | null {
  if (cache.has(ruta)) return cache.get(ruta)!;
  let d: Dimensiones | null = null;
  try {
    const b = readFileSync(join(process.cwd(), 'public', ruta));
    d = ruta.endsWith('.svg') ? svg(b) : ruta.endsWith('.png') ? png(b) : ruta.endsWith('.webp') ? webp(b) : null;
  } catch {
    d = null;
  }
  cache.set(ruta, d);
  return d;
}
