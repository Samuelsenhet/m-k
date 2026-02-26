import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CardV2, CardV2Content, CardV2Header, CardV2Title } from '@/components/ui-v2';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAchievementsContextOptional } from '@/contexts/AchievementsContext';
import { useAchievements, type Achievement } from '@/hooks/useAchievements';
import { Loader2, Trophy, Lock, Camera, UserCheck, Brain, Heart, MessageCircle, Flame, TrendingUp, MessageSquare, Images, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ReactNode> = {
  'trophy': <Trophy className="w-5 h-5" />,
  'user-check': <UserCheck className="w-5 h-5" />,
  'camera': <Camera className="w-5 h-5" />,
  'images': <Images className="w-5 h-5" />,
  'brain': <Brain className="w-5 h-5" />,
  'heart': <Heart className="w-5 h-5" />,
  'hearts': <Sparkles className="w-5 h-5" />,
  'message-circle': <MessageCircle className="w-5 h-5" />,
  'flame': <Flame className="w-5 h-5" />,
  'trending-up': <TrendingUp className="w-5 h-5" />,
  'message-square': <MessageSquare className="w-5 h-5" />,
};

interface AchievementCardProps {
  achievement: Achievement;
  isEarned: boolean;
}

const AchievementCard = React.forwardRef<HTMLDivElement, AchievementCardProps>(
  function AchievementCard({ achievement, isEarned }, ref) {
    const { i18n } = useTranslation();
    const locale = i18n.language?.startsWith('sv') ? 'sv-SE' : 'en-US';

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
        "p-4 rounded-xl border transition-all",
        isEarned
          ? "bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30"
          : "bg-muted/30 border-border opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            isEarned
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isEarned ? (
            <span className="text-xl leading-none">{achievement.icon}</span>
          ) : (
            <Lock className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-foreground">{achievement.name}</h4>
            <Badge variant={isEarned ? "default" : "outline"} className="text-xs">
              {achievement.points} pts
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
          {isEarned && achievement.earned_at && (
            <p className="text-xs text-primary mt-1">
              ✓ {new Date(achievement.earned_at).toLocaleDateString(locale)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
    );
  }
);
AchievementCard.displayName = 'AchievementCard';

export function AchievementsPanel() {
  const { t, i18n } = useTranslation();
  const ctx = useAchievementsContextOptional();
  const fallback = useAchievements();
  const { earnedAchievements, unearnedAchievements, totalPoints, achievements, loading } =
    ctx?.useAchievementsReturn ?? fallback;

  const progressPercent = achievements.length > 0 
    ? (earnedAchievements.length / achievements.length) * 100 
    : 0;

  if (loading) {
    return (
      <CardV2 padding="none">
        <CardV2Content className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardV2Content>
      </CardV2>
    );
  }

  return (
    <CardV2 padding="none">
      <CardV2Header className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <CardV2Title className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            {t('achievements.title')}
          </CardV2Title>
          <Badge className="gradient-primary text-primary-foreground">
            {totalPoints} pts
          </Badge>
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {earnedAchievements.length} / {achievements.length}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardV2Header>
      <CardV2Content className="px-5 pb-5 space-y-3">
        {achievements.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('achievements.empty')}</p>
          </div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {earnedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isEarned={true}
                />
              ))}
              {unearnedAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  isEarned={false}
                />
              ))}
            </AnimatePresence>
          </>
        )}
      </CardV2Content>
    </CardV2>
  );
}
