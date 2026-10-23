/** The three success stories with a full case at /en/success-stories/<slug>/. English version of historias.ts. */
export interface Historia {
  slug: string;
  /** Headline figure, split for the headline counter. */
  cifra: { valor: number; sufijo: string };
  /** Short label under the figure, for the index card. */
  etiqueta: string;
  /** Rest of the headline, after the figure. */
  titular: string;
  /** Who the client is. */
  cliente: string;
  /** Sector the client belongs to, as displayed. */
  sector: string;
  /** One sentence for the index card. */
  resumen: string;
  /** Three verified metrics, in the row under the headline. */
  metricas: { valor: string; etiqueta: string }[];
  situacion: string;
  solucion: string;
  como: string;
  resultados: string;
}

export const historias: Historia[] = [
  {
    slug: 'clinicas-dentales-barcelona',
    cifra: { valor: 38, sufijo: '%' },
    etiqueta: 'fewer no-shows',
    titular: 'fewer no-shows at the practice',
    cliente: 'Three dental clinics in Barcelona',
    sector: 'Clinics and healthcare',
    resumen:
      'A virtual receptionist on WhatsApp in 4 weeks. 22 hours a week freed up and ROI in under a month.',
    metricas: [
      { valor: '18% → 11%', etiqueta: 'no-show rate' },
      { valor: '22h/week', etiqueta: 'freed up at reception' },
      { valor: 'Under 1 month', etiqueta: 'total ROI' },
    ],
    situacion:
      'A group of three dental clinics in Barcelona shared the same problem: 18% of patients missed their appointments without notice. Reception had three people dedicated to phone confirmations, but the share of patients actually reached was low and slots went unfilled.',
    solucion:
      'We deployed Contestia, our virtual receptionist on WhatsApp. The assistant sends a confirmation 24 hours ahead with the visit details, handles changes by proposing alternatives based on the real calendar, frees the slot if the patient cancels and notifies the waiting list, and escalates to the human team only for sensitive clinical cases. Integrated with Google Calendar and the patient record.',
    como: 'Four weeks. Week 1: audit of missed calls and mapping of the 12 usual scenarios. Week 2: pilot at the main clinic with controlled volume. Week 3: integration with the calendar and patient record. Week 4: rollout to the remaining two clinics.',
    resultados:
      'Three months after rollout: no-show rate down from 18% to 11%. Reception recovered 22 hours a week (the equivalent of half a working day for one person), redirected to in-person care, quote management and patient acquisition. Patient satisfaction rose by 0.8 points out of 10. The investment paid for itself in under a month.',
  },
  {
    slug: 'distribuidora-industrial',
    cifra: { valor: 2, sufijo: 'h' },
    etiqueta: 'recovered / sales rep · day',
    titular: 'recovered per sales rep every day',
    cliente: 'Industrial distributor with 12 sales reps',
    sector: 'Distribution and logistics',
    resumen:
      'An automated WhatsApp assistant for order intake. +25% handling capacity without adding headcount.',
    metricas: [
      { valor: '2h/day', etiqueta: 'per sales rep' },
      { valor: '+25%', etiqueta: 'capacity without new headcount' },
      { valor: '0 errors', etiqueta: 'in transcription' },
    ],
    situacion:
      'A distributor of industrial supplies with 12 sales reps received orders by WhatsApp, phone and email. Reps spent the first two hours of the day keying orders into the ERP by hand. More than 50% of the working day went on administrative tasks, not selling.',
    solucion:
      'We connected an automated assistant to the main WhatsApp number. The system identifies the customer by phone number and tax ID, recognises catalogue references, checks stock and price in real time, creates the order in the ERP and notifies the sales rep in charge. The rep steps in only for exceptions: a new customer, an off-catalogue product or approval of a special discount.',
    como: 'Six weeks. Analysis of regular ordering patterns, ERP connection, training the assistant on the full catalogue and customer naming, real-time stock and price validation, and a gradual customer-by-customer rollout under supervision.',
    resultados:
      'Each sales rep recovered between 90 minutes and 2 hours a day. Order handling capacity grew by 25% without adding headcount. Manual transcription errors disappeared. Reps now spend those hours on active selling and on strategic accounts.',
  },
  {
    slug: 'despacho-mercantil',
    cifra: { valor: 20, sufijo: 'h' },
    etiqueta: 'freed up / partner · month',
    titular: 'freed up per senior partner every month',
    cliente: 'Commercial law firm with 18 professionals',
    sector: 'Professional firms',
    resumen:
      'A contract generator built on the firm\'s own templates. Client response time cut from 3 days to 6 hours.',
    metricas: [
      { valor: '20h/month', etiqueta: 'per senior partner' },
      { valor: '3 days → 6h', etiqueta: 'client response time' },
      { valor: '5 templates', etiqueta: 'systematised' },
    ],
    situacion:
      'A commercial law firm with 18 professionals kept drafting similar contracts over and over. Each senior partner spent between 4 and 6 hours a week reviewing and drafting contracts that were, in essence, variations of five templates. That time was not billed at a high-value rate and delayed delivery to urgent clients.',
    solucion:
      'We built a contract generator based on the firm\'s own templates. The lawyer answers a structured questionnaire and the system delivers the contract ready for review. Smart search over the historical archive retrieves precedents in seconds. Control always stays with the partner who signs.',
    como: 'Eight weeks. Analysis of the five most frequent contract types, systematisation of the key variables, training on an anonymised historical archive, validation against real cases from the last six months, and a gradual rollout with calibration sessions.',
    resultados:
      'Each senior partner recovers roughly 20 hours a month, redirected to higher-value cases or business development. Average client response time on standard contracts fell from 3 days to 6 hours. End-client satisfaction improved markedly.',
  },
];
