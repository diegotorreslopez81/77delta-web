/** Juego único de iconos del blog: 24x24, trazo 1.5, sin relleno. Se pintan con máscara CSS (color = currentColor). */
export const iconos = {
  flujo: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="18" r="2"/><path d="M7 6h4a3 3 0 0 1 3 3v0a3 3 0 0 0 3 3M7 18h4a3 3 0 0 0 3-3v0"/>',
  alerta: '<path d="M12 4 2.5 20h19L12 4Z"/><path d="M12 10v4.5M12 17.2v.1"/>',
  dato: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  ejemplo: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
  lista: '<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="18" r=".8"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 2.8 2.8L16 9.5"/>',
  cruz: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  euro: '<path d="M18 6.5A7 7 0 1 0 18 17.5M4 10h9M4 14h9"/>',
  escudo: '<path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.5 7.5-5 7.5-9.5V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  engranaje: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  documento: '<path d="M7 3h7l5 5v13H7V3Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  personas: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.3"/><path d="M17 14c2.5 0 4.5 2 4.5 4.5"/>',
  pregunta: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17v.1"/>',
  lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/>',
  objetivo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  candado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  flecha: '<path d="M4 12h16M14 6l6 6-6 6"/>',
};

const svg = (c) =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>${c}</svg>`;

/** CSS con una variable --i por icono, para usar con mask-image. */
export const cssIconos = Object.entries(iconos)
  .map(([n, c]) => `.i-${n}{--i:url("data:image/svg+xml,${encodeURIComponent(svg(c))}")}`)
  .join('\n');

/** Palabras clave de un h2 -> icono, cuando el frontmatter no lo indica. */
export const porPalabra = [
  [/error|errada|errors/i, 'alerta'],
  [/no hace|no fa|límite|limit/i, 'cruz'],
  [/cómo funciona|com funciona|paso a paso|passos/i, 'flujo'],
  [/medir|mesur|resultado|resultat/i, 'dato'],
  [/caso|cas /i, 'personas'],
  [/antes de empezar|abans de comen|requisit|hace falta/i, 'check'],
  [/problema/i, 'documento'],
  [/seguir|continuar|siguiente/i, 'flecha'],
  [/ayuda|ajut|subvenc|cupó|cupo/i, 'euro'],
  [/seguridad|seguretat|datos|dades/i, 'escudo'],
  [/prioridad|criteri|empezar|començar/i, 'objetivo'],
];

/** Delta de marca (brand/delta.svg), como máscara. */
const delta = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 745 730'><path fill='black' fill-rule='evenodd' transform='translate(0 730.0)' d='M721.2 0L24 0L277.3-730L468.9-730L721.2 0M369.9-566.4L224.4-124L521.8-124L375.8-566.4'/></svg>`;
export const cssDelta = `:root{--delta:url("data:image/svg+xml,${encodeURIComponent(delta)}")}`;
