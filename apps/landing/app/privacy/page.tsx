import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description:
    "Så här hanterar MÄÄK dina personuppgifter enligt GDPR - datainsamling, användning, tredjepart, rättigheter och kontaktvägar.",
  alternates: { canonical: "/privacy/" },
  openGraph: {
    title: "Integritetspolicy · MÄÄK",
    description: "GDPR-kompatibel integritetspolicy för MÄÄK.",
    url: "/privacy/",
    type: "article",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Integritetspolicy · MÄÄK" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-maak-bg pb-20">
      <div className="sticky top-0 z-10 border-b border-maak-border/70 bg-maak-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="shrink-0 text-sm font-medium text-maak-primary hover:underline">
            ← Tillbaka
          </Link>
          <h1 className="truncate text-base font-semibold tracking-tight text-maak-foreground">
            Integritetspolicy
          </h1>
          <span className="w-[62px]" aria-hidden />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-6">
        <p className="text-sm text-maak-muted-fg">Senast uppdaterad: 2026-04-01</p>

        <div className="rounded-3xl border border-maak-border bg-maak-card p-5 transition-all duration-200 shadow-[0_10px_28px_-24px_rgba(37,61,44,0.5)]">
          <div className="space-y-8 text-sm leading-relaxed text-maak-foreground">
            <section>
              <h2 className="text-lg font-semibold">1. Vilken information samlar vi in?</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
                <li>
                  Profilinformation: Namn, ålder, kön, personlighetstestresultat, foton, yrke, plats.
                </li>
                <li>Verifieringsdata: ID-dokument (krypterat och endast för verifiering).</li>
                <li>Användardata: Meddelanden, matchningar, klickbeteende.</li>
                <li>Teknisk data: IP-adress, enhetsinformation, cookies.</li>
              </ul>
            </section>

          <section>
            <h2 className="text-lg font-semibold">2. Hur använder vi din information?</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>För att matcha dig med andra baserat på personlighet.</li>
              <li>För att förbättra AI-funktioner (isbrytare, förslag).</li>
              <li>För att säkerställa säkerhet och följa svensk lag.</li>
              <li>För att skicka viktiga uppdateringar om Tjänsterna.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Delning av information</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>Din offentliga profil (namn, bilder, personlighetstyp) visas för andra användare.</li>
              <li>
                Vi delar inte din ID-verifiering, exakt plats eller meddelanden med tredje part utan ditt
                samtycke, utom när lagligen krävt.
              </li>
              <li>
                Vi anlitar följande personuppgiftsbiträden för att tillhandahålla tjänsten:
                <ul className="mt-1 list-[circle] space-y-1 pl-5">
                  <li>
                    <strong>Supabase</strong> (EU) - databas, autentisering och filhantering.
                  </li>
                  <li>
                    <strong>Twilio</strong> (EU/US) - SMS-verifiering vid inloggning.
                  </li>
                  <li>
                    <strong>Resend</strong> (EU/US) - transaktionella mejl (rapporter, överklaganden,
                    väntelistan).
                  </li>
                  <li>
                    <strong>RevenueCat</strong> (US) - hantering av prenumerationer och köpkvitton.
                  </li>
                  <li>
                    <strong>PostHog</strong> (EU) - anonym produktanalys. Du kan välja bort detta i
                    appen under Inställningar → Integritetskontroller → Delad data.
                  </li>
                  <li>
                    <strong>OpenAI</strong> (US) - AI-genererade isbrytare och matchningsinsikter. Inga
                    meddelanden eller personliga identifierare skickas.
                  </li>
                </ul>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Dina rättigheter (enligt GDPR)</h2>
            <p className="mt-2 text-maak-muted-fg">
              Du har rätt att: begära en kopia av din data; rättelse av felaktig information; radering av
              ditt konto och all data; invända mot viss databehandling; dra tillbaka ditt samtycke när som
              helst. Kontakta dataskydd@maakapp.se för att utöva dina rättigheter.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Datalagring & säkerhet</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>
                All data lagras säkert i EU (via Supabase) enligt svenska och europeiska dataskyddslagar.
              </li>
              <li>ID-dokument krypteras och lagras separat med begränsad åtkomst.</li>
              <li>
                Vi implementerar tekniska och organisatoriska skydd för att skydda din information.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Cookies & spårning</h2>
            <p className="mt-2 text-maak-muted-fg">
              Vi använder cookies för att förbättra användarupplevelsen och analysera användning. Du kan
              hantera cookies via din webbläsares inställningar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Bevarande av data</h2>
            <p className="mt-2 text-maak-muted-fg">
              Vi behåller din data så länge ditt konto är aktivt. Vid avslut raderas din profil och
              personliga data inom 30 dagar (utom viss information som krävs enligt lag).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Barn & integritet</h2>
            <p className="mt-2 text-maak-muted-fg">
              MÄÄK är endast för personer 20 år och äldre. Vi samlar inte medvetet in data från
              minderåriga.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Uppdateringar av policyn</h2>
            <p className="mt-2 text-maak-muted-fg">
              Vi kan uppdatera denna policy. Vid betydande ändringar meddelar vi dig via appen eller
              e-post.
            </p>
          </section>

            <section>
              <h2 className="text-lg font-semibold">10. Kontakt för integritetsfrågor</h2>
              <p className="mt-2 text-maak-muted-fg">📧 dataskydd@maakapp.se</p>
              <p className="text-maak-muted-fg">🏢 MÄÄK AB, Sverige</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
