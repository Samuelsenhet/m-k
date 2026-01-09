import { DimensionKey, PersonalityCategory } from '@/types/personality';

// Score signals for ranking (must sum to 1.0)
// Age is a dealbreaker filter, NOT a scoring signal
export const SCORE_SIGNALS = {
  PERSONALITY_SIMILARITY: 0.40,
  ARCHETYPE_ALIGNMENT: 0.30,
  CONVERSATION_ANXIETY_REDUCTION: 0.00, // Removed from MVP scoring
  INTEREST_OVERLAP: 0.30
} as const;

// Matching ratio: 60% similar + 40% complementary
export const MATCH_RATIO = {
  SIMILAR: 0.6,
  COMPLEMENTARY: 0.4
} as const;

interface PersonalityScores {
  ei: number;
  sn: number;
  tf: number;
  jp: number;
  at: number;
}

interface MatchCandidate {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  category: PersonalityCategory;
  archetype?: string;
  scores: PersonalityScores;
  bio?: string;
  age?: number;
  gender?: string;
  interests?: string[];
  onboardingCompleted?: boolean; // Add for dealbreaker check
}

interface UserProfile extends MatchCandidate {
  minAge?: number;
  maxAge?: number;
  interestedIn?: string;
}

export interface MatchResult {
  user: MatchCandidate;
  matchType: 'similar' | 'complementary';
  matchScore: number;
  compositeScore: number;
  compatibilityFactors: string[];
  dimensionBreakdown?: DimensionBreakdown[];
  isFirstDayMatch?: boolean;
}

export interface DimensionBreakdown {
  dimension: string;
  score: number;
  alignment: 'high' | 'medium' | 'low';
  description: string;
}

export interface MatchOutput {
  match_id: string;
  profile_id: string;
  display_name: string;
  age: number;
  archetype: string;
  compatibility_percentage: number;
  dimension_score_breakdown: DimensionBreakdown[];
  archetype_alignment_score: number;
  conversation_anxiety_reduction_score: number;
  ai_icebreakers: string[]; // Exactly 3 icebreakers
  personality_insight: string;
  match_reason: string;
  is_first_day_match: boolean;
  expires_at: null; // Always null in MVP
  special_effects: string[] | null; // ['confetti', 'celebration'] for first match, null otherwise
  photo_urls: string[];
  bio_preview: string;
  common_interests: string[];
}

// Dealbreaker checks - must pass before scoring
// Age interval is a dealbreaker filter (all users are 20+)
export const passesDealbreakers = (
  user: UserProfile,
  candidate: MatchCandidate
): boolean => {
  // Onboarding completion check (PRP requirement)
  if (candidate.onboardingCompleted === false) {
    return false;
  }
  
  // Age must be within user's preferred range (dealbreaker)
  if (user.minAge && user.maxAge && candidate.age) {
    if (candidate.age < user.minAge || candidate.age > user.maxAge) {
      return false;
    }
  }
  
  // Gender preferences (if applicable)
  if (user.interestedIn && user.interestedIn !== 'all' && candidate.gender) {
    // Map interested_in to gender
    const genderMap: Record<string, string[]> = {
      'men': ['male', 'man'],
      'women': ['female', 'woman'],
      'all': ['male', 'female', 'man', 'woman', 'non-binary', 'other']
    };
    const allowedGenders = genderMap[user.interestedIn] || genderMap['all'];
    if (!allowedGenders.includes(candidate.gender.toLowerCase())) {
      return false;
    }
  }
  
  return true;
};

// Calculate similarity score between two personality profiles (0-100)
const calculateSimilarityScore = (
  scores1: PersonalityScores,
  scores2: PersonalityScores
): number => {
  const dimensions: DimensionKey[] = ['ei', 'sn', 'tf', 'jp', 'at'];
  
  let totalDiff = 0;
  dimensions.forEach((dim) => {
    const diff = Math.abs(scores1[dim] - scores2[dim]);
    totalDiff += diff;
  });

  // Max possible difference is 100 * 5 = 500
  // Convert to similarity percentage
  const similarity = ((500 - totalDiff) / 500) * 100;
  return Math.round(similarity);
};

// Calculate complementary score - looks for balanced opposites
const calculateComplementaryScore = (
  scores1: PersonalityScores,
  scores2: PersonalityScores
): number => {
  // For complementary matching, we want some dimensions to be similar
  // and some to be different (balanced)
  
  // EI and AT should be similar (energy and identity)
  // SN, TF, JP can be complementary
  const similarDims: DimensionKey[] = ['ei', 'at'];
  const complementaryDims: DimensionKey[] = ['sn', 'tf', 'jp'];
  
  let score = 0;
  
  // Reward similarity on similar dimensions
  similarDims.forEach((dim) => {
    const diff = Math.abs(scores1[dim] - scores2[dim]);
    score += (100 - diff) / 2; // Max 50 per dimension
  });
  
  // Reward moderate differences on complementary dimensions
  // Ideal difference is around 30-50 (not too similar, not too extreme)
  complementaryDims.forEach((dim) => {
    const diff = Math.abs(scores1[dim] - scores2[dim]);
    if (diff >= 25 && diff <= 55) {
      score += 40; // Ideal complementary range
    } else if (diff >= 15 && diff <= 65) {
      score += 25; // Acceptable range
    } else {
      score += 10; // Less ideal
    }
  });
  
  // Normalize to 0-100
  const maxScore = (50 * 2) + (40 * 3); // 220
  return Math.round((score / maxScore) * 100);
};

// Calculate archetype alignment score (0-100)
const calculateArchetypeAlignment = (
  archetype1?: string,
  archetype2?: string
): number => {
  if (!archetype1 || !archetype2) return 50; // Neutral if unknown
  
  // Same archetype = high alignment
  if (archetype1 === archetype2) return 95;
  
  // Same category = good alignment
  const categoryMap: Record<string, string> = {
    'INFJ': 'DIPLOMAT', 'INFP': 'DIPLOMAT', 'ENFJ': 'DIPLOMAT', 'ENFP': 'DIPLOMAT',
    'INTJ': 'STRATEGER', 'INTP': 'STRATEGER', 'ENTJ': 'STRATEGER', 'ENTP': 'STRATEGER',
    'ISTJ': 'BYGGARE', 'ISFJ': 'BYGGARE', 'ESTJ': 'BYGGARE', 'ESFJ': 'BYGGARE',
    'ISTP': 'UPPTÄCKARE', 'ISFP': 'UPPTÄCKARE', 'ESTP': 'UPPTÄCKARE', 'ESFP': 'UPPTÄCKARE',
  };
  
  const cat1 = categoryMap[archetype1];
  const cat2 = categoryMap[archetype2];
  
  if (cat1 && cat2 && cat1 === cat2) return 80;
  
  // Cross-category compatibility
  return 60;
};

// Calculate conversation anxiety reduction score (0-100)
// Higher score = less likely to have awkward silences
const calculateAnxietyReduction = (
  scores1: PersonalityScores,
  scores2: PersonalityScores
): number => {
  // Extroverts together = easy conversation
  // Introvert + Extrovert = balanced
  // Introverts together = may need more icebreakers
  
  const avgEnergy = (scores1.ei + scores2.ei) / 2;
  
  // Higher EI = more extroverted = easier conversation
  let score = avgEnergy;
  
  // Similar communication styles help
  const tfDiff = Math.abs(scores1.tf - scores2.tf);
  const communicationBonus = (100 - tfDiff) / 4; // Max 25 bonus
  
  score += communicationBonus;
  
  return Math.min(100, Math.round(score));
};

// Calculate interest overlap score (0-100)
const calculateInterestOverlap = (
  interests1?: string[],
  interests2?: string[]
): number => {
  if (!interests1?.length || !interests2?.length) return 50;
  
  const set1 = new Set(interests1.map(i => i.toLowerCase()));
  const set2 = new Set(interests2.map(i => i.toLowerCase()));
  
  let overlap = 0;
  set1.forEach(interest => {
    if (set2.has(interest)) overlap++;
  });
  
  const maxPossible = Math.min(set1.size, set2.size);
  if (maxPossible === 0) return 50;
  
  return Math.round((overlap / maxPossible) * 100);
};

// Calculate composite score using all signals
// Age is handled as dealbreaker filter, not scoring signal
export const calculateCompositeScore = (
  user: UserProfile,
  candidate: MatchCandidate
): { total: number; breakdown: Record<string, number> } => {
  const personality = calculateSimilarityScore(user.scores, candidate.scores);
  const archetype = calculateArchetypeAlignment(user.archetype, candidate.archetype);
  const interests = calculateInterestOverlap(user.interests, candidate.interests);
  
  const breakdown = {
    personality,
    archetype,
    interests
  };
  
  const total = 
    personality * SCORE_SIGNALS.PERSONALITY_SIMILARITY +
    archetype * SCORE_SIGNALS.ARCHETYPE_ALIGNMENT +
    interests * SCORE_SIGNALS.INTEREST_OVERLAP;
  
  return { total: Math.round(total), breakdown };
};

// Get dimension breakdown for UI display
export const getDimensionBreakdown = (
  user: UserProfile,
  candidate: MatchCandidate
): DimensionBreakdown[] => {
  const { breakdown } = calculateCompositeScore(user, candidate);
  
  const dimensionDescriptions: Record<string, { high: string; medium: string; low: string }> = {
    personality: {
      high: 'Ni delar liknande personlighetsdrag',
      medium: 'Era personligheter kompletterar varandra',
      low: 'Era personligheter är olika men kan balansera'
    },
    archetype: {
      high: 'Era arketyper harmonierar väl',
      medium: 'Era arketyper skapar intressant dynamik',
      low: 'Era arketyper utmanar varandra positivt'
    },
    interests: {
      high: 'Många gemensamma intressen',
      medium: 'Några gemensamma intressen',
      low: 'Möjlighet att upptäcka nya intressen'
    }
  };
  
  return Object.entries(breakdown).map(([dimension, score]) => {
    const alignment = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low';
    const descriptions = dimensionDescriptions[dimension];
    
    return {
      dimension,
      score,
      alignment,
      description: descriptions ? descriptions[alignment] : ''
    };
  });
};

// Get compatibility factors based on personality types
const getCompatibilityFactors = (
  category1: PersonalityCategory,
  category2: PersonalityCategory,
  matchType: 'similar' | 'complementary'
): string[] => {
  const factors: string[] = [];
  
  if (matchType === 'similar') {
    if (category1 === category2) {
      factors.push('Delar samma personlighetstyp');
    }
    factors.push('Liknande värderingar och kommunikationsstil');
    factors.push('Förståelse för varandras behov');
  } else {
    factors.push('Kompletterar varandras styrkor');
    factors.push('Balanserad dynamik i relationen');
    factors.push('Möjlighet att växa tillsammans');
  }
  
  // Category-specific factors
  const categoryFactors: Record<PersonalityCategory, Record<PersonalityCategory, string>> = {
    DIPLOMAT: {
      DIPLOMAT: 'Djup emotionell förståelse',
      STRATEGER: 'Kombination av känsla och logik',
      BYGGARE: 'Stabilitet möter empati',
      UPPTÄCKARE: 'Kreativitet möter harmoni',
    },
    STRATEGER: {
      DIPLOMAT: 'Logik balanseras med empati',
      STRATEGER: 'Intellektuell stimulans',
      BYGGARE: 'Strategi möter praktik',
      UPPTÄCKARE: 'Vision möter spontanitet',
    },
    BYGGARE: {
      DIPLOMAT: 'Trygghet och omsorg',
      STRATEGER: 'Praktik möter strategi',
      BYGGARE: 'Gemensam stabilitet',
      UPPTÄCKARE: 'Struktur möter frihet',
    },
    UPPTÄCKARE: {
      DIPLOMAT: 'Äventyr med djup',
      STRATEGER: 'Spontanitet möter planering',
      BYGGARE: 'Frihet med trygghet',
      UPPTÄCKARE: 'Dubbel äventyrslust',
    },
  };
  
  const specificFactor = categoryFactors[category1]?.[category2];
  if (specificFactor) {
    factors.push(specificFactor);
  }
  
  return factors;
};

// Generate match pool for user with global batch size (admin-controlled)
// MVP FLOW:
// 1. Admin sets global batch_size (3-10) at 00:00 CET
// 2. For each user: filter batch by dealbreakers (age, gender, onboarding)
// 3. Score remaining candidates using composite algorithm
// 4. Split 60% similar / 40% complementary
// 5. Store in user_daily_match_pool
// 6. Delivery layer caps at 5 for free users, full batch for Plus
export const generateUserMatchPool = (
  currentUser: UserProfile,
  candidates: MatchCandidate[],
  batchSize: number, // Admin-controlled global batch size (3-10)
  previousMatchedIds: string[] = []
): MatchResult[] => {
  // Filter out current user
  const otherUsers = candidates.filter((c) => c.userId !== currentUser.userId);
  
  // Apply dealbreakers first (age interval, gender, etc.)
  const eligibleCandidates = otherUsers.filter((c) => passesDealbreakers(currentUser, c));
  
  // Apply repeat avoidance (no same match 2 days in a row if alternatives exist)
  const previousSet = new Set(previousMatchedIds);
  const freshCandidates = eligibleCandidates.filter((c) => !previousSet.has(c.userId));
  
  // Use fresh candidates if enough exist, otherwise fall back to allow repeats
  // FALLBACK LOGIC: If no alternatives, allow repeat to prevent 0 matches for free users
  const candidatePool = freshCandidates.length >= batchSize 
    ? freshCandidates 
    : freshCandidates.length > 0 
      ? freshCandidates 
      : eligibleCandidates; // Allow repeats if no fresh candidates
  
  // If still not enough candidates, work with what we have
  if (candidatePool.length === 0) {
    return [];
  }
  
  // Calculate all scores using composite scoring
  const scoredCandidates = candidatePool.map((candidate) => {
    const { total, breakdown } = calculateCompositeScore(currentUser, candidate);
    return {
      candidate,
      compositeScore: total,
      similarScore: calculateSimilarityScore(currentUser.scores, candidate.scores),
      complementaryScore: calculateComplementaryScore(currentUser.scores, candidate.scores),
      breakdown,
      // Tie-breakers for candidates with similar scores
      interestScore: calculateInterestOverlap(currentUser.interests, candidate.interests),
      archetypeScore: calculateArchetypeAlignment(currentUser.archetype, candidate.archetype)
    };
  });
  
  // Calculate counts based on 60/40 ratio (always)
  // Cap batch size to available candidates
  const actualBatchSize = Math.min(batchSize, candidatePool.length);
  const similarCount = Math.ceil(actualBatchSize * MATCH_RATIO.SIMILAR);
  const complementaryCount = actualBatchSize - similarCount;
  
  // Get top similar matches (sorted by similarity score with tie-breakers)
  const similarMatches = [...scoredCandidates]
    .sort((a, b) => {
      // Primary sort: similarity score
      if (b.similarScore !== a.similarScore) {
        return b.similarScore - a.similarScore;
      }
      // Tie-breaker 1: interest overlap
      if (b.interestScore !== a.interestScore) {
        return b.interestScore - a.interestScore;
      }
      // Tie-breaker 2: archetype alignment
      return b.archetypeScore - a.archetypeScore;
    })
    .slice(0, similarCount)
    .map((item) => ({
      user: item.candidate,
      matchType: 'similar' as const,
      matchScore: item.similarScore,
      compositeScore: item.compositeScore,
      compatibilityFactors: getCompatibilityFactors(
        currentUser.category,
        item.candidate.category,
        'similar'
      ),
      dimensionBreakdown: getDimensionBreakdown(currentUser, item.candidate),
    }));
  
  // Get top complementary matches (excluding already selected similar matches)
  const similarIds = new Set(similarMatches.map((m) => m.user.userId));
  const complementaryMatches = [...scoredCandidates]
    .filter((item) => !similarIds.has(item.candidate.userId))
    .sort((a, b) => {
      // Primary sort: complementary score
      if (b.complementaryScore !== a.complementaryScore) {
        return b.complementaryScore - a.complementaryScore;
      }
      // Tie-breaker 1: interest overlap
      if (b.interestScore !== a.interestScore) {
        return b.interestScore - a.interestScore;
      }
      // Tie-breaker 2: archetype alignment
      return b.archetypeScore - a.archetypeScore;
    })
    .slice(0, complementaryCount)
    .map((item) => ({
      user: item.candidate,
      matchType: 'complementary' as const,
      matchScore: item.complementaryScore,
      compositeScore: item.compositeScore,
      compatibilityFactors: getCompatibilityFactors(
        currentUser.category,
        item.candidate.category,
        'complementary'
      ),
      dimensionBreakdown: getDimensionBreakdown(currentUser, item.candidate),
    }));
  
  // Combine and shuffle matches
  const allMatches = [...similarMatches, ...complementaryMatches];
  return allMatches.sort(() => Math.random() - 0.5);
};

// Legacy function for backward compatibility - replaced by generateUserMatchPool in MVP
// Main function to calculate daily matches with dealbreakers and composite scoring
export const calculateDailyMatches = (
  currentUser: UserProfile,
  candidates: MatchCandidate[],
  totalMatchCount: number = 5,
  previousMatchedIds: string[] = []
): MatchResult[] => {
  // Redirect to new batch-based function
  return generateUserMatchPool(currentUser, candidates, totalMatchCount, previousMatchedIds);
};

// Generate match reason text
export const generateMatchReason = (matchType: 'similar' | 'complementary'): string => {
  if (matchType === 'similar') {
    return `${Math.round(MATCH_RATIO.SIMILAR * 100)}% liknande värderingar`;
  }
  return `${Math.round(MATCH_RATIO.COMPLEMENTARY * 100)}% kompletterande energi`;
};

// Export individual functions for testing
export { 
  calculateSimilarityScore, 
  calculateComplementaryScore, 
  getCompatibilityFactors
};
