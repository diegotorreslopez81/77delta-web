/**
 * Ongoing projects via ACCIÓ's Cupó IA, at /en/ongoing-projects/. English version of proyectos-en-curso.ts.
 * Hard rule: none of these vouchers is closed yet, all are still in the assessment phase. NO result
 * figures, improvement percentages or the word "certified" are published: only client, year, scope and
 * what we are doing now, in the present tense.
 */
export interface ProyectoEnCurso {
  cliente: string;
  anio: string;
  ambito: string;
  queHacemos: string;
}

export const proyectosEnCurso: ProyectoEnCurso[] = [
  {
    cliente: 'Nora Real Food',
    anio: '2026',
    ambito: 'Food · Barcelona',
    queHacemos:
      'We are mapping how daily production is decided, where information gets lost between orders and delivery, and which administrative processes are clear candidates for AI automation.',
  },
  {
    cliente: 'One Hub Energy',
    anio: '2026',
    ambito: 'Energy',
    queHacemos:
      'We are reviewing how asset performance is tracked, which in-house and market tools are used today, and where AI fits into day-to-day management.',
  },
  {
    cliente: 'Aresa Shipyard',
    anio: '2026',
    ambito: 'Shipbuilding',
    queHacemos:
      'We are analysing how a project moves from quotation to delivery, where hours and materials are lost, and what production and maintenance data is available.',
  },
  {
    cliente: 'Epic Solutions',
    anio: '2026',
    ambito: 'Technology',
    queHacemos:
      'We are reviewing the internal management and support tools, and where AI can cut manual review and classification work.',
  },
  {
    cliente: 'Zimeron',
    anio: '2026',
    ambito: 'Industry',
    queHacemos:
      'We are starting to map the production processes across its business lines, to identify where AI adds value in planning and quality.',
  },
  {
    cliente: 'IPAE',
    anio: '2026',
    ambito: 'Engineering',
    queHacemos: 'AI opportunity assessment under way, delivered together with a specialist partner.',
  },
];
