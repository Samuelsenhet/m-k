import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

export interface Achievement {
  id: string;
  code: string;
  name_sv: string;
  name_en: string;
  description_sv: string;
  description_en: string;
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
      // Fetch all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch user's earned achievements
      const { data: userAchievements, error: userError } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', user.id);

      if (userError) throw userError;

      const earnedMap = new Map(
        userAchievements?.map((ua) => [ua.achievement_id, ua.earned_at]) || []
      );
      setEarnedIds(new Set(earnedMap.keys()));

      // Merge achievements with earned status
      const mergedAchievements = (allAchievements || []).map((a) => ({
        ...a,
        earned_at: earnedMap.get(a.id),
      }));

      setAchievements(mergedAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const checkAndAwardAchievement = async (code: string): Promise<boolean> => {
    if (!user) return false;

    const achievement = achievements.find((a) => a.code === code);
    if (!achievement || earnedIds.has(achievement.id)) {
      return false;
    }

    try {
      const { error } = await supabase.from('user_achievements').insert({
        user_id: user.id,
        achievement_id: achievement.id,
      });

      if (error) {
        if (error.code === '23505') {
          // Already exists, silently ignore
          return false;
        }
        throw error;
      }

      // Update local state
      setEarnedIds((prev) => new Set([...prev, achievement.id]));
      setAchievements((prev) =>
        prev.map((a) =>
          a.id === achievement.id
            ? { ...a, earned_at: new Date().toISOString() }
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
