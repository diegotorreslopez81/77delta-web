// #2159: avisos push guardados por sw.js en IndexedDB para poder releerlos si la notificación se cierra o se pierde.
// El esquema lo comparte sw.js: base 'hq-avisos' v1, almacén 'avisos', clave autoincremental 'n'.
// Cada aviso: { n, t (ms), title, body, url, id, lic, tag, leido }.
const BD = 'hq-avisos', ALMACEN = 'avisos';

const pedir = r => new Promise((ok, ko) => { r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
const acabar = tx => new Promise((ok, ko) => { tx.oncomplete = () => ok(); tx.onerror = tx.onabort = () => ko(tx.error); });

function abrir(idb) {
  if (!idb) return Promise.reject(new Error('IndexedDB no disponible'));
  return new Promise((ok, ko) => {
    const r = idb.open(BD, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(ALMACEN, { keyPath: 'n', autoIncrement: true }); };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
  });
}
async function conAlmacen(idb, modo, fn) {
  const db = await abrir(idb);
  try {
    const tx = db.transaction(ALMACEN, modo), fin = acabar(tx);
    const res = await fn(tx.objectStore(ALMACEN));
    await fin;
    return res;
  } finally { db.close(); }
}

export function listar(idb = globalThis.indexedDB) {
  return conAlmacen(idb, 'readonly', s => pedir(s.getAll())).then(l => l.sort((a, b) => b.t - a.t || b.n - a.n));
}
export function marcarLeido(n, idb = globalThis.indexedDB) {
  return conAlmacen(idb, 'readwrite', async s => { const a = await pedir(s.get(n)); if (a) { a.leido = true; s.put(a); } });
}
export function marcarTodosLeidos(idb = globalThis.indexedDB) {
  return conAlmacen(idb, 'readwrite', async s => { for (const a of await pedir(s.getAll())) if (!a.leido) { a.leido = true; s.put(a); } });
}
export function vaciar(idb = globalThis.indexedDB) {
  return conAlmacen(idb, 'readwrite', s => { s.clear(); });
}
export const sinLeer = avisos => avisos.filter(a => !a.leido).length;

// Enlace dentro de la app: el hash de la url del aviso ('/hq/#hoy/12' da '#hoy/12'); sin hash, la Home.
export const enlaceLic = exp => '#operacion/licitaciones?exp=' + encodeURIComponent(exp);
export function enlaceApp(url, lic) {
  if (lic) return enlaceLic(lic);
  const i = String(url || '').indexOf('#');
  return i >= 0 && url.length > i + 1 ? url.slice(i) : '#hoy';
}
