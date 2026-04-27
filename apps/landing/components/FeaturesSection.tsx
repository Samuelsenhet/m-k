import { FEATURES_HEADING, STEPS } from "@/content/home";
import { FeatureCard } from "./FeatureCard";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-t border-maak-border/60 bg-maak-cream/40 py-20 md:py-28"
    >
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-maak-foreground md:text-4xl">
          {FEATURES_HEADING.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-maak-muted-fg">
          {FEATURES_HEADING.subtitle}
        </p>

        <div
          className="mt-14 h-px w-full bg-gradient-to-r from-transparent via-maak-border to-transparent"
          aria-hidden
        />

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((item) => (
            <FeatureCard key={item.eyebrow} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
