import type { Question, DimensionKey } from '@/types/personality';

const DIMENSION_ORDER: DimensionKey[] = ['ei', 'sn', 'tf', 'jp', 'at'];

// Swedish personality test questions - 6 questions per dimension (30 total)
const questionTexts: string[] = [
  // EI - Energi (Extrovert/Introvert)
  'Jag laddar batterierna genom att umgås med andra människor',
  'Jag trivs bäst i stora sällskap och sociala sammanhang',
  'Jag tar gärna initiativ till konversationer med nya människor',
  'Jag föredrar att prata igenom mina tankar med andra',
  'Jag blir energisk av att delta i gruppdiskussioner',
  'Jag söker aktivt upp sociala evenemang och fester',

  // SN - Perception (Sinne/Intuition)
  'Jag fokuserar på konkreta fakta snarare än abstrakta idéer',
  'Jag litar mer på min erfarenhet än på min fantasi',
  'Jag föredrar praktiska lösningar framför teoretiska',
  'Jag uppmärksammar detaljer mer än helheten',
  'Jag trivs med rutiner och beprövade metoder',
  'Jag föredrar att leva i nuet snarare än att drömma om framtiden',

  // TF - Beslut (Tanke/Känsla)
  'Jag fattar beslut baserat på logik snarare än känslor',
  'Jag värdesätter ärlighet även om det kan såra',
  'Jag analyserar för- och nackdelar noggrant',
  'Jag håller mig objektiv i konfliktsituationer',
  'Jag prioriterar effektivitet framför harmoni',
  'Jag ifrågasätter beslut som bara baseras på känslor',

  // JP - Livsstil (Bedömning/Perception)
  'Jag föredrar att ha en tydlig plan för framtiden',
  'Jag trivs med struktur och deadlines',
  'Jag avslutar gärna uppgifter innan jag börjar nya',
  'Jag föredrar förutsägbarhet framför överraskningar',
  'Jag organiserar mitt liv noggrant',
  'Jag blir stressad av sista-minuten-förändringar',

  // AT - Identitet (Assertiv/Turbulent)
  'Jag känner mig säker på mig själv i de flesta situationer',
  'Jag låter inte andras åsikter påverka min självbild',
  'Jag hanterar stress och motgångar utan större oro',
  'Jag är nöjd med den jag är',
  'Jag tvivlar sällan på mina beslut',
  'Jag söker inte bekräftelse från andra för att må bra',
];

export const QUESTIONS: Question[] = questionTexts.map((text, i) => ({
  id: i + 1,
  text,
  dimension: DIMENSION_ORDER[Math.floor(i / 6)],
}));
