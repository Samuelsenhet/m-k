import React from 'react';
import { Brain, Shield, Heart, MessageCircle, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/useAuth';
import { ButtonPrimary, ButtonGhost } from '@/components/ui-v2';
import { COLORS, FONTS } from '@/design/tokens';
import { SCREEN_CONTAINER_CLASS, SCREEN_CONTENT_WIDTH_CLASS } from '@/layout/screenLayout';
import { useTranslation } from 'react-i18next';
import { useOnlineCount } from '@/hooks/useOnlineCount';
import { hasValidSupabaseConfig } from '@/integrations/supabase/client';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';

interface LandingPageProps {
  onStart?: () => void;
}

export const LandingPage = ({ onStart }: LandingPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const onlineCount = useOnlineCount(user?.id);
  const landingMascot = useMascot(MASCOT_SCREEN_STATES.LANDING_HERO);

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
            <ButtonGhost size="sm" onClick={handleLogin}>
              Logga in
            </ButtonGhost>
          )}
        </div>
      </nav>

      {/* Hero – floating card mockup */}
      <div className={`relative pt-4 pb-6 ${SCREEN_CONTAINER_CLASS}`}>
        <div className="relative mx-auto w-72">
          {/* Background cards */}
          <div
            className="absolute top-6 -left-4 w-48 h-64 rounded-3xl rotate-[-12deg] opacity-50"
            style={{ background: COLORS.coral[100] }}
            aria-hidden
          />
          <div
            className="absolute top-8 -right-2 w-48 h-64 rounded-3xl rotate-[8deg] opacity-50"
            style={{ background: COLORS.primary[100] }}
            aria-hidden
          />
          {/* Left overlay: circle only (no bubble) */}
          <div className="absolute top-4 left-0 z-20" aria-hidden>
            <div className="w-11 h-11 rounded-full border-2 border-white shadow-lg flex items-center justify-center overflow-hidden bg-muted" />
          </div>

          {/* Main card */}
          <div
            className="relative z-10 rounded-3xl shadow-xl p-4 mx-auto w-52"
            style={{ background: COLORS.neutral.white }}
          >
            <div
              className="aspect-[3/4] rounded-2xl mb-3 flex items-center justify-center"
              style={{ background: COLORS.sage[100] }}
            >
              <span className="text-5xl" aria-hidden>🌿</span>
            </div>
            <h3 className="font-semibold" style={{ color: COLORS.primary[800] }}>
              Sofia, Debattören
            </h3>
            <p className="text-xs mb-2" style={{ color: COLORS.neutral.gray }}>
              Smart och nyfiken tänkare...
            </p>
            <div className="flex flex-wrap gap-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: COLORS.sage[100], color: COLORS.sage[700] }}
              >
                Musik
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: COLORS.sage[100], color: COLORS.sage[700] }}
              >
                Fika
              </span>
            </div>
          </div>

          {/* Floating elements */}
          <div
            className="absolute top-0 left-2 w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{ background: COLORS.primary[100] }}
            aria-hidden
          >
            <span>💡</span>
          </div>
          <div
            className="absolute top-16 right-0 w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{ background: COLORS.primary[100] }}
            aria-hidden
          >
            <MessageCircle className="w-6 h-6" style={{ color: COLORS.primary[500] }} />
          </div>
          <div
            className="absolute bottom-16 left-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
            style={{ background: COLORS.primary[500], color: COLORS.neutral.white }}
          >
            Likhets-match
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full" style={{ background: COLORS.sage[300] }} />
          <div className="w-6 h-2 rounded-full" style={{ background: COLORS.primary[500] }} />
          <div className="w-2 h-2 rounded-full" style={{ background: COLORS.sage[300] }} />
        </div>
      </div>

      {/* Title + landing mascot */}
      <div className={`text-center mb-8 ${SCREEN_CONTENT_WIDTH_CLASS}`}>
        <h1
          id="landing-heading"
          className="text-3xl font-bold mb-3"
          style={{
            fontFamily: FONTS.serif,
            color: COLORS.primary[800],
          }}
        >
          Hitta kärlek som
          <br />
          <span
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            matchar din själ
          </span>
        </h1>
        {landingMascot.shouldShow && (
          <div className="flex justify-center my-4">
            <Mascot {...landingMascot} />
          </div>
        )}
        <p className="whitespace-pre-line" style={{ color: COLORS.neutral.slate }}>
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
          <div key={i} className="text-center">
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

      {/* Online-räkning – diskret */}
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
