import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENT_DEFINITIONS, getLocalizedAchievement } from '@/constants/achievements';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  earned_at?: string;
}

interface UseAchievementsReturn {
  achievements: Achievement[];
  earnedAchievements: Achievement[];
  unearnedAchievements: Achievement[];
  totalPoints: number;
  loading: boolean;
  checkAndAwardAchievement: (code: string) => Promise<boolean>;
  refreshAchievements: () => Promise<void>;
}

export const useAchievements = (): UseAchievementsReturn => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch earned achievements from existing table
      const { data: earnedData, error } = await supabase
        .from('achievements')
        .select('achievement_type, unlocked_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const earnedMap = new Map<string, string>(
        (earnedData || []).map((row) => [row.achievement_type, row.unlocked_at])
      );

      // Map definitions with i18n and earned status
      const mergedAchievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
        const localized = getLocalizedAchievement(def, i18n.language);
        return {
          id: def.id,
          code: def.code,
          name: localized.name,
          description: localized.description,
          icon: def.icon,
          points: def.points,
          category: def.category,
          earned_at: earnedMap.get(def.code),
        };
      });

      setEarnedIds(new Set(earnedMap.keys()));
      setAchievements(mergedAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user, i18n.language]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const checkAndAwardAchievement = async (code: string): Promise<boolean> => {
    if (!user) return false;

    const achievement = achievements.find((a) => a.code === code);
    if (!achievement || earnedIds.has(achievement.code)) {
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('achievements')
        .insert({
          user_id: user.id,
          achievement_type: achievement.code,
        })
        .select('achievement_type, unlocked_at')
        .single();

      if (error) {
        if ((error as { code?: string }).code === '23505') {
          return false;
        }
        throw error;
      }

      const earnedAt = data?.unlocked_at ?? new Date().toISOString();

      setEarnedIds((prev) => new Set([...prev, achievement.code]));
      setAchievements((prev) =>
        prev.map((a) =>
          a.code === achievement.code
            ? { ...a, earned_at: earnedAt }
            : a
        )
      );

      return true;
    } catch (error) {
      console.error('Error awarding achievement:', error);
      return false;
    }
  };

  const earnedAchievements = achievements.filter((a) => a.earned_at);
  const unearnedAchievements = achievements.filter((a) => !a.earned_at);
  const totalPoints = earnedAchievements.reduce((sum, a) => sum + a.points, 0);

  return {
    achievements,
    earnedAchievements,
    unearnedAchievements,
    totalPoints,
    loading,
    checkAndAwardAchievement,
    refreshAchievements: fetchAchievements,
  };
};
