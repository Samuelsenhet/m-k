import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Heart, Sparkles } from 'lucide-react';
import { MaakMascot } from '@/components/mascot';

interface WaitingPhaseProps {
  timeRemaining: string; // e.g., "18h 42m"
  nextMatchAvailable: string; // ISO timestamp
}

export function WaitingPhase({ timeRemaining, nextMatchAvailable }: WaitingPhaseProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const tips = [
    {
      icon: Heart,
      title: "Fyll i din bio",
      description: "En bra bio ökar dina chanser för matchningar med 40%"
    },
    {
      icon: Sparkles,
      title: "Lägg till fler foton",
      description: "3-6 foton ger de bästa matchningarna"
    },
    {
      icon: Clock,
      title: "Kolla in dina intressen",
      description: "Se till att dina intressen är uppdaterade"
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
        {/* Mascot Container */}
        <div className="flex justify-center">
          <MaakMascot pose="idle" expression="😊" size={150} />
        </div>

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
          </CardContent>
        </Card>

        {/* Encouragement Message */}
        <p className="text-center text-sm text-muted-foreground px-4">
          Medan du väntar kan du fortsätta förbättra din profil för ännu bättre matchningar! ✨
        </p>
      </div>
    </div>
  );
}
