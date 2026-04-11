import { CtaSection } from "@/components/CtaSection";
import { ExtrasSection } from "@/components/ExtrasSection";
import { FactsSection } from "@/components/FactsSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Hero } from "@/components/Hero";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { VardarSection } from "@/components/VardarSection";

// Landing-hem. Sektionerna är separata komponenter så copy (content/home.ts)
// och markup kan utvecklas oberoende av varandra.
export default function HomePage() {
  return (
    <div id="top" className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <FeaturesSection />
        <ExtrasSection />
        <VardarSection />
        <FactsSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
