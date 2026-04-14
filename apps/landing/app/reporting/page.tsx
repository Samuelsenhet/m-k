import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Rapportering & säkerhet",
  description:
    "Hur määk hanterar rapporter, moderering, sanktioner och samarbete med rättsvårdande myndigheter för att hålla plattformen trygg.",
  alternates: { canonical: "/reporting/" },
  openGraph: {
    title: "Rapportering & säkerhet · määk",
    description: "Säkerhet, moderering och rapporthantering hos määk.",
    url: "/reporting/",
    type: "article",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Rapportering & säkerhet · määk" }],
  },
  twitter: { card: "summary_large_image", images: ["/opengraph-image"] },
};

export default function ReportingPage() {
  return (
    <main className="min-h-screen bg-maak-bg pb-20">
      <div className="sticky top-0 z-10 border-b border-maak-border/70 bg-maak-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="shrink-0 text-sm font-medium text-maak-primary hover:underline">
            ← Tillbaka
          </Link>
          <h1 className="truncate text-base font-semibold tracking-tight text-maak-foreground">
            Rapportering
          </h1>
          <span className="w-[62px]" aria-hidden />
        </div>
      </div>

      <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-6">
        <p className="text-sm text-maak-muted-fg">Senast uppdaterad: 2026-03-31</p>

        <p className="text-sm text-maak-muted-fg">
          Vår heltäckande metod för hantering av användarrapporter och upprätthållande av
          community-säkerhet.
        </p>

        <div className="rounded-3xl border border-maak-border bg-maak-card p-5 transition-all duration-200 shadow-[0_10px_28px_-24px_rgba(37,61,44,0.5)]">
          <div className="space-y-8 text-sm leading-relaxed text-maak-foreground">
            <section>
              <h2 className="text-lg font-semibold">1. Rapportinlämning & kategorisering</h2>
              <p className="mt-2">Användare kan rapportera olämpligt beteende direkt i appen via:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Profilsidan (tre prickar-menyn)</li>
                <li>Chattfönstret (meddelandemeny)</li>
                <li>Inställningar → &quot;Rapportera problem&quot;</li>
              </ul>
              <p className="mt-2">
                Rapportformuläret kräver: typ av överträdelse (trakasserier, hatiskt språk, bedrägeri,
                naket innehåll, spam, falsk profil m.m.), kontext och bevis (skärmdumpar, meddelanden
                kan bifogas), valfritt vittnesmål.
              </p>
              <p className="mt-2">Rapporter kategoriseras efter allvarlighetsgrad:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <strong>Låg:</strong> Mild misconduct (t.ex. mindre oförskämdhet, enstaka oönskade
                  kommentarer)
                </li>
                <li>
                  <strong>Medel:</strong> Oroande beteende (t.ex. ihållande oönskade meddelanden, lättare
                  kränkningar)
                </li>
                <li>
                  <strong>Hög:</strong> Allvarliga överträdelser (t.ex. hot, sexuella trakasserier,
                  hatbrott, våldshot, explicit innehåll)
                </li>
              </ul>
            </section>

          <section>
            <h2 className="text-lg font-semibold">2. Manuell moderering & undersökning</h2>
            <p className="mt-2">
              En utbildad modereringsteammedlem granskar varje rapport manuellt inom 24 timmar.
            </p>
            <p className="mt-2">
              Undersökningsprocess: granskning av konversationshistorik (om tillämpligt), bedömning av
              bifogat bevis, jämförelse med tidigare rapporter om samma användare, kontroll av profilens
              verifieringsstatus.
            </p>
            <p className="mt-2">
              Under pågående utredning: den rapporterade användaren begränsas tillfälligt från att skicka
              nya meddelanden eller matchningar; profilen kan markeras med &quot;Under granskning&quot;
              internt.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Användarkommunikation & återkoppling</h2>
            <p className="mt-2">
              <strong>För den som rapporterar:</strong>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Omedelbar bekräftelse: &quot;Din rapport har mottagits&quot;</li>
              <li>Uppföljning inom 48 timmar: &quot;Din rapport granskas&quot;</li>
              <li>Slutgiltigt svar med handling vid behov</li>
            </ul>
            <p className="mt-2">
              <strong>För den rapporterade användaren:</strong>
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Mindre överträdelser: Varning med utbildningsmodul om community-riktlinjer</li>
              <li>Allvarliga fall: Meddelande om permanent avstängning från MÄÄK</li>
              <li>Alltid med specifikt skäl och referens till vilken regel som brutits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Åtgärder och sanktioner</h2>
            <p className="mt-2">Baserat på allvarlighetsgrad och tidigare överträdelser:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Varning (för första gången, låg allvarlighetsgrad)</li>
              <li>Tillfällig avstängning (7-30 dagar för medelgradiga överträdelser)</li>
              <li>Permanent avstängning (för allvarliga eller upprepade överträdelser)</li>
              <li>
                Eskalering till myndigheter vid misstanke om brott (t.ex. våldshot, sexualbrott, grova
                hatbrott) - i enlighet med svensk lag
              </li>
            </ul>
            <p className="mt-2">
              Ytterligare åtgärder: radering av olämpligt innehåll, återkallande av verifieringsstatus,
              blockering av betalningsfunktioner för bedrägerimisstanke.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Överklagande- och återkallningsprocess</h2>
            <p className="mt-2">
              Användare som fått en påföljd har rätt att överklaga inom 14 dagar. Överklaganden hanteras
              av en annan moderator än den som utfärdade påföljden. Beslut fattas inom 72 timmar.
            </p>
            <p className="mt-2">
              Vid giltigt överklagande: påföljder kan mildras eller återkallas; användaren återfår full
              tillgång; en notering om felaktig rapport kan läggas till i användarens historik.
            </p>
            <p className="mt-2">
              Vid avslag: besked med motivering; ingen möjlighet till ytterligare överklaganden (utom i
              extremt fall).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Kontinuerlig övervakning & förbättringar</h2>
            <p className="mt-2">
              Dataanalys: månatlig analys av rapporttrender, åtgärder och tidslinjer. Moderatorutbildning:
              regelbundna utbildningar i svensk lag, psykologi och konflikthantering. Tekniska
              förbättringar: AI-assisterad flaggning av potentiellt skadligt språk (som komplement till
              mänsklig moderering), automatisk detektering av upprepade överträdelser, förbättrade
              rapporteringsflöden baserat på användarfeedback. Uppdateringar av riktlinjer: halvårlig
              granskning och uppdatering av community-riktlinjer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Transparens & rapportering</h2>
            <p className="mt-2">
              Användarinsyn: Användare kan se status på sina rapporter i &quot;Rapporthistorik&quot; under
              inställningar. Månadsrapport (internt): översikt över antal rapporter, vanligaste
              överträdelsetyper, genomsnittlig handläggningstid. Säkerhetsuppdateringar: kommunikation
              till communityn om signifikanta säkerhetsförbättringar eller viktiga policyändringar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Samarbete med myndigheter</h2>
            <p className="mt-2">
              Tydliga rutiner för när och hur vi samarbetar med svenska myndigheter (ex. Polisen).
              Lagring av relevant data för eventuella rättsliga processer i enlighet med svensk lag.
              Anonymiserad datadelning för brottsförebyggande syften (endast vid allvarliga fall).
            </p>
          </section>

          <section className="rounded-2xl border border-maak-primary/30 bg-maak-primary/5 p-4">
            <p className="font-semibold text-maak-foreground">MÄÄK:s åtagande</p>
            <p className="mt-2 italic text-maak-muted-fg">
              &quot;Vi strävar efter att skapa en säker, respektfull och meningsfull dejtingsmiljö för alla
              våra medlemmar. Varje rapport tas på största allvar och hanteras med diskretion, rättvisa
              och en tydlig inriktning på communityns välbefinnande.&quot;
            </p>
          </section>

          <section>
            <p className="font-semibold">Kontakt för frågor om rapportering:</p>
            <p className="mt-1">📧 safety@maakapp.se</p>
            <p>🔗 MÄÄK Safety Center (inom appen)</p>
          </section>
          </div>
        </div>
      </div>
    </main>
  );
}
