/**
 * Partner tecnológico: ficha de capacidades. Decisión de Diego (07-10-2026): es el socio técnico de
 * amplitud de la empresa, para toda su tecnología, no solo la IA, y la página habla de qué tecnologías
 * tocamos y podemos ofrecer, no de precios ni paquetes. La IA tiene su propio servicio (Director de IA
 * externo) y aquí solo se enlaza.
 */
export interface Ambito {
  n: string;
  titulo: string;
  texto: string;
  tecnologias: readonly string[];
  enlace?: { texto: string; ruta: string };
}

export interface Modalidad {
  n: string;
  titulo: string;
  texto: string;
}

export const ambitos: readonly Ambito[] = [
  {
    n: '01',
    titulo: 'Software a medida',
    texto:
      'Aplicaciones web, móviles y de escritorio, APIs y mantenimiento de software heredado. Desarrollo nuevo o rescate del que ya tienes.',
    tecnologias: ['Java', 'Spring', '.NET', 'C#', 'Python', 'Node.js', 'TypeScript', 'PHP', 'iOS y Android', 'APIs REST'],
  },
  {
    n: '02',
    titulo: 'Integración de sistemas y datos',
    texto:
      'Que el ERP, el CRM, la web, la tienda y las máquinas estén conectados entre sí sin introducir los datos manualmente dos veces.',
    tecnologias: ['APIs', 'EDI', 'ETL', 'SQL Server', 'Oracle', 'PostgreSQL', 'MySQL', 'Webhooks', 'Make y n8n'],
  },
  {
    n: '03',
    titulo: 'CRM',
    texto: 'Elegir, implantar, integrar y formar. Con el objetivo de que el equipo comercial lo utilice de forma habitual.',
    tecnologias: ['Dynamics 365', 'HubSpot', 'Salesforce', 'Zoho', 'Odoo CRM', 'Pipedrive'],
  },
  {
    n: '04',
    titulo: 'ERP y gestión',
    texto:
      'Selección, implantación, migración e integración con producción, almacén, contabilidad y facturación electrónica.',
    tecnologias: ['SAP Business One', 'Business Central', 'Odoo', 'Sage', 'A3', 'Holded', 'Facturación electrónica'],
  },
  {
    n: '05',
    titulo: 'Entorno Microsoft',
    texto: 'Orden en el entorno que ya tienes contratado: licencias, identidades, dispositivos y automatización.',
    tecnologias: [
      'Microsoft 365',
      'Teams',
      'SharePoint',
      'Exchange',
      'Entra ID',
      'Intune',
      'Power Apps',
      'Power Automate',
      'Power BI',
    ],
  },
  {
    n: '06',
    titulo: 'Nube e infraestructura',
    texto:
      'Servidores, nube, copias de seguridad, redes y continuidad. Migramos lo que conviene y mantenemos en tus instalaciones lo que no.',
    tecnologias: [
      'Azure',
      'AWS',
      'Google Cloud',
      'VMware',
      'Proxmox',
      'Linux y Windows Server',
      'Copias y recuperación',
      'Redes y VPN',
      'Telefonía IP',
    ],
  },
  {
    n: '07',
    titulo: 'Ciberseguridad',
    texto: 'Accesos, copias, parches y continuidad. Lo esencial bien resuelto antes que cualquier herramienta costosa.',
    tecnologias: [
      'Doble factor',
      'Gestión de identidades',
      'Copias inmutables',
      'Cortafuegos',
      'Protección de puestos',
      'Concienciación',
      'RGPD',
    ],
  },
  {
    n: '08',
    titulo: 'Hardware, planta e IoT',
    texto:
      'El equipamiento físico también es tecnología: puestos de trabajo, servidores, redes de planta, sensores y captura de datos de máquina.',
    tecnologias: [
      'Puestos y servidores',
      'Wifi industrial',
      'PLC y SCADA',
      'OPC UA',
      'Modbus',
      'Sensores IoT',
      'Terminales de almacén',
      'Códigos de barras y RFID',
      'Impresoras de etiquetas',
      'Pantallas de planta',
    ],
  },
  {
    n: '09',
    titulo: 'Web, e-commerce y marketing digital',
    texto: 'Web corporativa, tienda online, SEO técnico y analítica. Conectado al ERP y a los medios de pago.',
    tecnologias: ['WordPress', 'WooCommerce', 'Shopify', 'PrestaShop', 'Astro', 'SEO técnico', 'Analítica', 'Pasarelas de pago'],
  },
  {
    n: '10',
    titulo: 'Datos y Business Intelligence',
    texto: 'Cuadros de mando que la dirección mira cada lunes, con datos limpios y de una sola fuente.',
    tecnologias: ['Power BI', 'Looker Studio', 'Metabase', 'Almacén de datos', 'Informes automáticos'],
  },
  {
    n: '11',
    titulo: 'IA y automatización',
    texto:
      'Agentes, automatizaciones, OCR y modelos de lenguaje aplicados a tus procesos. Cuando la IA es el centro, tiene servicio propio.',
    tecnologias: ['Agentes de IA', 'Modelos de lenguaje', 'OCR', 'RPA', 'Automatización de procesos'],
    enlace: { texto: 'Ver Director de IA externo', ruta: '/servicios/director-ia/' },
  },
  {
    n: '12',
    titulo: 'I+D e innovación',
    texto:
      'Prototipos, pruebas de concepto y memorias técnicas de proyectos de I+D, incluida la documentación técnica para ayudas a la innovación.',
    tecnologias: ['Prototipos', 'Pruebas de concepto', 'Memorias técnicas', 'Documentación para ayudas'],
  },
];

export const modalidades: readonly Modalidad[] = [
  {
    n: '01',
    titulo: 'Un solo interlocutor',
    texto:
      'Gestionamos la relación con tus proveedores de forma directa, revisamos sus ofertas y contratos y te traducimos lo técnico a decisiones de negocio.',
  },
  {
    n: '02',
    titulo: 'Proyecto o acompañamiento',
    texto:
      'Un proyecto cerrado con alcance y entrega, o un responsable técnico continuo a tu lado. Lo que pida tu caso.',
  },
  {
    n: '03',
    titulo: 'Independencia de fabricantes',
    texto:
      'Elegimos por criterio técnico y coste total. Fabricante, nube o software libre: lo que encaje con tu empresa.',
  },
  {
    n: '04',
    titulo: 'Presupuesto a medida',
    texto: 'Tras el diagnóstico gratuito, propuesta con alcance, orden y presupuesto cerrado. Sin costes inesperados.',
  },
];

export const ambitosCa: readonly Ambito[] = [
  {
    n: '01',
    titulo: 'Programari a mida',
    texto:
      'Aplicacions web, mòbils i d’escriptori, APIs i manteniment de programari heretat. Desenvolupament nou o rescat del que ja tens.',
    tecnologias: ['Java', 'Spring', '.NET', 'C#', 'Python', 'Node.js', 'TypeScript', 'PHP', 'iOS i Android', 'APIs REST'],
  },
  {
    n: '02',
    titulo: 'Integració de sistemes i dades',
    texto:
      'Que l’ERP, el CRM, el web, la botiga i les màquines estiguin connectats entre si sense introduir les dades manualment dues vegades.',
    tecnologias: ['APIs', 'EDI', 'ETL', 'SQL Server', 'Oracle', 'PostgreSQL', 'MySQL', 'Webhooks', 'Make i n8n'],
  },
  {
    n: '03',
    titulo: 'CRM',
    texto: 'Triar, implantar, integrar i formar. Amb l’objectiu que l’equip comercial el faci servir de manera habitual.',
    tecnologias: ['Dynamics 365', 'HubSpot', 'Salesforce', 'Zoho', 'Odoo CRM', 'Pipedrive'],
  },
  {
    n: '04',
    titulo: 'ERP i gestió',
    texto:
      'Selecció, implantació, migració i integració amb producció, magatzem, comptabilitat i facturació electrònica.',
    tecnologias: ['SAP Business One', 'Business Central', 'Odoo', 'Sage', 'A3', 'Holded', 'Facturació electrònica'],
  },
  {
    n: '05',
    titulo: 'Entorn Microsoft',
    texto: 'Ordre a l’entorn que ja tens contractat: llicències, identitats, dispositius i automatització.',
    tecnologias: [
      'Microsoft 365',
      'Teams',
      'SharePoint',
      'Exchange',
      'Entra ID',
      'Intune',
      'Power Apps',
      'Power Automate',
      'Power BI',
    ],
  },
  {
    n: '06',
    titulo: 'Núvol i infraestructura',
    texto:
      'Servidors, núvol, còpies de seguretat, xarxes i continuïtat. Migrem el que convé i mantenim a les teves instal·lacions el que no.',
    tecnologias: [
      'Azure',
      'AWS',
      'Google Cloud',
      'VMware',
      'Proxmox',
      'Linux i Windows Server',
      'Còpies i recuperació',
      'Xarxes i VPN',
      'Telefonia IP',
    ],
  },
  {
    n: '07',
    titulo: 'Ciberseguretat',
    texto: 'Accessos, còpies, pedaços i continuïtat. L’essencial ben resolt abans que cap eina costosa.',
    tecnologias: [
      'Doble factor',
      'Gestió d’identitats',
      'Còpies immutables',
      'Tallafocs',
      'Protecció de llocs de treball',
      'Conscienciació',
      'RGPD',
    ],
  },
  {
    n: '08',
    titulo: 'Maquinari, planta i IoT',
    texto:
      'L’equipament físic també és tecnologia: llocs de treball, servidors, xarxes de planta, sensors i captura de dades de màquina.',
    tecnologias: [
      'Llocs i servidors',
      'Wifi industrial',
      'PLC i SCADA',
      'OPC UA',
      'Modbus',
      'Sensors IoT',
      'Terminals de magatzem',
      'Codis de barres i RFID',
      'Impressores d’etiquetes',
      'Pantalles de planta',
    ],
  },
  {
    n: '09',
    titulo: 'Web, comerç electrònic i màrqueting digital',
    texto: 'Web corporatiu, botiga en línia, SEO tècnic i analítica. Connectat a l’ERP i als mitjans de pagament.',
    tecnologias: ['WordPress', 'WooCommerce', 'Shopify', 'PrestaShop', 'Astro', 'SEO tècnic', 'Analítica', 'Passarel·les de pagament'],
  },
  {
    n: '10',
    titulo: 'Dades i Business Intelligence',
    texto: 'Quadres de comandament que la direcció mira cada dilluns, amb dades netes i d’una sola font.',
    tecnologias: ['Power BI', 'Looker Studio', 'Metabase', 'Magatzem de dades', 'Informes automàtics'],
  },
  {
    n: '11',
    titulo: 'IA i automatització',
    texto:
      'Agents, automatitzacions, OCR i models de llenguatge aplicats als teus processos. Quan la IA és el centre, té servei propi.',
    tecnologias: ['Agents d’IA', 'Models de llenguatge', 'OCR', 'RPA', 'Automatització de processos'],
    enlace: { texto: 'Veure Director d’IA extern', ruta: '/servicios/director-ia/' },
  },
  {
    n: '12',
    titulo: 'R+D i innovació',
    texto:
      'Prototips, proves de concepte i memòries tècniques de projectes d’R+D, inclosa la documentació tècnica per a ajuts a la innovació.',
    tecnologias: ['Prototips', 'Proves de concepte', 'Memòries tècniques', 'Documentació per a ajuts'],
  },
];

export const modalidadesCa: readonly Modalidad[] = [
  {
    n: '01',
    titulo: 'Un sol interlocutor',
    texto:
      'Gestionem la relació amb els teus proveïdors de manera directa, revisem les seves ofertes i contractes i et traduïm el que és tècnic a decisions de negoci.',
  },
  {
    n: '02',
    titulo: 'Projecte o acompanyament',
    texto:
      'Un projecte tancat amb abast i lliurament, o un responsable tècnic continu al teu costat. El que demani el teu cas.',
  },
  {
    n: '03',
    titulo: 'Independència de fabricants',
    texto:
      'Triem per criteri tècnic i cost total. Fabricant, núvol o programari lliure: el que encaixi amb la teva empresa.',
  },
  {
    n: '04',
    titulo: 'Pressupost a mida',
    texto: 'Després del diagnòstic gratuït, proposta amb abast, ordre i pressupost tancat. Sense costos inesperats.',
  },
];
