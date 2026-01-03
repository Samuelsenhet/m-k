import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationPrompt() {
  const { isSupported, permission, requestPermission, loading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt after a delay if notifications aren't enabled
    if (isSupported && permission === 'default') {
      const timer = setTimeout(() => {
        const wasDismissed = localStorage.getItem('notification-prompt-dismissed');
        if (!wasDismissed) {
          setShowPrompt(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowPrompt(false);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  if (!showPrompt || dismissed || permission === 'granted') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {/* Bell Icon with pink background */}
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-7 h-7 text-primary" />
              </div>
              
              <div className="flex-1 pt-1">
                <h3 className="font-bold text-lg mb-1">Missa inga matchningar!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Aktivera notiser för att få veta när du har nya matchningar och meddelanden.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline"
                onClick={handleDismiss}
                className="flex-1 h-12 rounded-xl bg-muted/50 border-0 hover:bg-muted"
              >
                <X className="w-4 h-4 mr-2" />
                Inte nu
              </Button>
              <Button 
                onClick={handleEnable}
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60"
              >
                <Bell className="w-4 h-4 mr-2" />
                {loading ? 'Aktiverar...' : 'Aktivera'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
