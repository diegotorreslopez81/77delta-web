// IndexedDB mínimo en memoria para probar sw.js y app/avisos.js con node --test (solo lo que usan: un almacén con
// clave autoincremental; add, put, get, getAll, getAllKeys, delete, clear). Las peticiones responden en una tarea
// aparte y la transacción termina cuando no queda ninguna en vuelo, como en un navegador.
export function crearIDB() {
  const bases = new Map();
  function peticion(tx, op) {
    const r = { result: undefined, error: null, onsuccess: null, onerror: null };
    tx.pendientes++;
    try { r.result = op(); } catch (e) { r.error = e; }
    setTimeout(() => {
      if (r.error) { if (r.onerror) r.onerror(); tx.error = r.error; tx.fallar(); } else if (r.onsuccess) r.onsuccess();
      tx.pendientes--; tx.comprobar();
    }, 0);
    return r;
  }
  function crearTx(datos, modo) {
    const tx = { pendientes: 0, acabada: false, error: null, oncomplete: null, onerror: null, onabort: null,
      comprobar() { setTimeout(() => { if (!tx.pendientes && !tx.acabada) { tx.acabada = true; if (tx.oncomplete) tx.oncomplete(); } }, 0); },
      fallar() { if (!tx.acabada) { tx.acabada = true; if (tx.onabort) tx.onabort(); } },
      objectStore() {
        const escribir = () => { if (modo !== 'readwrite') throw new Error('ReadOnlyError'); };
        return {
          add: v => peticion(tx, () => { escribir(); const n = ++datos.contador; datos.filas.set(n, { ...v, n }); return n; }),
          put: v => peticion(tx, () => { escribir(); datos.filas.set(v.n, { ...v }); return v.n; }),
          get: n => peticion(tx, () => { const f = datos.filas.get(n); return f && { ...f }; }),
          getAll: () => peticion(tx, () => [...datos.filas.values()].map(f => ({ ...f }))),
          getAllKeys: () => peticion(tx, () => [...datos.filas.keys()].sort((a, b) => a - b)),
          delete: n => peticion(tx, () => { escribir(); datos.filas.delete(n); }),
          clear: () => peticion(tx, () => { escribir(); datos.filas.clear(); }),
        };
      } };
    tx.comprobar();
    return tx;
  }
  return {
    bases,
    open(nombre) {
      const r = { result: null, error: null, onsuccess: null, onerror: null, onupgradeneeded: null };
      setTimeout(() => {
        let datos = bases.get(nombre);
        const nueva = !datos;
        if (nueva) { datos = { contador: 0, filas: new Map(), almacen: null }; bases.set(nombre, datos); }
        r.result = { close() {}, createObjectStore(a) { datos.almacen = a; return {}; }, transaction(a, modo = 'readonly') { return crearTx(datos, modo); } };
        if (nueva && r.onupgradeneeded) r.onupgradeneeded();
        if (r.onsuccess) r.onsuccess();
      }, 0);
      return r;
    },
  };
}
