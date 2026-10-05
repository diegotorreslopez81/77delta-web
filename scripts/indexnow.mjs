// Avisa a Bing, Yandex y otros buscadores (IndexNow) de URLs nuevas o cambiadas.
// Uso: node scripts/indexnow.mjs [--enviar] [url ...]
// Sin URLs toma todo el sitemap de dist/. Sin --enviar solo muestra lo que enviaría.
// Se ejecuta a mano tras publicar; no forma parte del deploy.
import { readFileSync, readdirSync } from 'node:fs';

const host = '77delta.com';
const clave = readdirSync('public').find((f) => /^[0-9a-f]{32}\.txt$/.test(f))?.replace('.txt', '');
if (!clave) throw new Error('Falta el fichero de clave en public/');

const args = process.argv.slice(2);
const enviar = args.includes('--enviar');
let urls = args.filter((a) => a.startsWith('https://'));
if (!urls.length) {
  urls = [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}
console.log(`${urls.length} URLs, clave ${clave.slice(0, 6)}...`);
if (!enviar) process.exit(0);

const r = await fetch('https://api.indexnow.org/IndexNow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: clave, keyLocation: `https://${host}/${clave}.txt`, urlList: urls }),
});
console.log(r.status, r.statusText);
