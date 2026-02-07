export type DimensionKey = 'ei' | 'sn' | 'tf' | 'jp' | 'at';

// 16 MBTI-style archetypes grouped into 4 categories
export type ArchetypeCode = 
  // Diplomats (NF types)
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  // Strategists (NT types)  
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  // Builders (SJ types)
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  // Explorers (SP types)
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export type PersonalityCategory = 'DIPLOMAT' | 'STRATEGER' | 'BYGGARE' | 'UPPTÄCKARE';

export interface PersonalityTestResult {
  scores: Record<DimensionKey, number>;
  category: PersonalityCategory;
  archetype: ArchetypeCode;
  answers: number[];
}

export interface Question {
  id: number;
  text: string;
  dimension: DimensionKey;
}

export const DIMENSION_LABELS: Record<DimensionKey, { left: string; right: string; name: string }> = {
  ei: { left: 'Introvert', right: 'Extrovert', name: 'Energi' },
  sn: { left: 'Sinne', right: 'Intuition', name: 'Perception' },
  tf: { left: 'Tanke', right: 'Känsla', name: 'Beslut' },
  jp: { left: 'Bedömning', right: 'Perception', name: 'Livsstil' },
  at: { left: 'Turbulent', right: 'Assertiv', name: 'Identitet' },
};

export const CATEGORY_INFO: Record<PersonalityCategory, {
  title: string;
  description: string;
  emoji: string;
  color: string;
  tips: string[];
}> = {
  DIPLOMAT: {
    title: 'Diplomaten',
    description: 'Du är en empatisk och varm person som värdesätter djupa relationer och harmoni.',
    emoji: '🕊️',
    color: 'diplomat',
    tips: [
      'Du skapar starka emotionella band snabbt',
      'Fokusera på att lyssna aktivt på din match',
      'Var inte rädd att visa sårbarhet',
    ],
  },
  STRATEGER: {
    title: 'Strategen',
    description: 'Du är analytisk och målinriktad med en naturlig förmåga att se helheten.',
    emoji: '🎯',
    color: 'strateger',
    tips: [
      'Du imponerar med din intelligens och vision',
      'Balansera logik med känslomässig öppenhet',
      'Ge din match utrymme att uttrycka sig',
    ],
  },
  BYGGARE: {
    title: 'Byggaren',
    description: 'Du är praktisk och pålitlig med en stark känsla för ansvar och lojalitet.',
    emoji: '🏗️',
    color: 'byggare',
    tips: [
      'Din stabilitet är attraktiv för många',
      'Visa mer av din lekfulla sida',
      'Planera genomtänkta dejter',
    ],
  },
  UPPTÄCKARE: {
    title: 'Upptäckaren',
    description: 'Du är spontan och äventyrlig med en passion för nya upplevelser.',
    emoji: '🌟',
    color: 'upptackare',
    tips: [
      'Din energi är smittsam och tilltalande',
      'Balansera spontanitet med uppmärksamhet',
      'Skapa minnesvärda första dejter',
    ],
  },
};

// 16 Archetypes with full info
export const ARCHETYPE_INFO: Record<ArchetypeCode, {
  name: string;
  title: string;
  category: PersonalityCategory;
  description: string;
  emoji: string;
  strengths: string[];
  loveStyle: string;
}> = {
  // Diplomats
  INFJ: {
    name: 'INFJ',
    title: 'Advokaten',
    category: 'DIPLOMAT',
    description: 'Tyst och mystisk, men inspirerande och oupphörligt idealistisk.',
    emoji: '🦋',
    strengths: ['Djup empati', 'Kreativ vision', 'Passionerad'],
    loveStyle: 'Söker djupa, meningsfulla förbindelser',
  },
  INFP: {
    name: 'INFP',
    title: 'Medlaren',
    category: 'DIPLOMAT',
    description: 'Poetisk, vänlig och altruistisk, alltid redo att hjälpa en god sak.',
    emoji: '🌸',
    strengths: ['Kreativitet', 'Empati', 'Autenticitet'],
    loveStyle: 'Drömmer om den perfekta romantiken',
  },
  ENFJ: {
    name: 'ENFJ',
    title: 'Huvudpersonen',
    category: 'DIPLOMAT',
    description: 'Karismatisk och inspirerande ledare, kan fängsla sina lyssnare.',
    emoji: '🌟',
    strengths: ['Karisma', 'Naturlig ledare', 'Generös'],
    loveStyle: 'Ger allt i relationer, extremt hängivna',
  },
  ENFP: {
    name: 'ENFP',
    title: 'Kampanjaren',
    category: 'DIPLOMAT',
    description: 'Entusiastisk, kreativ och socialt fri ande som alltid hittar skäl att le.',
    emoji: '🎭',
    strengths: ['Kreativitet', 'Entusiasm', 'Social förmåga'],
    loveStyle: 'Passionerad och spontan i kärlek',
  },
  
  // Strategists
  INTJ: {
    name: 'INTJ',
    title: 'Arkitekten',
    category: 'STRATEGER',
    description: 'Fantasifull och strategisk tänkare med en plan för allt.',
    emoji: '🏛️',
    strengths: ['Strategisk', 'Oberoende', 'Beslutsam'],
    loveStyle: 'Söker intellektuella partners',
  },
  INTP: {
    name: 'INTP',
    title: 'Logikern',
    category: 'STRATEGER',
    description: 'Uppfinnare med en otrolig törst efter kunskap.',
    emoji: '🔬',
    strengths: ['Logik', 'Objektivitet', 'Innovation'],
    loveStyle: 'Värdesätter intellektuell stimulans',
  },
  ENTJ: {
    name: 'ENTJ',
    title: 'Befälhavaren',
    category: 'STRATEGER',
    description: 'Djärv, fantasifull och viljestark ledare som alltid hittar vägen.',
    emoji: '⚔️',
    strengths: ['Ledarskap', 'Strategisk', 'Effektiv'],
    loveStyle: 'Ambitiös och engagerad partner',
  },
  ENTP: {
    name: 'ENTP',
    title: 'Debattören',
    category: 'STRATEGER',
    description: 'Smart och nyfiken tänkare som inte kan motstå en intellektuell utmaning.',
    emoji: '💡',
    strengths: ['Kvicktänkt', 'Kreativ', 'Karismatisk'],
    loveStyle: 'Älskar intellektuell utmaning i relationer',
  },
  
  // Builders
  ISTJ: {
    name: 'ISTJ',
    title: 'Logistikern',
    category: 'BYGGARE',
    description: 'Praktisk och faktaorienterad individ vars tillförlitlighet är obestridlig.',
    emoji: '📋',
    strengths: ['Pålitlighet', 'Organiserad', 'Lojal'],
    loveStyle: 'Trogen och stabil i relationer',
  },
  ISFJ: {
    name: 'ISFJ',
    title: 'Försvararen',
    category: 'BYGGARE',
    description: 'Mycket engagerad och varm beskyddare, alltid redo att försvara sina nära.',
    emoji: '🛡️',
    strengths: ['Omtänksam', 'Lojal', 'Pålitlig'],
    loveStyle: 'Extremt omhändertagande och kärleksfull',
  },
  ESTJ: {
    name: 'ESTJ',
    title: 'Chefen',
    category: 'BYGGARE',
    description: 'Utmärkt administratör, oöverträffad på att hantera saker eller människor.',
    emoji: '👔',
    strengths: ['Organisation', 'Ledarskap', 'Direkthet'],
    loveStyle: 'Pålitlig och engagerad i långa relationer',
  },
  ESFJ: {
    name: 'ESFJ',
    title: 'Konsuln',
    category: 'BYGGARE',
    description: 'Extraordinärt omtänksam, social och populär, alltid ivrig att hjälpa.',
    emoji: '🤝',
    strengths: ['Social', 'Omtänksam', 'Lojal'],
    loveStyle: 'Vill skapa harmoni och värme',
  },
  
  // Explorers
  ISTP: {
    name: 'ISTP',
    title: 'Virtuosen',
    category: 'UPPTÄCKARE',
    description: 'Djärv och praktisk experimentator, mästare på alla verktyg.',
    emoji: '🔧',
    strengths: ['Praktisk', 'Problemlösare', 'Oberoende'],
    loveStyle: 'Avslappnad men lojal partner',
  },
  ISFP: {
    name: 'ISFP',
    title: 'Äventyraren',
    category: 'UPPTÄCKARE',
    description: 'Flexibel och charmig artist, alltid redo att utforska något nytt.',
    emoji: '🎨',
    strengths: ['Kreativitet', 'Spontanitet', 'Känslighet'],
    loveStyle: 'Romantisk och passionerad',
  },
  ESTP: {
    name: 'ESTP',
    title: 'Entreprenören',
    category: 'UPPTÄCKARE',
    description: 'Smart, energisk och perceptiv, lever verkligen på gränsen.',
    emoji: '🎲',
    strengths: ['Energisk', 'Perceptiv', 'Direkt'],
    loveStyle: 'Spännande och spontan i kärlek',
  },
  ESFP: {
    name: 'ESFP',
    title: 'Underhållaren',
    category: 'UPPTÄCKARE',
    description: 'Spontan, energisk och entusiastisk underhållare.',
    emoji: '🎉',
    strengths: ['Energi', 'Positivitet', 'Social'],
    loveStyle: 'Generös och rolig partner',
  },
};

// Calculate archetype from scores
export function calculateArchetype(scores: Record<DimensionKey, number>): ArchetypeCode {
  const e = scores.ei >= 50;
  const n = scores.sn < 50; // Low score = Intuition (N), high = Sensing (S)
  const f = scores.tf < 50; // Low score = Feeling (F), high = Thinking (T)
  const j = scores.jp >= 50; // High score = Judging (J), low = Perceiving (P)
  
  const code = `${e ? 'E' : 'I'}${n ? 'N' : 'S'}${f ? 'F' : 'T'}${j ? 'J' : 'P'}` as ArchetypeCode;
  return code;
}

// Archetype codes grouped by category (for "same category" lists)
export const ARCHETYPE_CODES_BY_CATEGORY: Record<PersonalityCategory, ArchetypeCode[]> = {
  DIPLOMAT: ['INFJ', 'INFP', 'ENFJ', 'ENFP'],
  STRATEGER: ['INTJ', 'INTP', 'ENTJ', 'ENTP'],
  BYGGARE: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'],
  UPPTÄCKARE: ['ISTP', 'ISFP', 'ESTP', 'ESFP'],
};

// Get category from archetype
export function getCategoryFromArchetype(archetype: ArchetypeCode): PersonalityCategory {
  return ARCHETYPE_INFO[archetype].category;
}
