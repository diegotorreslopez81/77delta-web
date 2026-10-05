/** Contenido de la página para ayuntamientos en cuatro idiomas. Sin cifras, clientes ni resultados. */

export type Idioma = 'es' | 'ca' | 'gl' | 'eu';

export interface Area {
  titulo: string;
  intro: string;
  casos: string[];
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
  areasNota: string;
  serviciosEyebrow: string;
  serviciosTitulo: string;
  servicios: { titulo: string; texto: string }[];
  acred: { eyebrow: string; titulo: string; texto: string; enlace: string };
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
  etiquetaIdioma: 'Castellano',
  ruta: rutas.es,
  meta: {
    title: 'IA para ayuntamientos',
    description:
      'Ejemplos concretos de IA en un ayuntamiento: atención ciudadana, redacción, expedientes, formación y datos. Diagnóstico, formación, ejecución y acompañamiento.',
  },
  eyebrow: 'Administración local',
  h1: ['IA útil para ', 'tu ayuntamiento', '.'],
  lead: 'Te contamos con ejemplos qué puede hacer la IA en el trabajo diario de un ayuntamiento y cómo te acompañamos, desde el primer diagnóstico hasta el proyecto en marcha.',
  boton: 'Hablemos',
  selector: 'Idioma',
  areasEyebrow: 'Ejemplos por área',
  areasTitulo: 'Qué puede hacer la IA en un ayuntamiento',
  areasNota: 'En todos los casos, una persona del ayuntamiento revisa y decide. La IA prepara; no resuelve sola.',
  serviciosEyebrow: 'Cómo trabajamos',
  serviciosTitulo: 'Cuatro servicios, en este orden',
  servicios: [
    {
      titulo: 'Diagnóstico',
      texto:
        'Entrevistamos a vuestro equipo y revisamos los procesos. Te decimos qué conviene hacer primero, qué todavía no y qué no hace falta.',
    },
    {
      titulo: 'Formación',
      texto: 'Cursos prácticos para el personal, con ejemplos de su trabajo diario y normas claras de uso seguro.',
    },
    {
      titulo: 'Ejecución',
      texto: 'Desarrollamos e implantamos el proyecto acordado, con entregables definidos y seguimiento.',
    },
    {
      titulo: 'Acompañamiento',
      texto: 'Seguimos a vuestro lado tras la puesta en marcha: dudas, ajustes y mejoras cuando cambian las necesidades.',
    },
  ],
  acred: {
    eyebrow: 'Acreditación',
    titulo: 'Proveedores acreditados por ACCIÓ',
    texto: 'Somos proveedores acreditados por ACCIÓ en proyectos de IA.',
    enlace: 'ACCIÓ, Generalitat de Catalunya',
  },
  historias: {
    texto: 'Mira las historias de éxito ya publicadas.',
    enlace: 'Ver historias de éxito',
  },
  cta: {
    titulo: 'Cuéntanos qué necesita tu ayuntamiento.',
    texto: 'Una conversación para entender tu caso. Sin compromiso.',
    boton: 'Escribirnos',
  },
};

const ca: Contenido = {
  idioma: 'ca',
  etiquetaIdioma: 'Català',
  ruta: rutas.ca,
  meta: {
    title: 'IA per a ajuntaments',
    description:
      "Exemples concrets d'IA en un ajuntament: atenció ciutadana, redacció, expedients, formació i dades. Diagnòstic, formació, execució i acompanyament.",
  },
  eyebrow: 'Administració local',
  h1: ['IA útil per al ', 'teu ajuntament', '.'],
  lead: "Et expliquem amb exemples què pot fer la IA en la feina diària d'un ajuntament i com t'acompanyem, des del primer diagnòstic fins al projecte en marxa.",
  boton: 'Parlem',
  selector: 'Idioma',
  areasEyebrow: 'Exemples per àrea',
  areasTitulo: "Què pot fer la IA en un ajuntament",
  areasNota: "En tots els casos, una persona de l'ajuntament revisa i decideix. La IA prepara; no resol sola.",
  serviciosEyebrow: 'Com treballem',
  serviciosTitulo: 'Quatre serveis, en aquest ordre',
  servicios: [
    {
      titulo: 'Diagnòstic',
      texto:
        "Entrevistem el vostre equip i revisem els processos. Et diem què convé fer primer, què encara no i què no cal.",
    },
    {
      titulo: 'Formació',
      texto: "Cursos pràctics per al personal, amb exemples de la seva feina diària i normes clares d'ús segur.",
    },
    {
      titulo: 'Execució',
      texto: "Desenvolupem i implantem el projecte acordat, amb lliurables definits i seguiment.",
    },
    {
      titulo: 'Acompanyament',
      texto: "Continuem al vostre costat després de la posada en marxa: dubtes, ajustos i millores quan canvien les necessitats.",
    },
  ],
  acred: {
    eyebrow: 'Acreditació',
    titulo: 'Proveïdors acreditats per ACCIÓ',
    texto: 'Som proveïdors acreditats per ACCIÓ en projectes d’IA.',
    enlace: 'ACCIÓ, Generalitat de Catalunya',
  },
  historias: {
    texto: 'Consulta les històries d’èxit ja publicades.',
    enlace: "Veure històries d'èxit",
  },
  cta: {
    titulo: 'Explica’ns què necessita el teu ajuntament.',
    texto: 'Una conversa per entendre el teu cas. Sense compromís.',
    boton: 'Escriu-nos',
  },
};

const gl: Contenido = {
  idioma: 'gl',
  etiquetaIdioma: 'Galego',
  ruta: rutas.gl,
  meta: {
    title: 'IA para concellos',
    description:
      'Exemplos concretos de IA nun concello: atención cidadá, redacción, expedientes, formación e datos. Diagnóstico, formación, execución e acompañamento.',
  },
  eyebrow: 'Administración local',
  h1: ['IA útil para o ', 'teu concello', '.'],
  lead: 'Contámosche con exemplos o que pode facer a IA no traballo diario dun concello e como te acompañamos, desde o primeiro diagnóstico ata o proxecto en marcha.',
  boton: 'Falemos',
  selector: 'Idioma',
  areasEyebrow: 'Exemplos por área',
  areasTitulo: 'Que pode facer a IA nun concello',
  areasNota: 'En todos os casos, unha persoa do concello revisa e decide. A IA prepara; non resolve soa.',
  serviciosEyebrow: 'Como traballamos',
  serviciosTitulo: 'Catro servizos, nesta orde',
  servicios: [
    {
      titulo: 'Diagnóstico',
      texto:
        'Entrevistamos o voso equipo e revisamos os procesos. Dicímosche que convén facer primeiro, que aínda non e que non fai falta.',
    },
    {
      titulo: 'Formación',
      texto: 'Cursos prácticos para o persoal, con exemplos do seu traballo diario e normas claras de uso seguro.',
    },
    {
      titulo: 'Execución',
      texto: 'Desenvolvemos e implantamos o proxecto acordado, con entregables definidos e seguimento.',
    },
    {
      titulo: 'Acompañamento',
      texto: 'Seguimos ao voso carón tras a posta en marcha: dúbidas, axustes e melloras cando cambian as necesidades.',
    },
  ],
  acred: {
    eyebrow: 'Acreditación',
    titulo: 'Provedores acreditados por ACCIÓ',
    texto: 'Somos provedores acreditados por ACCIÓ en proxectos de IA.',
    enlace: 'ACCIÓ, Generalitat de Catalunya',
  },
  historias: {
    texto: 'Mira as historias de éxito xa publicadas.',
    enlace: 'Ver historias de éxito',
  },
  cta: {
    titulo: 'Conta-nos que necesita o teu concello.',
    texto: 'Unha conversa para entender o teu caso. Sen compromiso.',
    boton: 'Escribirnos',
  },
};

const eu: Contenido = {
  idioma: 'eu',
  etiquetaIdioma: 'Euskara',
  ruta: rutas.eu,
  meta: {
    title: 'IA udalentzat',
    description:
      'IAren adibide zehatzak udal batean: herritarren arreta, idazketa, espedienteak, prestakuntza eta datuak. Diagnostikoa, prestakuntza, gauzatzea eta laguntza.',
  },
  eyebrow: 'Toki-administrazioa',
  h1: ['IA erabilgarria ', 'zure udalarentzat', '.'],
  lead: 'Adibideen bidez azaltzen dizugu zer egin dezakeen IAk udal baten eguneroko lanean eta nola laguntzen dizugun, lehen diagnostikotik martxan dagoen proiektura arte.',
  boton: 'Hitz egin dezagun',
  selector: 'Hizkuntza',
  areasEyebrow: 'Adibideak arloka',
  areasTitulo: 'Zer egin dezake IAk udal batean',
  areasNota: 'Kasu guztietan, udaleko pertsona batek berrikusi eta erabakitzen du. IAk prestatzen du; ez du bakarrik ebazten.',
  serviciosEyebrow: 'Nola lan egiten dugun',
  serviciosTitulo: 'Lau zerbitzu, ordena honetan',
  servicios: [
    {
      titulo: 'Diagnostikoa',
      texto:
        'Zuen taldea elkarrizketatu eta prozesuak berrikusten ditugu. Zer egin lehenengo, zer oraindik ez eta zer ez den beharrezkoa esaten dizugu.',
    },
    {
      titulo: 'Prestakuntza',
      texto: 'Langileentzako ikastaro praktikoak, eguneroko lanaren adibideekin eta erabilera segururako arau argiekin.',
    },
    {
      titulo: 'Gauzatzea',
      texto: 'Adostutako proiektua garatu eta ezartzen dugu, entregagai zehatzekin eta jarraipenarekin.',
    },
    {
      titulo: 'Laguntza',
      texto: 'Martxan jarri ondoren ere zuen ondoan jarraitzen dugu: zalantzak, doikuntzak eta hobekuntzak.',
    },
  ],
  acred: {
    eyebrow: 'Akreditazioa',
    titulo: 'ACCIÓk akreditatutako hornitzaileak',
    texto: 'IA proiektuetan ACCIÓk akreditatutako hornitzaileak gara.',
    enlace: 'ACCIÓ, Kataluniako Generalitatea',
  },
  historias: {
    texto: 'Ikusi jada argitaratutako arrakasta-istorioak.',
    enlace: 'Arrakasta-istorioak ikusi',
  },
  cta: {
    titulo: 'Kontatu zer behar duen zure udalak.',
    texto: 'Zure kasua ulertzeko elkarrizketa bat. Konpromisorik gabe.',
    boton: 'Idatzi iezaguzu',
  },
};

export const areas: Record<Idioma, Area[]> = {
  es: [
    {
      titulo: 'Atención ciudadana',
      intro: 'Que el vecino tenga respuesta a cualquier hora y el equipo dedique su tiempo a lo que pide criterio.',
      casos: [
        'Asistente web y de WhatsApp, 24 horas, para consultas sobre trámites, horarios e incidencias.',
        'Cita previa conversacional: pedir, cambiar o anular cita sin llamar.',
        'Triaje del registro de entrada: clasificar cada escrito y proponer el departamento que lo tramita.',
        'Triaje del correo: ordenar las consultas y derivarlas a la persona adecuada.',
      ],
    },
    {
      titulo: 'Redacción',
      intro: 'Un primer borrador bien estructurado para que el técnico revise, corrija y firme.',
      casos: [
        'Memorias justificativas y memorias de subvenciones a partir de los datos del expediente.',
        'Pliegos de prescripciones técnicas e informes técnicos: estructura y primer texto.',
        'Actas y resúmenes de plenos a partir de la grabación o la transcripción.',
        'Respuestas a instancias y recursos, con la normativa y los antecedentes localizados.',
      ],
    },
    {
      titulo: 'Documentos y expedientes',
      intro: 'Encontrar y entender lo que ya existe, sin buscar a mano.',
      casos: [
        'Búsqueda y clasificación de documentos por su contenido, no solo por la carpeta.',
        'Extracción de datos de facturas hacia el sistema contable.',
        'Extracción de datos de padrones y listados.',
        'Resumen de expedientes largos para incorporarse a un caso sin leerlo entero.',
      ],
    },
    {
      titulo: 'Eficiencia interna',
      intro: 'Menos tareas repetitivas en el día a día de cada departamento.',
      casos: [
        'Plantillas de documentos y comunicaciones listas para completar.',
        'Traducción de textos administrativos entre castellano, catalán y otros idiomas, con revisión.',
        'Borradores de comunicaciones y avisos a vecinos.',
        'Control de plazos: avisos de vencimientos de trámites y requerimientos.',
      ],
    },
    {
      titulo: 'Formación del personal',
      intro: 'Que cada persona sepa usar la IA en su puesto y con seguridad.',
      casos: [
        'Curso práctico por puesto, con ejemplos de su trabajo.',
        'Uso seguro de datos: qué se puede y qué no se puede escribir en una herramienta de IA.',
        'Alfabetización en IA, según el artículo 4 del Reglamento europeo de IA.',
        'Guía interna de uso responsable para todo el ayuntamiento.',
      ],
    },
    {
      titulo: 'Datos y smart city',
      intro: 'Aprovechar los datos que el municipio ya tiene para decidir mejor.',
      casos: [
        'Cuadros de mando con los datos que ya existen en el ayuntamiento.',
        'Análisis de consultas e incidencias para ver qué se repite.',
        'Apoyo a proyectos de ciudad inteligente: movilidad, residuos o energía, desde el diagnóstico hasta el piloto.',
        'Datos abiertos: ordenar y documentar conjuntos de datos para publicarlos.',
      ],
    },
  ],
  ca: [
    {
      titulo: 'Atenció ciutadana',
      intro: "Que el veí tingui resposta a qualsevol hora i l'equip dediqui el temps al que demana criteri.",
      casos: [
        'Assistent web i de WhatsApp, 24 hores, per a consultes sobre tràmits, horaris i incidències.',
        'Cita prèvia conversacional: demanar, canviar o anul·lar cita sense trucar.',
        "Triatge del registre d'entrada: classificar cada escrit i proposar el departament que el tramita.",
        'Triatge del correu: ordenar les consultes i derivar-les a la persona adequada.',
      ],
    },
    {
      titulo: 'Redacció',
      intro: 'Un primer esborrany ben estructurat perquè el tècnic revisi, corregeixi i signi.',
      casos: [
        "Memòries justificatives i memòries de subvencions a partir de les dades de l'expedient.",
        'Plecs de prescripcions tècniques i informes tècnics: estructura i primer text.',
        "Actes i resums de plens a partir de l'enregistrament o la transcripció.",
        'Respostes a instàncies i recursos, amb la normativa i els antecedents localitzats.',
      ],
    },
    {
      titulo: 'Documents i expedients',
      intro: 'Trobar i entendre el que ja existeix, sense cercar a mà.',
      casos: [
        'Cerca i classificació de documents pel seu contingut, no només per la carpeta.',
        'Extracció de dades de factures cap al sistema comptable.',
        'Extracció de dades de padrons i llistats.',
        'Resum d’expedients llargs per incorporar-se a un cas sense llegir-lo sencer.',
      ],
    },
    {
      titulo: 'Eficiència interna',
      intro: 'Menys tasques repetitives en el dia a dia de cada departament.',
      casos: [
        'Plantilles de documents i comunicacions a punt per completar.',
        'Traducció de textos administratius entre castellà, català i altres idiomes, amb revisió.',
        'Esborranys de comunicacions i avisos als veïns.',
        'Control de terminis: avisos de venciments de tràmits i requeriments.',
      ],
    },
    {
      titulo: 'Formació del personal',
      intro: 'Que cada persona sàpiga usar la IA al seu lloc de treball i amb seguretat.',
      casos: [
        'Curs pràctic per lloc de treball, amb exemples de la seva feina.',
        "Ús segur de dades: què es pot i què no es pot escriure en una eina d'IA.",
        "Alfabetització en IA, segons l'article 4 del Reglament europeu d'IA.",
        "Guia interna d'ús responsable per a tot l'ajuntament.",
      ],
    },
    {
      titulo: 'Dades i smart city',
      intro: 'Aprofitar les dades que el municipi ja té per decidir millor.',
      casos: [
        "Quadres de comandament amb les dades que ja existeixen a l'ajuntament.",
        'Anàlisi de consultes i incidències per veure què es repeteix.',
        'Suport a projectes de ciutat intel·ligent: mobilitat, residus o energia, des del diagnòstic fins al pilot.',
        'Dades obertes: ordenar i documentar conjunts de dades per publicar-los.',
      ],
    },
  ],
  gl: [
    {
      titulo: 'Atención cidadá',
      intro: 'Que o veciño teña resposta a calquera hora e o equipo dedique o tempo ao que require criterio.',
      casos: [
        'Asistente web e de WhatsApp, 24 horas, para consultas sobre trámites, horarios e incidencias.',
        'Cita previa conversacional: pedir, cambiar ou anular cita sen chamar.',
        'Triaxe do rexistro de entrada: clasificar cada escrito e propoñer o departamento que o tramita.',
        'Triaxe do correo: ordenar as consultas e derivalas á persoa adecuada.',
      ],
    },
    {
      titulo: 'Redacción',
      intro: 'Un primeiro bosquexo ben estruturado para que o técnico revise, corrixa e asine.',
      casos: [
        'Memorias xustificativas e memorias de subvencións a partir dos datos do expediente.',
        'Pregos de prescricións técnicas e informes técnicos: estrutura e primeiro texto.',
        'Actas e resumos de plenos a partir da gravación ou da transcrición.',
        'Respostas a instancias e recursos, coa normativa e os antecedentes localizados.',
      ],
    },
    {
      titulo: 'Documentos e expedientes',
      intro: 'Atopar e entender o que xa existe, sen buscar a man.',
      casos: [
        'Busca e clasificación de documentos polo seu contido, non só pola carpeta.',
        'Extracción de datos de facturas cara ao sistema contable.',
        'Extracción de datos de padróns e listaxes.',
        'Resumo de expedientes longos para incorporarse a un caso sen lelo enteiro.',
      ],
    },
    {
      titulo: 'Eficiencia interna',
      intro: 'Menos tarefas repetitivas no día a día de cada departamento.',
      casos: [
        'Modelos de documentos e comunicacións listos para completar.',
        'Tradución de textos administrativos entre galego, castelán e outros idiomas, con revisión.',
        'Bosquexos de comunicacións e avisos aos veciños.',
        'Control de prazos: avisos de vencementos de trámites e requirimentos.',
      ],
    },
    {
      titulo: 'Formación do persoal',
      intro: 'Que cada persoa saiba usar a IA no seu posto e con seguridade.',
      casos: [
        'Curso práctico por posto, con exemplos do seu traballo.',
        'Uso seguro de datos: que se pode e que non se pode escribir nunha ferramenta de IA.',
        'Alfabetización en IA, segundo o artigo 4 do Regulamento europeo de IA.',
        'Guía interna de uso responsable para todo o concello.',
      ],
    },
    {
      titulo: 'Datos e smart city',
      intro: 'Aproveitar os datos que o municipio xa ten para decidir mellor.',
      casos: [
        'Cadros de mando cos datos que xa existen no concello.',
        'Análise de consultas e incidencias para ver que se repite.',
        'Apoio a proxectos de cidade intelixente: mobilidade, residuos ou enerxía, desde o diagnóstico ata o piloto.',
        'Datos abertos: ordenar e documentar conxuntos de datos para publicalos.',
      ],
    },
  ],
  eu: [
    {
      titulo: 'Herritarren arreta',
      intro: 'Auzokideak edozein ordutan erantzuna izan dezan, eta taldeak irizpidea behar duenari eman diezaion denbora.',
      casos: [
        'Web eta WhatsApp laguntzailea, 24 orduz, izapide, ordutegi eta gorabeheren inguruko kontsultetarako.',
        'Aurretiazko hitzordu elkarrizketatua: hitzordua eskatu, aldatu edo bertan behera utzi deitu gabe.',
        'Sarrera-erregistroaren sailkapena: idazki bakoitza sailkatu eta izapidetuko duen saila proposatu.',
        'Posta elektronikoaren sailkapena: kontsultak ordenatu eta dagokion pertsonari bideratu.',
      ],
    },
    {
      titulo: 'Idazketa',
      intro: 'Lehen zirriborro egituratu bat, teknikariak berrikusi, zuzendu eta sinatu dezan.',
      casos: [
        'Memoria justifikatiboak eta diru-laguntzen memoriak espedientearen datuetatik abiatuta.',
        'Preskripzio teknikoen pleguak eta txosten teknikoak: egitura eta lehen testua.',
        'Osoko bilkuren aktak eta laburpenak grabaziotik edo transkripziotik abiatuta.',
        'Instantzien eta errekurtsoen erantzunak, araudia eta aurrekariak aurkituta.',
      ],
    },
    {
      titulo: 'Dokumentuak eta espedienteak',
      intro: 'Dagoena aurkitu eta ulertu, eskuz bilatu gabe.',
      casos: [
        'Dokumentuen bilaketa eta sailkapena edukiaren arabera, ez karpetaren arabera soilik.',
        'Fakturen datuen erauzketa kontabilitate-sistemara begira.',
        'Errolden eta zerrenden datuen erauzketa.',
        'Espediente luzeen laburpena, kasu batean sartzeko osorik irakurri gabe.',
      ],
    },
    {
      titulo: 'Barne-eraginkortasuna',
      intro: 'Errepikatzen diren lan gutxiago saila bakoitzaren egunerokoan.',
      casos: [
        'Dokumentu eta komunikazio txantiloiak, betetzeko prest.',
        'Administrazio-testuen itzulpena gaztelania, euskara eta beste hizkuntzen artean, berrikusita.',
        'Komunikazio eta auzokideentzako abisuen zirriborroak.',
        'Epeen kontrola: izapideen eta errekerimenduen mugaeguneko abisuak.',
      ],
    },
    {
      titulo: 'Langileen prestakuntza',
      intro: 'Pertsona bakoitzak bere lanpostuan IA seguru erabiltzen jakin dezan.',
      casos: [
        'Lanpostuaren araberako ikastaro praktikoa, bere lanaren adibideekin.',
        'Datuen erabilera segurua: zer idatz daitekeen eta zer ez IA tresna batean.',
        'IAren alfabetatzea, IAren Europako Erregelamenduaren 4. artikuluaren arabera.',
        'Udal osoarentzako erabilera arduratsuaren barne-gida.',
      ],
    },
    {
      titulo: 'Datuak eta smart city',
      intro: 'Udalerriak dituen datuak baliatu hobeto erabakitzeko.',
      casos: [
        'Udalean dauden datuekin kontrol-paneletak.',
        'Kontsulten eta gorabeheren azterketa, zer errepikatzen den ikusteko.',
        'Hiri adimentsuaren proiektuetarako laguntza: mugikortasuna, hondakinak edo energia, diagnostikotik pilotura.',
        'Datu irekiak: datu-multzoak ordenatu eta dokumentatu argitaratzeko.',
      ],
    },
  ],
};

export const contenidos: Record<Idioma, Contenido> = { es, ca, gl, eu };
