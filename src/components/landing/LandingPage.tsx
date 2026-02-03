import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { GlowCard } from '@/components/ui/glow-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Heart, Sparkles, Users, MessageCircle, ArrowRight, User, LogOut, Phone, Brain, Calendar, HelpCircle, Video } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { MaakMascot } from '@/components/mascot/MaakMascot';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/useAuth';
import { cn } from '@/lib/utils';

interface LandingPageProps {
  onStart?: () => void;
}

export const LandingPage = ({ onStart }: LandingPageProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    { icon: Brain, title: '30 personlighetsfrågor', desc: 'Djupgående test för äkta kompatibilitet' },
    { icon: Sparkles, title: 'AI-driven matchning', desc: 'Smart algoritm som förstår dig' },
    { icon: MessageCircle, title: 'AI-konversationshjälp', desc: 'Aldrig mer awkward tystnad' },
    { icon: Video, title: 'Kemi-Check video', desc: 'Videodejt innan ni träffas' },
  ];

  useEffect(() => { 
    const i = setInterval(() => setCurrentFeature(p => (p + 1) % features.length), 3000); 
    return () => clearInterval(i); 
  }, [features.length]);

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
    <div className="min-h-screen bg-gradient-premium overflow-x-hidden relative">
      {/* Eucalyptus grove – subtle background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-glow" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-glow" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <div className="relative w-full px-4 pt-safe-top pb-safe-bottom">
        {/* Header - Premium mobile optimized */}
        <nav className="flex justify-between items-center py-5 mb-10 animate-fade-in relative z-10">
          <Logo size={48} />
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <Button asChild variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground active:scale-95">
                  <Link to="/matches">
                    <Heart className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground active:scale-95">
                  <Link to="/chat">
                    <MessageCircle className="w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:text-foreground active:scale-95">
                  <Link to="/profile">
                    <User className="w-5 h-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <ShimmerButton variant="ghost" size="sm" shimmer={false} onClick={() => navigate('/phone-auth')} className="text-sm">
                Logga in
              </ShimmerButton>
            )}
          </div>
        </nav>

        {/* Hero - Mobile first */}
        <div className="text-center w-full max-w-lg mx-auto mb-12 sm:mb-16">
          <div className="mb-6 sm:mb-10">
            <MaakMascot size={200} className="mx-auto drop-shadow-xl sm:hidden" />
            <MaakMascot size={280} className="mx-auto drop-shadow-xl hidden sm:block" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 sm:mb-5 leading-tight tracking-tight px-2">
            Hitta kärlek som
            <span className="block mt-1 text-gradient">
              matchar din själ
            </span>
          </h1>
          
          <p className="text-muted-foreground text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed px-4">
            Glöm ytliga swipes. MÄÄK matchar dig baserat på personlighet, inte utseende.
          </p>
          
          <div className="px-4">
            <ShimmerButton size="lg" onClick={handleStart} className="w-full min-h-[56px] text-base font-semibold active:scale-[0.98]">
              Kom igång gratis
              <ArrowRight className="w-5 h-5" />
            </ShimmerButton>
            <Button asChild variant="outline" size="lg" className="w-full mt-3 min-h-[48px] text-base font-medium border-primary/30 text-primary hover:bg-primary/10">
              <Link to="/demo-seed" className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Se demo – matchningar & chatt utan konto
              </Link>
            </Button>
          </div>
          
          <p className="text-xs sm:text-sm text-muted-foreground mt-4 px-4">Redan 10,000+ svenskar söker kärlek här</p>
        </div>

        {/* Features - Rotating card for mobile */}
        <div className="px-4 mb-12 sm:mb-16">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-center gap-2 mb-6" role="tablist" aria-label="Funktioner">
              {features.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === currentFeature}
                  aria-label={`Visa ${features[i].title}`}
                  onClick={() => setCurrentFeature(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-normal touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    i === currentFeature ? 'w-8 bg-primary' : 'w-1.5 bg-muted'
                  )}
                />
              ))}
            </div>

            <GlowCard glowColor="rose" className="text-center active:scale-[0.98] transition-bounce card-premium">
              <div className={cn(
                'w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 rounded-3xl flex items-center justify-center gradient-primary shadow-glow transition-all duration-normal animate-scale-in'
              )}>
                {React.createElement(features[currentFeature].icon, { className: 'w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground drop-shadow-lg' })}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 text-foreground">{features[currentFeature].title}</h2>
              <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">{features[currentFeature].desc}</p>
            </GlowCard>
          </div>
        </div>

        {/* How it works - Mobile optimized */}
        <section className="w-full px-4 py-12 sm:py-16 bg-card/60 backdrop-blur-sm" aria-labelledby="how-it-works-heading">
          <div className="max-w-lg mx-auto">
            <h2 id="how-it-works-heading" className="text-xl sm:text-2xl font-bold text-center mb-8 sm:mb-10 px-2 text-foreground">Så fungerar det</h2>
            <div className="space-y-3 sm:space-y-4">
              {[
                { step: 1, title: 'Skapa profil', desc: 'Berätta om dig själv', icon: User },
                { step: 2, title: 'Ta personlighetstest', desc: '30 frågor, 5 minuter', icon: Brain },
                { step: 3, title: 'Få dagliga matcher', desc: 'Baserat på kompatibilitet', icon: Heart },
                { step: 4, title: 'Chatta & träffas', desc: 'Med AI-hjälp på vägen', icon: MessageCircle },
              ].map((item, i) => (
                <GlowCard
                  key={i}
                  glowColor={i % 2 === 0 ? 'rose' : 'violet'}
                  className="flex items-center gap-3 sm:gap-4 !p-4 sm:!p-5 active:scale-[0.98] transition-transform duration-normal touch-manipulation"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-base sm:text-lg shadow-card flex-shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-base sm:text-lg mb-0.5">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground flex-shrink-0" aria-hidden />
                </GlowCard>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section - Mobile optimized */}
        <section className="w-full px-4 py-12 sm:py-16" aria-labelledby="faq-heading">
          <div className="text-center mb-8 sm:mb-12">
            <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow" aria-hidden>
              <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3 px-2">
              Vanliga frågor
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-4">
              Har du funderingar? Här hittar du svar på de vanligaste frågorna.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-2 sm:space-y-3">
              <AccordionItem value="item-1" className="bg-card rounded-2xl border border-border px-4 sm:px-6 shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4 sm:py-5 text-sm sm:text-base text-foreground">
                  Hur fungerar personlighetsmatchningen?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 sm:pb-5">
                  Vårt personlighetstest analyserar 30 olika aspekter av din personlighet baserat på 
                  vetenskapliga modeller. Vår AI jämför sedan ditt resultat med andra användare för att 
                  hitta personer som kompletterar din personlighet på bästa sätt.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-card rounded-2xl border border-border px-4 sm:px-6 shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4 sm:py-5 text-sm sm:text-base text-foreground">
                  Är MÄÄK gratis att använda?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 sm:pb-5">
                  Ja! Det är helt gratis att skapa konto, göra personlighetstestet och få dagliga 
                  matchningar. Vi tror på att alla förtjänar att hitta kärlek utan prisbarriärer.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-card rounded-2xl border border-border px-4 sm:px-6 shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4 sm:py-5 text-sm sm:text-base text-foreground">
                  Hur många matchningar får jag per dag?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 sm:pb-5">
                  Du får nya matchningar varje dag baserat på din personlighetsprofil. Antalet varierar 
                  beroende på tillgänglighet, men kvalitet går alltid före kvantitet hos oss.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-card rounded-2xl border border-border px-4 sm:px-6 shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4 sm:py-5 text-sm sm:text-base text-foreground">
                  Vad är AI-isbrytare?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 sm:pb-5">
                  När du matchas med någon genererar vår AI skräddarsydda konversationsstartare baserat 
                  på båda era profiler och personligheter. Detta gör det enklare att börja prata och 
                  skapa en genuin koppling.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-card rounded-2xl border border-border px-4 sm:px-6 shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4 sm:py-5 text-sm sm:text-base text-foreground">
                  Hur skyddas min integritet?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 sm:pb-5">
                  Din integritet är vår högsta prioritet. Du bestämmer själv vilken information som 
                  visas på din profil, och vi delar aldrig dina uppgifter med tredje part. All data 
                  lagras säkert och krypterat.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-card rounded-2xl border border-border px-4 sm:px-6 shadow-sm">
                <AccordionTrigger className="text-left font-medium hover:no-underline py-4 sm:py-5 text-sm sm:text-base text-foreground">
                  Vilken ålder krävs för att använda MÄÄK?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm sm:text-base pb-4 sm:pb-5">
                  Du måste vara minst 20 år för att använda MÄÄK. Vi verifierar ålder vid registrering 
                  för att skapa en trygg miljö för alla användare.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Social proof */}
        <div className="w-full text-center py-8 sm:py-12 px-4" aria-hidden>
          <p className="text-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4">Älskad av singlar i Sverige</p>
          <div className="flex justify-center items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Heart
                key={i}
                className="w-4 h-4 sm:w-5 sm:h-5 text-primary animate-pulse-soft"
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
