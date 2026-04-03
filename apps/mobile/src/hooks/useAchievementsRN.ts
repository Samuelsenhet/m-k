import { useSupabase } from "@/contexts/SupabaseProvider";
import {
  ACHIEVEMENT_DEFINITIONS,
  getLocalizedAchievement,
} from "@/constants/achievements";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export type AchievementRN = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  earned_at?: string;
};

export function useAchievementsRN() {
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const { i18n } = useTranslation();
  const [achievements, setAchievements] = useState<AchievementRN[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: earnedRows, error: earnedError } = await supabase
        .from("user_achievements")
        .select("earned_at, achievement_id")
        .eq("user_id", user.id);

      if (earnedError) throw earnedError;

      const earnedMap = new Map<string, string>();
      if (earnedRows?.length) {
        const ids = [...new Set(earnedRows.map((r) => r.achievement_id))];
        const { data: achRows } = await supabase
          .from("achievements")
          .select("id, code")
          .in("id", ids);
        const idToCode = new Map(
          (achRows || []).map((a) => [a.id, (a as { code?: string }).code]),
        );
        earnedRows.forEach((r) => {
          const code = idToCode.get(r.achievement_id);
          if (code && r.earned_at) earnedMap.set(code, r.earned_at);
        });
      }

      const merged: AchievementRN[] = ACHIEVEMENT_DEFINITIONS.map((def) => {
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

      setAchievements(merged);
    } catch (e) {
      if (__DEV__) console.warn("[useAchievementsRN]", e);
      setAchievements([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, user, i18n.language]);

  useEffect(() => {
    void fetchAchievements();
  }, [fetchAchievements]);

  const earnedAchievements = useMemo(
    () => achievements.filter((a) => a.earned_at),
    [achievements],
  );
  const totalPoints = useMemo(
    () => earnedAchievements.reduce((s, a) => s + a.points, 0),
    [earnedAchievements],
  );

  return {
    achievements,
    earnedAchievements,
    loading,
    totalPoints,
    refresh: fetchAchievements,
  };
}
