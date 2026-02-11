import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/navigation/BottomNav";
import { ContactInfo } from "@/components/ContactInfo";
import { ContactForm } from "@/components/ContactForm";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>Kontakta oss – MĀĀK</title>
        <meta
          name="description"
          content="Kontakta MĀĀK-teamet för support, säkerhet, affärssamarbeten eller juridiska frågor."
        />
      </Helmet>
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/about">
              <ChevronLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-serif text-lg font-bold">Kontakta MĀĀK</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-8">
        <p className="text-sm text-muted-foreground">
          Support, säkerhet, affärssamarbeten eller juridiska frågor – välj rätt
          adress nedan eller skicka ett meddelande.
        </p>
        <ContactInfo />
        <ContactForm />
      </div>
      <BottomNav />
    </div>
  );
}
