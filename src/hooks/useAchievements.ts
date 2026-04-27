import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENT_DEFINITIONS, getLocalizedAchievement } from '@/constants/achievements';
import type { Tables } from '@/integrations/supabase/types';

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
  checkAndAwardAchievement: (code: string) => Promise<Achievement | null>;
  refreshAchievements: () => Promise<void>;
}

export const useAchievements = (): UseAchievementsReturn => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  type UserAchievementRow = Tables<'user_achievements'>;
  type AchievementRow = Tables<'achievements'>;

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Earned achievements: fetch user_achievements then resolve achievement codes (avoids join if achievements.code missing)
      const { data: earnedRows, error: earnedError } = await supabase
        .from('user_achievements')
        .select('earned_at, achievement_id')
        .eq('user_id', user.id);

      if (earnedError) throw earnedError;

      const earnedMap = new Map<string, string>();
      if (earnedRows?.length) {
        const ids = [...new Set(earnedRows.map((r) => r.achievement_id))];
        const { data: achRows } = await supabase
          .from('achievements')
          .select('id, code')
          .in('id', ids);
        const idToCode = new Map((achRows || []).map((a) => [a.id, (a as { code?: string }).code]));
        earnedRows.forEach((r) => {
          const code = idToCode.get(r.achievement_id);
          if (code && r.earned_at) earnedMap.set(code, r.earned_at);
        });
      }

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
      if (import.meta.env.DEV) console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user, i18n.language]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const checkAndAwardAchievement = async (code: string): Promise<Achievement | null> => {
    if (!user) return null;

    const achievement = achievements.find((a) => a.code === code);
    if (!achievement || earnedIds.has(achievement.code)) {
      return null;
    }

    try {
      // Find the achievement row by code to get its DB id
      const { data: achievementRow, error: achError } = await supabase
        .from('achievements')
        .select('id')
        .eq('code', achievement.code)
        .maybeSingle();

      if (achError) throw achError;
      if (!achievementRow?.id) {
        if (import.meta.env.DEV) console.warn('Achievement code not found in DB:', achievement.code);
        return null;
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementRow.id,
        })
        .select('earned_at')
        .single();

      if (error) {
        if ((error as { code?: string }).code === '23505') {
          return null;
        }
        throw error;
      }

      const earnedAt = (data as { earned_at?: string } | null)?.earned_at ?? new Date().toISOString();
      const awarded: Achievement = { ...achievement, earned_at: earnedAt };

      setEarnedIds((prev) => new Set([...prev, achievement.code]));
      setAchievements((prev) =>
        prev.map((a) =>
          a.code === achievement.code ? awarded : a
        )
      );

      return awarded;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error awarding achievement:', error);
      return null;
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
