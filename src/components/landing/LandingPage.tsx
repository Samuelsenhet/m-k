import React, { useState, useEffect } from 'react';
import { Brain, Shield, Heart, MessageCircle, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/useAuth';
import { ButtonPrimary, ButtonGhost } from '@/components/ui-v2';
import { COLORS } from '@/design/tokens';
import { SCREEN_CONTAINER_CLASS, SCREEN_CONTENT_WIDTH_CLASS } from '@/layout/screenLayout';
import { useTranslation } from 'react-i18next';
import { useOnlineCount } from '@/hooks/useOnlineCount';
import { hasValidSupabaseConfig } from '@/integrations/supabase/client';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';

const LANDING_SLIDES = [
  {
    image: '/landing-profile-sofia.png',
    name: 'Sofia',
    archetype: 'Debattören',
    bio: 'Smart och nyfiken tänkare...',
    tags: ['Musik', 'Fika'],
  },
  {
    image: '/landing-profile-merbel.png',
    name: 'Merbel',
    archetype: 'Värdaren',
    bio: 'Lekfull och omtänksam...',
    tags: ['Resor', 'Mat'],
  },
  {
    image: '/landing-profile-erik.png',
    name: 'Erik',
    archetype: 'Strategen',
    bio: 'Driven och nyfiken...',
    tags: ['Träning', 'Böcker'],
  },
];

interface LandingPageProps {
  onStart?: () => void;
}

export const LandingPage = ({ onStart }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const onlineCount = useOnlineCount(user?.id);
  const landingMascot = useMascot(MASCOT_SCREEN_STATES.LANDING_HERO);
  const [currentSlide, setCurrentSlide] = useState(0);
  const slide = LANDING_SLIDES[currentSlide];
  const prevSlide = LANDING_SLIDES[(currentSlide - 1 + LANDING_SLIDES.length) % LANDING_SLIDES.length];
  const nextSlide = LANDING_SLIDES[(currentSlide + 1) % LANDING_SLIDES.length];

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % LANDING_SLIDES.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const handleStart = () => {
    if (user) navigate('/onboarding');
    else navigate('/phone-auth');
    onStart?.();
  };

  const handleLogin = () => {
    navigate('/phone-auth');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${COLORS.sage[50]} 0%, ${COLORS.neutral.white} 100%)`,
      }}
    >
      {/* Header */}
      <nav className={`flex justify-between items-center py-5 relative z-10 ${SCREEN_CONTENT_WIDTH_CLASS}`} aria-label="Huvudnavigation">
        <Logo size={48} />
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <ButtonGhost asChild size="sm" className="h-10 w-10">
                <Link to="/matches" className="flex items-center justify-center" aria-label="Matcher">
                  <Heart className="w-5 h-5 shrink-0" />
                </Link>
              </ButtonGhost>
              <ButtonGhost asChild size="sm" className="h-10 w-10">
                <Link to="/chat" className="flex items-center justify-center" aria-label="Chatt">
                  <MessageCircle className="w-5 h-5 shrink-0" />
                </Link>
              </ButtonGhost>
              <ButtonGhost asChild size="sm" className="h-10 w-10">
                <Link to="/profile" className="flex items-center justify-center" aria-label="Profil">
                  <User className="w-5 h-5 shrink-0" />
                </Link>
              </ButtonGhost>
            </>
          ) : (
            <ButtonGhost size="sm" onClick={handleLogin}>
              Logga in
            </ButtonGhost>
          )}
        </div>
      </nav>

      {/* Landing mascot + intro */}
      <div className={`text-center mt-4 mb-8 ${SCREEN_CONTENT_WIDTH_CLASS}`}>
        <div className="flex justify-center mb-0">
          <Mascot {...landingMascot} />
        </div>
        <p className="whitespace-pre-line mt-0 mb-0" style={{ color: COLORS.neutral.slate }}>
          {t('maak.intro')}
        </p>
      </div>

      {/* Features */}
      <div className={`flex justify-center gap-6 mb-10 ${SCREEN_CONTENT_WIDTH_CLASS}`} role="list" aria-label="Fördelar">
        {[
          { icon: Brain, label: 'Personlighets-', sub: 'matchning' },
          { icon: Shield, label: 'Säker &', sub: 'verifierad' },
          { icon: Heart, label: 'Meningsfulla', sub: 'kopplingar' },
        ].map((f, i) => (
          <div key={i} className="text-center" role="listitem">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: COLORS.primary[100] }}
            >
              <f.icon className="w-6 h-6" style={{ color: COLORS.primary[600] }} />
            </div>
            <p className="text-xs font-medium" style={{ color: COLORS.primary[800] }}>
              {f.label}
            </p>
            <p className="text-xs" style={{ color: COLORS.neutral.gray }}>
              {f.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Profile cards section */}
      <div className={`relative pt-4 pb-6 ${SCREEN_CONTAINER_CLASS}`}>
        <div className="relative mx-auto w-72">
          {/* Background cards – previous/next profile, byts med slide */}
          <div
            className="absolute top-6 -left-4 w-48 h-64 rounded-3xl rotate-[-12deg] opacity-50 overflow-hidden transition-opacity duration-300"
            style={{ background: COLORS.sage[100] }}
            aria-hidden
          >
            <img
              src={prevSlide.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div
            className="absolute top-8 -right-2 w-48 h-64 rounded-3xl rotate-[8deg] opacity-50 overflow-hidden transition-opacity duration-300"
            style={{ background: COLORS.sage[100] }}
            aria-hidden
          >
            <img
              src={nextSlide.image}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>

          {/* Left overlay: sitting mascot */}
          <div
            className="absolute top-4 left-0 z-20 w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden bg-white/90"
            aria-hidden
          >
            <img
              src="/mascot/sitting.png"
              alt=""
              className="w-full h-full object-contain object-center"
            />
          </div>

          {/* Right overlay: chat + pass */}
          <div
            className="absolute top-12 right-0 w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-2xl z-20 bg-white/90"
            aria-hidden
          >
            💬
          </div>
          <div
            className="absolute top-28 right-0 w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-lg z-20 bg-white/90"
            aria-hidden
          >
            🙅
          </div>

          {/* Main profile card */}
          <div
            className="relative z-10 rounded-3xl shadow-elevation-2 p-4 mx-auto w-60"
            style={{ background: COLORS.neutral.white }}
          >
            <div
              className="aspect-[3/4] rounded-2xl mb-3 flex items-center justify-center overflow-hidden bg-muted"
            >
              <img
                key={currentSlide}
                src={slide.image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-semibold text-base" style={{ color: COLORS.primary[800] }}>
              {slide.name}, {slide.archetype}
            </h3>
            <p className="text-xs mb-2" style={{ color: COLORS.neutral.gray }}>
              {slide.bio}
            </p>
            <div className="flex flex-wrap gap-1">
              {slide.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: COLORS.sage[100], color: COLORS.sage[700] }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Online-räkning – diskret, smälter in */}
      {hasValidSupabaseConfig && (
        <p
          className={`text-center text-sm tabular-nums mb-6 ${SCREEN_CONTENT_WIDTH_CLASS}`}
          style={{ color: COLORS.neutral.slate }}
          role="status"
          aria-live="polite"
        >
          {t('common.online_now_full', { count: onlineCount.toLocaleString('sv-SE') })}
        </p>
      )}

      {/* Buttons */}
      <div className={`space-y-3 mb-6 ${SCREEN_CONTENT_WIDTH_CLASS}`}>
        <ButtonPrimary fullWidth size="lg" onClick={handleStart}>
          Kom igång gratis
        </ButtonPrimary>
      </div>

      {/* Terms */}
      <p className={`text-center text-xs pb-8 ${SCREEN_CONTENT_WIDTH_CLASS}`} style={{ color: COLORS.neutral.gray }}>
        Genom att fortsätta godkänner du våra{' '}
        <Link to="/terms" className="font-medium underline" style={{ color: COLORS.primary[600] }}>
          Användarvillkor
        </Link>{' '}
        och{' '}
        <Link to="/terms#integritet" className="font-medium underline" style={{ color: COLORS.primary[600] }}>
          Integritetspolicy
        </Link>
      </p>
    </div>
  );
};
