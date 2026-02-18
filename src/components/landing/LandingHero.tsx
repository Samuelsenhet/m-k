import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import { useAuth } from "@/contexts/useAuth";
import { isDemoEnabled } from "@/config/supabase";
import { hasValidSupabaseConfig } from "@/integrations/supabase/client";
import { useOnlineCount } from "@/hooks/useOnlineCount";
import { hasSeenMaekIntro, setMaekIntroSeen } from "@/constants/mascot";
import { ButtonPrimary, ButtonGhost } from "@/components/ui-v2";

const LANDING_MAX_WIDTH = "max-w-lg";

const MAAK_INTRO_COPY =
  "Jag heter Määk.\nJag finns här med dig –\nmedan vi hittar någon som verkligen passar.";

export function LandingHero() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const onlineCount = useOnlineCount(user?.id);
  const mascot = useMascot(MASCOT_SCREEN_STATES.LANDING_HERO);

  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    if (!hasSeenMaekIntro()) {
      setShowIntro(true);
      setMaekIntroSeen();
    }
  }, []);

  const handleStart = () => {
    if (user) {
      navigate("/onboarding");
    } else {
      navigate("/phone-auth");
    }
  };

  return (
    <section
      className="text-center w-full mx-auto mb-16 sm:mb-20"
      aria-labelledby="hero-heading"
    >
      <div className={LANDING_MAX_WIDTH + " mx-auto space-y-8"}>
        <Mascot {...mascot} className="mx-auto" />

        {/* MÄÄK intro – first visit only; small, warm, non-blocking */}
        {showIntro && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed px-4"
          >
            {MAAK_INTRO_COPY}
          </motion.p>
        )}

        <div className="space-y-4">
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight tracking-tight px-2"
          >
            Slipp marknadsplatsen.
            <span className="block mt-1 text-primary">
              Kärlek som matchar din själ
            </span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed px-4">
            Glöm ytliga swipes. MÄÄK matchar dig baserat på personlighet, inte
            utseende – så du kan vara dig, inte bara din profil.
          </p>
        </div>
        {hasValidSupabaseConfig && (
          <p
            className="text-sm sm:text-base text-muted-foreground font-medium"
            role="status"
            aria-live="polite"
          >
            {t("common.online_now_full", {
              count: onlineCount.toLocaleString("sv-SE"),
            })}
          </p>
        )}
        <div className="flex flex-col gap-3 px-4">
          <ButtonPrimary
            size="lg"
            onClick={handleStart}
            className="w-full min-h-[52px] text-base font-semibold"
          >
            Kom igång gratis
            <ArrowRight className="w-5 h-5" />
          </ButtonPrimary>
          {isDemoEnabled && (
            <ButtonGhost
              asChild
              size="lg"
              className="w-full min-h-[48px] text-base font-medium"
            >
              <Link
                to="/demo-seed"
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Se demo – matchningar & chatt utan konto
              </Link>
            </ButtonGhost>
          )}
        </div>
      </div>
    </section>
  );
}
