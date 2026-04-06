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

type CycleRow = {
  cycle_number: number;
  started_at: string;
  completed_at: string | null;
};

/** Two months in milliseconds. */
const CYCLE_INTERVAL_MS = 2 * 30 * 24 * 60 * 60 * 1000;

export function useAchievementsRN() {
  const { supabase, session } = useSupabase();
  const user = session?.user;
  const { i18n } = useTranslation();
  const [achievements, setAchievements] = useState<AchievementRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [newCycleAvailable, setNewCycleAvailable] = useState(false);

  const fetchAchievements = useCallback(async () => {
    if (!user) {
      setAchievements([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch current cycle
      const { data: cycleRows } = await supabase
        .from("achievement_cycles")
        .select("cycle_number, started_at, completed_at")
        .eq("user_id", user.id)
        .order("cycle_number", { ascending: false })
        .limit(1);

      const latestCycle: CycleRow | null =
        cycleRows && cycleRows.length > 0 ? (cycleRows[0] as CycleRow) : null;
      const cycleNum = latestCycle?.cycle_number ?? 0;
      setCurrentCycle(cycleNum);

      // Check if new cycle is available (all completed + 2 months passed)
      if (latestCycle?.completed_at) {
        const completedAt = new Date(latestCycle.completed_at).getTime();
        const elapsed = Date.now() - completedAt;
        setNewCycleAvailable(elapsed >= CYCLE_INTERVAL_MS);
      } else {
        setNewCycleAvailable(false);
      }

      // Fetch earned achievements for current cycle
      const { data: earnedRows, error: earnedError } = await supabase
        .from("user_achievements")
        .select("earned_at, achievement_id, cycle_number")
        .eq("user_id", user.id)
        .eq("cycle_number", cycleNum);

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
    currentCycle,
    newCycleAvailable,
    refresh: fetchAchievements,
  };
}
