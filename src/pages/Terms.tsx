import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold">Användarvillkor & Integritet</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <p className="text-sm text-muted-foreground">Senast uppdaterad: 2026</p>

        {/* ANVÄNDARVILLKOR */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Användarvillkor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Dessa Användarvillkor (&quot;Villkor&quot;) ingås mellan dig och MÄÄK AB (&quot;Företaget&quot;, &quot;MÄÄK&quot;, &quot;vi&quot;, &quot;oss&quot;). Villkoren styr din tillgång till och användning av vår webbplats, mobilapplikationer och alla andra tjänster inklusive innehåll, funktionalitet och evenemang (sammanfattat &quot;Tjänsterna&quot;).
            </p>
            <p>
              Genom att använda Tjänsterna godkänner du och samtycker till att följa dessa Villkor samt vår Integritetspolicy. Om du inte godkänner Villkoren får du inte använda Tjänsterna.
            </p>

            <section>
              <h3 className="font-semibold text-foreground mb-2">1. Ålders- & ID-krav</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Du måste vara minst 20 år gammal för att använda MÄÄK.</li>
                <li>Du måste verifiera din ålder och kan välja att verifiera din identitet genom att ladda upp ett godkänt ID (körkort, pass, nationellt ID).</li>
                <li>MÄÄK förbehåller sig rätten att begära ytterligare verifiering eller avsluta din åtkomst om du inte uppfyller kraven.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">2. Säkerhet & ansvar</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Du ansvarar för att ditt lösenord och telefonnummer hålls konfidentiella.</li>
                <li>Du är ensam ansvarig för dina interaktioner med andra användare, både i appen och personligt.</li>
                <li>MÄÄK garanterar inte säkerheten vid möten utanför appen. Använd sunt förnuft och ta säkerhetsåtgärder.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">3. Användargenererat innehåll</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Allt innehåll du lägger upp (bilder, texter, meddelanden) får inte bryta mot svensk lag eller vara kränkande, trakasserande eller olagligt.</li>
                <li>MÄÄK förbehåller sig rätten att ta bort innehåll eller avsluta konton som bryter mot våra riktlinjer.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">4. Betaltjänster & prenumerationer</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Vissa funktioner kan kräva betalning (t.ex. Premium).</li>
                <li>Prenumerationer förnyas automatiskt om de inte sägs upp minst 24 timmar före förnyelsedatum.</li>
                <li>För återbetalningar i Sverige, kontakta vår support på support@maakapp.se.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">5. Immateriell egendom</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Allt innehåll, logotyper och design i MÄÄK är skyddat av upphovsrätt och tillhör MÄÄK AB.</li>
                <li>Du får inte kopiera, modifiera eller distribuera någon del av Tjänsterna utan vårt tillstånd.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">6. Ansvarsbegränsning</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Tjänsterna tillhandahålls &quot;som de är&quot;. Vi garanterar inte att Tjänsterna alltid fungerar felfritt eller oavbrutet.</li>
                <li>Vårt ansvar är begränsat till det belopp du har betalat till oss under de senaste 12 månaderna.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">7. Tvistlösning</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Eventuella tvister mellan dig och MÄÄK ska lösas genom medling eller skiljeförfarande enligt svensk lag.</li>
                <li>Du avstår från rätten att ingå grupptalan.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">8. Kontakt</h3>
              <p>Frågor om dessa Villkor? Kontakta oss på:</p>
              <p>📧 juridik@maakapp.se</p>
              <p>🏢 MÄÄK AB, Sverige</p>
            </section>
          </CardContent>
        </Card>

        {/* INTEGRITETSPOLICY */}
        <Card id="integritet">
          <CardHeader>
            <CardTitle className="font-serif">Integritetspolicy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <section>
              <h3 className="font-semibold text-foreground mb-2">1. Vilken information samlar vi in?</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Profilinformation: Namn, ålder, kön, personlighetstestresultat, foton, yrke, plats.</li>
                <li>Verifieringsdata: ID-dokument (krypterat och endast för verifiering).</li>
                <li>Användardata: Meddelanden, matchningar, klickbeteende.</li>
                <li>Teknisk data: IP-adress, enhetsinformation, cookies.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">2. Hur använder vi din information?</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>För att matcha dig med andra baserat på personlighet.</li>
                <li>För att förbättra AI-funktioner (isbrytare, förslag).</li>
                <li>För att säkerställa säkerhet och följa svensk lag.</li>
                <li>För att skicka viktiga uppdateringar om Tjänsterna.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">3. Delning av information</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Din offentliga profil (namn, bilder, personlighetstyp) visas för andra användare.</li>
                <li>Vi delar inte din ID-verifiering, exakt plats eller meddelanden med tredje part utan ditt samtycke, utom när lagligen krävt.</li>
                <li>Vi använder leverantörer som Supabase (databas) och Google AI för tekniska tjänster.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">4. Dina rättigheter (enligt GDPR)</h3>
              <p>Du har rätt att: begära en kopia av din data; rättelse av felaktig information; radering av ditt konto och all data; invända mot viss databehandling; dra tillbaka ditt samtycke när som helst. Kontakta dataskydd@maakapp.se för att utöva dina rättigheter.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">5. Datalagring & säkerhet</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>All data lagras säkert i EU (via Supabase) enligt svenska och europeiska dataskyddslagar.</li>
                <li>ID-dokument krypteras och lagras separat med begränsad åtkomst.</li>
                <li>Vi implementerar tekniska och organisatoriska skydd för att skydda din information.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">6. Cookies & spårning</h3>
              <p>Vi använder cookies för att förbättra användarupplevelsen och analysera användning. Du kan hantera cookies via din webbläsares inställningar.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">7. Bevarande av data</h3>
              <p>Vi behåller din data så länge ditt konto är aktivt. Vid avslut raderas din profil och personliga data inom 30 dagar (utom viss information som krävs enligt lag).</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">8. Barn & integritet</h3>
              <p>MÄÄK är endast för personer 20 år och äldre. Vi samlar inte medvetet in data från minderåriga.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">9. Uppdateringar av policyn</h3>
              <p>Vi kan uppdatera denna policy. Vid betydande ändringar meddelar vi dig via appen eller e-post.</p>
            </section>

            <section>
              <h3 className="font-semibold text-foreground mb-2">10. Kontakt för integritetsfrågor</h3>
              <p>📧 dataskydd@maakapp.se</p>
              <p>🏢 MÄÄK AB, Sverige</p>
            </section>
          </CardContent>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}
