import type { StaticImageData } from "next/image";
import { IphoneMockup } from "./IphoneMockup";

type FeatureCardProps = {
  title: string;
  description: string;
  imageSrc: string | StaticImageData;
  imageAlt: string;
};

export function FeatureCard({ title, description, imageSrc, imageAlt }: FeatureCardProps) {
  return (
    <article className="group relative flex flex-col items-center overflow-hidden rounded-3xl border border-maak-border/70 bg-gradient-to-b from-white to-maak-card p-6 text-center shadow-[0_14px_40px_-32px_rgba(37,61,44,0.45)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_48px_-28px_rgba(37,61,44,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-28 w-48 -translate-x-1/2 rounded-full bg-maak-primary/10 blur-2xl transition group-hover:bg-maak-primary/15"
      />
      <div className="relative mb-6 w-full">
        <IphoneMockup src={imageSrc} alt={imageAlt} />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-maak-foreground md:text-xl">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-maak-muted-fg">{description}</p>
    </article>
  );
}
