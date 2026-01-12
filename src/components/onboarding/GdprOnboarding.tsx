import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsent } from '@/contexts/useConsent';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Shield, Heart, ChartBar, Megaphone, Sparkles, ChevronRight, Check } from 'lucide-react';

interface ConsentOption {
  id: 'analytics' | 'marketing' | 'personalization';
  title: string;
  description: string;
  icon: React.ReactNode;
}

const consentOptions: ConsentOption[] = [
  {
    id: 'analytics',
    title: 'Analys & förbättring',
    description: 'Hjälp oss förbättra appen genom att samla in anonym användningsdata.',
    icon: <ChartBar className="h-5 w-5" />,
  },
  {
    id: 'marketing',
    title: 'Marknadsföring',
    description: 'Ta emot personliga erbjudanden och nyheter via e-post.',
    icon: <Megaphone className="h-5 w-5" />,
  },
  {
    id: 'personalization',
    title: 'Personalisering',
    description: 'Få personliga matchningsförslag baserat på din aktivitet.',
    icon: <Sparkles className="h-5 w-5" />,
  },
];

export const GdprOnboarding = () => {
  const { acceptAll, updateConsent } = useConsent();
  const [step, setStep] = useState<'welcome' | 'customize'>('welcome');
  const [preferences, setPreferences] = useState({
    analytics: true,
    marketing: false,
    personalization: true,
  });

  const handleCustomize = () => {
    setStep('customize');
  };

  const handleSavePreferences = () => {
    updateConsent(preferences);
  };

  const togglePreference = (id: 'analytics' | 'marketing' | 'personalization') => {
    setPreferences((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-4 w-full max-w-md"
          >
            <div className="rounded-3xl bg-card p-8 shadow-card">
              {/* Icon */}
              <div className="mb-6 flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-10 w-10 text-primary" />
                </div>
              </div>

              {/* Header */}
              <h1 className="mb-3 text-center font-serif text-2xl font-semibold text-foreground">
                Välkommen till MÄÄK
              </h1>
              <p className="mb-6 text-center text-muted-foreground">
                Vi värnar om din integritet. Välj hur du vill att vi hanterar dina uppgifter.
              </p>

              {/* Privacy highlight */}
              <div className="mb-6 flex items-start gap-3 rounded-xl bg-secondary/50 p-4">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Din data är skyddad
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vi följer GDPR och säljer aldrig din information till tredje part.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={acceptAll}
                  className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  <Check className="h-4 w-4" />
                  Acceptera alla
                </Button>
                <Button
                  onClick={handleCustomize}
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                >
                  Anpassa inställningar
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Footer links */}
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Genom att fortsätta godkänner du våra{' '}
                <a href="/terms" className="underline hover:text-foreground">
                  villkor
                </a>{' '}
                och{' '}
                <a href="/privacy" className="underline hover:text-foreground">
                  integritetspolicy
                </a>
                .
              </p>
            </div>
          </motion.div>
        )}

        {step === 'customize' && (
          <motion.div
            key="customize"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mx-4 w-full max-w-md"
          >
            <div className="rounded-3xl bg-card p-8 shadow-card">
              {/* Header */}
              <h2 className="mb-2 font-serif text-xl font-semibold text-foreground">
                Anpassa dina inställningar
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Välj vilken data du vill dela. Du kan ändra detta när som helst.
              </p>

              {/* Required consent */}
              <div className="mb-4 flex items-center justify-between rounded-xl bg-muted/50 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Nödvändiga cookies</p>
                    <p className="text-xs text-muted-foreground">Krävs för att appen ska fungera</p>
                  </div>
                </div>
                <Switch checked disabled className="opacity-50" />
              </div>

              {/* Optional consents */}
              <div className="space-y-3">
                {consentOptions.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-primary">{option.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{option.title}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[option.id]}
                      onCheckedChange={() => togglePreference(option.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => setStep('welcome')}
                  variant="outline"
                  className="flex-1"
                >
                  Tillbaka
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Spara val
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
