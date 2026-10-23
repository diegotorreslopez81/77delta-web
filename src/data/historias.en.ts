/** The three case studies with a full case at /en/success-stories/<slug>/. English version of historias.ts. */
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
    titular: 'fewer missed appointments',
    cliente: 'Three dental clinics in Barcelona',
    sector: 'Clinics and healthcare',
    resumen:
      'A WhatsApp virtual receptionist, live in four weeks. 22 hours a week freed up and payback in under a month.',
    metricas: [
      { valor: '18% → 11%', etiqueta: 'no-show rate' },
      { valor: '22h/week', etiqueta: 'freed up at reception' },
      { valor: 'Under 1 month', etiqueta: 'payback period' },
    ],
    situacion:
      'A group of three dental clinics in Barcelona shared the same problem: 18% of patients missed their appointments without notice. Three receptionists spent their days phoning patients to confirm, but few were actually reached and slots went unfilled.',
    solucion:
      'We deployed Contestia, our virtual receptionist on WhatsApp. The assistant sends a confirmation 24 hours ahead with the appointment details, handles changes by offering alternatives from the live diary, frees the slot if the patient cancels and notifies the waiting list, and escalates to the human team only for sensitive clinical cases. It integrates with Google Calendar and the practice management system.',
    como: 'Four weeks. Week 1: audit of missed calls and mapping of the 12 most common scenarios. Week 2: pilot at the main clinic on limited volume. Week 3: integration with the calendar and practice management system. Week 4: rollout to the remaining two clinics.',
    resultados:
      'Three months after rollout: no-show rate down from 18% to 11%. Reception recovered 22 hours a week (the equivalent of a half-time post), redirected to front-desk care, treatment quotes and new-patient acquisition. Patient satisfaction rose by 0.8 points on a 10-point scale. The investment paid for itself in under a month.',
  },
  {
    slug: 'distribuidora-industrial',
    cifra: { valor: 2, sufijo: 'h' },
    etiqueta: 'saved per sales rep, every day',
    titular: 'saved per sales rep, every day',
    cliente: 'Industrial distributor with 12 sales reps',
    sector: 'Wholesale and distribution',
    resumen:
      'An automated WhatsApp assistant takes the orders. 25% more order capacity without adding headcount.',
    metricas: [
      { valor: '2h/day', etiqueta: 'per sales rep' },
      { valor: '+25%', etiqueta: 'order capacity, same headcount' },
      { valor: 'Zero', etiqueta: 'order-entry errors' },
    ],
    situacion:
      'A distributor of industrial supplies with 12 sales reps received orders by WhatsApp, phone and email. Reps spent the first two hours of the day keying orders into the ERP by hand. More than half the working day went on admin rather than selling.',
    solucion:
      'We connected an automated assistant to the main WhatsApp number. The system identifies the customer by phone number and VAT number, recognises catalogue references, checks stock and price in real time, creates the order in the ERP and notifies the sales rep in charge. The rep steps in only for exceptions: a new customer, an off-catalogue product or approval of a special discount.',
    como: 'Six weeks. Analysis of regular ordering patterns, ERP connection, training the assistant on the full catalogue and the names customers use for products, real-time stock and price validation, and a gradual customer-by-customer rollout under supervision.',
    resultados:
      'Each sales rep recovered between 90 minutes and 2 hours a day. Order handling capacity grew by 25% without adding headcount. Manual order-entry errors were eliminated. Reps now spend those hours on active selling and on strategic accounts.',
  },
  {
    slug: 'despacho-mercantil',
    cifra: { valor: 20, sufijo: 'h' },
    etiqueta: 'freed up per partner, every month',
    titular: 'freed up per senior partner every month',
    cliente: 'Commercial law firm with 18 professionals',
    sector: 'Law and accountancy firms',
    resumen:
      'A contract generator built on the firm\'s own templates. Client response time cut from 3 days to 6 hours.',
    metricas: [
      { valor: '20h/month', etiqueta: 'per senior partner' },
      { valor: '3 days → 6h', etiqueta: 'client response time' },
      { valor: '5 templates', etiqueta: 'standardised' },
    ],
    situacion:
      'A commercial law firm with 18 professionals kept drafting similar contracts over and over. Each senior partner spent between 4 and 6 hours a week reviewing and drafting contracts that were, in essence, variations of five templates. That time could not be billed at senior rates and held up work for urgent clients.',
    solucion:
      'We built a contract generator based on the firm\'s own templates. The lawyer answers a structured questionnaire and the system delivers the contract ready for review. Smart search over the historical archive retrieves precedents in seconds. The signing partner always stays in control.',
    como: 'Eight weeks. Analysis of the five most frequent contract types, mapping of the key variables, training on the firm\'s anonymised archive, validation against real cases from the last six months, and a gradual rollout with calibration sessions.',
    resultados:
      'Each senior partner recovers roughly 20 hours a month, redirected to higher-value cases or business development. Average client response time on standard contracts fell from 3 days to 6 hours. Client satisfaction rose markedly.',
  },
];
