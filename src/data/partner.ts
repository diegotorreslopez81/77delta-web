/**
 * Ámbitos que cubre el Partner tecnológico. Decisión de Diego (07-10-2026): el servicio es un socio
 * técnico de amplitud, para toda la tecnología de la empresa, no solo para la IA. La IA tiene su propio
 * servicio (Director de IA externo) y aquí solo se enlaza.
 */
export interface Ambito {
  n: string;
  titulo: string;
  texto: string;
  enlace?: { texto: string; ruta: string };
}

export const ambitos: readonly Ambito[] = [
  {
    n: '01',
    titulo: 'IA y automatización',
    texto:
      'Agentes, automatizaciones y modelos de lenguaje aplicados a tus procesos. Cuando la IA es el centro, tiene servicio propio.',
    enlace: { texto: 'Ver Director de IA externo', ruta: '/servicios/director-ia/' },
  },
  {
    n: '02',
    titulo: 'Software a medida e integración',
    texto:
      'Java, .NET, Python y APIs. Desarrollo nuevo, mantenimiento de lo heredado y conexión entre sistemas que hoy no se hablan.',
  },
  {
    n: '03',
    titulo: 'CRM y ERP',
    texto:
      'Elegir, negociar, implantar e integrar: Dynamics 365, HubSpot, Odoo, Salesforce o el que ya tengas. Sin casarnos con ningún fabricante.',
  },
  {
    n: '04',
    titulo: 'Entorno Microsoft y nube',
    texto:
      'Microsoft 365, Azure, SharePoint, Power Platform, copias de seguridad, accesos e identidades. Orden en la nube que ya pagas.',
  },
  {
    n: '05',
    titulo: 'Hardware, planta e IoT',
    texto:
      'Sensores y captura de datos de máquina, dispositivos en almacén o tienda, redes y puestos de trabajo. Lo físico también es tecnología.',
  },
  {
    n: '06',
    titulo: 'I+D e innovación',
    texto:
      'Prototipos, pruebas de concepto y memorias técnicas de proyectos de I+D, incluida la documentación técnica para ayudas a la innovación.',
  },
];

export const ambitosCa: readonly Ambito[] = [
  {
    n: '01',
    titulo: 'IA i automatització',
    texto:
      'Agents, automatitzacions i models de llenguatge aplicats als teus processos. Quan la IA és el centre, té servei propi.',
    enlace: { texto: 'Veure Director d’IA extern', ruta: '/servicios/director-ia/' },
  },
  {
    n: '02',
    titulo: 'Programari a mida i integració',
    texto:
      'Java, .NET, Python i APIs. Desenvolupament nou, manteniment del que ja tens i connexió entre sistemes que avui no es parlen.',
  },
  {
    n: '03',
    titulo: 'CRM i ERP',
    texto:
      'Triar, negociar, implantar i integrar: Dynamics 365, HubSpot, Odoo, Salesforce o el que ja tinguis. Sense casar-nos amb cap fabricant.',
  },
  {
    n: '04',
    titulo: 'Entorn Microsoft i núvol',
    texto:
      'Microsoft 365, Azure, SharePoint, Power Platform, còpies de seguretat, accessos i identitats. Ordre al núvol que ja pagues.',
  },
  {
    n: '05',
    titulo: 'Maquinari, planta i IoT',
    texto:
      'Sensors i captura de dades de màquina, dispositius al magatzem o a la botiga, xarxes i llocs de treball. El que és físic també és tecnologia.',
  },
  {
    n: '06',
    titulo: 'R+D i innovació',
    texto:
      'Prototips, proves de concepte i memòries tècniques de projectes d’R+D, inclosa la documentació tècnica per a ajuts a la innovació.',
  },
];
