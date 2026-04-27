import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardV2, CardV2Content, CardV2Header, CardV2Title } from '@/components/ui-v2';
import { ButtonPrimary } from '@/components/ui-v2';
import { Clock, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { useEmotionalState } from '@/hooks/useEmotionalState';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';
import { SCREEN_CONTAINER_CLASS } from '@/layout/screenLayout';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface WaitingPhaseProps {
  timeRemaining: string; // e.g., "18h 42m"
  nextMatchAvailable: string; // ISO timestamp
}

export function WaitingPhase({ timeRemaining, nextMatchAvailable }: WaitingPhaseProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const emotionalConfig = { screen: "waiting" as const };
  const { surfaceClass: emotionalSurfaceClass } = useEmotionalState(emotionalConfig);
  const mascot = useMascot(MASCOT_SCREEN_STATES.WAITING, { emotionalConfig });
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    {
      icon: Heart,
      title: "Matchning med mening",
      description: "Vi letar efter någon som passar dig – inte bara är lik dig"
    },
    {
      icon: Clock,
      title: "Ta den tid det tar",
      description: "Bra matchningar tar lite tid"
    },
    {
      icon: Sparkles,
      title: "Medan du väntar",
      description: "Under tiden kan du lära känna dig själv"
    }
  ];

  // Rotate tips every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const currentTip = tips[currentTipIndex];
  const TipIcon = currentTip.icon;

  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20", emotionalSurfaceClass, SCREEN_CONTAINER_CLASS)}>
      <div className="w-full max-w-lg space-y-6">
        <p className="text-center text-sm text-muted-foreground">
          {t('maak.waiting')}
        </p>

        {/* Main Message Card */}
        <CardV2 padding="none" className="border border-primary/20">
          <CardV2Header className="text-center p-6 pb-0">
            <CardV2Title className="text-2xl">Din första matchning kommer snart!</CardV2Title>
            <p className="text-sm text-muted-foreground mt-2">
              Vi förbereder dina personliga matchningar baserat på din personlighet
            </p>
          </CardV2Header>
          <CardV2Content className="p-6 pt-4 space-y-6">
            {/* Countdown Timer + Mascot (waiting_tea) */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
              {mascot.shouldShow && (
                <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20">
                  <Mascot {...mascot} size="small" placement="inline" />
                </div>
              )}
              <div className="flex items-center gap-3 min-w-0">
                <Clock className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="text-center sm:text-left">
                  <div className="text-3xl font-bold text-primary">{timeRemaining}</div>
                  <div className="text-sm text-muted-foreground">till dina matchningar är redo</div>
                </div>
              </div>
            </div>

            {/* Tips Carousel */}
            <div className="p-4 bg-muted/50 rounded-lg space-y-2 min-h-[100px] transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TipIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">{currentTip.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{currentTip.description}</p>
                </div>
              </div>
            </div>

            {/* Tip Indicators */}
            <div className="flex justify-center gap-2">
              {tips.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentTipIndex 
                      ? 'w-8 bg-primary' 
                      : 'w-1.5 bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            {/* Next Reset Time */}
            <div className="text-center text-xs text-muted-foreground">
              Matchningar blir tillgängliga{' '}
              <time dateTime={nextMatchAvailable} className="font-medium">
                {new Date(nextMatchAvailable).toLocaleString('sv-SE', {
                  weekday: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>

            {/* Continue button – lets user leave waiting screen */}
            <ButtonPrimary
              className="w-full mt-2"
              size="lg"
              onClick={() => navigate('/profile')}
            >
              Fortsätt utforska appen
              <ArrowRight className="ml-2 w-4 h-4" />
            </ButtonPrimary>
          </CardV2Content>
        </CardV2>

        <p className="text-center text-sm text-muted-foreground px-4">
          Medan du väntar kan du lägga till mer om dig i profilen – lugn och i din takt.
        </p>
      </div>
    </div>
  );
}
