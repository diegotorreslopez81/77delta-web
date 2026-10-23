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
  { slug: 'agentes', num: '02', titulo: 'Autonomous agents', texto: 'Agents that run real business processes: they query internal systems, answer business questions about your data, monitor, test and prospect. With a full trace of every step so it can be audited.' },
  { slug: 'rag', num: '03', titulo: 'Search and knowledge', texto: 'Semantic search across your intranet, your regulations or your recordings. Role-based access control, mandatory source citation in every answer and incremental indexing.' },
  { slug: 'workflow', num: '04', titulo: 'Process automation', texto: 'Integration between systems that are not connected, incident management, multichannel communication, automatic reports and technical proposals for public tenders.' },
  { slug: 'governance', num: '05', titulo: 'Governance and compliance', texto: 'Governance of AI systems under the EU AI Act, ALTAI audits and multi-framework compliance with GDPR, NIS2 and the accessibility standard. The mandatory documentation is generated automatically.' },
  { slug: 'seguridad', num: '06', titulo: 'AI security', texto: 'Audit and hardening of the assistants you already have live: what information they can reveal, how it is triggered and how to fix it. Includes adversarial testing, guardrails and continuous monitoring.' },
  { slug: 'verticales', num: '07', titulo: 'Vertical platforms and synthetic data', texto: 'AI platforms for a specific sector (insurance, legal, healthcare, business acceleration), digital simulation and generation of privacy-preserving synthetic data.' },
  { slug: 'modelos', num: '08', titulo: 'Custom models and prediction', texto: 'Fine-tuning of open models for a vertical, forecasting and anomaly detection, supervised classification, custom document recognition and model evaluation.' },
];

/** Filter labels. The key is the one carried by the cases. */
export const sectores: Record<string, string> = {
  publico: 'Public sector',
  salud: 'Health',
  turismo: 'Tourism',
  edu: 'Training',
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
      'Web + WhatsApp conversational assistant so citizens can handle procedures, grants and regulations without travelling or calling the council helpline.',
    sectores: ['publico'],
    tecnologias: ['chat', 'rag'],
  },
  {
    id: 'chatbot-academico',
    familia: 'conversacional',
    titulo: 'University academic chatbot',
    texto:
      'Assistant with SSO against the institution\'s LDAP/SAML and RAG over study plans, enrolment and academic regulations. Multilingual.',
    sectores: ['edu', 'publico'],
    tecnologias: ['chat', 'rag'],
  },
  {
    id: 'chatbot-turistico',
    familia: 'conversacional',
    titulo: 'Smart destination tourism chatbot',
    texto:
      'Multilingual assistant (ES/EN/CA/FR/DE/IT) with geolocation for points of interest, events, dining and visitor mobility.',
    sectores: ['turismo', 'publico'],
    tecnologias: ['chat', 'rag'],
  },
  {
    id: 'chatbot-crm',
    familia: 'conversacional',
    titulo: 'Chatbot integrated into a corporate CRM',
    texto:
      'Assistant with tool calling over your open source CRM: looks up customers, opens tickets, drafts emails, runs workflows.',
    sectores: ['b2b'],
    tecnologias: ['chat', 'agentes'],
  },
  {
    id: 'recepcionista-salud',
    familia: 'conversacional',
    titulo: 'AI receptionist on WhatsApp for clinics',
    texto:
      'Assistant that manages appointments in Google Calendar, transcribes voice notes and hands over to a person when it detects an emergency. Pay-per-use pricing.',
    sectores: ['salud'],
    tecnologias: ['chat', 'agentes'],
  },
  {
    id: 'chatbot-legal',
    familia: 'conversacional',
    titulo: 'Vertical chatbot for legal and insurance',
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
      'LangGraph agents that run the client\'s administrative processes, with predictive observability and an audit log for the AI Act.',
    sectores: ['publico', 'b2b'],
    tecnologias: ['agentes', 'compliance'],
  },
  {
    id: 'agente-bi-conversacional',
    familia: 'agentes',
    titulo: 'Conversational BI with text-to-SQL',
    texto:
      'Agent that queries your operational databases and returns indicators in natural language. Semantic validation, SQL injection protection.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['agentes', 'datos'],
  },
  {
    id: 'agente-normativa',
    familia: 'agentes',
    titulo: 'Conversational agent for regulatory queries',
    texto:
      'RAG over the Official State Gazette (BOE), the Public Sector Contracts Act and sector regulations. Tells apart what is in force from what has been repealed, and cites articles.',
    sectores: ['legal', 'publico'],
    tecnologias: ['agentes', 'rag', 'compliance'],
  },
  {
    id: 'agentes-qa',
    familia: 'agentes',
    titulo: 'QA and automated testing agents',
    texto:
      'Agents that generate tests, detect regressions and validate OWASP patterns on legacy code.',
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
      'Prospecting and sequences across LinkedIn, email and X with AI personalisation, detection of genuine replies and automatic suppression.',
    sectores: ['b2b'],
    tecnologias: ['agentes', 'chat'],
  },
  {
    id: 'agente-evaluaciones',
    familia: 'agentes',
    titulo: 'Assessment generation agent',
    texto:
      'Quizzes from text, PDF, URL or YouTube. Multiple choice, open questions, matching, ordering. Anti-cheating controls and automatic marking.',
    sectores: ['edu', 'b2b'],
    tecnologias: ['agentes', 'modelos'],
  },
  {
    id: 'rag-corporativo',
    familia: 'rag',
    titulo: 'RAG over corporate documentation',
    texto:
      'Semantic search with role-based access control over intranet, manuals and procedures. Verifiable source citations.',
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
    titulo: 'RAG over audiovisual transcripts',
    texto:
      'Whisper transcription + semantic search with timestamps over plenary sessions, classes or video training.',
    sectores: ['publico', 'edu'],
    tecnologias: ['rag', 'modelos'],
  },
  {
    id: 'rag-busqueda-juridica',
    familia: 'rag',
    titulo: 'Semantic search over case law',
    texto:
      'RAG over rulings and regulations with validation of legal citations and comparison across bodies of case law.',
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
    titulo: 'Open source ITSM and ticketing',
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
    titulo: 'Automatic report generation',
    texto:
      'Pipeline that extracts operational data and generates DOCX/PDF with interpretive narrative and historical comparisons.',
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
      'Register of AI systems, risk classification, impact assessment and monitoring of drift and bias.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['compliance'],
  },
  {
    id: 'auditoria-altai',
    familia: 'governance',
    titulo: 'ALTAI trustworthy AI audit',
    texto:
      'European framework for assessing the 7 ALTAI requirements, with a certifiable report for public tenders.',
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
    titulo: 'Audit of published AI assistants',
    texto:
      'Scan of the AI chatbots on a website: extraction of internal instructions, disclosure of commercial terms and data leakage, with the exact excerpt that proves each finding.',
    sectores: ['b2b', 'publico', 'salud', 'legal'],
    tecnologias: ['seguridad', 'chat'],
  },
  {
    id: 'red-team-llm',
    familia: 'seguridad',
    titulo: 'Adversarial testing of LLMs and agents',
    texto:
      'Battery of tests against the assistant and the tools connected to it: prompt injection, jailbreaking and diversion from intended behaviour, scored by a judge model with a rubric.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['seguridad', 'agentes'],
  },
  {
    id: 'guardarrailes',
    familia: 'seguridad',
    titulo: 'Guardrails and output filters',
    texto:
      'Rewriting of the system prompt, input and output filters, and explicit limits on what the agent can query or execute. With regression tests so the hole does not reopen.',
    sectores: ['b2b', 'salud', 'legal'],
    tecnologias: ['seguridad', 'chat', 'compliance'],
  },
  {
    id: 'hardening-rag',
    familia: 'seguridad',
    titulo: 'Hardening of RAG and tools',
    texto:
      'Role-based access control over the sources, sanitising of the context that reaches the model and least-privilege permissions for every tool connected to the agent.',
    sectores: ['b2b', 'publico', 'legal'],
    tecnologias: ['seguridad', 'rag'],
  },
  {
    id: 'vigilancia-ia',
    familia: 'seguridad',
    titulo: 'Continuous assistant monitoring',
    texto:
      'Periodic re-scanning and an alert when a prompt change or a new source reopens a leak that had been closed.',
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
    titulo: 'Business accelerator with AI tooling',
    texto:
      'Programme management with automatic startup assessment, mentor matching and reports for European funders.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['agentes', 'datos'],
  },
  {
    id: 'gemelo-digital',
    familia: 'verticales',
    titulo: 'Digital simulation and crowd-capacity twin',
    texto:
      'Digital twin for footfall scenarios and mass events. Evaluates measures before they are implemented.',
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
      'Sector data space compliant with IDS / Gaia-X for sharing data between organisations while keeping sovereignty.',
    sectores: ['b2b', 'publico'],
    tecnologias: ['datos', 'compliance'],
  },
  {
    id: 'finetuning-vertical',
    familia: 'modelos',
    titulo: 'Fine-tuning of vertical open-weights LLMs',
    texto:
      'Tuning of Mistral or Llama on the client\'s own corpus. Meets EU sovereignty and lowers inference cost.',
    sectores: ['b2b', 'legal', 'salud'],
    tecnologias: ['modelos'],
  },
  {
    id: 'forecasting-anomaly',
    familia: 'modelos',
    titulo: 'Forecasting and anomaly detection',
    texto:
      'Time series models (Prophet, ARIMA, deep learning) and anomaly detection on operational metrics.',
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
    titulo: 'Custom OCR for specific documentation',
    texto:
      'Structured field extraction from policies, invoices, prescriptions or case files. Incremental retraining with feedback.',
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
