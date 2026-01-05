import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'framer-motion';
import { Smartphone, Download, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileOnlyWrapperProps {
  children: React.ReactNode;
}

export function MobileOnlyWrapper({ children }: MobileOnlyWrapperProps) {
  const isMobile = useIsMobile();

  // Show mobile content on mobile devices
  if (isMobile) {
    return <>{children}</>;
  }

  // Show "download app" message on desktop
  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md text-center space-y-8"
      >
        {/* App icon/logo */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="mx-auto w-24 h-24 rounded-3xl gradient-primary flex items-center justify-center shadow-glow"
        >
          <span className="text-4xl">🐸</span>
        </motion.div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">MÄÄK</h1>
          <p className="text-muted-foreground text-lg">
            Personlighetsbaserad Dejting
          </p>
        </div>

        {/* Message */}
        <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50 space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Smartphone className="w-5 h-5" />
            <span className="font-medium">Endast för mobil</span>
          </div>
          <p className="text-muted-foreground text-sm">
            MÄÄK är designad för den bästa mobilupplevelsen. 
            Öppna appen på din telefon för att börja dejta.
          </p>
        </div>

        {/* QR code placeholder */}
        <div className="space-y-3">
          <div className="mx-auto w-32 h-32 bg-card rounded-xl border border-border/50 flex items-center justify-center">
            <QrCode className="w-16 h-16 text-muted-foreground/50" />
          </div>
          <p className="text-xs text-muted-foreground">
            Skanna med din telefon för att öppna
          </p>
        </div>

        {/* Alternative: resize browser hint */}
        <div className="pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground">
            💡 Tips: Använd webbläsarens utvecklarverktyg (F12) och aktivera 
            mobilvyn för att testa appen på datorn.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
