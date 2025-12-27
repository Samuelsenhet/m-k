import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Users, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  displayName?: string;
  onContinue: () => void;
}

export function WelcomeScreen({ displayName, onContinue }: WelcomeScreenProps) {
  const features = [
    {
      icon: Users,
      title: 'Dagliga matchningar',
      description: 'Varje dag får du nya matchningar baserade på din personlighet',
    },
    {
      icon: MessageCircle,
      title: 'Starta konversationer',
      description: 'Använd våra AI-genererade isbrytare för att börja chatta',
    },
    {
      icon: Sparkles,
      title: 'Djupare kontakter',
      description: 'Vi matchar baserat på personlighet, inte bara utseende',
    },
  ];

  return (
    <div className="min-h-screen gradient-hero flex flex-col items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-primary/5 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-md w-full text-center">
        {/* Logo and Welcome */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-8"
        >
          <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow">
            <Heart className="w-10 h-10 text-primary-foreground" fill="currentColor" />
          </div>
          
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-serif font-bold text-foreground mb-2"
          >
            Välkommen{displayName ? `, ${displayName}` : ''}!
          </motion.h1>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground"
          >
            Din profil är nu klar. Här är vad som väntar dig.
          </motion.p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className={cn(
                'flex items-start gap-4 p-4 rounded-2xl',
                'bg-card/50 backdrop-blur-sm border border-border/50',
                'text-left'
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full gradient-primary text-primary-foreground border-0 shadow-glow text-lg py-6"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Se mina matchningar
          </Button>
        </motion.div>

        {/* Confetti-like decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                y: -20, 
                x: Math.random() * 300 - 150,
                opacity: 0,
                rotate: Math.random() * 360
              }}
              animate={{ 
                y: 400,
                opacity: [0, 1, 1, 0],
                rotate: Math.random() * 360 + 180
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                delay: 0.5 + i * 0.3,
                repeat: Infinity,
                repeatDelay: 2
              }}
              className={cn(
                'absolute w-3 h-3 rounded-full',
                i % 3 === 0 ? 'bg-primary/40' : i % 3 === 1 ? 'bg-accent/40' : 'bg-secondary/40'
              )}
              style={{ left: `${20 + i * 12}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
