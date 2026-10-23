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
    nombre: 'Clinics and healthcare',
    resumen: 'We rethink reception, scheduling, patient follow-up and clinical traceability.',
    h1: 'Reception, scheduling and clinical follow-up, rethought with AI',
    lead: 'A virtual receptionist on WhatsApp, smart scheduling and automatic clinical notes. Your team stops spending time on confirmations and focuses on patients.',
    problema:
      'Clinics lose revenue to no-shows. Reception is swamped with confirmation calls. Clinicians lose hours to notes and follow-up.',
    soluciones: [
      'Virtual receptionist on WhatsApp that confirms appointments and handles changes',
      'AI-assisted clinical notes during appointments',
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
    ctaTitulo: 'Could this work in your clinic?',
  },
  {
    slug: 'industria',
    nombre: 'Manufacturing and engineering',
    resumen: 'We transform quoting, maintenance and quality control across production.',
    h1: 'Maintenance, quotes and quality control with applied AI',
    lead: 'Failures predicted before they stop the line, automatic quotes and camera-based quality inspection. For workshops and plants that want to cut downtime.',
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
        'We cut the quoting cycle from 3 days to 4 hours. The technical team now focuses on complex jobs. More quotes are accepted because clients hear back before the competition does.',
    },
    ctaTitulo: 'Could this work in your plant?',
  },
  {
    slug: 'distribucion',
    nombre: 'Wholesale and distribution',
    resumen: 'We rethink order intake, stock checks and how your sales reps spend their day.',
    h1: 'Orders, stock and sales support automated 24/7',
    lead: 'Order processing over WhatsApp and email, multichannel stock sync and sales support outside office hours, with no on-call shifts. Your customers get an answer at any hour.',
    problema:
      'Sales reps retype orders into the ERP by hand. Customers order by WhatsApp, email and phone. Stock checks are slow.',
    soluciones: [
      'Automatic order intake over WhatsApp with ERP integration',
      'Real-time validation of stock, price and credit',
      '24/7 sales assistant for repeat customers',
      'Demand forecasting and replenishment planning',
    ],
    caso: {
      cifra: '2h',
      etiqueta: 'won back per rep every day',
      titulo: 'Industrial distributor with 12 sales reps',
      texto:
        'We connected an assistant to the main WhatsApp line. Each rep won back two hours a day that used to go on retyping orders. Order capacity grew by 25% without adding headcount.',
      historia: 'distribuidora-industrial',
    },
    ctaTitulo: 'Could this work for your business?',
  },
  {
    slug: 'despachos',
    nombre: 'Law and accountancy firms',
    resumen: 'We free up senior time by automating repetitive documents and archive searches.',
    h1: 'Win back billable hours by automating repetitive tasks',
    lead: 'Case-law research, AI-assisted drafting of court documents and matter file analysis. Hand off the low-value hours and focus on strategy and clients.',
    problema:
      'Senior partners draft the same contracts over and over. The team researches case law by hand. Meetings are written up manually.',
    soluciones: [
      'Contract generation from the firm\'s own templates',
      'Smart search across the historical archive and case law',
      'Automatic meeting transcription and summaries',
      'Legal assistant for initial client enquiries',
    ],
    caso: {
      cifra: '20h',
      etiqueta: 'freed up per senior partner each month',
      titulo: 'Commercial law firm with 18 professionals',
      texto:
        'We built a contract generator based on the firm\'s templates. Average response time to clients fell from 3 days to 6 hours. Each senior partner wins back 20 hours a month for higher-value work.',
      historia: 'despacho-mercantil',
    },
    ctaTitulo: 'Could this work in your firm?',
  },
  {
    slug: 'administracion',
    nombre: 'Public sector and local government',
    resumen: 'Digital transformation consulting, public enquiries, document management and analysis of historical records.',
    h1: 'Public enquiries, document management and records analysis with AI',
    lead: 'Technology consulting for public bodies: process assessment, a conversational online services desk, large-scale document classification and records analysis. Compliant with Spain\'s National Security Framework (ENS), with data processed in the EU.',
    problema:
      'Residents\' enquiries swamp the call centre. Historical records are hard to search. Full council meetings produce lengthy minutes.',
    soluciones: [
      'Digital transformation consulting: assessment and roadmap before building anything',
      '24/7 public enquiries chatbot with hand-off to a member of staff',
      'Semantic search across historical records',
      'Automatic summaries and classification of council meeting minutes',
      'Assistant for internal document management',
      'AI tools training for council staff',
    ],
    caso: {
      cifra: '60%',
      etiqueta: 'enquiries resolved without escalation',
      titulo: 'Mid-sized town council in Catalonia',
      texto:
        'We deployed a public enquiries chatbot linked to the council\'s catalogue of services. Six in ten enquiries are resolved without reaching staff. Front-desk teams now have more time for complex cases.',
    },
    ctaTitulo: 'Could this work for your council or public body?',
  },
  {
    slug: 'formacion',
    nombre: 'Education, training and HR',
    resumen: 'We change how learners are assessed, how onboarding works and how progress is analysed.',
    h1: 'Adaptive assessment, 24/7 tutoring and progress analytics',
    lead: 'AI-generated exams in 30 seconds, automated tutoring and a progress dashboard for every learner. For academies, bootcamps and corporate L&D teams.',
    problema:
      'Tutors can\'t answer every individual question. Marking and testing eat into teaching time. Onboarding for new starters is one-size-fits-all.',
    soluciones: [
      'Learning assistant trained on your own course materials',
      'Assessment adapted to the learner\'s level',
      'Onboarding personalised by role and experience',
      'Real-time progress analytics',
    ],
    caso: {
      cifra: '3x',
      etiqueta: 'more learners supported',
      titulo: 'Vocational college with a month-long tutoring backlog',
      texto:
        'We built a learning assistant trained on the college\'s own course materials. It answers questions 24/7 and hands over to a human tutor only for complex queries. The backlog cleared and the pass rate rose by five percentage points.',
    },
    ctaTitulo: 'Could this work for your school or training team?',
    aparte: {
      eyebrow: 'Also for human resources',
      titulo: 'Workplace health training for your staff',
      texto:
        'Corpora is our workplace health training for companies: desk ergonomics, back and neck pain, micro-breaks, menopause at work, longevity and rest. Taught by a physiotherapist who is also a university lecturer, in person or online, in Spanish and Catalan. Eligible for FUNDAE funding.',
      enlace: 'https://corpora.cat',
      etiqueta: 'See the catalogue at corpora.cat →',
    },
  },
];
