import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain, User, MessageCircle, Loader2, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SuggestionType = 'matching' | 'profile' | 'icebreakers' | 'all';

interface AIAssistantPanelProps {
  matchedUserId?: string;
  onClose?: () => void;
  className?: string;
}

export function AIAssistantPanel({ matchedUserId, onClose, className }: AIAssistantPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<SuggestionType | null>(null);

  const suggestionTypes = [
    {
      type: 'all' as SuggestionType,
      label: 'Komplett analys',
      icon: Sparkles,
      description: 'Få en fullständig AI-analys',
    },
    {
      type: 'matching' as SuggestionType,
      label: 'Matchningsinsikter',
      icon: Brain,
      description: 'Vilka passar dig bäst?',
    },
    {
      type: 'profile' as SuggestionType,
      label: 'Profilförbättringar',
      icon: User,
      description: 'Gör din profil bättre',
    },
    ...(matchedUserId ? [{
      type: 'icebreakers' as SuggestionType,
      label: 'Konversationsstartare',
      icon: MessageCircle,
      description: 'Personliga isbrytare',
    }] : []),
  ];

  const fetchSuggestion = async (type: SuggestionType) => {
    if (!user) {
      toast.error('Du måste vara inloggad');
      return;
    }

    setLoading(true);
    setActiveType(type);
    setSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          userId: user.id,
          type,
          matchedUserId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuggestion(data.suggestion);
    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Kunde inte hämta AI-förslag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg font-serif">AI-assistent</CardTitle>
              <p className="text-xs text-muted-foreground">Smarta förslag baserade på din profil</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Suggestion type buttons */}
        <div className="grid grid-cols-2 gap-2">
          {suggestionTypes.map(({ type, label, icon: Icon, description }) => (
            <button
              key={type}
              onClick={() => fetchSuggestion(type)}
              disabled={loading}
              className={cn(
                'flex flex-col items-start p-3 rounded-xl border transition-all text-left',
                'hover:border-primary/50 hover:bg-primary/5',
                activeType === type ? 'border-primary bg-primary/10' : 'border-border bg-card',
                loading && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mb-2',
                activeType === type ? 'text-primary' : 'text-muted-foreground'
              )} />
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </button>
          ))}
        </div>

        {/* Loading state */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center py-8"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Analyserar din profil...</p>
              </div>
            </motion.div>
          )}

          {/* Suggestion result */}
          {!loading && suggestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="bg-muted/50 rounded-xl p-4 border border-border">
                <div className="prose prose-sm max-w-none text-foreground">
                  {suggestion.split('\n').map((line, i) => (
                    <p key={i} className={cn(
                      'mb-2 last:mb-0',
                      line.startsWith('**') && 'font-semibold',
                      line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') 
                        ? 'ml-2' : ''
                    )}>
                      {line.replace(/\*\*/g, '')}
                    </p>
                  ))}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => activeType && fetchSuggestion(activeType)}
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Generera nytt förslag
              </Button>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !suggestion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6 text-muted-foreground"
            >
              <p className="text-sm">Välj en kategori ovan för att få AI-förslag</p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
