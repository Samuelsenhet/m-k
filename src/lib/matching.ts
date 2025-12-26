import { DimensionKey, PersonalityCategory } from '@/types/personality';

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
  scores: PersonalityScores;
  bio?: string;
}

export interface MatchResult {
  user: MatchCandidate;
  matchType: 'similar' | 'complementary';
  matchScore: number;
  compatibilityFactors: string[];
}

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
  
  const dimensions: DimensionKey[] = ['ei', 'sn', 'tf', 'jp', 'at'];
  
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

// Main function to calculate daily matches
export const calculateDailyMatches = (
  currentUser: MatchCandidate,
  candidates: MatchCandidate[],
  similarCount: number = 3,
  complementaryCount: number = 2
): MatchResult[] => {
  // Filter out current user
  const otherUsers = candidates.filter((c) => c.userId !== currentUser.userId);
  
  // Calculate all scores
  const scoredCandidates = otherUsers.map((candidate) => ({
    candidate,
    similarScore: calculateSimilarityScore(currentUser.scores, candidate.scores),
    complementaryScore: calculateComplementaryScore(currentUser.scores, candidate.scores),
  }));
  
  // Get top similar matches
  const similarMatches = [...scoredCandidates]
    .sort((a, b) => b.similarScore - a.similarScore)
    .slice(0, similarCount)
    .map((item) => ({
      user: item.candidate,
      matchType: 'similar' as const,
      matchScore: item.similarScore,
      compatibilityFactors: getCompatibilityFactors(
        currentUser.category,
        item.candidate.category,
        'similar'
      ),
    }));
  
  // Get top complementary matches (excluding already selected similar matches)
  const similarIds = new Set(similarMatches.map((m) => m.user.userId));
  const complementaryMatches = [...scoredCandidates]
    .filter((item) => !similarIds.has(item.candidate.userId))
    .sort((a, b) => b.complementaryScore - a.complementaryScore)
    .slice(0, complementaryCount)
    .map((item) => ({
      user: item.candidate,
      matchType: 'complementary' as const,
      matchScore: item.complementaryScore,
      compatibilityFactors: getCompatibilityFactors(
        currentUser.category,
        item.candidate.category,
        'complementary'
      ),
    }));
  
  // Shuffle and return combined matches
  const allMatches = [...similarMatches, ...complementaryMatches];
  return allMatches.sort(() => Math.random() - 0.5);
};

// Export individual functions for testing
export { calculateSimilarityScore, calculateComplementaryScore, getCompatibilityFactors };
