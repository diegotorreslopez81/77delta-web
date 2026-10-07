/**
 * Contingut dels serveis, en català. Mateixa estructura que servicios.ts
 * (castellà); el comparteixen l'índex /ca/servicios/ i les pàgines de cada
 * servei, perquè el text visqui en un sol lloc.
 */
export const resumen = [
  {
    etiqueta: 'Punt de partida',
    titulo: 'Diagnòstic',
    pie: '30 minuts · gratuït',
    ruta: '/servicios/diagnostico/',
  },
  {
    etiqueta: 'Projecte puntual',
    titulo: 'Transformació operativa',
    pie: 'Implantació, integració i capacitació',
    ruta: '/servicios/transformacion/',
  },
  {
    etiqueta: 'Acompanyament continu',
    titulo: 'Soci tecnològic',
    pie: 'Tota la teva tecnologia, no només la IA',
    ruta: '/servicios/partner/',
  },
  {
    etiqueta: 'Seguretat',
    titulo: 'Auditoria d’IA',
    pie: 'Escaneig gratuït dels teus assistents',
    ruta: '/servicios/seguridad-ia/',
  },
];

export const queObtienes = [
  {
    titulo: 'Identificació d’àrees amb potencial',
    texto: 'Mapatge preliminar de processos on la IA pot aportar valor mesurable a la teva empresa.',
  },
  {
    titulo: 'Estat inicial documentat',
    texto: 'Diagnòstic de com està la teva organització avui en termes de processos, dades i maduresa digital.',
  },
  {
    titulo: 'Pla de treball recomanat',
    texto: 'Full de ruta prioritzat: què fer primer, què després, amb terminis estimats.',
  },
  {
    titulo: 'Pressupost orientatiu',
    texto: 'Estimació transparent de la inversió necessària per fase, amb tarifes ajustades i condicions clares.',
  },
  {
    titulo: 'Recomanació de tecnologies',
    texto: 'Quines eines, models i arquitectura tenen sentit per al teu cas concret.',
  },
];

export const queIncluye = [
  {
    titulo: 'Implantació clau en mà',
    texto: 'Construïm les solucions des de zero o adaptem les nostres al teu cas concret.',
  },
  {
    titulo: 'Integració amb els teus sistemes',
    texto: 'Connectem amb el teu ERP, CRM, WhatsApp, correu, agenda i qualsevol eina que ja facis servir.',
  },
  {
    titulo: 'Automatització de processos',
    texto: 'Dissenyem el flux end-to-end, no només el model. Supervisió humana per defecte.',
  },
  {
    titulo: 'Capacitació del teu equip',
    texto: 'Formació a comercials, administratius i operacions. Amb casos pràctics de la teva activitat diària.',
  },
  {
    titulo: 'Documentació i traspàs',
    texto: 'En acabar el projecte et quedes amb codi, claus, dades i manuals. Plena independència.',
  },
  {
    titulo: 'SLA i suport mensual',
    texto: 'Acord de nivell de servei inclòs durant el primer cicle. Temps de resposta compromesos.',
  },
];

export const fases = [
  {
    n: '01',
    titulo: 'Pilot',
    texto: 'Versió mínima funcionant en un procés acotat. Validem hipòtesis abans d’escalar.',
  },
  {
    n: '02',
    titulo: 'Integració',
    texto: 'Connexió amb els teus sistemes (ERP, CRM, WhatsApp, agenda). Dades fluint end-to-end.',
  },
  {
    n: '03',
    titulo: 'Desplegament',
    texto: 'Sortida a producció i formació al teu equip. Mesurament des del primer dia.',
  },
  {
    n: '04',
    titulo: 'Tancament',
    texto: 'Lliurament de codi, claus, dades i documentació. Plena independència.',
  },
];

export const recorrido = [
  {
    n: '01',
    titulo: 'Diagnòstic',
    texto: '30 minuts d’entrevista. Et lliurem proposta amb estat inicial, pla de treball i pressupost.',
  },
  {
    n: '02',
    titulo: 'Decisió',
    texto: 'Tu decideixes el següent pas. Cap compromís fins a signar l’abast del projecte.',
  },
  {
    n: '03',
    titulo: 'Execució',
    texto: 'Implantem, integrem i formem el teu equip. Pilot controlat abans del desplegament complet.',
  },
  {
    n: '04',
    titulo: 'Acompanyament',
    texto:
      'Si vols, continuem com el teu soci tecnològic per escalar i mantenir la transformació.',
  },
];

export const faq = [
  {
    pregunta: 'El diagnòstic és realment gratuït? Hi ha alguna condició?',
    respuesta:
      'No hi ha condicions ocultes. És el nostre punt d’entrada. Si després del diagnòstic no decideixes contractar res, et quedes amb la proposta i el pla de treball. És informació valuosa per a tu i una inversió raonable per a nosaltres si el comparem amb un projecte fallit per no haver entès el cas.',
  },
  {
    pregunta: 'Per què no publiqueu preus fixos del servei de transformació?',
    respuesta:
      'Perquè cada cas és diferent. Un projecte d’automatització conversacional en una clínica no s’assembla a un de cerca intel·ligent en un despatx. Les tarifes tancades obliguen a elevar el preu en els casos complexos o a acceptar pèrdues en els casos petits. Preferim cotitzar cada projecte després d’entendre’l.',
  },
  {
    pregunta: 'En quant de temps veig resultats mesurables?',
    respuesta:
      'Depèn del projecte, però per norma general entre 4 i 12 setmanes des de l’inici. Treballem sempre per fites curtes amb mètriques verificables, perquè vegis resultats abans de comprometre recursos al desplegament complet.',
  },
  {
    pregunta: 'Les meves dades estan segures?',
    respuesta:
      'Tota la nostra infraestructura és a la Unió Europea (Hetzner Frankfurt i proveïdors UE). Complim el RGPD per defecte, sense dependències de tercers països. Si treballem amb sectors regulats (salut, legal, finances), afegim les mesures específiques que el teu sector requereixi.',
  },
  {
    pregunta: 'Què passa si vull deixar de treballar amb vosaltres?',
    respuesta:
      'En finalitzar qualsevol projecte et lliurem codi, claus d’accés, dades i documentació. La teva empresa conserva tot el que s’ha desenvolupat. El soci tecnològic es revisa trimestralment i el pots ajustar o pausar segons evolucioni la teva empresa.',
  },
];
