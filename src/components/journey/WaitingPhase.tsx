import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Heart, Sparkles, ArrowRight } from 'lucide-react';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';

interface WaitingPhaseProps {
  timeRemaining: string; // e.g., "18h 42m"
  nextMatchAvailable: string; // ISO timestamp
}

const MAAK_WAITING_COPY = 'Jag är här medan vi väntar. Bra saker får ta tid.';

export function WaitingPhase({ timeRemaining, nextMatchAvailable }: WaitingPhaseProps) {
  const navigate = useNavigate();
  const mascot = useMascot(MASCOT_SCREEN_STATES.WAITING);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-lg space-y-6">
        {/* Mascot + Määk relation copy */}
        <div className="flex justify-center">
          <Mascot {...mascot} />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {MAAK_WAITING_COPY}
        </p>

        {/* Main Message Card */}
        <Card className="border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Din första matchning kommer snart!</CardTitle>
            <CardDescription className="text-base mt-2">
              Vi förbereder dina personliga matchningar baserat på din personlighet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
              <Clock className="w-6 h-6 text-primary" />
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{timeRemaining}</div>
                <div className="text-sm text-muted-foreground">till dina matchningar är redo</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Onboarding klar</span>
                <span>100%</span>
              </div>
              <Progress value={100} className="h-2" />
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
            <Button
              className="w-full mt-2"
              size="lg"
              onClick={() => navigate('/profile')}
            >
              Fortsätt utforska appen
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground px-4">
          Medan du väntar kan du lägga till mer om dig i profilen – lugn och i din takt.
        </p>
      </div>
    </div>
  );
}
