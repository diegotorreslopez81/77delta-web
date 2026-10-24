/** Our products, English version of productos.ts. Listed at /en/products/. */
export interface Producto {
  slug: string;
  nombre: string;
  estado: 'In production' | 'Beta' | 'Pre-MVP';
  categoria: string;
  descripcion: string;
  /** true only for LeakAI: NGA's only own product. The rest belong to the group portfolio. */
  propio: boolean;
  /** No url when the product is not public yet. */
  url?: string;
  /** File name inside public/img/productos/. */
  logo: string;
  /** Product page: what it does and what it is built with. */
  queHace: string;
  stack: string;
}

export const productos: Producto[] = [
  {
    slug: 'leakai',
    nombre: 'LeakAI',
    estado: 'In production',
    categoria: 'Cybersecurity',
    descripcion: 'Security audit for the AI chatbots on your website.',
    propio: true,
    url: 'https://leakai.77delta.com',
    logo: 'leakai.svg',
    queHace:
      'Crawls a website, finds the AI assistants it has published and runs a battery of leak tests against them: extraction of internal instructions, disclosure of commercial terms, personal data, prompt injection and going off-script. A judge model scores each response and has to quote the passage that proves the leak.',
    stack: 'Node 22, Playwright, Mistral as judge model, Postgres',
  },
  {
    slug: 'regulia',
    nombre: 'Regulia',
    estado: 'In production',
    categoria: 'EU compliance',
    descripcion: 'Automated EU compliance for SMEs.',
    propio: false,
    url: 'https://regulia.app',
    logo: 'regulia.png',
    queHace:
      'A platform with three EU compliance modules: accessibility (EN 301 549 standard), cybersecurity (NIS2) and AI governance (EU AI Act). It analyses, generates the mandatory documentation and monitors ongoing compliance.',
    stack: 'Next.js 16, Supabase, Gemini 2.0 Flash, axe-core',
  },
  {
    slug: 'contestia',
    nombre: 'Contestia',
    estado: 'In production',
    categoria: 'HealthTech',
    descripcion: 'Virtual WhatsApp receptionist for clinics.',
    propio: false,
    url: 'https://contestia.co',
    logo: 'contestia.png',
    queHace:
      'A WhatsApp receptionist for clinics: it answers patients, draws on the clinic\'s knowledge base, books appointments against the calendar and hands over to a member of staff when it detects an emergency.',
    stack: 'FastAPI, Supabase with pgvector, Gemini 2.0 Flash, Evolution API',
  },
  {
    slug: 'instantexam',
    nombre: 'InstantExam',
    estado: 'In production',
    categoria: 'EdTech',
    descripcion: 'AI-generated exams in 30 seconds.',
    propio: false,
    url: 'https://instantexam.co',
    logo: 'instantexam.png',
    queHace:
      'Turns a text, a PDF, a URL or a YouTube video into an exam in seconds. Students join with a link and a password, without signing up, and marking and rankings are automatic.',
    stack: 'React 19, Express 5, MongoDB, OpenAI',
  },
  {
    slug: 'scoreflow',
    nombre: 'ScoreFlow',
    estado: 'Pre-MVP',
    categoria: 'B2B SaaS',
    descripcion: 'Work-quality scoring for AI-assisted coding.',
    propio: false,
    logo: 'scoreflow.svg',
    queHace:
      'Collects telemetry from a team\'s AI coding tools and produces a craft score per team. Banded metrics, aggregated over at least five people, so it measures without monitoring individuals.',
    stack: 'Next.js 16, Hono, Postgres and ClickHouse, OpenTelemetry',
  },
  {
    slug: 'contablia',
    nombre: 'Contablia',
    estado: 'Pre-MVP',
    categoria: 'FinTech',
    descripcion: 'A virtual team of five agents for self-employed professionals in Spain.',
    propio: false,
    logo: 'contablia.png',
    queHace:
      'Five agents that split a freelancer\'s admin between them: quotes and sales follow-up, recording income and expenses, tax returns, paperwork and business alerts. You run it simply by chatting.',
    stack: 'Next.js, Postgres with pgvector, Drizzle, open banking',
  },
  {
    slug: 'swarmix',
    nombre: 'Swarmix',
    estado: 'Beta',
    categoria: 'Prospecting',
    descripcion: 'Cross-platform AI prospecting.',
    propio: false,
    url: 'https://swarmix.co',
    logo: 'swarmix.png',
    queHace:
      'A cross-platform prospecting engine across LinkedIn, email and X: it finds contacts, enriches them, runs the sequence and measures what happens at each step of the funnel.',
    stack: 'Node 22, Express 5, MongoDB, Unipile, Gemini 2.5 Flash',
  },
];

/** Health training line for companies by Next Gen Academy SL. Own website at corpora.cat. */
export const corpora = {
  slug: 'corpora',
  nombre: 'Corpora',
  url: 'https://corpora.cat',
  claim: 'Health science applied to everyday working life.',
  descripcion:
    'Health training for professional teams, delivered by a physiotherapist and university lecturer. Evidence-based content applied to the workplace. In person or online, in Spanish and Catalan.',
  ambitos: [
    {
      nombre: 'Ergonomics and the body at work',
      programas: 'Office and remote workstations · Back and neck pain · Micro-breaks · Body and load in physically demanding jobs',
    },
    {
      nombre: 'Women\'s health at work',
      programas: 'Menopause and hormonal transition · Women\'s health in the workplace',
    },
    {
      nombre: 'Longevity and performance',
      programas: 'Workforces aged 50 and over · Sleep, rest and performance',
    },
  ],
  financiacion: 'Training eligible for FUNDAE funding',
} as const;
