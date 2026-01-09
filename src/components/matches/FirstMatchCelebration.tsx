import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, MessageCircle, Heart, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaakMascot } from '@/components/mascot/MaakMascot';

interface FirstMatchCelebrationProps {
  matchCount: number;
  welcomeMessage?: string;
  onViewMatches: () => void;
}

export const FirstMatchCelebration = ({
  matchCount,
  welcomeMessage,
  onViewMatches
}: FirstMatchCelebrationProps) => {
  const { t } = useTranslation();
  const [showConfetti, setShowConfetti] = useState(true);
  
  // Hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);
  
  const tips = [
    { icon: <MessageCircle className="h-4 w-4" />, text: 'Personlighetsmatchning handlar om djupare förståelse' },
    { icon: <Heart className="h-4 w-4" />, text: 'Vårt system väljer både liknande och kompletterande personligheter' },
    { icon: <Sparkles className="h-4 w-4" />, text: 'Använd AI-isbrytare för att starta samtalet' }
  ];
  
  const defaultWelcome = `Grattis! 🥳 Din MÄÄK-resa börjar nu. Baserat på dina personlighetssvar har vårt system hittat ${matchCount} matchningar vars energi och värderingar harmonierar med dina.`;

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Confetti Effect */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'][i % 5]
                }}
                initial={{ 
                  top: -20, 
                  opacity: 1,
                  rotate: 0,
                  scale: Math.random() * 0.5 + 0.5
                }}
                animate={{ 
                  top: '100%', 
                  opacity: 0,
                  rotate: Math.random() * 360,
                }}
                transition={{ 
                  duration: Math.random() * 2 + 2,
                  delay: Math.random() * 0.5,
                  ease: 'easeOut'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      <div className="w-full max-w-md space-y-6 z-10">
        {/* Mascot with celebration animation */}
        <motion.div 
          className="flex justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.8, bounce: 0.5 }}
        >
          <MaakMascot pose="happy" expression="😍" size={140} />
        </motion.div>
        
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border-primary shadow-lg shadow-primary/10">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                <span className="text-4xl mb-2 block">🎉</span>
              </motion.div>
              <CardTitle className="text-2xl">
                Välkommen till MÄÄK!
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Dina första matchningar är redo
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                <p className="text-sm leading-relaxed">
                  {welcomeMessage || defaultWelcome}
                </p>
              </div>
              
              {/* Match Count */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                  <Heart className="h-5 w-5 text-primary fill-primary" />
                  <span className="font-bold text-primary">{matchCount}</span>
                  <span className="text-sm">matchningar väntar på dig</span>
                </div>
              </div>
              
              {/* Tips */}
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-3 text-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <span className="text-primary mt-0.5">{tip.icon}</span>
                    <span className="text-muted-foreground">{tip.text}</span>
                  </motion.div>
                ))}
              </div>
              
              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
              >
                <Button 
                  className="w-full group" 
                  size="lg"
                  onClick={onViewMatches}
                >
                  Visa mina matchningar
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
