import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Users, MessageCircle, ArrowRight, User, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import heroIllustration from '@/assets/hero-illustration.png';
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
              Starta personlighetstest
              <ArrowRight className="w-5 h-5" />
            </Button>
            </div>
          </div>
          
          {/* Hero Image */}
          <div 
            className="order-1 md:order-2 animate-slide-up flex justify-center"
            style={{ animationDelay: '0.2s' }}
          >
            <img 
              src={heroIllustration} 
              alt="MÄÄK - Personlighetsbaserad dejting illustration" 
              className="w-full max-w-md animate-float"
            />
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
