import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Achievement } from '@/hooks/useAchievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const { i18n } = useTranslation();
  const isSwedish = i18n.language === 'sv';

  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement) return null;

  const name = isSwedish ? achievement.name_sv : achievement.name_en;
  const description = isSwedish ? achievement.description_sv : achievement.description_en;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm"
      >
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-xl shadow-2xl p-4 border border-primary-foreground/20">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium opacity-80 uppercase tracking-wide">
                {isSwedish ? 'Prestation upplåst!' : 'Achievement Unlocked!'}
              </p>
              <h4 className="font-bold text-lg truncate">{name}</h4>
              <p className="text-sm opacity-90 line-clamp-2">{description}</p>
              <p className="text-xs font-medium mt-1 opacity-70">
                +{achievement.points} {isSwedish ? 'poäng' : 'points'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
