import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { ButtonIcon, ButtonSecondary, CardV2, CardV2Content, CardV2Header, CardV2Title, AIChatBubble } from '@/components/ui-v2';
import { Sparkles, Brain, User, MessageCircle, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { MascotToken } from '@/lib/mascot';

type SuggestionType = 'matching' | 'profile' | 'icebreakers' | 'all';

interface AIAssistantPanelProps {
  matchedUserId?: string;
  onClose?: () => void;
  className?: string;
}

const AI_LISTENING_TOKEN: MascotToken = 'mascot_ai_listening';
const AI_THINKING_TOKEN: MascotToken = 'mascot_ai_thinking';
const AI_ANSWERING_TOKEN: MascotToken = 'mascot_ai_open_hand';
const AI_CELEBRATING_TOKEN: MascotToken = 'mascot_ai_tiny_sparkle';

export function AIAssistantPanel({ matchedUserId, onClose, className }: AIAssistantPanelProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<SuggestionType | null>(null);
  const [showCelebrating, setShowCelebrating] = useState(false);

  // Brief ai_celebrating state when suggestion arrives
  useEffect(() => {
    if (!loading && suggestion) {
      setShowCelebrating(true);
      const id = setTimeout(() => setShowCelebrating(false), 2200);
      return () => clearTimeout(id);
    }
  }, [loading, suggestion]);

  const suggestionTypes = [
    {
      type: 'all' as SuggestionType,
      label: t('ai_assistant.title'),
      icon: Sparkles,
      description: t('ai_assistant.analyzing'),
    },
    {
      type: 'matching' as SuggestionType,
      label: t('matches.similar'),
      icon: Brain,
      description: t('matches.matchScore', { score: '' }),
    },
    {
      type: 'profile' as SuggestionType,
      label: t('profile.edit_profile'),
      icon: User,
      description: t('profile.bio'),
    },
    ...(matchedUserId ? [{
      type: 'icebreakers' as SuggestionType,
      label: t('chat.generate_icebreakers'),
      icon: MessageCircle,
      description: t('chat.personalized_starters'),
    }] : []),
  ];

  const fetchSuggestion = async (type: SuggestionType) => {
    if (!user) {
      toast.error(t('ai_assistant.error_auth'));
      return;
    }

    setLoading(true);
    setActiveType(type);
    setSuggestion(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          userId: user.id,
          type,
          matchedUserId,
        },
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuggestion(data.suggestion);
    } catch (error) {
      if (import.meta.env.DEV) console.error('AI Assistant error:', error);
      toast.error(t('ai_assistant.error_fetch'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardV2 padding="none" className={cn('overflow-hidden', className)}>
      <CardV2Header className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <CardV2Title className="text-lg font-serif">{t('ai_assistant.title')}</CardV2Title>
              <p className="text-xs text-muted-foreground">{t('chat.personalized_starters')}</p>
            </div>
          </div>
          {onClose && (
            <ButtonIcon onClick={onClose}>
              <X className="w-4 h-4" />
            </ButtonIcon>
          )}
        </div>
      </CardV2Header>


      <CardV2Content className="px-5 pb-5 space-y-4">
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

        {/* AI states with Mascot: listening → thinking → answering → celebrating */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="ai-thinking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="py-4"
            >
              <AIChatBubble token={AI_THINKING_TOKEN} message="Låt mig tänka..." />
            </motion.div>
          )}

          {!loading && suggestion && (
            <motion.div
              key="ai-result"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {showCelebrating && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-end"
                >
                  <AIChatBubble token={AI_CELEBRATING_TOKEN} message="Klart! ✨" />
                </motion.div>
              )}
              <AIChatBubble
                token={AI_ANSWERING_TOKEN}
                message={
                  <>
                    <p className="font-medium mb-2">Här är vad jag tänker...</p>
                    <div className="prose prose-sm max-w-none text-foreground">
                      {suggestion.split('\n').map((line, i) => (
                        <p key={i} className={cn(
                          'mb-2 last:mb-0',
                          line.startsWith('**') && 'font-semibold',
                          (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) ? 'ml-2' : ''
                        )}>
                          {line.replace(/\*\*/g, '')}
                        </p>
                      ))}
                    </div>
                  </>
                }
              />
              <ButtonSecondary
                size="sm"
                onClick={() => activeType && fetchSuggestion(activeType)}
                className="w-full gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('ai_assistant.generate_new')}
              </ButtonSecondary>
            </motion.div>
          )}

          {!loading && !suggestion && (
            <motion.div
              key="ai-listening"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              <AIChatBubble
                token={AI_LISTENING_TOKEN}
                message="Lyssnar... Välj en kategori nedan så hjälper jag dig."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </CardV2Content>
    </CardV2>
  );
}
