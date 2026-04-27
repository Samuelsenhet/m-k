import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/** Keep in sync with RN `MOMENT_DEPTH_LINE_MS` and docs/MOMENT_OF_DEPTH_SCRIPT.md */
const LINE_MS = 580;

const LINE_KEYS = Array.from({ length: 16 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `maak_moment_of_depth.lines_${n}` as const;
});

type Props = {
  open: boolean;
  onContinue: () => void;
};

export function MomentOfDepthInterstitialWeb({ open, onContinue }: Props) {
  const { t } = useTranslation();
  const [visibleCount, setVisibleCount] = useState(0);
  const [showStory, setShowStory] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisibleCount(0);
      setShowStory(false);
      return;
    }
    setVisibleCount(0);
    setShowStory(false);
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 16; i++) {
      timers.push(setTimeout(() => setVisibleCount(i), i * LINE_MS));
    }
    timers.push(setTimeout(() => setShowStory(true), 16 * LINE_MS + 400));
    return () => timers.forEach(clearTimeout);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a0c] text-zinc-100 px-6 py-10 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="moment-depth-title"
    >
      <div id="moment-depth-title" className="sr-only">
        {t("maak_moment_of_depth.lines_01")}
      </div>
      <div className="max-w-md w-full flex flex-col items-center gap-3 pb-8">
        <img
          src="/mascot/onboarding.png"
          alt=""
          className="w-28 h-28 object-contain animate-pulse"
        />
        {LINE_KEYS.slice(0, visibleCount).map((key) => (
          <p key={key} className="text-center text-base font-medium leading-relaxed text-zinc-100">
            {t(key)}
          </p>
        ))}
        {showStory ? (
          <div className="w-full mt-6 pt-6 border-t border-white/20 space-y-3">
            <h2 className="text-lg font-serif font-bold text-center text-white">
              {t("maak_matching_story.title")}
            </h2>
            <p className="text-sm text-center text-zinc-300 leading-relaxed">
              {t("maak_matching_story.body_1")}
            </p>
            <p className="text-sm text-center text-zinc-300 leading-relaxed">
              {t("maak_matching_story.body_2")}
            </p>
            <p className="text-sm text-center text-zinc-300 leading-relaxed">
              {t("maak_matching_story.body_3")}
            </p>
            <Button className="w-full mt-4 gradient-primary" onClick={onContinue}>
              {t("maak_moment_of_depth.continue_cta")}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
