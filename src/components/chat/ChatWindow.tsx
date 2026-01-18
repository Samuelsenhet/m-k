import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Send, Loader2, ArrowLeft, Sparkles, Check, CheckCheck, Brain, Laugh, Heart, Coffee, MessageCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { TypingIndicator } from './TypingIndicator';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useIcebreakerAnalytics } from '@/hooks/useIcebreakerAnalytics';
import type { IcebreakerCategory } from '@/types/api';

// Category configuration with icons
const CATEGORY_CONFIG: { key: IcebreakerCategory; icon: typeof Laugh; color: string }[] = [
  { key: 'general', icon: Sparkles, color: 'text-purple-500' },
  { key: 'funny', icon: Laugh, color: 'text-yellow-500' },
  { key: 'deep', icon: Heart, color: 'text-red-500' },
  { key: 'activity', icon: Coffee, color: 'text-green-500' },
  { key: 'compliment', icon: MessageCircle, color: 'text-blue-500' },
];

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

// Memoized message bubble to prevent unnecessary re-renders
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble = memo(function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div
      className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
      role="listitem"
    >
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        <p className="text-sm">{message.content}</p>
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOwn ? 'justify-end' : ''
          )}
        >
          <span
            className={cn(
              'text-xs',
              isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
            )}
          >
            {format(new Date(message.created_at), 'HH:mm', { locale: sv })}
          </span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="w-3 h-3 text-primary-foreground/70" aria-label="Läst" />
            ) : (
              <Check className="w-3 h-3 text-primary-foreground/50" aria-label="Skickat" />
            )
          )}
        </div>
      </div>
    </div>
  );
});

interface ChatWindowProps {
  matchId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchedUserAvatar?: string;
  icebreakers?: string[];
  onBack: () => void;
}

export function ChatWindow({
  matchId,
  matchedUserId,
  matchedUserName,
  matchedUserAvatar,
  icebreakers = [],
  onBack,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { trackIcebreakerUsed, trackIcebreakersShown } = useIcebreakerAnalytics();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showIcebreakers, setShowIcebreakers] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [aiIcebreakers, setAiIcebreakers] = useState<string[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<IcebreakerCategory>('general');
  // Follow-up suggestions state
  const [showFollowupPanel, setShowFollowupPanel] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [followupsRemaining, setFollowupsRemaining] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
      if (data && data.length > 0) {
        setShowIcebreakers(false);
      }
    }
    setLoading(false);
  }, [matchId]);

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setShowIcebreakers(false);
          setPartnerTyping(false);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
          );
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== user?.id) {
          setPartnerTyping(true);
          setTimeout(() => setPartnerTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user?.id]);

  useEffect(() => {
    fetchMessages();
    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup();
    };
  }, [fetchMessages, setupRealtimeSubscription]);

  // Mark messages as read when viewing
  const markMessagesAsRead = useCallback(async () => {
    if (!user) return;
    
    const unreadMessages = messages.filter(
      (m) => m.sender_id !== user.id && !m.is_read
    );
    
    if (unreadMessages.length === 0) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .in('id', unreadMessages.map((m) => m.id));

    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        unreadMessages.some((u) => u.id === m.id) ? { ...m, is_read: true } : m
      )
    );
  }, [messages, user]);

  useEffect(() => {
    if (messages.length > 0 && user) {
      markMessagesAsRead();
    }
  }, [messages, user, markMessagesAsRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  

  const broadcastTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      supabase.channel(`messages:${matchId}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id },
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }, [isTyping, matchId, user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;
    
    setSending(true);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
      sender_id: user.id,
      content: content.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      setNewMessage(content);
      toast.error('Meddelandet kunde inte skickas. Försök igen.');
    }
    setSending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleIcebreakerClick = (icebreaker: string) => {
    // Track analytics (fire-and-forget)
    trackIcebreakerUsed(matchId, icebreaker);
    sendMessage(icebreaker);
    setShowAIPanel(false);
    setShowFollowupPanel(false);
  };

  const generateAIIcebreakers = async (category: IcebreakerCategory = selectedCategory) => {
    if (!user) return;

    setLoadingAI(true);
    setAiIcebreakers([]);

    try {
      // Use the enhanced generate-icebreakers endpoint with category
      const { data, error } = await supabase.functions.invoke('generate-icebreakers', {
        body: {
          matchId,
          matchedUserId,
          category,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const icebreakersData = data.icebreakers as string[];
      if (icebreakersData && icebreakersData.length > 0) {
        setAiIcebreakers(icebreakersData.slice(0, 3));
        // Track that icebreakers were shown (fire-and-forget)
        trackIcebreakersShown(matchId, icebreakersData.slice(0, 3), category);
      } else {
        toast.error(t('chat.followup_error'));
      }
    } catch (error) {
      console.error('AI Icebreaker error:', error);
      toast.error(t('chat.followup_error'));
    } finally {
      setLoadingAI(false);
    }
  };

  // Generate follow-up suggestions for ongoing conversations
  const generateFollowups = async () => {
    if (!user) return;

    setLoadingFollowups(true);
    setFollowups([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-followups', {
        body: {
          matchId,
          messageCount: 10,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.remainingToday === 0) {
          toast.error(t('chat.followup_limit'));
        } else {
          toast.error(data.message || t('chat.followup_error'));
        }
        return;
      }

      const followupsData = data.followups as string[];
      if (followupsData && followupsData.length > 0) {
        setFollowups(followupsData);
        setFollowupsRemaining(data.remainingToday);
      }
    } catch (error) {
      console.error('Followup error:', error);
      toast.error(t('chat.followup_error'));
    } finally {
      setLoadingFollowups(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (category: IcebreakerCategory) => {
    setSelectedCategory(category);
    generateAIIcebreakers(category);
  };

  // Check if follow-up button should be shown
  const showFollowupButton = messages.length >= 3 &&
    messages.length > 0 &&
    messages[messages.length - 1]?.sender_id !== user?.id;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label={t('common.back')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={matchedUserAvatar} alt={matchedUserName} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {matchedUserName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="font-semibold text-foreground">{matchedUserName}</h2>
        </div>
        
        {/* AI Icebreaker Button */}
        <Sheet open={showAIPanel} onOpenChange={setShowAIPanel}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary"
              aria-label={t('chat.ai_icebreakers')}
              onClick={() => {
                setShowAIPanel(true);
                if (aiIcebreakers.length === 0) {
                  generateAIIcebreakers();
                }
              }}
            >
              <Brain className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 font-serif">
                <Sparkles className="w-5 h-5 text-primary" />
                {t('chat.ai_icebreakers')}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('chat.personalized_starters')}
              </p>

              {/* Category Picker */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">{t('chat.icebreaker_categories')}</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_CONFIG.map(({ key, icon: Icon, color }) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleCategoryChange(key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        selectedCategory === key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                      )}
                    >
                      <Icon className={cn('w-4 h-4', selectedCategory === key ? 'text-primary-foreground' : color)} />
                      {t(`chat.category_${key}`)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Icebreakers List */}
              <AnimatePresence mode="wait">
                {loadingAI ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-8"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">{t('chat.generating')}</p>
                    </div>
                  </motion.div>
                ) : aiIcebreakers.length > 0 ? (
                  <motion.div
                    key="icebreakers"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-2"
                  >
                    {aiIcebreakers.map((icebreaker, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleIcebreakerClick(icebreaker)}
                        className="w-full p-3 text-left text-sm bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 transition-colors"
                      >
                        {icebreaker}
                      </motion.button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateAIIcebreakers(selectedCategory)}
                      className="w-full mt-3 gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('chat.generate_new')}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <Button
                      onClick={() => generateAIIcebreakers(selectedCategory)}
                      className="gradient-primary text-primary-foreground gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('chat.generate_icebreakers')}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SheetContent>
        </Sheet>

        {/* Follow-up Help Button (shows after 3+ messages when it's user's turn) */}
        {showFollowupButton && (
          <Sheet open={showFollowupPanel} onOpenChange={setShowFollowupPanel}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-green-500"
                aria-label={t('chat.followup_help')}
                onClick={() => {
                  setShowFollowupPanel(true);
                  if (followups.length === 0) {
                    generateFollowups();
                  }
                }}
              >
                <HelpCircle className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[60vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-serif">
                  <HelpCircle className="w-5 h-5 text-green-500" />
                  {t('chat.followup_suggestions')}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('chat.personalized_starters')}
                </p>

                {followupsRemaining !== null && (
                  <p className="text-xs text-muted-foreground">
                    {followupsRemaining} {t('chat.followup_help')} kvar idag
                  </p>
                )}

                <AnimatePresence mode="wait">
                  {loadingFollowups ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center py-8"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                        <p className="text-sm text-muted-foreground">{t('chat.followup_generating')}</p>
                      </div>
                    </motion.div>
                  ) : followups.length > 0 ? (
                    <motion.div
                      key="followups"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-2"
                    >
                      {followups.map((followup, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={() => handleIcebreakerClick(followup)}
                          className="w-full p-3 text-left text-sm bg-green-500/5 hover:bg-green-500/10 rounded-xl border border-green-500/20 transition-colors"
                        >
                          {followup}
                        </motion.button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateFollowups}
                        disabled={followupsRemaining === 0}
                        className="w-full mt-3 gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('chat.generate_new')}
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-4"
                    >
                      <Button
                        onClick={generateFollowups}
                        className="bg-green-500 hover:bg-green-600 text-white gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('chat.followup_suggestions')}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 && showIcebreakers && icebreakers.length > 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 px-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-serif font-semibold text-foreground mb-2">
                Ny match! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Välj en konversationsstartare eller skriv ditt eget meddelande
              </p>
            </div>
            <div className="w-full space-y-2">
              {icebreakers.map((icebreaker, index) => (
                <button
                  key={index}
                  onClick={() => handleIcebreakerClick(icebreaker)}
                  className="w-full p-3 text-left text-sm bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors"
                >
                  {icebreaker}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4" role="list" aria-label={t('chat.messages')}>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === user?.id}
              />
            ))}
            {partnerTyping && (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Skriv ett meddelande..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="gradient-primary text-primary-foreground"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
