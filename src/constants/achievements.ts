/**
 * Achievement definitions with i18n support
 * Add new achievements here - no code changes needed in the hook
 */

export interface AchievementDefinition {
  id: string;
  code: string;
  name_sv: string;
  name_en: string;
  description_sv: string;
  description_en: string;
  icon: string;
  points: number;
  category: 'profile' | 'matching' | 'chat' | 'personality' | 'social';
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: 'profile_complete',
    code: 'profile_complete',
    name_sv: 'Profilmästare',
    name_en: 'Profile Master',
    description_sv: 'Fyll i din profil helt',
    description_en: 'Complete your profile',
    icon: '👤',
    category: 'profile',
    points: 10,
  },
  {
    id: 'first_match',
    code: 'first_match',
    name_sv: 'Första matchningen',
    name_en: 'First Match',
    description_sv: 'Få din första match',
    description_en: 'Get your first match',
    icon: '💕',
    category: 'matching',
    points: 20,
  },
  {
    id: 'first_message',
    code: 'first_message',
    name_sv: 'Isbrytare',
    name_en: 'Icebreaker',
    description_sv: 'Skicka ditt första meddelande',
    description_en: 'Send your first message',
    icon: '💬',
    category: 'chat',
    points: 15,
  },
  {
    id: 'personality_test',
    code: 'personality_test',
    name_sv: 'Självkännedom',
    name_en: 'Self-Awareness',
    description_sv: 'Genomför personlighetstestet',
    description_en: 'Complete the personality test',
    icon: '🧠',
    category: 'personality',
    points: 25,
  },
  {
    id: 'photo_upload',
    code: 'photo_upload',
    name_sv: 'Fotogen',
    name_en: 'Photogenic',
    description_sv: 'Ladda upp ett profilfoto',
    description_en: 'Upload a profile photo',
    icon: '📷',
    category: 'profile',
    points: 10,
  },
  {
    id: 'weekly_active',
    code: 'weekly_active',
    name_sv: 'Veckoaktiv',
    name_en: 'Weekly Active',
    description_sv: 'Logga in varje dag i en vecka',
    description_en: 'Log in every day for a week',
    icon: '🔥',
    category: 'social',
    points: 30,
  },
  {
    id: 'conversation_starter',
    code: 'conversation_starter',
    name_sv: 'Konversationsstartare',
    name_en: 'Conversation Starter',
    description_sv: 'Starta 5 konversationer',
    description_en: 'Start 5 conversations',
    icon: '🗣️',
    category: 'chat',
    points: 25,
  },
  {
    id: 'perfect_match',
    code: 'perfect_match',
    name_sv: 'Perfekt Match',
    name_en: 'Perfect Match',
    description_sv: 'Få en match med 95%+ kompatibilitet',
    description_en: 'Get a match with 95%+ compatibility',
    icon: '💯',
    category: 'matching',
    points: 50,
  },
  {
    id: 'id_verified',
    code: 'id_verified',
    name_sv: 'Verifierad',
    name_en: 'Verified',
    description_sv: 'Verifiera din identitet med ID',
    description_en: 'Verify your identity with ID',
    icon: '🪪',
    category: 'profile',
    points: 15,
  },
];

/**
 * Helper to get localized achievement text
 */
export const getLocalizedAchievement = (
  definition: AchievementDefinition,
  locale: string
): { name: string; description: string } => {
  const isSwedish = locale.startsWith('sv');
  return {
    name: isSwedish ? definition.name_sv : definition.name_en,
    description: isSwedish ? definition.description_sv : definition.description_en,
  };
};
