import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Brain, Shield, Heart, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import { useAuth } from "@/contexts/useAuth";
import { hasSeenMaekIntro, setMaekIntroSeen } from "@/constants/mascot";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui-v2";
import { COLORS, FONTS } from "@/design/tokens";

const LANDING_MAX_WIDTH = "max-w-lg";

export function LandingHero() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
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
        <Mascot {...mascot} />

        {/* MÄÄK intro – first visit only */}
        {showIntro && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="text-sm whitespace-pre-line leading-relaxed px-4"
            style={{ color: COLORS.neutral.slate }}
          >
            {t("maak.intro")}
          </motion.p>
        )}

        {/* Floating card mockup – 3 stacked cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative mx-auto w-64 h-80"
          aria-hidden
        >
          {/* Background card left: coral-100, -12deg */}
          <div
            className="absolute top-6 -left-6 w-44 h-56 rounded-3xl opacity-60"
            style={{ background: COLORS.coral[100], transform: "rotate(-12deg)" }}
          />
          {/* Background card right: primary-100, 8deg */}
          <div
            className="absolute top-8 -right-4 w-44 h-56 rounded-3xl opacity-60"
            style={{ background: COLORS.primary[100], transform: "rotate(8deg)" }}
          />

          {/* Main profile card */}
          <div
            className="relative z-10 rounded-3xl shadow-xl p-4 mx-auto w-52"
            style={{ background: COLORS.neutral.white }}
          >
            <div
              className="aspect-[3/4] rounded-2xl mb-3 flex items-center justify-center overflow-hidden"
              style={{ background: COLORS.sage[100] }}
            >
              <Mascot {...mascot} size="medium" placement="center" className="scale-90" />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: COLORS.primary[800] }}>
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

          {/* Floating 💡 badge */}
          <div
            className="absolute top-0 left-2 w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{ background: COLORS.primary[100] }}
          >
            <span>💡</span>
          </div>

          {/* Floating MessageCircle icon */}
          <div
            className="absolute top-16 right-0 w-12 h-12 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
            style={{ background: COLORS.primary[100] }}
          >
            <MessageCircle className="w-6 h-6" style={{ color: COLORS.primary[500] }} />
          </div>

          {/* Likhets-match badge */}
          <div
            className="absolute bottom-16 left-0 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
            style={{ background: COLORS.primary[500], color: COLORS.neutral.white }}
          >
            Likhets-match
          </div>
        </motion.div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2" aria-hidden>
          <div className="w-2 h-2 rounded-full" style={{ background: COLORS.sage[300] }} />
          <div className="w-6 h-2 rounded-full" style={{ background: COLORS.primary[500] }} />
          <div className="w-2 h-2 rounded-full" style={{ background: COLORS.sage[300] }} />
        </div>

        {/* Title with gradient text */}
        <div className="text-center px-6">
          <h1
            id="hero-heading"
            className="text-3xl font-bold mb-3"
            style={{ fontFamily: FONTS.serif, color: COLORS.primary[800] }}
          >
            Hitta kärlek som
            <br />
            <span
              style={{
                background: `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              matchar din själ
            </span>
          </h1>
          <p style={{ color: COLORS.neutral.slate }}>
            Glöm ytliga swipes. MÄÄK matchar dig baserat på personlighet.
          </p>
        </div>

        {/* Feature icons: Brain, Shield, Heart */}
        <div className="flex justify-center gap-6 px-6">
          {[
            { icon: Brain, label: "Personlighets-", sub: "matchning" },
            { icon: Shield, label: "Säker &", sub: "verifierad" },
            { icon: Heart, label: "Meningsfulla", sub: "kopplingar" },
          ].map((f) => (
            <div key={f.label} className="text-center">
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

        {/* Buttons */}
        <div className="px-6 space-y-3">
          <ButtonPrimary fullWidth size="lg" onClick={handleStart}>
            Kom igång gratis
          </ButtonPrimary>
          <ButtonSecondary fullWidth size="lg" onClick={() => navigate("/phone-auth")}>
            Jag har redan ett konto
          </ButtonSecondary>
        </div>

        {/* Terms */}
        <p className="text-center text-xs px-6 pb-2" style={{ color: COLORS.neutral.gray }}>
          Genom att fortsätta godkänner du våra{" "}
          <span style={{ color: COLORS.primary[600] }}>Användarvillkor</span> och{" "}
          <span style={{ color: COLORS.primary[600] }}>Integritetspolicy</span>
        </p>
      </div>
    </section>
  );
}
