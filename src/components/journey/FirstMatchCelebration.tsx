import { useEffect, useState } from 'react';
import { CardV2, CardV2Content } from '@/components/ui-v2';
import { ButtonPrimary } from '@/components/ui-v2';
import { Heart, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';
import { useTranslation } from 'react-i18next';

interface FirstMatchCelebrationProps {
  specialMessage: string;
  matchCount: number;
  onContinue: () => void;
}

export function FirstMatchCelebration({ 
  specialMessage, 
  matchCount,
  onContinue 
}: FirstMatchCelebrationProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(true);
  const mascot = useMascot(MASCOT_SCREEN_STATES.FIRST_MATCH);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ff0080', '#ff8c00', '#ffd700']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#ff0080', '#ff8c00', '#ffd700']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onContinue, 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <CardV2 padding="none" className="w-full max-w-md border border-primary/50 animate-in zoom-in-95 duration-500">
        <CardV2Content className="p-8 text-center space-y-6">
          {/* Animated Mascot (placement/spacing from M11) */}
          <Mascot {...mascot} />

          {/* Celebration Message */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {specialMessage}
            </h2>
            <p className="text-muted-foreground">
              Du har {matchCount} {matchCount === 1 ? 'matchning' : 'nya matchningar'} som väntar på dig!
            </p>
          </div>

          {/* Määk – emotionell payoff */}
          <div className="relative p-4 bg-primary/5 rounded-2xl border border-primary/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary/5 border-l border-t border-primary/20 rotate-45" />
            <p className="text-sm font-medium">
              Jag sa ju att det var värt att vänta. 💛
            </p>
          </div>

          {/* Continue Button */}
          <ButtonPrimary 
            onClick={() => {
              setIsVisible(false);
              setTimeout(onContinue, 300);
            }}
            size="lg"
            className="w-full group"
          >
            Visa mina matchningar
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </ButtonPrimary>

          {/* Auto-dismiss hint */}
          <p className="text-xs text-muted-foreground">
            Stängs automatiskt om 5 sekunder...
          </p>
        </CardV2Content>
      </CardV2>
    </div>
  );
}
