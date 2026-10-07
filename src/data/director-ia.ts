/**
 * Director de IA externo: contenido en castellano, catalán e inglés.
 * Una sola fuente para las tres páginas (/servicios/director-ia/, /ca/servicios/director-ia/, /en/ai-director/).
 * Precios, horas y garantía aprobados por Diego el 07-10-2026. No inventar cifras ni clientes.
 */
export type Idioma = 'es' | 'ca' | 'en';

export const rutas: Record<Idioma, string> = {
  es: '/servicios/director-ia/',
  ca: '/ca/servicios/director-ia/',
  en: '/en/ai-director/',
};

export const hreflangs: Record<Idioma, string> = { es: 'es-ES', ca: 'ca-ES', en: 'en' };

export interface Paquete {
  nombre: string;
  precio: string;
  iva: string;
  presencia: string;
  remoto: string;
  para: string;
}

export interface Contenido {
  etiquetaIdioma: string;
  meta: { title: string; description: string };
  miga: string;
  eyebrow: string;
  h1: [string, string, string];
  lead: string;
  precio: string;
  precioPie: string;
  botonWhatsapp: string;
  botonSesion: string;
  whatsappTexto: string;
  paraQuien: { eyebrow: string; titulo: string; texto: string };
  comoFunciona: { eyebrow: string; titulo: string; pasos: { titulo: string; texto: string }[] };
  paquetes: { eyebrow: string; titulo: string; lista: Paquete[]; nota: string; accio: string };
  garantia: { eyebrow: string; titulo: string; texto: string; medida: string };
  ejemplos: { eyebrow: string; titulo: string; lista: { area: string; texto: string }[]; cierre: string };
  faq: { eyebrow: string; titulo: string; lista: { pregunta: string; respuesta: string }[] };
  otros: { eyebrow: string; enlace: string };
  cta: { titulo: string; texto: string; boton: string };
}

export const contenidos: Record<Idioma, Contenido> = {
  es: {
    etiquetaIdioma: 'Castellano',
    meta: {
      title: 'Director de IA externo desde 1.200 € al mes',
      description:
        'Un director de IA para tu empresa con cuota fija mensual: una mañana al mes en tus instalaciones junto a tu equipo técnico y el resto del trabajo a distancia, con ahorro garantizado por contrato. Tres paquetes desde 1.200 € al mes.',
    },
    miga: 'Servicios',
    eyebrow: 'Servicio principal · Cuota fija mensual',
    h1: ['Tu director de IA ', 'desde 1.200 € al mes', '.'],
    lead: 'Una mañana al mes en tu empresa, junto a tu equipo técnico, y el resto del trabajo a distancia, con un objetivo: identificar y reducir al máximo las horas dedicadas a tareas repetitivas. El ahorro queda garantizado por contrato y se mide contigo cada mes.',
    precio: 'Desde 1.200 €/mes',
    precioPie: 'Tres paquetes · cuota fija · ahorro garantizado por contrato',
    botonWhatsapp: 'Hablar por WhatsApp',
    botonSesion: 'Primera sesión sin coste',
    whatsappTexto: 'Hola Diego, me interesa el servicio de director de IA.',
    paraQuien: {
      eyebrow: 'Para quién es',
      titulo: 'Para empresas con informático, pero sin nadie que piense la IA.',
      texto:
        'Empresas de 10 a 250 personas con un informático o un responsable de sistemas que resuelve el día a día, pero sin nadie sénior que piense los procesos, la automatización y dónde encaja la IA. Aportamos esa visión estratégica por una cuota fija al mes, y trabajamos con tu técnico, no en su lugar.',
    },
    comoFunciona: {
      eyebrow: 'Cómo funciona',
      titulo: 'Un ritmo fijo cada mes, sin que tengas que pedirlo.',
      pasos: [
        {
          titulo: 'Primera sesión sin coste',
          texto: '90 minutos con tu técnico. Salimos con una lista de procesos y las horas que se pierden en cada uno.',
        },
        {
          titulo: 'Una mañana en tu empresa',
          texto: 'Cada mes: revisamos lo hecho, elegimos el siguiente proceso y lo dejamos arrancado.',
        },
        {
          titulo: 'El resto, a distancia',
          texto: 'Trabajamos con tu técnico el resto del mes hasta que la mejora está en marcha.',
        },
        {
          titulo: 'Informe mensual',
          texto: 'Procesos tocados, horas ahorradas por proceso y lo que viene el mes siguiente.',
        },
      ],
    },
    paquetes: {
      eyebrow: 'Tres paquetes',
      titulo: 'Eliges el ritmo. La cuota no cambia.',
      lista: [
        {
          nombre: 'Base',
          precio: '1.200 €/mes',
          iva: '+ IVA',
          presencia: 'Una mañana al mes en tu empresa',
          remoto: '4 horas al mes a distancia',
          para: 'Para abrir una primera línea de ahorro',
        },
        {
          nombre: 'Avance',
          precio: '2.400 €/mes',
          iva: '+ IVA',
          presencia: 'Dos mañanas al mes en tu empresa',
          remoto: '10 horas al mes a distancia',
          para: 'Para varios departamentos a la vez',
        },
        {
          nombre: 'Intensivo',
          precio: '3.600 €/mes',
          iva: '+ IVA',
          presencia: 'Una mañana cada semana en tu empresa',
          remoto: '14 horas al mes a distancia',
          para: 'Para cambiar el ritmo de toda la empresa',
        },
      ],
      nota: 'Contrato anual con cuota fija mensual. Factura a principio de mes. Las horas no se acumulan de un mes a otro. Las licencias de herramientas van aparte y siempre con tu aprobación previa.',
      accio: '77 Delta es consultora acreditada por ACCIÓ para el Cupó IA. Te decimos si tu caso encaja.',
    },
    garantia: {
      eyebrow: 'Garantía',
      titulo: 'Ahorro garantizado por contrato, medido cada mes.',
      texto:
        'Nos comprometemos a que, a partir del tercer mes, el ahorro mensual en marcha alcance al menos el doble de la cuota. Si no se alcanza, puedes finalizar el contrato ese mismo mes sin coste alguno. A partir de ese punto, basta un preaviso de 30 días.',
      medida:
        'El ahorro se mide así: estimación de horas en la sesión del mes y comprobación con tu técnico cuatro semanas después.',
    },
    ejemplos: {
      eyebrow: 'Ejemplos reales',
      titulo: 'Horas que ya se han ahorrado en empresas industriales.',
      lista: [
        {
          area: 'Administración',
          texto:
            'Cuadrar albaranes de proveedor con pedidos y pasarlos al programa de gestión costaba unas 35 horas al mes. Ahora lo deja preparado un proceso automatizado con IA y una persona lo revisa en una o dos horas.',
        },
        {
          area: 'Operaciones',
          texto:
            'Los partes de producción y las órdenes de trabajo se pasaban a mano del papel al sistema, unas 65 horas al mes. Hoy se leen automáticamente y solo se corrige lo que no cuadra.',
        },
      ],
      cierre: 'En ningún caso cambiaron de programa ni de forma de trabajar.',
    },
    faq: {
      eyebrow: 'Preguntas frecuentes',
      titulo: 'Lo que suelen preguntarnos antes de empezar.',
      lista: [
        { pregunta: '¿Sustituye a mi informático?', respuesta: 'No. Trabajamos con tu técnico, que adquiere la capacidad de continuar sin nosotros.' },
        {
          pregunta: '¿Y si no hay ahorro?',
          respuesta: 'Se aplica la garantía: si al tercer mes el ahorro no alcanza el doble de la cuota, puedes finalizar el contrato ese mismo mes sin coste.',
        },
        {
          pregunta: '¿Hay permanencia?',
          respuesta: 'Contrato anual, con esa salida al tercer mes y preaviso de 30 días a partir de entonces.',
        },
        { pregunta: '¿Qué herramientas usáis?', respuesta: 'Las vuestras. Incorporamos IA únicamente donde supone un ahorro de horas.' },
        {
          pregunta: '¿Puedo pagarlo con ayudas?',
          respuesta: '77 Delta es consultora acreditada por ACCIÓ para el Cupó IA. Te decimos si tu caso encaja.',
        },
        {
          pregunta: '¿Quién factura?',
          respuesta: 'Next Gen Academy SL (77 Delta), Palau-solità i Plegamans, Barcelona.',
        },
      ],
    },
    otros: { eyebrow: 'Otras formas de trabajar', enlace: 'Ver el detalle →' },
    cta: {
      titulo: 'Comienza con la sesión sin coste.',
      texto: '90 minutos con tu técnico. Si no encaja, te lo comunicamos en esa misma sesión.',
      boton: 'Pedir la primera sesión',
    },
  },

  ca: {
    etiquetaIdioma: 'Català',
    meta: {
      title: "Director d'IA extern des de 1.200 € al mes",
      description:
        "Un director d'IA per a la teva empresa amb quota fixa mensual: un matí al mes a les teves instal·lacions amb el teu equip tècnic i la resta de la feina a distància, amb estalvi garantit per contracte. Tres paquets des de 1.200 € al mes.",
    },
    miga: 'Serveis',
    eyebrow: 'Servei principal · Quota fixa mensual',
    h1: ["El teu director d'IA ", 'des de 1.200 € al mes', '.'],
    lead: "Un matí al mes a la teva empresa, amb el teu equip tècnic, i la resta de la feina a distància, amb un objectiu: identificar i reduir al màxim les hores dedicades a tasques repetitives. L'estalvi queda garantit per contracte i es mesura amb tu cada mes.",
    precio: 'Des de 1.200 €/mes',
    precioPie: 'Tres paquets · quota fixa · estalvi garantit per contracte',
    botonWhatsapp: 'Parlar per WhatsApp',
    botonSesion: 'Primera sessió sense cost',
    whatsappTexto: "Hola Diego, m'interessa el servei de director d'IA.",
    paraQuien: {
      eyebrow: 'Per a qui és',
      titulo: 'Per a empreses amb informàtic, però sense ningú que pensi la IA.',
      texto:
        "Empreses de 10 a 250 persones amb un informàtic o un responsable de sistemes que resol el dia a dia, però sense ningú sènior que pensi els processos, l'automatització i on encaixa la IA. Hi aportem aquesta visió estratègica per una quota fixa al mes, i treballem amb el teu tècnic, no en lloc seu.",
    },
    comoFunciona: {
      eyebrow: 'Com funciona',
      titulo: 'Un ritme fix cada mes, sense que ho hagis de demanar.',
      pasos: [
        {
          titulo: 'Primera sessió sense cost',
          texto: '90 minuts amb el teu tècnic. En sortim amb una llista de processos i les hores que es perden en cadascun.',
        },
        {
          titulo: 'Un matí a la teva empresa',
          texto: "Cada mes: revisem el que s'ha fet, triem el següent procés i el deixem engegat.",
        },
        {
          titulo: 'La resta, a distància',
          texto: 'Treballem amb el teu tècnic la resta del mes fins que la millora està en marxa.',
        },
        {
          titulo: 'Informe mensual',
          texto: 'Processos tocats, hores estalviades per procés i el que ve el mes següent.',
        },
      ],
    },
    paquetes: {
      eyebrow: 'Tres paquets',
      titulo: 'Tries el ritme. La quota no canvia.',
      lista: [
        {
          nombre: 'Base',
          precio: '1.200 €/mes',
          iva: '+ IVA',
          presencia: 'Un matí al mes a la teva empresa',
          remoto: '4 hores al mes a distància',
          para: "Per obrir una primera línia d'estalvi",
        },
        {
          nombre: 'Avanç',
          precio: '2.400 €/mes',
          iva: '+ IVA',
          presencia: 'Dos matins al mes a la teva empresa',
          remoto: '10 hores al mes a distància',
          para: 'Per a diversos departaments alhora',
        },
        {
          nombre: 'Intensiu',
          precio: '3.600 €/mes',
          iva: '+ IVA',
          presencia: 'Un matí cada setmana a la teva empresa',
          remoto: '14 hores al mes a distància',
          para: "Per canviar el ritme de tota l'empresa",
        },
      ],
      nota: "Contracte anual amb quota fixa mensual. Factura a principi de mes. Les hores no s'acumulen d'un mes a l'altre. Les llicències d'eines van a part i sempre amb la teva aprovació prèvia.",
      accio: '77 Delta és consultora acreditada per ACCIÓ per al Cupó IA. Et diem si el teu cas hi encaixa.',
    },
    garantia: {
      eyebrow: 'Garantia',
      titulo: 'Estalvi garantit per contracte, mesurat cada mes.',
      texto:
        "Ens comprometem que, a partir del tercer mes, l'estalvi mensual en marxa arribi com a mínim al doble de la quota. Si no s'hi arriba, pots finalitzar el contracte aquell mateix mes sense cap cost. A partir d'aquest punt, n'hi ha prou amb un preavís de 30 dies.",
      medida:
        "L'estalvi es mesura així: estimació d'hores a la sessió del mes i comprovació amb el teu tècnic quatre setmanes després.",
    },
    ejemplos: {
      eyebrow: 'Exemples reals',
      titulo: "Hores que ja s'han estalviat en empreses industrials.",
      lista: [
        {
          area: 'Administració',
          texto:
            "Quadrar albarans de proveïdor amb comandes i passar-los al programa de gestió costava unes 35 hores al mes. Ara ho deixa preparat un procés automatitzat amb IA i una persona ho revisa en una o dues hores.",
        },
        {
          area: 'Operacions',
          texto:
            'Els comunicats de producció i les ordres de treball es passaven a mà del paper al sistema, unes 65 hores al mes. Avui es llegeixen automàticament i només es corregeix el que no quadra.',
        },
      ],
      cierre: 'En cap cas van canviar de programa ni de manera de treballar.',
    },
    faq: {
      eyebrow: 'Preguntes freqüents',
      titulo: 'El que ens solen preguntar abans de començar.',
      lista: [
        { pregunta: 'Substitueix el meu informàtic?', respuesta: 'No. Treballem amb el teu tècnic, que adquireix la capacitat de continuar sense nosaltres.' },
        {
          pregunta: 'I si no hi ha estalvi?',
          respuesta: "S'aplica la garantia: si al tercer mes l'estalvi no arriba al doble de la quota, pots finalitzar el contracte aquell mateix mes sense cost.",
        },
        {
          pregunta: 'Hi ha permanència?',
          respuesta: 'Contracte anual, amb aquesta sortida al tercer mes i preavís de 30 dies a partir de llavors.',
        },
        { pregunta: 'Quines eines feu servir?', respuesta: 'Les vostres. Hi incorporem IA únicament on suposa un estalvi d’hores.' },
        {
          pregunta: 'Ho puc pagar amb ajuts?',
          respuesta: '77 Delta és consultora acreditada per ACCIÓ per al Cupó IA. Et diem si el teu cas hi encaixa.',
        },
        {
          pregunta: 'Qui factura?',
          respuesta: 'Next Gen Academy SL (77 Delta), Palau-solità i Plegamans, Barcelona.',
        },
      ],
    },
    otros: { eyebrow: 'Altres formes de treballar', enlace: 'Veure el detall →' },
    cta: {
      titulo: 'Comença amb la sessió sense cost.',
      texto: "90 minuts amb el teu tècnic. Si no encaixa, t'ho diem en aquella mateixa sessió.",
      boton: 'Demanar la primera sessió',
    },
  },

  en: {
    etiquetaIdioma: 'English',
    meta: {
      title: 'External AI director from 1,200 € a month',
      description:
        'An AI director for your company on a fixed monthly fee: one morning a month on site with your technical team and the rest of the work remote, with savings guaranteed by contract. Three plans from 1,200 € a month.',
    },
    miga: 'Services',
    eyebrow: 'Main service · Fixed monthly fee',
    h1: ['Your AI director ', 'from 1,200 € a month', '.'],
    lead: 'One morning a month at your company, alongside your technical team, and the rest of the work remote, with one goal: to identify and reduce as far as possible the hours spent on repetitive tasks. The savings are guaranteed by contract and measured with you every month.',
    precio: 'From 1,200 €/month',
    precioPie: 'Three plans · fixed fee · savings guaranteed by contract',
    botonWhatsapp: 'Chat on WhatsApp',
    botonSesion: 'First session at no cost',
    whatsappTexto: 'Hi Diego, I am interested in the AI director service.',
    paraQuien: {
      eyebrow: 'Who it is for',
      titulo: 'For companies with an IT person, but nobody thinking about AI.',
      texto:
        'Companies of 10 to 250 people with an IT person or systems manager who handles the day to day, but nobody senior to think about processes, automation and where AI fits. We provide that senior expertise for a fixed monthly fee, and we work with your IT person, not instead of them.',
    },
    comoFunciona: {
      eyebrow: 'How it works',
      titulo: 'A fixed rhythm every month, without you having to ask.',
      pasos: [
        {
          titulo: 'First session at no cost',
          texto: '90 minutes with your IT person. We leave with a list of processes and the hours lost in each one.',
        },
        {
          titulo: 'One morning at your company',
          texto: 'Every month: we review what is done, pick the next process and get it started.',
        },
        {
          titulo: 'The rest, remote',
          texto: 'We work with your IT person for the rest of the month until the improvement is running.',
        },
        {
          titulo: 'Monthly report',
          texto: 'Processes touched, hours saved per process and what comes next month.',
        },
      ],
    },
    paquetes: {
      eyebrow: 'Three plans',
      titulo: 'You choose the pace. The fee does not change.',
      lista: [
        {
          nombre: 'Base',
          precio: '1,200 €/month',
          iva: '+ VAT',
          presencia: 'One morning a month at your company',
          remoto: '4 hours a month remote',
          para: 'To open a first line of savings',
        },
        {
          nombre: 'Advance',
          precio: '2,400 €/month',
          iva: '+ VAT',
          presencia: 'Two mornings a month at your company',
          remoto: '10 hours a month remote',
          para: 'For several departments at once',
        },
        {
          nombre: 'Intensive',
          precio: '3,600 €/month',
          iva: '+ VAT',
          presencia: 'One morning every week at your company',
          remoto: '14 hours a month remote',
          para: 'To change the pace of the whole company',
        },
      ],
      nota: 'Annual contract with a fixed monthly fee. Invoice at the start of each month. Hours do not roll over. Tool licences are separate and always with your approval.',
      accio: '77 Delta is a consultancy accredited by ACCIÓ (Government of Catalonia) for the Cupó IA programme. We will tell you if your case fits.',
    },
    garantia: {
      eyebrow: 'Guarantee',
      titulo: 'Savings guaranteed by contract, measured every month.',
      texto:
        'We commit that, from month three onwards, the monthly savings in place will reach at least twice the fee. If they do not, you may end the contract that same month at no cost. From that point on, 30 days notice is sufficient.',
      medida:
        'Savings are measured like this: hours estimated in the month session and checked with your IT person four weeks later.',
    },
    ejemplos: {
      eyebrow: 'Real examples',
      titulo: 'Hours already saved in industrial companies.',
      lista: [
        {
          area: 'Administration',
          texto:
            'Matching supplier delivery notes with orders and entering them in the management system took about 35 hours a month. Now an automated AI step prepares it and one person reviews it in one or two hours.',
        },
        {
          area: 'Operations',
          texto:
            'Production reports and work orders were typed by hand from paper into the system, about 65 hours a month. Today they are read automatically and only mismatches are corrected.',
        },
      ],
      cierre: 'In neither case did they change software or the way they work.',
    },
    faq: {
      eyebrow: 'FAQ',
      titulo: 'What we are usually asked before starting.',
      lista: [
        { pregunta: 'Does it replace my IT person?', respuesta: 'No. We work with your IT person, who gains the ability to continue without us.' },
        {
          pregunta: 'What if there are no savings?',
          respuesta: 'The guarantee applies: if by month three the savings do not reach twice the fee, you may end the contract that same month at no cost.',
        },
        {
          pregunta: 'Is there a lock-in?',
          respuesta: 'Annual contract, with that exit at month three and 30 days notice from then on.',
        },
        { pregunta: 'Which tools do you use?', respuesta: 'Yours. We add AI only where it saves measurable hours.' },
        {
          pregunta: 'Can I pay for it with grants?',
          respuesta: '77 Delta is a consultancy accredited by ACCIÓ for the Cupó IA programme. We will tell you if your case fits.',
        },
        {
          pregunta: 'Who invoices?',
          respuesta: 'Next Gen Academy SL (77 Delta), Palau-solità i Plegamans, Barcelona, Spain.',
        },
      ],
    },
    otros: { eyebrow: 'Other ways of working', enlace: 'See details →' },
    cta: {
      titulo: 'Start with the no-cost session.',
      texto: '90 minutes with your IT person. If it is not a fit, we tell you in that same session.',
      boton: 'Request the first session',
    },
  },
};
