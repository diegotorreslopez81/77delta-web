/** Contenido de la página para ayuntamientos en cuatro idiomas. Sin cifras, clientes ni resultados. */

export type Idioma = 'es' | 'ca' | 'gl' | 'eu';

export interface Area {
  icono: string;
  titulo: string;
  frase: string;
  casos: string[];
}

export interface Servicio {
  icono: string;
  titulo: string;
  texto: string;
}

export interface Contenido {
  idioma: Idioma;
  etiquetaIdioma: string;
  ruta: string;
  meta: { title: string; description: string };
  eyebrow: string;
  h1: [string, string, string];
  lead: string;
  boton: string;
  selector: string;
  areasEyebrow: string;
  areasTitulo: string;
  serviciosEyebrow: string;
  serviciosTitulo: string;
  servicios: Servicio[];
  acred: { sello: string; texto: string; enlace: string };
  historias: { texto: string; enlace: string };
  cta: { titulo: string; texto: string; boton: string };
}

export const rutas: Record<Idioma, string> = {
  es: '/ayuntamientos/',
  ca: '/ca/ajuntaments/',
  gl: '/gl/concellos/',
  eu: '/eu/udalak/',
};

export const hreflangs: Record<Idioma, string> = { es: 'es-ES', ca: 'ca-ES', gl: 'gl-ES', eu: 'eu-ES' };

const es: Contenido = {
  idioma: 'es',
  etiquetaIdioma: "Castellano",
  ruta: rutas.es,
  meta: { title: "IA para ayuntamientos", description: "Ejemplos concretos de IA en un ayuntamiento: atención ciudadana, redacción, expedientes, formación y datos. Diagnóstico, formación, ejecución y acompañamiento." },
  eyebrow: "Administración local",
  h1: ["IA útil para ", "tu ayuntamiento", "."],
  lead: "Ejemplos reales de lo que la IA hace en el día a día municipal.",
  boton: "Hablemos",
  selector: "Idioma",
  areasEyebrow: "Dónde aplicarla",
  areasTitulo: "Siete áreas del ayuntamiento",
  serviciosEyebrow: "Cómo trabajamos",
  serviciosTitulo: "Cuatro pasos",
  servicios: [
  {
    "icono": "diagnostico",
    "titulo": "Diagnóstico",
    "texto": "Vemos qué conviene hacer primero."
  },
  {
    "icono": "formacion",
    "titulo": "Formación",
    "texto": "Cursos prácticos para tu equipo."
  },
  {
    "icono": "produccion",
    "titulo": "Ejecución",
    "texto": "Desarrollamos e implantamos el proyecto."
  },
  {
    "icono": "integracion",
    "titulo": "Acompañamiento",
    "texto": "Seguimos a tu lado tras el arranque."
  }
],
  acred: {"sello": "Acreditación ACCIÓ", "texto": "Proveedores acreditados por ACCIÓ en proyectos de IA.", "enlace": "ACCIÓ, Generalitat de Catalunya"},
  historias: {"texto": "Consulta las historias de éxito publicadas.", "enlace": "Ver historias de éxito"},
  cta: {"titulo": "¿Hablamos de tu ayuntamiento?", "texto": "Una conversación, sin compromiso.", "boton": "Escríbenos"},
};

const ca: Contenido = {
  idioma: 'ca',
  etiquetaIdioma: "Català",
  ruta: rutas.ca,
  meta: { title: "IA per a ajuntaments", description: "Exemples concrets d'IA en un ajuntament: atenció ciutadana, redacció, expedients, formació i dades. Diagnòstic, formació, execució i acompanyament." },
  eyebrow: "Administració local",
  h1: ["IA útil per al ", "teu ajuntament", "."],
  lead: "Exemples reals del que la IA fa en el dia a dia municipal.",
  boton: "Parlem",
  selector: "Idioma",
  areasEyebrow: "On aplicar-la",
  areasTitulo: "Set àrees de l'ajuntament",
  serviciosEyebrow: "Com treballem",
  serviciosTitulo: "Quatre passos",
  servicios: [
  {
    "icono": "diagnostico",
    "titulo": "Diagnòstic",
    "texto": "Veiem què convé fer primer."
  },
  {
    "icono": "formacion",
    "titulo": "Formació",
    "texto": "Cursos pràctics per al teu equip."
  },
  {
    "icono": "produccion",
    "titulo": "Execució",
    "texto": "Desenvolupem i implantem el projecte."
  },
  {
    "icono": "integracion",
    "titulo": "Acompanyament",
    "texto": "Seguim al teu costat després de l'arrencada."
  }
],
  acred: {"sello": "Acreditació ACCIÓ", "texto": "Proveïdors acreditats per ACCIÓ en projectes d'IA.", "enlace": "ACCIÓ, Generalitat de Catalunya"},
  historias: {"texto": "Consulta les històries d’èxit publicades.", "enlace": "Veure històries d’èxit"},
  cta: {"titulo": "Parlem del teu ajuntament?", "texto": "Una conversa, sense compromís.", "boton": "Escriu-nos"},
};

const gl: Contenido = {
  idioma: 'gl',
  etiquetaIdioma: "Galego",
  ruta: rutas.gl,
  meta: { title: "IA para concellos", description: "Exemplos concretos de IA nun concello: atención á cidadanía, redacción, expedientes, formación e datos. Diagnóstico, formación, execución e acompañamento." },
  eyebrow: "Administración local",
  h1: ["IA útil para o ", "teu concello", "."],
  lead: "Exemplos reais do que a IA fai no día a día municipal.",
  boton: "Falemos",
  selector: "Idioma",
  areasEyebrow: "Onde aplicala",
  areasTitulo: "Sete áreas do concello",
  serviciosEyebrow: "Como traballamos",
  serviciosTitulo: "Catro pasos",
  servicios: [
  {
    "icono": "diagnostico",
    "titulo": "Diagnóstico",
    "texto": "Vemos que convén facer primeiro."
  },
  {
    "icono": "formacion",
    "titulo": "Formación",
    "texto": "Cursos prácticos para o teu equipo."
  },
  {
    "icono": "produccion",
    "titulo": "Execución",
    "texto": "Desenvolvemos e implantamos o proxecto."
  },
  {
    "icono": "integracion",
    "titulo": "Acompañamento",
    "texto": "Seguimos ao teu carón tras o arranque."
  }
],
  acred: {"sello": "Acreditación ACCIÓ", "texto": "Provedores acreditados por ACCIÓ en proxectos de IA.", "enlace": "ACCIÓ, Generalitat de Catalunya"},
  historias: {"texto": "Consulta as historias de éxito publicadas.", "enlace": "Ver historias de éxito"},
  cta: {"titulo": "Falamos do teu concello?", "texto": "Unha conversa, sen compromiso.", "boton": "Escríbenos"},
};

const eu: Contenido = {
  idioma: 'eu',
  etiquetaIdioma: "Euskara",
  ruta: rutas.eu,
  meta: { title: "IA udalentzat", description: "IAren adibide zehatzak udal batean: herritarrentzako arreta, idazketa, espedienteak, prestakuntza eta datuak. Diagnostikoa, prestakuntza, gauzatzea eta laguntza." },
  eyebrow: "Toki-administrazioa",
  h1: ["IA erabilgarria ", "zure udalarentzat", "."],
  lead: "IAk udalaren egunerokoan egiten duenaren adibide errealak.",
  boton: "Hitz egin dezagun",
  selector: "Hizkuntza",
  areasEyebrow: "Non aplikatu",
  areasTitulo: "Udalaren zazpi arlo",
  serviciosEyebrow: "Nola lan egiten dugun",
  serviciosTitulo: "Lau urrats",
  servicios: [
  {
    "icono": "diagnostico",
    "titulo": "Diagnostikoa",
    "texto": "Zer egin behar den lehenik ikusten dugu."
  },
  {
    "icono": "formacion",
    "titulo": "Prestakuntza",
    "texto": "Ikastaro praktikoak zure taldearentzat."
  },
  {
    "icono": "produccion",
    "titulo": "Gauzatzea",
    "texto": "Proiektua garatu eta ezartzen dugu."
  },
  {
    "icono": "integracion",
    "titulo": "Laguntza",
    "texto": "Martxan jarri ondoren zure ondoan jarraitzen dugu."
  }
],
  acred: {"sello": "ACCIÓ akreditazioa", "texto": "IA proiektuetan ACCIÓk akreditatutako hornitzaileak.", "enlace": "ACCIÓ, Kataluniako Generalitatea"},
  historias: {"texto": "Ikusi argitaratutako arrakasta istorioak.", "enlace": "Arrakasta-istorioak ikusi"},
  cta: {"titulo": "Zure udalaz hitz egingo dugu?", "texto": "Elkarrizketa bat, konpromisorik gabe.", "boton": "Idatzi iezaguzu"},
};

export const areas: Record<Idioma, Area[]> = {
  "es": [
    {
      "icono": "partner",
      "titulo": "Atención ciudadana",
      "frase": "Respuesta al vecino a cualquier hora.",
      "casos": [
        "Asistente virtual en web y WhatsApp",
        "Cita previa conversacional",
        "Triaje del registro de entrada"
      ]
    },
    {
      "icono": "propuesta",
      "titulo": "Plenos y actas",
      "frase": "Sesiones recogidas sin horas de trabajo manual.",
      "casos": [
        "Transcripción de plenos",
        "Borrador de actas",
        "Resumen de cada sesión"
      ]
    },
    {
      "icono": "despachos",
      "titulo": "Redacción y bases",
      "frase": "Textos administrativos más rápidos.",
      "casos": [
        "Borrador de pliegos y bases",
        "Revisión de coherencia",
        "Resúmenes de normativa"
      ]
    },
    {
      "icono": "administracion",
      "titulo": "Documentos y expedientes",
      "frase": "Menos búsqueda, más tramitación.",
      "casos": [
        "Clasificación de documentos",
        "Búsqueda en el archivo",
        "Resumen de expedientes"
      ]
    },
    {
      "icono": "transformacion",
      "titulo": "Automatización interna",
      "frase": "Menos trabajo repetitivo en cada área.",
      "casos": [
        "Automatizar tareas entre programas",
        "Extraer datos de facturas",
        "Avisos de plazos"
      ]
    },
    {
      "icono": "medir",
      "titulo": "Datos y cuadros de mando",
      "frase": "Datos propios para decidir mejor.",
      "casos": [
        "Paneles con datos del ayuntamiento",
        "Datos abiertos ordenados",
        "Análisis de consultas e incidencias"
      ]
    },
    {
      "icono": "formacion",
      "titulo": "Formación",
      "frase": "Cada persona usa la IA con seguridad.",
      "casos": [
        "Curso práctico por puesto",
        "Uso seguro de datos",
        "Talleres para la ciudadanía"
      ]
    }
  ],
  "ca": [
    {
      "icono": "partner",
      "titulo": "Atenció ciutadana",
      "frase": "Resposta al veí a qualsevol hora.",
      "casos": [
        "Assistent virtual al web i WhatsApp",
        "Cita prèvia conversacional",
        "Triatge del registre d’entrada"
      ]
    },
    {
      "icono": "propuesta",
      "titulo": "Plens i actes",
      "frase": "Sessions recollides sense hores de feina manual.",
      "casos": [
        "Transcripció de plens",
        "Esborrany d’actes",
        "Resum de cada sessió"
      ]
    },
    {
      "icono": "despachos",
      "titulo": "Redacció i bases",
      "frase": "Textos administratius més ràpids.",
      "casos": [
        "Esborrany de plecs i bases",
        "Revisió de coherència",
        "Resums de normativa"
      ]
    },
    {
      "icono": "administracion",
      "titulo": "Documents i expedients",
      "frase": "Menys cerca, més tramitació.",
      "casos": [
        "Classificació de documents",
        "Cerca a l’arxiu",
        "Resum d’expedients"
      ]
    },
    {
      "icono": "transformacion",
      "titulo": "Automatització interna",
      "frase": "Menys feina repetitiva a cada àrea.",
      "casos": [
        "Automatitzar tasques entre programes",
        "Extreure dades de factures",
        "Avisos de terminis"
      ]
    },
    {
      "icono": "medir",
      "titulo": "Dades i quadres de comandament",
      "frase": "Dades pròpies per decidir millor.",
      "casos": [
        "Panells amb dades de l’ajuntament",
        "Dades obertes ordenades",
        "Anàlisi de consultes i incidències"
      ]
    },
    {
      "icono": "formacion",
      "titulo": "Formació",
      "frase": "Cada persona fa servir la IA amb seguretat.",
      "casos": [
        "Curs pràctic per lloc de treball",
        "Ús segur de dades",
        "Tallers per a la ciutadania"
      ]
    }
  ],
  "gl": [
    {
      "icono": "partner",
      "titulo": "Atención á cidadanía",
      "frase": "Resposta ao veciño a calquera hora.",
      "casos": [
        "Asistente virtual na web e WhatsApp",
        "Cita previa conversacional",
        "Triaxe do rexistro de entrada"
      ]
    },
    {
      "icono": "propuesta",
      "titulo": "Plenos e actas",
      "frase": "Sesións recollidas sen horas de traballo manual.",
      "casos": [
        "Transcrición de plenos",
        "Borrador de actas",
        "Resumo de cada sesión"
      ]
    },
    {
      "icono": "despachos",
      "titulo": "Redacción e bases",
      "frase": "Textos administrativos máis rápidos.",
      "casos": [
        "Borrador de pregos e bases",
        "Revisión de coherencia",
        "Resumos de normativa"
      ]
    },
    {
      "icono": "administracion",
      "titulo": "Documentos e expedientes",
      "frase": "Menos busca, máis tramitación.",
      "casos": [
        "Clasificación de documentos",
        "Busca no arquivo",
        "Resumo de expedientes"
      ]
    },
    {
      "icono": "transformacion",
      "titulo": "Automatización interna",
      "frase": "Menos traballo repetitivo en cada área.",
      "casos": [
        "Automatizar tarefas entre programas",
        "Extraer datos de facturas",
        "Avisos de prazos"
      ]
    },
    {
      "icono": "medir",
      "titulo": "Datos e cadros de mando",
      "frase": "Datos propios para decidir mellor.",
      "casos": [
        "Paneis con datos do concello",
        "Datos abertos ordenados",
        "Análise de consultas e incidencias"
      ]
    },
    {
      "icono": "formacion",
      "titulo": "Formación",
      "frase": "Cada persoa usa a IA con seguridade.",
      "casos": [
        "Curso práctico por posto",
        "Uso seguro de datos",
        "Obradoiros para a cidadanía"
      ]
    }
  ],
  "eu": [
    {
      "icono": "partner",
      "titulo": "Herritarrentzako arreta",
      "frase": "Auzokoari erantzuna edozein ordutan.",
      "casos": [
        "Laguntzaile birtuala webean eta WhatsApp-en",
        "Hitzordu elkarrizketazkoa",
        "Sarrera-erregistroaren sailkapena"
      ]
    },
    {
      "icono": "propuesta",
      "titulo": "Osoko bilkurak eta aktak",
      "frase": "Bilerak jasota, eskuzko ordurik gabe.",
      "casos": [
        "Osoko bilkuren transkripzioa",
        "Akten zirriborroa",
        "Saio bakoitzaren laburpena"
      ]
    },
    {
      "icono": "despachos",
      "titulo": "Idazketa eta oinarriak",
      "frase": "Administrazio-testu azkarragoak.",
      "casos": [
        "Pleguen eta oinarrien zirriborroa",
        "Koherentzia-berrikuspena",
        "Araudiaren laburpenak"
      ]
    },
    {
      "icono": "administracion",
      "titulo": "Dokumentuak eta espedienteak",
      "frase": "Bilaketa gutxiago, izapide gehiago.",
      "casos": [
        "Dokumentuen sailkapena",
        "Artxiboko bilaketa",
        "Espedienteen laburpena"
      ]
    },
    {
      "icono": "transformacion",
      "titulo": "Barne-automatizazioa",
      "frase": "Lan errepikakor gutxiago arlo bakoitzean.",
      "casos": [
        "Programen arteko lanak automatizatu",
        "Fakturen datuak erauzi",
        "Epeen abisuak"
      ]
    },
    {
      "icono": "medir",
      "titulo": "Datuak eta kontrol-panelak",
      "frase": "Datu propioak hobeto erabakitzeko.",
      "casos": [
        "Udaleko datuekin kontrol-panelak",
        "Datu irekiak ordenatuta",
        "Kontsulten eta gorabeheren azterketa"
      ]
    },
    {
      "icono": "formacion",
      "titulo": "Prestakuntza",
      "frase": "Pertsona bakoitzak IA segurtasunez erabiltzen du.",
      "casos": [
        "Ikastaro praktikoa lanpostuaren arabera",
        "Datuen erabilera segurua",
        "Herritarrentzako tailerrak"
      ]
    }
  ]
};

export const contenidos: Record<Idioma, Contenido> = { es, ca, gl, eu };
