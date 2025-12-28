import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Heart, Sparkles, Users, MessageCircle, ArrowRight, User, LogOut, Phone, Brain, Calendar, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MaakMascot } from '@/components/mascot/MaakMascot';
import { useAuth } from '@/contexts/AuthContext';

interface LandingPageProps {
  onStart?: () => void;
}

export const LandingPage = ({ onStart }: LandingPageProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (user) {
      // User is logged in, go to onboarding
      navigate('/onboarding');
    } else {
      // User not logged in, go to phone auth first
      navigate('/phone-auth');
    }
    onStart?.();
  };

  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-primary-glow/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative container max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <nav className="flex justify-between items-center mb-16 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Heart className="w-5 h-5 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="text-2xl font-serif font-bold text-foreground">MÄÄK</span>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Link to="/matches">
                    <Heart className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Link to="/chat">
                    <MessageCircle className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Link to="/phone-auth">Logga in</Link>
                </Button>
                <Button asChild className="gradient-primary text-primary-foreground border-0 shadow-glow">
                  <Link to="/phone-auth">Registrera</Link>
                </Button>
              </>
            )}
          </div>
        </nav>

        {/* Hero */}
        <div className="grid md:grid-cols-2 gap-8 items-center mb-16">
          <div className="text-center md:text-left order-2 md:order-1">
            <div 
              className="inline-flex items-center gap-2 bg-secondary rounded-full px-4 py-2 text-sm font-medium text-secondary-foreground mb-6 animate-slide-up"
            >
              <Sparkles className="w-4 h-4" />
              AI-driven personlighetsmatchning
            </div>
            
            <h1 
              className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight animate-slide-up"
              style={{ animationDelay: '0.1s' }}
            >
              Hitta din perfekta
              <span className="text-gradient block mt-2">matchning</span>
            </h1>
            
            <p 
              className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed animate-slide-up"
              style={{ animationDelay: '0.2s' }}
            >
              MÄÄK använder personlighetsbaserad matchning för att koppla ihop dig 
              med någon som verkligen passar. Börja med vårt personlighetstest.
            </p>

            <div 
              className="animate-slide-up"
              style={{ animationDelay: '0.3s' }}
          >
            <Button
              onClick={handleStart}
              size="lg"
              className="gradient-primary text-primary-foreground border-0 shadow-glow text-lg px-8 py-6 rounded-2xl gap-3 hover:scale-105 transition-transform"
            >
              <Heart className="w-5 h-5" />
              Skapa konto
              <ArrowRight className="w-5 h-5" />
            </Button>
            </div>
          </div>
          
          {/* Hero Mascot */}
          <div 
            className="order-1 md:order-2 animate-slide-up flex justify-center"
            style={{ animationDelay: '0.2s' }}
          >
            <MaakMascot size={280} className="drop-shadow-xl" />
          </div>
        </div>

        {/* Features */}
        <div 
          className="grid sm:grid-cols-3 gap-6 animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        >
          <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center hover:shadow-glow transition-shadow">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-serif font-semibold text-foreground mb-2">30 frågor</h3>
            <p className="text-sm text-muted-foreground">
              Djupgående personlighetsanalys baserad på vetenskapliga modeller
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center hover:shadow-glow transition-shadow">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-serif font-semibold text-foreground mb-2">Smart matchning</h3>
            <p className="text-sm text-muted-foreground">
              AI-driven algoritm som hittar kompatibla personligheter
            </p>
          </div>

          <div className="bg-card rounded-2xl p-6 shadow-card border border-border text-center hover:shadow-glow transition-shadow">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-serif font-semibold text-foreground mb-2">AI-isbrytare</h3>
            <p className="text-sm text-muted-foreground">
              Skräddarsydda konversationsstartare baserat på dina profiler
            </p>
          </div>
        </div>

        {/* How it works */}
        <div 
          className="mt-24 animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
              Så fungerar det
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Tre enkla steg till meningsfulla kontakter
            </p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative text-center group">
                <div className="relative z-10 w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow group-hover:scale-110 transition-transform">
                  <Phone className="w-7 h-7 text-primary-foreground" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-card border-2 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    1
                  </div>
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground mb-2">
                  Skapa konto
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Verifiera ditt telefonnummer och skapa din profil på under 2 minuter
                </p>
              </div>

              {/* Step 2 */}
              <div className="relative text-center group">
                <div className="relative z-10 w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-primary-foreground" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-card border-2 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    2
                  </div>
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground mb-2">
                  Gör personlighetstestet
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Svara på 30 frågor så vårt AI kan förstå din personlighet på djupet
                </p>
              </div>

              {/* Step 3 */}
              <div className="relative text-center group">
                <div className="relative z-10 w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7 text-primary-foreground" />
                  <div className="absolute -top-2 -right-2 w-7 h-7 bg-card border-2 border-primary rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    3
                  </div>
                </div>
                <h3 className="font-serif font-semibold text-lg text-foreground mb-2">
                  Få dagliga matchningar
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Varje dag får du nya matchningar baserade på personlighetskompatibilitet
                </p>
              </div>
            </div>
          </div>

          {/* CTA after how it works */}
          <div className="text-center mt-12">
            <Button
              onClick={handleStart}
              size="lg"
              className="gradient-primary text-primary-foreground border-0 shadow-glow px-8 py-6 rounded-2xl gap-2 hover:scale-105 transition-transform"
            >
              Kom igång gratis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* FAQ Section */}
        <div 
          className="mt-24 animate-slide-up"
          style={{ animationDelay: '0.6s' }}
        >
          <div className="text-center mb-12">
            <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
              <HelpCircle className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-3">
              Vanliga frågor
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Har du funderingar? Här hittar du svar på de vanligaste frågorna.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              <AccordionItem value="item-1" className="bg-card rounded-2xl border border-border px-6 shadow-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  Hur fungerar personlighetsmatchningen?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Vårt personlighetstest analyserar 30 olika aspekter av din personlighet baserat på 
                  vetenskapliga modeller. Vår AI jämför sedan ditt resultat med andra användare för att 
                  hitta personer som kompletterar din personlighet på bästa sätt.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-card rounded-2xl border border-border px-6 shadow-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  Är MÄÄK gratis att använda?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Ja! Det är helt gratis att skapa konto, göra personlighetstestet och få dagliga 
                  matchningar. Vi tror på att alla förtjänar att hitta kärlek utan prisbarriärer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-card rounded-2xl border border-border px-6 shadow-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  Hur många matchningar får jag per dag?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Du får nya matchningar varje dag baserat på din personlighetsprofil. Antalet varierar 
                  beroende på tillgänglighet, men kvalitet går alltid före kvantitet hos oss.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-card rounded-2xl border border-border px-6 shadow-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  Vad är AI-isbrytare?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  När du matchas med någon genererar vår AI skräddarsydda konversationsstartare baserat 
                  på båda era profiler och personligheter. Detta gör det enklare att börja prata och 
                  skapa en genuin koppling.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-card rounded-2xl border border-border px-6 shadow-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  Hur skyddas min integritet?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Din integritet är vår högsta prioritet. Du bestämmer själv vilken information som 
                  visas på din profil, och vi delar aldrig dina uppgifter med tredje part. All data 
                  lagras säkert och krypterat.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-card rounded-2xl border border-border px-6 shadow-card">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-5">
                  Vilken ålder krävs för att använda MÄÄK?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  Du måste vara minst 20 år för att använda MÄÄK. Vi verifierar ålder vid registrering 
                  för att skapa en trygg miljö för alla användare.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Social proof */}
        <div 
          className="text-center mt-16 animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        >
          <p className="text-muted-foreground text-sm mb-4">Älskad av singlar i Sverige</p>
          <div className="flex justify-center items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                className="w-5 h-5 text-primary animate-pulse-soft"
                fill="currentColor"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
