/* eslint-disable react-refresh/only-export-components -- context file exports Provider + hooks */
import { createContext, useCallback, useContext, useState } from 'react';
import { useAchievements, type Achievement } from '@/hooks/useAchievements';
import { toast } from '@/components/native/Toast';

interface AchievementsContextValue {
  checkAndAwardAchievement: (code: string) => Promise<Achievement | null>;
  refreshAchievements: () => Promise<void>;
  useAchievementsReturn: ReturnType<typeof useAchievements>;
}

const AchievementsContext = createContext<AchievementsContextValue | null>(null);

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const hook = useAchievements();

  const checkAndAwardAchievement = useCallback(
    async (code: string): Promise<Achievement | null> => {
      const awarded = await hook.checkAndAwardAchievement(code);
      if (awarded) {
        toast.success(awarded.title, awarded.description ?? undefined);
      }
      return awarded;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hook.checkAndAwardAchievement]
  );

  return (
    <AchievementsContext.Provider
      value={{
        checkAndAwardAchievement,
        refreshAchievements: hook.refreshAchievements,
        useAchievementsReturn: hook,
      }}
    >
      {children}
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

export function useAchievementsContextOptional(): AchievementsContextValue | null {
  return useContext(AchievementsContext);
}
