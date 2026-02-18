import React from 'react';
import { Heart, MessageCircle, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/useAuth';
import {
  ButtonPrimary,
  ButtonGhost,
  CardV2,
  CardV2Content,
  BestMatchCard,
} from '@/components/ui-v2';
import { LandingHero } from '@/components/landing/LandingHero';

interface LandingPageProps {
  onStart?: () => void;
}

const LANDING_MAX_WIDTH = 'max-w-lg';

export const LandingPage = ({ onStart }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const problemMascot = useMascot(MASCOT_SCREEN_STATES.LANDING_PROBLEM);

  const handleStart = () => {
    if (user) navigate('/onboarding');
    else navigate('/phone-auth');
    onStart?.();
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* Subtle background – token-based only */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-muted rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-40 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full px-4 pt-safe-top pb-safe-bottom">
        {/* Header – Logo + nav; no coral in nav */}
        <nav className="flex justify-between items-center py-5 mb-6 relative z-10" aria-label="Huvudnavigation">
          <Logo size={48} />
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <ButtonGhost asChild size="icon" className="h-10 w-10">
                  <Link to="/matches" className="flex items-center justify-center" aria-label="Matcher">
                    <Heart className="w-5 h-5 shrink-0" />
                  </Link>
                </ButtonGhost>
                <ButtonGhost asChild size="icon" className="h-10 w-10">
                  <Link to="/chat" className="flex items-center justify-center" aria-label="Chatt">
                    <MessageCircle className="w-5 h-5 shrink-0" />
                  </Link>
                </ButtonGhost>
                <ButtonGhost asChild size="icon" className="h-10 w-10">
                  <Link to="/profile" className="flex items-center justify-center" aria-label="Profil">
                    <User className="w-5 h-5 shrink-0" />
                  </Link>
                </ButtonGhost>
              </>
            ) : (
              <ButtonGhost size="sm" onClick={() => navigate('/phone-auth')}>
                Logga in
              </ButtonGhost>
            )}
          </div>
        </nav>

        <LandingHero />

        {/* 2. Problem – Känna igen sig (CardV2, no stats); mascot neutral/thinking */}
        <section className="w-full mb-16 sm:mb-20" aria-labelledby="problem-heading">
          <div className={LANDING_MAX_WIDTH + ' mx-auto px-2'}>
            <Mascot {...problemMascot} className="mx-auto mb-4 opacity-90" aria-hidden />
            <h2 id="problem-heading" className="text-xl sm:text-2xl font-bold text-center text-foreground mb-6">
              Känna igen sig?
            </h2>
            <div className="space-y-3">
              <CardV2 variant="default" padding="default">
                <CardV2Content>
                  <p className="font-semibold text-foreground">Marknadsplatsen</p>
                  <p className="text-sm text-muted-foreground mt-1">Känslan av att välja och bli vald – inte att mötas.</p>
                </CardV2Content>
              </CardV2>
              <CardV2 variant="default" padding="default">
                <CardV2Content>
                  <p className="font-semibold text-foreground">Snabba beslut</p>
                  <p className="text-sm text-muted-foreground mt-1">Swipe på sekunder, innan du vet vem du egentligen ser.</p>
                </CardV2Content>
              </CardV2>
              <CardV2 variant="default" padding="default">
                <CardV2Content>
                  <p className="font-semibold text-foreground">Yta före person</p>
                  <p className="text-sm text-muted-foreground mt-1">Profilen som säljpunkt – inte människan bakom.</p>
                </CardV2Content>
              </CardV2>
            </div>
          </div>
        </section>

        {/* 3. Transformation – Hur MÄÄK känns (BestMatchCard as emotional preview) */}
        <section className="w-full mb-16 sm:mb-20" aria-labelledby="transformation-heading">
          <div className={LANDING_MAX_WIDTH + ' mx-auto px-2'}>
            <h2 id="transformation-heading" className="text-xl sm:text-2xl font-bold text-center text-foreground mb-6">
              Så kan det kännas istället
            </h2>
            <div className="space-y-4">
              <p className="text-muted-foreground text-center text-sm sm:text-base">Här börjar samtalet. Personlighet först. Lugn takt.</p>
              <div className="flex justify-center">
                <BestMatchCard
                  name="Någon du vill fortsätta prata med"
                  interests={['Samtal', 'Äkthet', 'Tid']}
                  className="w-full max-w-[280px] mx-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Så fungerar det – Passa → Chatta → Se profil (explanation, not action) */}
        <section className="w-full py-12 sm:py-16 bg-card/50 backdrop-blur-sm" aria-labelledby="how-heading">
          <div className={LANDING_MAX_WIDTH + ' mx-auto px-2'}>
            <h2 id="how-heading" className="text-xl sm:text-2xl font-bold text-center text-foreground mb-8">
              Så fungerar det
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <ButtonGhost size="default" className="pointer-events-none" asChild>
                  <span className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-muted-foreground" aria-hidden />
                    Passa
                  </span>
                </ButtonGhost>
              </div>
              <span className="text-muted-foreground" aria-hidden>→</span>
              <div className="flex items-center gap-2">
                <ButtonGhost size="default" className="pointer-events-none" asChild>
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-muted-foreground" aria-hidden />
                    Chatta
                  </span>
                </ButtonGhost>
              </div>
              <span className="text-muted-foreground" aria-hidden>→</span>
              <div className="flex items-center gap-2">
                <ButtonGhost size="default" className="pointer-events-none" asChild>
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" aria-hidden />
                    Se profil
                  </span>
                </ButtonGhost>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">Inga likes. Ingen swipe. Inget matchande i procent.</p>
            <p className="text-center text-sm text-muted-foreground mt-1 font-medium">Inga snabba beslut. Bara medvetna.</p>
          </div>
        </section>

        {/* 5. Social proof – quote / känsla only; no numbers */}
        <section className="w-full py-12 sm:py-16" aria-labelledby="social-heading">
          <div className={LANDING_MAX_WIDTH + ' mx-auto px-2'}>
            <h2 id="social-heading" className="sr-only">Vad andra säger</h2>
            <CardV2 variant="default" padding="lg">
              <CardV2Content>
                <blockquote className="text-foreground font-medium italic text-center">
                  "Det kändes äntligen som att någon ville förstå mig – inte bara swipa vidare."
                </blockquote>
                <p className="text-sm text-muted-foreground text-center mt-3">— Känsla vi strävar efter</p>
              </CardV2Content>
            </CardV2>
          </div>
        </section>

        {/* 6. Avslutande CTA */}
        <section className="w-full py-12 sm:py-16 pb-safe-bottom" aria-labelledby="final-cta-heading">
          <div className={LANDING_MAX_WIDTH + ' mx-auto px-2 text-center space-y-4'}>
            <h2 id="final-cta-heading" className="text-xl font-bold text-foreground">
              Redo att göra det annorlunda?
            </h2>
            <div className="flex flex-col gap-3">
              <ButtonPrimary size="lg" onClick={handleStart} className="w-full min-h-[52px] text-base font-semibold">
                Kom igång gratis
              </ButtonPrimary>
              <ButtonGhost size="lg" className="w-full min-h-[48px] text-base" asChild>
                <a href="#how-heading">Jag vill veta mer</a>
              </ButtonGhost>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
