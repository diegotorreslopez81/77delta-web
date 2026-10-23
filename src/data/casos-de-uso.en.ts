/**
 * AI capabilities we have designed, built and put into production.
 * They come from the previous website; the examples are representative and anonymised
 * for client confidentiality. They are listed and filtered at /en/use-cases/.
 */
export interface Familia {
  slug: string;
  num: string;
  titulo: string;
  texto: string;
}

export interface Caso {
  id: string;
  familia: string;
  titulo: string;
  texto: string;
  sectores: string[];
  tecnologias: string[];
}

export const familias: Familia[] = [
  { slug: 'conversacional', num: '01', titulo: 'Conversational assistants', texto: 'Chatbots and voice assistants for web, WhatsApp and phone, with search over your own information, handover to a person and conversation analytics. Customer service, health, training and internal support.' },
  { slug: 'agentes', num: '02', titulo: 'Autonomous agents', texto: 'Agents that run real business processes: they query internal systems, answer business questions about your data, monitor, test and prospect, with a full, auditable trace of every step.' },
  { slug: 'rag', num: '03', titulo: 'Search and knowledge', texto: 'Semantic search across your intranet, regulatory documents or recordings. Role-based access control, mandatory source citations in every answer and incremental indexing.' },
  { slug: 'workflow', num: '04', titulo: 'Process automation', texto: 'Connecting systems that do not talk to each other, incident management, multichannel communication, automated reports and AI-assisted technical proposals for public tenders.' },
  { slug: 'governance', num: '05', titulo: 'Governance and compliance', texto: 'Governance of AI systems under the EU AI Act, ALTAI audits and multi-framework compliance with GDPR, NIS2 and the European Accessibility Act. The mandatory documentation is generated automatically.' },
  { slug: 'seguridad', num: '06', titulo: 'AI security', texto: 'Audit and hardening of the assistants you already have live: what information they can reveal, what triggers it and how to fix it. Includes adversarial testing, guardrails and continuous monitoring.' },
  { slug: 'verticales', num: '07', titulo: 'Vertical platforms and synthetic data', texto: 'AI platforms for a specific sector (insurance, legal, healthcare, business acceleration), digital simulation and privacy-preserving synthetic data generation.' },
  { slug: 'modelos', num: '08', titulo: 'Custom models and prediction', texto: 'Fine-tuning open models for a specific sector, forecasting and anomaly detection, supervised classification, custom document recognition and model evaluation.' },
];

/** Filter labels. The key is the one carried by the cases. */
export const sectores: Record<string, string> = {
  publico: 'Public sector',
  salud: 'Health',
  turismo: 'Tourism',
  edu: 'Education and training',
  b2b: 'Business and B2B',
  legal: 'Legal and finance',
};

export const tecnologias: Record<string, string> = {
  chat: 'Conversational',
  agentes: 'Agents',
  rag: 'Search',
  datos: 'Data',
  modelos: 'Models',
  seguridad: 'Security',
  compliance: 'Compliance',
};

export const casos: Caso[] = [
  {
    id: 'chatbot-ciudadano',
    familia: 'conversacional',
    titulo: 'Citizen chatbot for public services',
    texto:
      'Web and WhatsApp assistant that lets citizens deal with procedures, grants and regulations without visiting the council or ringing its helpline.',
    sectores: ['publico'],
    tecnologias: ['chat', 'rag'],
  },
  {
    id: 'chatbot-academico',
    familia: 'conversacional',
    titulo: 'Academic chatbot for universities',
    texto:
      'Assistant with SSO via the institution\'s LDAP/SAML and RAG over degree programmes, enrolment and academic regulations. Multilingual.',
    sectores: ['edu', 'publico'],
    tecnologias: ['chat', 'rag'],
  },
  {
    id: 'chatbot-turistico',
    familia: 'conversacional',
    titulo: 'Tourism chatbot for smart destinations',
    texto:
      'Multilingual assistant (ES/EN/CA/FR/DE/IT) with geolocation for points of interest, events, dining and getting around.',
    sectores: ['turismo', 'publico'],
    tecnologias: ['chat', 'rag'],
  },
  {
    id: 'chatbot-crm',
    familia: 'conversacional',
    titulo: 'CRM-integrated corporate chatbot',
    texto:
      'Assistant with tool calling over your open-source CRM: looks up customers, opens tickets, drafts emails, runs workflows.',
    sectores: ['b2b'],
    tecnologias: ['chat', 'agentes'],
  },
  {
    id: 'recepcionista-salud',
    familia: 'conversacional',
    titulo: 'WhatsApp AI receptionist for clinics',
    texto:
      'Assistant that manages appointments in Google Calendar, transcribes voice notes and hands over to a person when it detects an emergency. Pay-per-use pricing.',
    sectores: ['salud'],
    tecnologias: ['chat', 'agentes'],
  },
  {
    id: 'chatbot-legal',
    familia: 'conversacional',
    titulo: 'Specialist chatbot for legal and insurance',
    texto:
      'Assistant with RAG over sector regulations, policy terms and internal procedures. Source citations are mandatory.',
    sectores: ['legal', 'b2b'],
    tecnologias: ['chat', 'rag', 'compliance'],
  },
  {
    id: 'agentes-backoffice',
    familia: 'agentes',
    titulo: 'AI agents for back-office modules',
    texto:
      'LangGraph agents that run the client\'s administrative processes, with predictive observability and an AI Act audit log.',
    sectores: ['publico', 'b2b'],
    tecnologias: ['agentes', 'compliance'],
  },
  {
    id: 'agente-bi-conversacional',
    familia: 'agentes',
    titulo: 'Conversational BI with text-to-SQL',
    texto:
      'Agent that queries your operational databases and returns indicators in natural language, with semantic validation and SQL injection protection.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['agentes', 'datos'],
  },
  {
    id: 'agente-normativa',
    familia: 'agentes',
    titulo: 'Regulatory query agent',
    texto:
      'RAG over the Official State Gazette (BOE), the Public Sector Contracts Act and sector regulations. Distinguishes current from repealed provisions and cites the relevant articles.',
    sectores: ['legal', 'publico'],
    tecnologias: ['agentes', 'rag', 'compliance'],
  },
  {
    id: 'agentes-qa',
    familia: 'agentes',
    titulo: 'QA and automated testing agents',
    texto:
      'Agents that generate tests, detect regressions and check legacy code against OWASP patterns.',
    sectores: ['b2b'],
    tecnologias: ['agentes'],
  },
  {
    id: 'agente-observability',
    familia: 'agentes',
    titulo: 'Predictive observability agent',
    texto:
      'Monitors logs and metrics, predicts incidents before they happen and proposes corrective measures in natural language.',
    sectores: ['b2b'],
    tecnologias: ['agentes', 'datos'],
  },
  {
    id: 'agente-outreach',
    familia: 'agentes',
    titulo: 'Multichannel sales prospecting agent',
    texto:
      'Outreach sequences across LinkedIn, email and X with AI personalisation, genuine-reply detection and automatic suppression lists.',
    sectores: ['b2b'],
    tecnologias: ['agentes', 'chat'],
  },
  {
    id: 'agente-evaluaciones',
    familia: 'agentes',
    titulo: 'Quiz and exam generation agent',
    texto:
      'Quizzes from text, PDF, URL or YouTube. Multiple choice, open-ended questions, matching, ordering. Anti-cheating controls and automatic marking.',
    sectores: ['edu', 'b2b'],
    tecnologias: ['agentes', 'modelos'],
  },
  {
    id: 'rag-corporativo',
    familia: 'rag',
    titulo: 'RAG over corporate documentation',
    texto:
      'Semantic search with role-based access control over your intranet, manuals and procedures. Verifiable source citations.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['rag'],
  },
  {
    id: 'rag-compliance',
    familia: 'rag',
    titulo: 'Multi-framework RAG for EU compliance',
    texto:
      'GDPR + NIS2 + EAA + AI Act platform that analyses your website and documents, maps obligations and generates the mandatory documentation.',
    sectores: ['b2b', 'legal'],
    tecnologias: ['rag', 'compliance'],
  },
  {
    id: 'rag-transcripciones',
    familia: 'rag',
    titulo: 'RAG over audio and video transcripts',
    texto:
      'Whisper transcription + semantic search with timestamps over council plenaries, lectures or video training courses.',
    sectores: ['publico', 'edu'],
    tecnologias: ['rag', 'modelos'],
  },
  {
    id: 'rag-busqueda-juridica',
    familia: 'rag',
    titulo: 'Semantic search over case law',
    texto:
      'RAG over rulings and regulations with legal citation checking and comparison of case law across courts.',
    sectores: ['legal', 'publico'],
    tecnologias: ['rag', 'compliance'],
  },
  {
    id: 'cdc-hibrido',
    familia: 'workflow',
    titulo: 'CDC and sync across heterogeneous systems',
    texto:
      'Log-based change data capture across Oracle, SQL Server, PostgreSQL and Mongo with exactly-once delivery. No impact on production.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['datos'],
  },
  {
    id: 'itsm-publico',
    familia: 'workflow',
    titulo: 'Open-source ITSM and ticketing',
    texto:
      'Incident platform with LDAP/SAML SSO, 2FA, condition-action automation and a self-service web portal.',
    sectores: ['publico', 'b2b'],
    tecnologias: ['agentes'],
  },
  {
    id: 'comunicacion-ciudadana',
    familia: 'workflow',
    titulo: 'Multichannel citizen communication',
    texto:
      'WhatsApp + SMS with geographic segmentation, AI-assisted campaign generation and auditable tracking.',
    sectores: ['publico'],
    tecnologias: ['chat', 'agentes'],
  },
  {
    id: 'informes-automaticos',
    familia: 'workflow',
    titulo: 'Automated report generation',
    texto:
      'Pipeline that extracts operational data and produces DOCX/PDF reports with written analysis and historical comparisons.',
    sectores: ['publico', 'b2b'],
    tecnologias: ['agentes', 'datos'],
  },
  {
    id: 'memorias-licitaciones',
    familia: 'workflow',
    titulo: 'AI-assisted technical proposals',
    texto:
      'RAG over the history of winning proposals + analysis of the tender specifications. Cuts bid preparation time from 40-80 hours to 5-10.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['agentes', 'rag'],
  },
  {
    id: 'governance-ai-act',
    familia: 'governance',
    titulo: 'AI Act governance platform',
    texto:
      'AI system register, risk classification, impact assessment and drift and bias monitoring.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['compliance'],
  },
  {
    id: 'auditoria-altai',
    familia: 'governance',
    titulo: 'ALTAI trustworthy AI audit',
    texto:
      'Assessment against the seven EU ALTAI requirements, with a certifiable report for public tenders.',
    sectores: ['publico', 'b2b'],
    tecnologias: ['compliance'],
  },
  {
    id: 'multi-marco-compliance',
    familia: 'governance',
    titulo: 'Automated multi-framework compliance',
    texto:
      'Technical scanner and document generator (accessibility statement, privacy policy, AI register) for European SMEs.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['compliance', 'rag'],
  },
  {
    id: 'auditoria-asistentes',
    familia: 'seguridad',
    titulo: 'AI security audit of live assistants',
    texto:
      'Scans the AI chatbots on a website for exposed internal instructions, disclosed commercial terms and data leaks, quoting the exact excerpt that proves each finding.',
    sectores: ['b2b', 'publico', 'salud', 'legal'],
    tecnologias: ['seguridad', 'chat'],
  },
  {
    id: 'red-team-llm',
    familia: 'seguridad',
    titulo: 'Adversarial testing of LLMs and agents',
    texto:
      'A suite of tests against the assistant and its connected tools: prompt injection, jailbreaks and goal hijacking, scored by a judge model against a rubric.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['seguridad', 'agentes'],
  },
  {
    id: 'guardarrailes',
    familia: 'seguridad',
    titulo: 'Guardrails and output filters',
    texto:
      'System prompt rewrite, input and output filters, and explicit limits on what the agent can query or run. Regression tests keep the hole closed.',
    sectores: ['b2b', 'salud', 'legal'],
    tecnologias: ['seguridad', 'chat', 'compliance'],
  },
  {
    id: 'hardening-rag',
    familia: 'seguridad',
    titulo: 'RAG and tool hardening',
    texto:
      'Role-based access control over the sources, sanitisation of the context that reaches the model and least-privilege permissions for every tool connected to the agent.',
    sectores: ['b2b', 'publico', 'legal'],
    tecnologias: ['seguridad', 'rag'],
  },
  {
    id: 'vigilancia-ia',
    familia: 'seguridad',
    titulo: 'Continuous assistant monitoring',
    texto:
      'Regular rescans, with an alert whenever a prompt change or a new source reopens a previously closed leak.',
    sectores: ['b2b', 'publico', 'salud'],
    tecnologias: ['seguridad', 'compliance'],
  },
  {
    id: 'plataforma-seguros',
    familia: 'verticales',
    titulo: 'Corporate AI platform for insurance',
    texto:
      'Internal catalogue of models (classification, fraud, OCR) with centralised governance, costs and observability.',
    sectores: ['legal', 'b2b'],
    tecnologias: ['modelos', 'agentes', 'compliance'],
  },
  {
    id: 'asistente-legal',
    familia: 'verticales',
    titulo: 'AI assistant for the legal sector',
    texto:
      'Legal vertical with RAG over case law, assisted drafting and human-in-the-loop validation.',
    sectores: ['legal', 'b2b'],
    tecnologias: ['rag', 'chat', 'compliance'],
  },
  {
    id: 'aceleradora-empresarial',
    familia: 'verticales',
    titulo: 'AI tooling for a business accelerator',
    texto:
      'Programme management with automatic startup assessment, mentor matching and reports for European funders.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['agentes', 'datos'],
  },
  {
    id: 'gemelo-digital',
    familia: 'verticales',
    titulo: 'Crowd-capacity digital twin',
    texto:
      'Digital twin for footfall scenarios and mass events. Tests measures before they are rolled out.',
    sectores: ['publico', 'turismo'],
    tecnologias: ['datos', 'modelos'],
  },
  {
    id: 'datos-sinteticos-salud',
    familia: 'verticales',
    titulo: 'Synthetic data for health research',
    texto:
      'Synthetic datasets that preserve statistical properties without personal information. K-anonymity and differential privacy.',
    sectores: ['salud', 'b2b'],
    tecnologias: ['modelos', 'datos', 'compliance'],
  },
  {
    id: 'data-spaces',
    familia: 'verticales',
    titulo: 'Federated data spaces (Gaia-X)',
    texto:
      'IDS/Gaia-X-compliant sector data space for sharing data between organisations without giving up data sovereignty.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['datos', 'compliance'],
  },
  {
    id: 'finetuning-vertical',
    familia: 'modelos',
    titulo: 'Fine-tuning open-weight LLMs for your sector',
    texto:
      'Mistral or Llama tuned on the client\'s own corpus. Meets EU sovereignty requirements and lowers inference costs.',
    sectores: ['b2b', 'legal', 'salud'],
    tecnologias: ['modelos'],
  },
  {
    id: 'forecasting-anomaly',
    familia: 'modelos',
    titulo: 'Forecasting and anomaly detection',
    texto:
      'Time-series models (Prophet, ARIMA, deep learning) and anomaly detection on operational metrics.',
    sectores: ['b2b', 'publico', 'turismo'],
    tecnologias: ['modelos', 'datos'],
  },
  {
    id: 'clasificacion-salud',
    familia: 'modelos',
    titulo: 'Supervised classification for clinical triage',
    texto:
      'Symptom triage model for a remote health assistant, trained on synthetic data. Auditable and reproducible.',
    sectores: ['salud', 'legal'],
    tecnologias: ['modelos', 'compliance'],
  },
  {
    id: 'ocr-custom',
    familia: 'modelos',
    titulo: 'Custom OCR for specialist documents',
    texto:
      'Structured field extraction from policies, invoices, prescriptions or case files. Incremental retraining from user feedback.',
    sectores: ['legal', 'b2b', 'publico'],
    tecnologias: ['modelos', 'datos'],
  },
  {
    id: 'eval-benchmarking',
    familia: 'modelos',
    titulo: 'Model evaluation and benchmarking',
    texto:
      'Reproducible harness to compare LLMs and classical models on your specific task, with metrics tailored to your case rather than generic ones.',
    sectores: ['b2b'],
    tecnologias: ['modelos', 'compliance'],
  },
];
