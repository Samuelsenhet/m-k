import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Camera, Heart, Sparkles, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getProfilesAuthKey } from '@/lib/profiles';

interface ProfileCompletionPromptProps {
  onDismiss?: () => void;
}

export function ProfileCompletionPrompt({ onDismiss }: ProfileCompletionPromptProps) {
  const { user } = useAuth();
  const [completion, setCompletion] = useState(0);
  const [missingItems, setMissingItems] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);

  const checkProfileCompletion = useCallback(async () => {
    if (!user) return;

    try {
      const profileKey = await getProfilesAuthKey(user.id);
      if (!profileKey) {
        console.error('ProfileCompletionPrompt: Failed to get profile key');
        return;
      }

      const [profileRes, photosRes, personalityRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, bio, gender, looking_for, hometown, work, education, height')
          .eq(profileKey, user.id)
          .maybeSingle(),
        supabase
          .from('profile_photos')
          .select('id')
          .eq('user_id', user.id),
        supabase
          .from('personality_results')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
      ]);

      if (profileRes.error) {
        console.error('ProfileCompletionPrompt: Error fetching profile', profileRes.error);
        return;
      }

    const profile = profileRes.data;
    const photoCount = photosRes.data?.length || 0;
    const hasPersonality = (personalityRes.data?.length || 0) > 0;

    let filled = 0;
    const total = 8;
    const missing: string[] = [];

    if (profile?.display_name) filled++; else missing.push('Lägg till namn');
    if (profile?.bio) filled++; else missing.push('Skriv en bio');
    if (profile?.gender) filled++; 
    if (profile?.looking_for) filled++;
    if (photoCount >= 1) filled++; else missing.push('Ladda upp foton');
    if (photoCount >= 4) filled++; else if (photoCount > 0) missing.push('Lägg till fler foton');
    if (hasPersonality) filled++; else missing.push('Gör personlighetstest');
    if (profile?.hometown || profile?.work || profile?.education) filled++; 
    else missing.push('Lägg till mer info');

    setCompletion(Math.round((filled / total) * 100));
    setMissingItems(missing.slice(0, 3));
    } catch (error) {
      console.error('ProfileCompletionPrompt: Error checking completion', error);
    }
  }, [user]);

  useEffect(() => {
    checkProfileCompletion();
  }, [checkProfileCompletion]);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || completion >= 100) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="shadow-card border-primary/20 overflow-hidden">
          <div className="gradient-primary p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary-foreground">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium text-sm">Slutför din profil</span>
              </div>
              <button 
                onClick={handleDismiss}
                className="text-primary-foreground/70 hover:text-primary-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profilstyrka</span>
                <span className="font-medium text-primary">{completion}%</span>
              </div>
              <Progress value={completion} className="h-2" />
            </div>

            {missingItems.length > 0 && (
              <div className="space-y-2">
                {missingItems.map((item, index) => (
                  <Link
                    key={index}
                    to="/profile"
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {item.includes('foto') ? (
                        <Camera className="w-4 h-4 text-muted-foreground" />
                      ) : item.includes('personlighet') ? (
                        <Heart className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{item}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
              </div>
            )}

            <Button asChild size="sm" className="w-full bg-primary text-white hover:bg-primary/90 border-primary [&_svg]:text-white">
              <Link to="/profile" className="text-white">
                Redigera profil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
