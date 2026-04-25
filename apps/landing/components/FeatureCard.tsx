import type { StaticImageData } from "next/image";
import { ChatBubbles } from "./ChatBubbles";
import { IphoneMockup } from "./IphoneMockup";
import { KemiCheckPreview } from "./KemiCheckPreview";
import { MatchesPreview } from "./MatchesPreview";

type Variant = "screen" | "chat" | "matches" | "kemi";

type FeatureCardProps = {
  step?: number;
  eyebrow?: string;
  title: string;
  description: string;
  variant?: Variant;
  imageSrc?: string | StaticImageData;
  imageAlt: string;
};

export function FeatureCard({
  step,
  eyebrow,
  title,
  description,
  variant = "screen",
  imageSrc,
  imageAlt,
}: FeatureCardProps) {
  return (
    <article className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-maak-border/70 bg-gradient-to-b from-white to-maak-card p-6 text-center shadow-[0_14px_40px_-32px_rgba(37,61,44,0.45)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-28px_rgba(37,61,44,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-28 w-48 -translate-x-1/2 rounded-full bg-maak-primary/10 blur-2xl transition group-hover:bg-maak-primary/15"
      />

      {(step !== undefined || eyebrow) && (
        <div className="relative mb-4 flex items-center gap-2">
          {step !== undefined && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-maak-primary text-xs font-semibold text-white shadow-sm">
              {step}
            </span>
          )}
          {eyebrow && (
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-maak-primary">
              {eyebrow}
            </span>
          )}
        </div>
      )}

      <div className="relative mb-6 w-full">
        <IphoneMockup
          src={variant === "screen" ? imageSrc : undefined}
          alt={imageAlt}
        >
          {variant === "chat" && <ChatBubbles />}
          {variant === "matches" && <MatchesPreview />}
          {variant === "kemi" && <KemiCheckPreview />}
        </IphoneMockup>
      </div>

      <h3 className="text-lg font-semibold tracking-tight text-maak-foreground md:text-xl">
        {title}
      </h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-maak-muted-fg">
        {description}
      </p>
    </article>
  );
}
