import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Användarvillkor",
  description:
    "Användarvillkor för määk: åldersgräns, verifiering, användaransvar, betalningar, immaterialrätt och tvistlösning.",
  alternates: { canonical: "/terms/" },
  openGraph: {
    title: "Användarvillkor · määk",
    description: "Fullständiga användarvillkor för määk.",
    url: "/terms/",
    type: "article",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Användarvillkor · määk" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-maak-bg pb-20">
      <div className="sticky top-0 z-10 border-b border-maak-border/70 bg-maak-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="shrink-0 text-sm font-medium text-maak-primary hover:underline">
            ← Tillbaka
          </Link>
          <h1 className="truncate text-base font-semibold tracking-tight text-maak-foreground">
            Användarvillkor & Integritet
          </h1>
          <span className="w-[62px]" aria-hidden />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-6">
        <p className="text-sm text-maak-muted-fg">Senast uppdaterad: 2026-04-01</p>

        <div className="rounded-3xl border border-maak-border bg-maak-card p-5 transition-all duration-200 shadow-[0_10px_28px_-24px_rgba(37,61,44,0.5)]">
          <div className="space-y-8 text-sm leading-relaxed text-maak-foreground">
            <section>
              <h2 className="text-lg font-semibold">Användarvillkor</h2>
              <p className="mt-2 text-maak-muted-fg">
                Dessa Användarvillkor (&quot;Villkor&quot;) ingås mellan dig och MÄÄK AB
                (&quot;Företaget&quot;, &quot;MÄÄK&quot;, &quot;vi&quot;, &quot;oss&quot;). Villkoren styr
                din tillgång till och användning av vår webbplats, mobilapplikationer och alla andra
                tjänster inklusive innehåll, funktionalitet och evenemang (sammanfattat &quot;Tjänsterna&quot;).
              </p>
              <p className="mt-2 text-maak-muted-fg">
                Genom att använda Tjänsterna godkänner du och samtycker till att följa dessa Villkor samt
                vår Integritetspolicy. Om du inte godkänner Villkoren får du inte använda Tjänsterna.
              </p>
            </section>

          <section>
            <h3 className="text-lg font-semibold">1. Ålders- & ID-krav</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>Du måste vara minst 20 år gammal för att använda MÄÄK.</li>
              <li>
                Du måste verifiera din ålder och kan välja att verifiera din identitet genom att ladda
                upp ett godkänt ID (körkort, pass, nationellt ID).
              </li>
              <li>
                MÄÄK förbehåller sig rätten att begära ytterligare verifiering eller avsluta din åtkomst
                om du inte uppfyller kraven.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">2. Säkerhet & ansvar</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>Du ansvarar för att ditt lösenord och telefonnummer hålls konfidentiella.</li>
              <li>
                Du är ensam ansvarig för dina interaktioner med andra användare, både i appen och
                personligt.
              </li>
              <li>
                MÄÄK garanterar inte säkerheten vid möten utanför appen. Använd sunt förnuft och ta
                säkerhetsåtgärder.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">3. Användargenererat innehåll</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>
                Allt innehåll du lägger upp (bilder, texter, meddelanden) får inte bryta mot svensk lag
                eller vara kränkande, trakasserande eller olagligt.
              </li>
              <li>
                MÄÄK förbehåller sig rätten att ta bort innehåll eller avsluta konton som bryter mot våra
                riktlinjer.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">4. Betaltjänster & prenumerationer</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>Vissa funktioner kan kräva betalning (t.ex. Premium).</li>
              <li>
                Prenumerationer förnyas automatiskt om de inte sägs upp minst 24 timmar före
                förnyelsedatum.
              </li>
              <li>För återbetalningar i Sverige, kontakta vår support på support@maakapp.se.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">5. Immateriell egendom</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>
                Allt innehåll, logotyper och design i MÄÄK är skyddat av upphovsrätt och tillhör MÄÄK AB.
              </li>
              <li>
                Du får inte kopiera, modifiera eller distribuera någon del av Tjänsterna utan vårt
                tillstånd.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">6. Ansvarsbegränsning</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>
                Tjänsterna tillhandahålls &quot;som de är&quot;. Vi garanterar inte att Tjänsterna alltid
                fungerar felfritt eller oavbrutet.
              </li>
              <li>
                Vårt ansvar är begränsat till det belopp du har betalat till oss under de senaste 12
                månaderna.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">7. Tvistlösning</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-maak-muted-fg">
              <li>
                Eventuella tvister mellan dig och MÄÄK ska lösas genom medling eller skiljeförfarande
                enligt svensk lag.
              </li>
              <li>Du avstår från rätten att ingå grupptalan.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold">8. Kontakt</h3>
            <p className="mt-2 text-maak-muted-fg">Frågor om dessa Villkor? Kontakta oss på:</p>
            <p className="text-maak-muted-fg">📧 juridik@maakapp.se</p>
            <p className="text-maak-muted-fg">🏢 MÄÄK AB, Sverige</p>
          </section>
          </div>
        </div>
      </div>
    </main>
  );
}
