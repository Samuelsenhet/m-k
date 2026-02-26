import { useState, useEffect } from 'react';
import { ButtonPrimary, ButtonGhost } from '@/components/ui-v2';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Check if dismissed recently
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt on Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after a delay for better UX
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show iOS prompt after delay if on iOS
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', new Date().toISOString());
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Stäng"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>

            <div className="flex-1 pr-6">
              <h3 className="font-serif font-semibold text-foreground">
                Installera MÄÄK
              </h3>
              {isIOS ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Tryck på{' '}
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    Dela
                  </span>{' '}
                  och sedan{' '}
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-xs">
                    Lägg till på hemskärmen
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">
                  Få snabbare åtkomst och bättre upplevelse som app
                </p>
              )}
            </div>
          </div>

          {!isIOS && deferredPrompt && (
            <div className="mt-4 flex gap-2">
              <ButtonGhost
                onClick={handleDismiss}
                size="sm"
                className="flex-1"
              >
                Senare
              </ButtonGhost>
              <ButtonPrimary
                onClick={handleInstall}
                size="sm"
                className="flex-1 gap-2 bg-primary text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                Installera
              </ButtonPrimary>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
