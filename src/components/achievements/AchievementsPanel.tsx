import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAchievements, Achievement } from '@/hooks/useAchievements';
import { Loader2, Trophy, Lock, Star, Camera, UserCheck, Brain, Heart, MessageCircle, Flame, TrendingUp, MessageSquare, Images, Sparkles } from 'lucide-react';
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

function AchievementCard({ achievement, isEarned }: AchievementCardProps) {
  const { i18n } = useTranslation();
  const isSwedish = i18n.language === 'sv';
  
  const name = isSwedish ? achievement.name_sv : achievement.name_en;
  const description = isSwedish ? achievement.description_sv : achievement.description_en;

  return (
    <motion.div
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
            iconMap[achievement.icon] || <Star className="w-5 h-5" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-foreground">{name}</h4>
            <Badge variant={isEarned ? "default" : "outline"} className="text-xs">
              {achievement.points} pts
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
          {isEarned && achievement.earned_at && (
            <p className="text-xs text-primary mt-1">
              ✓ {new Date(achievement.earned_at).toLocaleDateString(isSwedish ? 'sv-SE' : 'en-US')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function AchievementsPanel() {
  const { t, i18n } = useTranslation();
  const { 
    earnedAchievements, 
    unearnedAchievements, 
    totalPoints, 
    achievements,
    loading 
  } = useAchievements();

  const progressPercent = achievements.length > 0 
    ? (earnedAchievements.length / achievements.length) * 100 
    : 0;

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            {t('achievements.title')}
          </CardTitle>
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
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
  );
}
