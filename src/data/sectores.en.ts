/** The six sectors. Each sector page lives at /en/sectors/<slug>/. */
export interface Sector {
  slug: string;
  nombre: string;
  /** One sentence for the home card and the index. */
  resumen: string;
  /** Headline of the sector page. */
  h1: string;
  /** Lead paragraph under the headline. */
  lead: string;
  /** What we hear when they first come to us. */
  problema: string;
  /** The transformation lines, numbered 01-04 on the page. */
  soluciones: string[];
  /** Featured case for the sector. `historia` links to /historias-de-exito/<slug>/. */
  caso: {
    cifra: string;
    etiqueta: string;
    titulo: string;
    texto: string;
    historia?: string;
  };
  /** Headline of the closing block. */
  ctaTitulo: string;
  /** Optional block before the closing one: another business line related to the sector. */
  aparte?: { eyebrow: string; titulo: string; texto: string; enlace: string; etiqueta: string };
}

export const sectores: Sector[] = [
  {
    slug: 'clinicas',
    nombre: 'Clinics and health centres',
    resumen: 'We rethink reception, scheduling, patient follow-up and clinical traceability.',
    h1: 'Reception, scheduling and clinical follow-up, rethought with AI',
    lead: 'A virtual receptionist on WhatsApp, smart scheduling and automatic clinical notes. Your team stops spending time on confirmations and focuses on patients.',
    problema:
      'Clinics lose revenue to unannounced no-shows. Reception is swamped with confirmation calls. Clinicians lose time on notes and follow-up.',
    soluciones: [
      'Virtual receptionist on WhatsApp that confirms appointments and handles changes',
      'Assisted clinical transcription during the consultation',
      'Automated follow-up of patients in treatment',
      'Smart search across clinical records',
    ],
    caso: {
      cifra: '38%',
      etiqueta: 'fewer no-shows',
      titulo: 'Three dental clinics in Barcelona',
      texto:
        'We rolled out Contestia in four weeks. No-shows fell from 18% to 11%. Reception won back 22 hours a week. The investment paid for itself in under a month.',
      historia: 'clinicas-dentales-barcelona',
    },
    ctaTitulo: 'Shall we apply this to your clinic?',
  },
  {
    slug: 'industria',
    nombre: 'Industry and workshops',
    resumen: 'We transform the quoting, maintenance and quality control cycle of production processes.',
    h1: 'Maintenance, quotes and quality control with applied AI',
    lead: 'Failure prediction before the stoppage, automatic quote generation and visual QA with a camera. For workshops and plants that want to cut downtime.',
    problema:
      'Quotes take days to go out. Maintenance is reactive, not predictive. Quality control eats up hours of technical staff time.',
    soluciones: [
      'Quote generation from drawings and specifications',
      'Predictive maintenance based on sensors and telemetry',
      'Image-based quality control with escalation to a human',
      'Search across technical documentation and industrial standards',
    ],
    caso: {
      cifra: '45%',
      etiqueta: 'less time spent on quotes',
      titulo: 'Metalworking shop in Sabadell',
      texto:
        'We cut the quoting cycle from 3 days to 4 hours. The technical team focuses on complex cases. The acceptance rate went up because clients get an answer before the competition.',
    },
    ctaTitulo: 'Shall we apply this to your workshop?',
  },
  {
    slug: 'distribucion',
    nombre: 'Distribution and logistics',
    resumen: 'We rethink how orders come in, how stock is validated and how sales reps work.',
    h1: 'Orders, stock and sales support automated 24/7',
    lead: 'Order processing over WhatsApp and email, multichannel stock sync and sales support outside office hours, with no on-call shifts. Your customers get an answer at any hour.',
    problema:
      'Sales reps retype orders into the ERP by hand. Customers order by WhatsApp, email and phone. Stock checks are slow.',
    soluciones: [
      'Automatic order intake over WhatsApp with ERP integration',
      'Real-time validation of stock, price and credit',
      '24/7 sales assistant for repeat customers',
      'Predictive demand and replenishment analysis',
    ],
    caso: {
      cifra: '2h',
      etiqueta: 'won back per rep every day',
      titulo: 'Industrial distributor with 12 sales reps',
      texto:
        'We connected an assistant to the main WhatsApp line. Each rep won back two hours a day that used to go on retyping orders. Handling capacity grew by 25% without adding headcount.',
      historia: 'distribuidora-industrial',
    },
    ctaTitulo: 'Shall we apply this to your company?',
  },
  {
    slug: 'despachos',
    nombre: 'Professional firms',
    resumen: 'We free up senior staff hours by automating repetitive documents and searches across the archive.',
    h1: 'Win back billable hours by automating repetitive tasks',
    lead: 'Case law search, assisted drafting of filings and case file analysis. You free up low-value hours to focus on strategy and clients.',
    problema:
      'The senior partner drafts repetitive contracts. The team searches case law by hand. Meetings are transcribed manually.',
    soluciones: [
      'Contract generation from the firm\'s own templates',
      'Smart search across the historical archive and case law',
      'Automatic meeting transcription and summaries',
      'Legal assistant for the first client consultation',
    ],
    caso: {
      cifra: '20h',
      etiqueta: 'freed per senior partner each month',
      titulo: 'Commercial law firm with 18 professionals',
      texto:
        'We built a contract generator based on the firm\'s templates. Average response time to clients fell from 3 days to 6 hours. Each senior partner wins back 20 hours a month for higher-value cases.',
      historia: 'despacho-mercantil',
    },
    ctaTitulo: 'Shall we apply this to your firm?',
  },
  {
    slug: 'administracion',
    nombre: 'Public administration',
    resumen: 'Digital transformation consulting, citizen services, document management and analysis of historical case files.',
    h1: 'Citizen services, document management and case file analysis with AI',
    lead: 'Technology consulting for public bodies: process assessment, a conversational e-office, large-scale document classification and case file analysis. ENS compliance and data processed within the European Union.',
    problema:
      'Citizen enquiries overwhelm the call centre. Historical case files are hard to search. Council plenary sessions produce lengthy minutes.',
    soluciones: [
      'Digital transformation consulting: assessment and roadmap before building anything',
      '24/7 citizen service chatbot with escalation to a civil servant',
      'Semantic search across historical case files',
      'Automatic summaries and classification of plenary session minutes',
      'Assistant for internal document management',
      'Training for council staff on AI tools',
    ],
    caso: {
      cifra: '60%',
      etiqueta: 'queries resolved without escalation',
      titulo: 'Mid-sized town council in Catalonia',
      texto:
        'We deployed a citizen service chatbot integrated with the catalogue of procedures. Six in ten queries are resolved without reaching the human team. Front-desk staff spend more time on complex cases.',
    },
    ctaTitulo: 'Shall we apply this to your administration?',
  },
  {
    slug: 'formacion',
    nombre: 'Training and human resources',
    resumen: 'We change how learners are assessed, how onboarding works and how progress is analysed.',
    h1: 'Adaptive assessment, 24/7 tutoring and progress analytics',
    lead: 'Exams generated with AI in 30 seconds, automatic tutoring and a progress dashboard for each learner. For academies, bootcamps and corporate training teams.',
    problema:
      'Tutors cannot answer every individual question. Assessments eat into teaching time. Onboarding for new employees is generic.',
    soluciones: [
      'Learning assistant trained on the centre\'s own material',
      'Assessment adapted to the learner\'s level',
      'Onboarding personalised by role and experience',
      'Real-time progress analytics',
    ],
    caso: {
      cifra: '3x',
      etiqueta: 'more learners supported in tutoring',
      titulo: 'Vocational training centre with a one-month queue',
      texto:
        'We built a learning assistant trained on the centre\'s own material. It answers questions 24/7 and escalates to a human tutor only in complex cases. The tutoring queue disappeared and the pass rate rose by five points.',
    },
    ctaTitulo: 'Shall we apply this to your centre?',
    aparte: {
      eyebrow: 'Also for human resources',
      titulo: 'Health training for your workforce',
      texto:
        'Corpora is our line of health training for companies: workstation ergonomics, back and neck pain, micro-breaks, menopause at work, longevity and rest. Delivered by a physiotherapist and university lecturer, in person or online, in Spanish and Catalan. Eligible for FUNDAE subsidies.',
      enlace: 'https://corpora.cat',
      etiqueta: 'See the catalogue at corpora.cat →',
    },
  },
];
