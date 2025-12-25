export type DimensionKey = 'ei' | 'sn' | 'tf' | 'jp' | 'at';

export type PersonalityCategory = 'DIPLOMAT' | 'STRATEGER' | 'BYGGARE' | 'UPPTÄCKARE';

export interface PersonalityTestResult {
  scores: Record<DimensionKey, number>;
  category: PersonalityCategory;
  archetype: string;
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
