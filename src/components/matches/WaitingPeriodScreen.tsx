import { useTranslation } from "react-i18next";
import { User, Sparkles, Heart, Clock } from "lucide-react";
import { CardV2, CardV2Content, CardV2Header, CardV2Title } from "@/components/ui-v2";
import { ButtonGhost } from "@/components/ui-v2";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { getEmotionalState } from "@/lib/emotional-state";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import { TimeRemaining } from "@/hooks/useUserJourney";
import { useNavigate } from "react-router-dom";

interface WaitingPeriodScreenProps {
  timeRemaining: TimeRemaining;
  profileCompletion?: number;
}

export const WaitingPeriodScreen = ({
  timeRemaining,
  profileCompletion = 0,
}: WaitingPeriodScreenProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const emotionalConfig = { screen: "waiting" as const };
  const mascot = useMascot(MASCOT_SCREEN_STATES.WAITING, { emotionalConfig });

  const tips = [
    {
      icon: <User className="h-4 w-4" />,
      text: "Fullförd profil ökar dina chanser med 40%",
    },
    {
      icon: <Sparkles className="h-4 w-4" />,
      text: "Lägg till bilder som visar din personlighet",
    },
    {
      icon: <Heart className="h-4 w-4" />,
      text: "Vi matchar baserat på djupa personlighetsdrag",
    },
    {
      icon: <Clock className="h-4 w-4" />,
      text: "Dina matchningar är noggrant utvalda",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        {mascot.shouldShow && <Mascot {...mascot} />}
        <p className="text-center text-sm text-muted-foreground">
          {t("maak.waiting")}
        </p>

        {/* Main Card */}
        <CardV2 className="border border-primary/20">
          <CardV2Header className="text-center pb-2">
            <CardV2Title className="text-xl">
              Dina första matchningar kommer snart! 🎯
            </CardV2Title>
            <p className="text-muted-foreground text-sm">
              Vi analyserar dina personlighetssvar och hittar perfekta
              matchningar för dig
            </p>
          </CardV2Header>

          <CardV2Content className="space-y-6">
            {/* Countdown */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Tid kvar till matchningar
              </p>
              <div className="flex justify-center gap-4">
                <div className="bg-primary-50 rounded-xl px-4 py-2">
                  <span className="text-2xl font-bold text-primary">
                    {String(timeRemaining.hours).padStart(2, "0")}
                  </span>
                  <p className="text-xs text-muted-foreground">timmar</p>
                </div>
                <div className="bg-primary-50 rounded-xl px-4 py-2">
                  <span className="text-2xl font-bold text-primary">
                    {String(timeRemaining.minutes).padStart(2, "0")}
                  </span>
                  <p className="text-xs text-muted-foreground">min</p>
                </div>
                <div className="bg-primary-50 rounded-xl px-4 py-2">
                  <span className="text-2xl font-bold text-primary">
                    {String(timeRemaining.seconds).padStart(2, "0")}
                  </span>
                  <p className="text-xs text-muted-foreground">sek</p>
                </div>
              </div>
            </div>

            {/* Profile Completion Prompt */}
            {profileCompletion < 100 && (
              <div className="bg-sage-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">
                    Medan du väntar...
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Din profil är {profileCompletion}% komplett. Fullförd profil
                  ger bättre matchningar!
                </p>
                <ButtonGhost
                  size="sm"
                  className="w-full border border-border"
                  onClick={() => navigate("/profile")}
                >
                  Fullförd min profil
                </ButtonGhost>
              </div>
            )}

            {/* Tips */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Tips medan du väntar</p>
              <div className="grid gap-2">
                {tips.map((tip, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <span className="text-primary">{tip.icon}</span>
                    <span>{tip.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardV2Content>
        </CardV2>
      </div>
    </div>
  );
};
