// Iconos de los bloques de Hoy (#2584 V3). Mismo trazo que los de rutas.js: svg 24x24 dibujado a mano, sin librerías.
// Se insertan con innerHTML (ui.js el({html})) para que el navegador los parsee como SVG real.
const svg = d => '<svg class="ico" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
export const ICONOS_HOY = {
  decidir: svg('<path d="M12 3v9"/><path d="M8 8l4 4 4-4"/><path d="M4 15h16v5H4z"/>'),
  captacion: svg('<path d="M3 5h18l-7 8v6l-4-2v-4z"/>'),
  firmar: svg('<path d="M4 20h6"/><path d="M14 4l6 6-9 9H5v-6z"/>'),
  web: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>'),
};
