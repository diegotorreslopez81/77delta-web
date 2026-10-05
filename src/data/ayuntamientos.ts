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
  areasNota: 'Son servicios que los ayuntamientos ya contratan hoy. En todos los casos, una persona del ayuntamiento revisa y decide: la IA prepara, no resuelve sola.',
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
    boton: 'Escríbenos',
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
  areasNota: "Són serveis que els ajuntaments ja contracten avui. En tots els casos, una persona de l'ajuntament revisa i decideix: la IA prepara, no resol sola.",
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
      'Exemplos concretos de IA nun concello: atención á cidadanía, redacción, expedientes, formación e datos. Diagnóstico, formación, execución e acompañamento.',
  },
  eyebrow: 'Administración local',
  h1: ['IA útil para o ', 'teu concello', '.'],
  lead: 'Contámosche con exemplos o que pode facer a IA no traballo diario dun concello e como te acompañamos, desde o primeiro diagnóstico ata o proxecto en marcha.',
  boton: 'Falemos',
  selector: 'Idioma',
  areasEyebrow: 'Exemplos por área',
  areasTitulo: 'Que pode facer a IA nun concello',
  areasNota: 'Son servizos que os concellos xa contratan hoxe. En todos os casos, unha persoa do concello revisa e decide: a IA prepara, non resolve soa.',
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
    texto: 'Consulta as historias de éxito xa publicadas.',
    enlace: 'Ver historias de éxito',
  },
  cta: {
    titulo: 'Cóntanos que necesita o teu concello.',
    texto: 'Unha conversa para entender o teu caso. Sen compromiso.',
    boton: 'Escríbenos',
  },
};

const eu: Contenido = {
  idioma: 'eu',
  etiquetaIdioma: 'Euskara',
  ruta: rutas.eu,
  meta: {
    title: 'IA udalentzat',
    description:
      'IAren adibide zehatzak udal batean: herritarrentzako arreta, idazketa, espedienteak, prestakuntza eta datuak. Diagnostikoa, prestakuntza, gauzatzea eta laguntza.',
  },
  eyebrow: 'Toki-administrazioa',
  h1: ['IA erabilgarria ', 'zure udalarentzat', '.'],
  lead: 'Adibideen bidez azaltzen dizugu zer egin dezakeen IAk udal baten eguneroko lanean eta nola laguntzen dizugun, lehen diagnostikotik martxan dagoen proiektura arte.',
  boton: 'Hitz egin dezagun',
  selector: 'Hizkuntza',
  areasEyebrow: 'Adibideak arloka',
  areasTitulo: 'Zer egin dezake IAk udal batean',
  areasNota: 'Udalek gaur egun jada kontratatzen dituzten zerbitzuak dira. Kasu guztietan, udaleko pertsona batek berrikusi eta erabakitzen du: IAk prestatzen du, ez du bere kabuz ebazten.',
  serviciosEyebrow: 'Nola lan egiten dugun',
  serviciosTitulo: 'Lau zerbitzu, ordena honetan',
  servicios: [
    {
      titulo: 'Diagnostikoa',
      texto:
        'Zuen taldea elkarrizketatu eta prozesuak berrikusten ditugu. Zer egin behar den lehenik, zer oraindik ez eta zer ez den beharrezkoa esaten dizugu.',
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
      texto: 'Martxan jarri ondoren ere zuen ondoan jarraitzen dugu: zalantzak, doikuntzak eta hobekuntzak, beharrak aldatzen direnean.',
    },
  ],
  acred: {
    eyebrow: 'Akreditazioa',
    titulo: 'ACCIÓk akreditatutako hornitzaileak',
    texto: 'IA proiektuetan ACCIÓk akreditatutako hornitzaileak gara.',
    enlace: 'ACCIÓ, Kataluniako Generalitatea',
  },
  historias: {
    texto: 'Ikusi jada argitaratutako arrakasta istorioak.',
    enlace: 'Arrakasta-istorioak ikusi',
  },
  cta: {
    titulo: 'Kontatu iezaguzu zer behar duen zure udalak.',
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
        'Asistente virtual en la web y en WhatsApp para consultas sobre trámites, horarios e incidencias.',
        'Atención telefónica con IA conversacional, como apoyo al 010.',
        'Cita previa conversacional: pedir, cambiar o anular cita sin llamar.',
        'Triaje del registro de entrada y del correo: clasificar cada escrito y derivarlo a quien lo tramita.',
      ],
    },
    {
      titulo: 'Plenos y actas',
      intro: 'Que las sesiones queden recogidas y consultables sin horas de trabajo manual.',
      casos: [
        'Videoactas: grabación y retransmisión de los plenos.',
        'Transcripción y subtitulado de cada sesión.',
        'Borrador de acta y resumen del pleno para que el secretario revise y firme.',
        'Búsqueda por tema dentro de las sesiones: quién dijo qué y cuándo.',
      ],
    },
    {
      titulo: 'Redacción y bases jurídicas',
      intro: 'Normativa a mano y un primer borrador bien estructurado para que el técnico revise, corrija y firme.',
      casos: [
        'Asistente de IA sobre bases de datos jurídicas, para resolver consultas de normativa y jurisprudencia.',
        'Memorias justificativas y memorias de subvenciones a partir de los datos del expediente.',
        'Pliegos de prescripciones técnicas e informes técnicos: estructura y primer texto.',
        'Respuestas a solicitudes, instancias y recursos, con la normativa y los antecedentes localizados.',
      ],
    },
    {
      titulo: 'Documentos, expedientes y archivo',
      intro: 'Encontrar y entender lo que ya existe, sin buscar a mano.',
      casos: [
        'Gestor documental con búsqueda por contenido, no solo por la carpeta.',
        'Digitalización del archivo municipal y clasificación automática de lo digitalizado.',
        'Resumen de expedientes largos para incorporarse a un caso sin leerlo entero.',
        'Conexión con la administración electrónica que ya usáis: registro, expedientes y sede electrónica.',
      ],
    },
    {
      titulo: 'Automatización y eficiencia interna',
      intro: 'Menos tareas repetitivas en el día a día de cada departamento.',
      casos: [
        'Automatización de procesos (RPA): tareas repetitivas entre programas, sin repetir datos a mano.',
        'Extracción de datos de facturas, padrones y listados hacia el sistema que corresponda.',
        'Control de plazos: avisos de vencimientos de trámites y requerimientos.',
        'Plantillas, traducción revisada de textos administrativos y borradores de avisos a vecinos.',
      ],
    },
    {
      titulo: 'Datos y cuadros de mando',
      intro: 'Aprovechar los datos que el municipio ya tiene para decidir mejor.',
      casos: [
        'Cuadros de mando con los datos que ya existen en el ayuntamiento.',
        'Gobierno del dato: quién tiene qué dato, con qué calidad y para qué.',
        'Datos abiertos: ordenar y documentar conjuntos de datos para publicarlos.',
        'Análisis de consultas e incidencias para ver qué se repite, y apoyo a proyectos de ciudad inteligente.',
      ],
    },
    {
      titulo: 'Formación',
      intro: 'Que cada persona sepa usar la IA y las herramientas digitales, con seguridad.',
      casos: [
        'Curso práctico para el personal municipal, por puesto y con ejemplos de su trabajo.',
        'Uso seguro de datos: qué se puede y qué no se puede escribir en una herramienta de IA.',
        'Alfabetización en IA según el artículo 4 del Reglamento europeo de IA.',
        'Talleres y charlas para la ciudadanía sobre competencias digitales y uso de la IA.',
      ],
    },
  ],
  ca: [
    {
      titulo: 'Atenció ciutadana',
      intro: "Que el veí tingui resposta a qualsevol hora i l'equip dediqui el temps al que demana criteri.",
      casos: [
        'Assistent virtual al web i al WhatsApp per a consultes sobre tràmits, horaris i incidències.',
        'Atenció telefònica amb IA conversacional, com a suport al 010.',
        'Cita prèvia conversacional: demanar, canviar o anul·lar cita sense trucar.',
        "Triatge del registre d'entrada i del correu: classificar cada escrit i derivar-lo a qui el tramita.",
      ],
    },
    {
      titulo: 'Plens i actes',
      intro: 'Que les sessions quedin recollides i consultables sense hores de feina manual.',
      casos: [
        'Videoactes: gravació i retransmissió dels plens.',
        'Transcripció i subtitulat de cada sessió.',
        "Esborrany d'acta i resum del ple perquè el secretari revisi i signi.",
        'Cerca per tema dins de les sessions: qui va dir què i quan.',
      ],
    },
    {
      titulo: 'Redacció i bases jurídiques',
      intro: 'Normativa a mà i un primer esborrany ben estructurat perquè el tècnic revisi, corregeixi i signi.',
      casos: [
        "Assistent d'IA sobre bases de dades jurídiques, per resoldre consultes de normativa i jurisprudència.",
        "Memòries justificatives i memòries de subvencions a partir de les dades de l'expedient.",
        'Plecs de prescripcions tècniques i informes tècnics: estructura i primer text.',
        'Respostes a sol·licituds, instàncies i recursos, amb la normativa i els antecedents localitzats.',
      ],
    },
    {
      titulo: 'Documents, expedients i arxiu',
      intro: 'Trobar i entendre el que ja existeix, sense cercar a mà.',
      casos: [
        'Gestor documental amb cerca per contingut, no només per la carpeta.',
        "Digitalització de l'arxiu municipal i classificació automàtica del digitalitzat.",
        "Resum d'expedients llargs per incorporar-se a un cas sense llegir-lo sencer.",
        "Connexió amb l'administració electrònica que ja feu servir: registre, expedients i seu electrònica.",
      ],
    },
    {
      titulo: 'Automatització i eficiència interna',
      intro: 'Menys tasques repetitives en el dia a dia de cada departament.',
      casos: [
        'Automatització de processos (RPA): tasques repetitives entre programes, sense repetir dades a mà.',
        "Extracció de dades de factures, padrons i llistats cap al sistema que correspongui.",
        'Control de terminis: avisos de venciments de tràmits i requeriments.',
        'Plantilles, traducció revisada de textos administratius i esborranys d’avisos als veïns.',
      ],
    },
    {
      titulo: 'Dades i quadres de comandament',
      intro: 'Aprofitar les dades que el municipi ja té per decidir millor.',
      casos: [
        "Quadres de comandament amb les dades que ja existeixen a l'ajuntament.",
        'Govern de la dada: qui té quina dada, amb quina qualitat i per a què.',
        'Dades obertes: ordenar i documentar conjunts de dades per publicar-los.',
        'Anàlisi de consultes i incidències per veure què es repeteix, i suport a projectes de ciutat intel·ligent.',
      ],
    },
    {
      titulo: 'Formació',
      intro: 'Que cada persona sàpiga usar la IA i les eines digitals, amb seguretat.',
      casos: [
        'Curs pràctic per al personal municipal, per lloc de treball i amb exemples de la seva feina.',
        "Ús segur de dades: què es pot i què no es pot escriure en una eina d'IA.",
        "Alfabetització en IA segons l'article 4 del Reglament europeu d'IA.",
        "Tallers i xerrades per a la ciutadania sobre competències digitals i ús de la IA.",
      ],
    },
  ],
  gl: [
    {
      titulo: 'Atención á cidadanía',
      intro: 'Que o veciño teña resposta a calquera hora e o equipo dedique o tempo ao que require criterio.',
      casos: [
        'Asistente virtual na web e en WhatsApp para consultas sobre trámites, horarios e incidencias.',
        'Atención telefónica con IA conversacional, como apoio ao 010.',
        'Cita previa conversacional: pedir, cambiar ou anular cita sen chamar.',
        'Triaxe do rexistro de entrada e do correo: clasificar cada escrito e derivalo a quen o tramita.',
      ],
    },
    {
      titulo: 'Plenos e actas',
      intro: 'Que as sesións queden recollidas e consultables sen horas de traballo manual.',
      casos: [
        'Videoactas: gravación e retransmisión dos plenos.',
        'Transcrición e subtitulado de cada sesión.',
        'Borrador de acta e resumo do pleno para que o secretario revise e asine.',
        'Busca por tema dentro das sesións: quen dixo que e cando.',
      ],
    },
    {
      titulo: 'Redacción e bases xurídicas',
      intro: 'Normativa á man e un primeiro borrador ben estruturado para que o técnico revise, corrixa e asine.',
      casos: [
        'Asistente de IA sobre bases de datos xurídicas, para resolver consultas de normativa e xurisprudencia.',
        'Memorias xustificativas e memorias de subvencións a partir dos datos do expediente.',
        'Pregos de prescricións técnicas e informes técnicos: estrutura e primeiro texto.',
        'Respostas a solicitudes e recursos, coa normativa e os antecedentes localizados.',
      ],
    },
    {
      titulo: 'Documentos, expedientes e arquivo',
      intro: 'Atopar e entender o que xa existe, sen buscar a man.',
      casos: [
        'Xestor documental con busca por contido, non só pola carpeta.',
        'Dixitalización do arquivo municipal e clasificación automática do dixitalizado.',
        'Resumo de expedientes longos para incorporarse a un caso sen lelo enteiro.',
        'Conexión coa administración electrónica que xa usades: rexistro, expedientes e sede electrónica.',
      ],
    },
    {
      titulo: 'Automatización e eficiencia interna',
      intro: 'Menos tarefas repetitivas no día a día de cada departamento.',
      casos: [
        'Automatización de procesos (RPA): tarefas repetitivas entre programas, sen repetir datos a man.',
        'Extracción de datos de facturas, padróns e listaxes ao sistema que corresponda.',
        'Control de prazos: avisos de vencementos de trámites e requirimentos.',
        'Modelos, tradución revisada de textos administrativos e borradores de avisos aos veciños.',
      ],
    },
    {
      titulo: 'Datos e cadros de mando',
      intro: 'Aproveitar os datos que o municipio xa ten para decidir mellor.',
      casos: [
        'Cadros de mando cos datos que xa existen no concello.',
        'Goberno do dato: quen ten que dato, con que calidade e para que.',
        'Datos abertos: ordenar e documentar conxuntos de datos para publicalos.',
        'Análise de consultas e incidencias para ver que se repite, e apoio a proxectos de cidade intelixente.',
      ],
    },
    {
      titulo: 'Formación',
      intro: 'Que cada persoa saiba usar a IA e as ferramentas dixitais, con seguridade.',
      casos: [
        'Curso práctico para o persoal municipal, por posto e con exemplos do seu traballo.',
        'Uso seguro de datos: que se pode e que non se pode escribir nunha ferramenta de IA.',
        'Alfabetización en IA, segundo o artigo 4 do Regulamento europeo de IA.',
        'Obradoiros e charlas para a cidadanía sobre competencias dixitais e uso da IA.',
      ],
    },
  ],
  eu: [
    {
      titulo: 'Herritarrentzako arreta',
      intro: 'Auzokideak edozein ordutan erantzuna izan dezan, eta taldeak irizpidea behar duenari eman diezaion denbora.',
      casos: [
        'Web eta WhatsApp bidezko laguntzaile birtuala, izapide, ordutegi eta gorabeheren inguruko kontsultetarako.',
        'Telefono bidezko arreta IA elkarrizketadunarekin, 010 zerbitzuaren laguntza gisa.',
        'Aurretiazko hitzordua elkarrizketa bidez: hitzordua eskatu, aldatu edo bertan behera utzi deitu gabe.',
        'Sarrera-erregistroaren eta posta elektronikoaren sailkapena: idazki bakoitza sailkatu eta izapidetuko duenari bideratu.',
      ],
    },
    {
      titulo: 'Osoko bilkurak eta aktak',
      intro: 'Saioak jaso eta kontsultagarri geratu daitezen, eskuzko lan-ordurik gabe.',
      casos: [
        'Bideoaktak: osoko bilkuren grabazioa eta zuzeneko emankizuna.',
        'Saio bakoitzaren transkripzioa eta azpitituluak.',
        'Akta-zirriborroa eta bilkuraren laburpena, idazkariak berrikusi eta sinatu dezan.',
        'Saioen barruko bilaketa gaiaren arabera: nork zer esan zuen eta noiz.',
      ],
    },
    {
      titulo: 'Idazketa eta oinarri juridikoak',
      intro: 'Araudia eskura eta lehen zirriborro egituratu bat, teknikariak berrikusi, zuzendu eta sinatu dezan.',
      casos: [
        'IA laguntzailea datu-base juridikoen gainean, araudi eta jurisprudentziaren kontsultak ebazteko.',
        'Memoria justifikatzaileak eta diru-laguntzen memoriak espedientearen datuetatik abiatuta.',
        'Baldintza teknikoen agiriak eta txosten teknikoak: egitura eta lehen testua.',
        'Eskabideen eta helegiteen erantzunak, araudia eta aurrekariak aurkituta.',
      ],
    },
    {
      titulo: 'Dokumentuak, espedienteak eta artxiboa',
      intro: 'Dagoena aurkitu eta ulertu, eskuz bilatu gabe.',
      casos: [
        'Dokumentu-kudeatzailea edukiaren araberako bilaketarekin, ez karpetaren arabera soilik.',
        'Udal-artxiboaren digitalizazioa eta digitalizatutakoaren sailkapen automatikoa.',
        'Espediente luzeen laburpena, kasu batean sartzeko osorik irakurri gabe.',
        'Dagoeneko erabiltzen duzuen administrazio elektronikoarekin lotura: erregistroa, espedienteak eta egoitza elektronikoa.',
      ],
    },
    {
      titulo: 'Automatizazioa eta barne-eraginkortasuna',
      intro: 'Lan errepikakor gutxiago sail bakoitzaren egunerokoan.',
      casos: [
        'Prozesuen automatizazioa (RPA): programen arteko lan errepikakorrak, datuak eskuz errepikatu gabe.',
        'Fakturen, errolden eta zerrenden datuen erauzketa dagokion sistemara.',
        'Epeen kontrola: izapideen eta errekerimenduen epe-mugen abisuak.',
        'Txantiloiak, administrazio-testuen itzulpen berrikusia eta auzokideentzako abisuen zirriborroak.',
      ],
    },
    {
      titulo: 'Datuak eta kontrol-panelak',
      intro: 'Udalerriak dituen datuak baliatu hobeto erabakitzeko.',
      casos: [
        'Udalean dauden datuekin kontrol-panelak.',
        'Datuen gobernantza: nork duen zein datu, zer kalitaterekin eta zertarako.',
        'Datu irekiak: datu-multzoak ordenatu eta dokumentatu argitaratzeko.',
        'Kontsulten eta gorabeheren azterketa, zer errepikatzen den ikusteko, eta hiri adimendunen proiektuetarako laguntza.',
      ],
    },
    {
      titulo: 'Prestakuntza',
      intro: 'Pertsona bakoitzak IA eta tresna digitalak modu seguruan erabiltzen jakin dezan.',
      casos: [
        'Udal-langileentzako ikastaro praktikoa, lanpostuaren arabera eta bere lanaren adibideekin.',
        'Datuen erabilera segurua: zer idatz daitekeen eta zer ez IA tresna batean.',
        'IAren alfabetatzea, Europar Batasuneko IAren Erregelamenduaren 4. artikuluaren arabera.',
        'Herritarrentzako tailerrak eta hitzaldiak gaitasun digitalei eta IAren erabilerari buruz.',
      ],
    },
  ],
};

export const contenidos: Record<Idioma, Contenido> = { es, ca, gl, eu };
