import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft } from 'lucide-react';
import { BottomNav } from '@/components/navigation/BottomNav';

export default function Reporting() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" state={{ openSettings: true }}>
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold">Rapportering</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <p className="text-sm text-muted-foreground">
          Vår heltäckande metod för hantering av användarrapporter och upprätthållande av community-säkerhet.
        </p>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">1. Rapportinlämning & kategorisering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Användare kan rapportera olämpligt beteende direkt i appen via:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Profilsidan (tre prickar-menyn)</li>
              <li>Chattfönstret (meddelandemeny)</li>
              <li>Inställningar → &quot;Rapportera problem&quot;</li>
            </ul>
            <p>Rapportformuläret kräver: typ av överträdelse (trakasserier, hatiskt språk, bedrägeri, naket innehåll, spam, falsk profil m.m.), kontext och bevis (skärmdumpar, meddelanden kan bifogas), valfritt vittnesmål.</p>
            <p>Rapporter kategoriseras efter allvarlighetsgrad:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-foreground">Låg:</strong> Mild misconduct (t.ex. mindre oförskämdhet, enstaka oönskade kommentarer)</li>
              <li><strong className="text-foreground">Medel:</strong> Oroande beteende (t.ex. ihållande oönskade meddelanden, lättare kränkningar)</li>
              <li><strong className="text-foreground">Hög:</strong> Allvarliga överträdelser (t.ex. hot, sexuella trakasserier, hatbrott, våldshot, explicit innehåll)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">2. Manuell moderering & undersökning</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>En utbildad modereringsteammedlem granskar varje rapport manuellt inom 24 timmar.</p>
            <p>Undersökningsprocess: granskning av konversationshistorik (om tillämpligt), bedömning av bifogat bevis, jämförelse med tidigare rapporter om samma användare, kontroll av profilens verifieringsstatus.</p>
            <p>Under pågående utredning: den rapporterade användaren begränsas tillfälligt från att skicka nya meddelanden eller matchningar; profilen kan markeras med &quot;Under granskning&quot; internt.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">3. Användarkommunikation & återkoppling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p><strong className="text-foreground">För den som rapporterar:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Omedelbar bekräftelse: &quot;Din rapport har mottagits&quot;</li>
              <li>Uppföljning inom 48 timmar: &quot;Din rapport granskas&quot;</li>
              <li>Slutgiltigt svar med handling vid behov</li>
            </ul>
            <p><strong className="text-foreground">För den rapporterade användaren:</strong></p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Mindre överträdelser: Varning med utbildningsmodul om community-riktlinjer</li>
              <li>Allvarliga fall: Meddelande om permanent avstängning från MÄÄK</li>
              <li>Alltid med specifikt skäl och referens till vilken regel som brutits</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">4. Åtgärder och sanktioner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Baserat på allvarlighetsgrad och tidigare överträdelser:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Varning (för första gången, låg allvarlighetsgrad)</li>
              <li>Tillfällig avstängning (7–30 dagar för medelgradiga överträdelser)</li>
              <li>Permanent avstängning (för allvarliga eller upprepade överträdelser)</li>
              <li>Eskalering till myndigheter vid misstanke om brott (t.ex. våldshot, sexualbrott, grova hatbrott) – i enlighet med svensk lag</li>
            </ul>
            <p>Ytterligare åtgärder: radering av olämpligt innehåll, återkallande av verifieringsstatus, blockering av betalningsfunktioner för bedrägerimisstanke.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">5. Överklagande- och återkallningsprocess</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Användare som fått en påföljd har rätt att överklaga inom 14 dagar. Överklaganden hanteras av en annan moderator än den som utfärdade påföljden. Beslut fattas inom 72 timmar.</p>
            <p>Vid giltigt överklagande: påföljder kan mildras eller återkallas; användaren återfår full tillgång; en notering om felaktig rapport kan läggas till i användarens historik.</p>
            <p>Vid avslag: besked med motivering; ingen möjlighet till ytterligare överklaganden (utom i extremt fall).</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">6. Kontinuerlig övervakning & förbättringar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Dataanalys: månatlig analys av rapporttrender, åtgärder och tidslinjer. Moderatorutbildning: regelbundna utbildningar i svensk lag, psykologi och konflikthantering. Tekniska förbättringar: AI-assisterad flaggning av potentiellt skadligt språk (som komplement till mänsklig moderering), automatisk detektering av upprepade överträdelser, förbättrade rapporteringsflöden baserat på användarfeedback. Uppdateringar av riktlinjer: halvårlig granskning och uppdatering av community-riktlinjer.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">7. Transparens & rapportering</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Användarinsyn: Användare kan se status på sina rapporter i &quot;Rapporthistorik&quot; under inställningar. Månadsrapport (internt): översikt över antal rapporter, vanligaste överträdelsetyper, genomsnittlig handläggningstid. Säkerhetsuppdateringar: kommunikation till communityn om signifikanta säkerhetsförbättringar eller viktiga policyändringar.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">8. Samarbete med myndigheter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Tydliga rutiner för när och hur vi samarbetar med svenska myndigheter (ex. Polisen). Lagring av relevant data för eventuella rättsliga processer i enlighet med svensk lag. Anonymiserad datadelning för brottsförebyggande syften (endast vid allvarliga fall).</p>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-foreground mb-2">MÄÄK:s åtagande</p>
            <p className="text-sm text-muted-foreground italic">
              &quot;Vi strävar efter att skapa en säker, respektfull och meningsfull dejtingsmiljö för alla våra medlemmar. Varje rapport tas på största allvar och hanteras med diskretion, rättvisa och en tydlig inriktning på communityns välbefinnande.&quot;
            </p>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Kontakt för frågor om rapportering:</p>
          <p>📧 safety@maakapp.se</p>
          <p>🔗 MÄÄK Safety Center (inom appen)</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
