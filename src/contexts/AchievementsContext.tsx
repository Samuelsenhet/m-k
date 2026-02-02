/* eslint-disable react-refresh/only-export-components -- context file exports Provider + hooks */
import { createContext, useCallback, useContext, useState } from 'react';
import { useAchievements, type Achievement } from '@/hooks/useAchievements';
import { AchievementToast } from '@/components/achievements/AchievementToast';

interface AchievementsContextValue {
  checkAndAwardAchievement: (code: string) => Promise<Achievement | null>;
  refreshAchievements: () => Promise<void>;
  /** Exposed for AchievementsPanel etc. */
  useAchievementsReturn: ReturnType<typeof useAchievements>;
}

const AchievementsContext = createContext<AchievementsContextValue | null>(null);

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const hook = useAchievements();
  const [lastUnlocked, setLastUnlocked] = useState<Achievement | null>(null);

  const checkAndAwardAchievement = useCallback(
    async (code: string): Promise<Achievement | null> => {
      const awarded = await hook.checkAndAwardAchievement(code);
      if (awarded) {
        setLastUnlocked(awarded);
      }
      return awarded;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hook.checkAndAwardAchievement]
  );

  const handleCloseToast = useCallback(() => {
    setLastUnlocked(null);
  }, []);

  return (
    <AchievementsContext.Provider
      value={{
        checkAndAwardAchievement,
        refreshAchievements: hook.refreshAchievements,
        useAchievementsReturn: hook,
      }}
    >
      {children}
      <AchievementToast achievement={lastUnlocked} onClose={handleCloseToast} />
    </AchievementsContext.Provider>
  );
}

export function useAchievementsContext(): AchievementsContextValue {
  const ctx = useContext(AchievementsContext);
  if (!ctx) {
    throw new Error('useAchievementsContext must be used within AchievementsProvider');
  }
  return ctx;
}

/** Optional hook: returns context or null if outside provider (for gradual adoption). */
export function useAchievementsContextOptional(): AchievementsContextValue | null {
  return useContext(AchievementsContext);
}
