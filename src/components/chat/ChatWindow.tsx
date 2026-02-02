import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Send, Loader2, ArrowLeft, Sparkles, Check, CheckCheck, Brain, Laugh, Heart, Coffee, MessageCircle, HelpCircle, Paperclip, Video, Mic, Image, Gift, Search, MoreVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { TypingIndicator } from './TypingIndicator';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useIcebreakerAnalytics } from '@/hooks/useIcebreakerAnalytics';
import { useAchievementsContextOptional } from '@/contexts/AchievementsContext';
import type { IcebreakerCategory } from '@/types/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={cn('flex mb-2', isOwn ? 'justify-end' : 'justify-start')}
      role="listitem"
    >
      <div
        className={cn(
          'max-w-[80%] px-3 py-2 text-sm',
          isOwn ? 'msn-bubble-own' : 'msn-bubble-them'
        )}
      >
        <p className="leading-relaxed" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>{message.content}</p>
        <div className={cn('flex items-center gap-1.5 mt-1', isOwn ? 'justify-end' : '')}>
          <span className="text-xs text-gray-600">
            {format(new Date(message.created_at), 'HH:mm', { locale: sv })}
          </span>
          {isOwn && (
            message.is_read ? (
              <CheckCheck className="w-3 h-3 text-gray-600" aria-label="Läst" />
            ) : (
              <Check className="w-3 h-3 text-gray-500" aria-label="Skickat" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
});

interface ChatWindowProps {
  matchId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchedUserAvatar?: string;
  matchedUserVerified?: boolean;
  icebreakers?: string[];
  onBack: () => void;
  onStartVideo?: () => void;
}

export function ChatWindow({
  matchId,
  matchedUserId,
  matchedUserName,
  matchedUserAvatar,
  matchedUserVerified,
  icebreakers = [],
  onBack,
  onStartVideo,
  showPostVideoCard = false,
  onDismissPostVideoCard,
}: ChatWindowProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { trackIcebreakerUsed, trackIcebreakersShown } = useIcebreakerAnalytics();
  const [messages, setMessages] = useState<Message[]>([]);
  const [showKemiCheckPrompt, setShowKemiCheckPrompt] = useState(true);
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
  const [postVideoSuggestion, setPostVideoSuggestion] = useState<string | null>(null);
  const [loadingPostVideo, setLoadingPostVideo] = useState(false);
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

  // Fetch post-video AI suggestion when returning from Kemi-Check
  useEffect(() => {
    if (!showPostVideoCard || !matchedUserId) return;
    setPostVideoSuggestion(null);
    setLoadingPostVideo(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) {
        setLoadingPostVideo(false);
        toast.error(t('chat.postVideoError'));
        return;
      }
      return supabase.functions.invoke('ai-assistant', {
        body: { type: 'after_video', matchedUserId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
    }).then((result) => {
      if (!result) return;
      const { data, error } = result;
      if (error) {
        console.error('Post-video AI error:', error);
        toast.error(t('chat.postVideoError'));
        return;
      }
      if (data?.suggestion) {
        setPostVideoSuggestion(data.suggestion);
      } else if (data?.error) {
        toast.error(data.error);
      }
    }).catch(() => {
      toast.error(t('chat.postVideoError'));
    }).finally(() => setLoadingPostVideo(false));
  }, [showPostVideoCard, matchedUserId, t]);

  

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
    } else if (achievementsCtx) {
      achievementsCtx.checkAndAwardAchievement('first_message');
      // conversation_starter: started 5 conversations (user sent first message in 5 matches)
      const { data: firstMsgMatches } = await supabase
        .from('messages')
        .select('match_id')
        .eq('sender_id', user.id)
        .order('created_at', { ascending: true });
      const matchIds = [...new Set((firstMsgMatches ?? []).map((m) => m.match_id))];
      if (matchIds.length >= 5) {
        achievementsCtx.checkAndAwardAchievement('conversation_starter');
      }
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error(t('chat.followup_error'));
        setLoadingFollowups(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('generate-followups', {
        body: {
          matchId,
          messageCount: 10,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
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
    <div className="msn-chat flex flex-col h-full bg-background">
      {/* MSN Title Bar */}
      <div className="msn-title-bar flex items-center gap-2 px-3 py-2 safe-area-top shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded hover:bg-white/20 text-white"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold truncate flex-1" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
          {t('chat.chatWith')}: {matchedUserName}
          {matchedUserVerified && <VerifiedBadge size="sm" className="text-primary-foreground ml-1 inline" />}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="p-1.5 rounded hover:bg-white/20 text-white" aria-label={t('report.report_user')}>
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[180px]">
            <DropdownMenuItem
              onClick={() => navigate(`/report?userId=${encodeURIComponent(matchedUserId)}&matchId=${encodeURIComponent(matchId)}&context=chat`)}
              className="cursor-pointer"
            >
              <AlertCircle className="w-4 h-4 mr-2" />
              {t('report.report_user')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* MÄÄK Action Toolbar – dating/relationship goals */}
      <div className="msn-toolbar flex items-center gap-1 px-2 py-1.5 shrink-0 flex-wrap">
        <button type="button" className="msn-toolbar-btn p-2 flex flex-col items-center gap-0.5 text-[10px]" title={t('chat.sendPhoto')} aria-label={t('chat.sendPhoto')}>
          <Paperclip className="w-4 h-4" />
          <span>{t('chat.sendPhoto')}</span>
        </button>
        <button type="button" className="msn-toolbar-btn p-2 flex flex-col items-center gap-0.5 text-[10px]" title={t('chat.kemiCheckTooltip')} onClick={onStartVideo} aria-label={t('chat.videoCall')}>
          <Video className="w-4 h-4" />
          <span>{t('chat.videoCall')}</span>
        </button>
        <button type="button" className="msn-toolbar-btn p-2 flex flex-col items-center gap-0.5 text-[10px]" title={t('chat.voiceMsg')} aria-label={t('chat.voiceMsg')} onClick={() => toast.info(t('chat.coming_soon'))}>
          <Mic className="w-4 h-4" />
          <span>{t('chat.voiceMsg')}</span>
        </button>
        <button
          type="button"
          className="msn-toolbar-btn p-2 flex flex-col items-center gap-0.5 text-[10px]"
          title={t('chat.icebreakers')}
          aria-label={t('chat.icebreakers')}
          onClick={() => {
            setShowAIPanel(true);
            if (aiIcebreakers.length === 0) {
              generateAIIcebreakers();
            }
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('chat.icebreakers')}</span>
        </button>
        <div className="flex-1" />
        <Sheet open={showAIPanel} onOpenChange={setShowAIPanel}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="msn-toolbar-btn p-2 flex flex-col items-center gap-0.5 text-[10px]"
              aria-label={t('chat.ai_icebreakers')}
              onClick={() => {
                setShowAIPanel(true);
                if (aiIcebreakers.length === 0) {
                  generateAIIcebreakers();
                }
              }}
            >
              <Brain className="w-4 h-4" />
              <span>{t('chat.aiSuggestions')}</span>
            </button>
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
      </div>

      {/* Chatt med row */}
      <div className="msn-to-row flex items-center gap-2 px-3 py-2 shrink-0">
        <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>{t('chat.chatWith')}:</span>
        <span className="text-sm truncate flex-1" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>{matchedUserName}</span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          {t('chat.online')}
        </span>
      </div>

      {/* Main: messages + avatar panels */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Messages area */}
        <div className="msn-messages-area flex-1 flex flex-col min-w-0 overflow-hidden rounded-br">
          <ScrollArea className="flex-1 px-3 py-4">
            {showPostVideoCard && onDismissPostVideoCard && (
              <div className="mb-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm text-foreground">{t('chat.postVideoTitle')}</h3>
                </div>
                {loadingPostVideo ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">{t('chat.postVideoGenerating')}</span>
                  </div>
                ) : postVideoSuggestion ? (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                    {postVideoSuggestion}
                  </p>
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onDismissPostVideoCard}
                  className="w-full"
                >
                  {t('chat.postVideoDismiss')}
                </Button>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center items-center h-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 && showIcebreakers && icebreakers.length > 0 ? (
              <div className="flex flex-col items-center justify-center py-6 px-4 space-y-4">
                <p className="text-sm text-gray-700 text-center" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>
                  Ny match! Välj en konversationsstartare eller skriv ditt eget meddelande.
                </p>
                <div className="w-full max-w-md space-y-2">
                  {icebreakers.map((icebreaker, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleIcebreakerClick(icebreaker)}
                      className="w-full p-3 text-left text-sm msn-bubble-them hover:border-primary/40 transition-colors"
                      style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}
                    >
                      {icebreaker}
                    </motion.button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 pb-4" role="list" aria-label={t('chat.messages')}>
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

          {/* MSN Input toolbar + field */}
          <div className="msn-input-toolbar px-2 pt-2 pb-1 shrink-0">
            <div className="flex items-center gap-1 mb-2">
              <button type="button" className="p-1.5 rounded hover:bg-white/60" title="Teckensnitt" aria-label="Teckensnitt">
                <span className="text-xs font-bold text-gray-700" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>A</span>
              </button>
              <button type="button" className="p-1.5 rounded hover:bg-white/60" title="Emoticons" aria-label="Emoticons">😊</button>
              <button type="button" className="p-1.5 rounded hover:bg-white/60" title="Röstklipp" aria-label="Röstklipp">
                <Mic className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button type="button" className="p-1.5 rounded hover:bg-white/60" title="Bild" aria-label="Bild">
                <Image className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button type="button" className="p-1.5 rounded hover:bg-white/60" title="Present" aria-label="Present">
                <Gift className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2 items-end">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder={t('chat.typeMessage')}
                disabled={sending}
                className="msn-input-field flex-1 min-h-[60px] px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex flex-col gap-1">
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="msn-send-btn px-3 py-1.5 text-xs font-medium min-w-[60px]"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : t('chat.send')}
                </button>
                <button type="button" className="msn-send-btn px-3 py-1 text-xs flex items-center justify-center gap-1 min-w-[60px]" title={t('chat.search')} aria-label={t('chat.search')} onClick={() => toast.info(t('chat.coming_soon'))}>
                  <Search className="w-3 h-3" />
                  {t('chat.search')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right: Avatar panels (MSN-style) */}
        <div className="msn-avatar-panel w-24 sm:w-28 flex flex-col border-l shrink-0 overflow-auto">
          <div className="p-2 border-b border-border/80">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>{t('chat.myMatch')}</p>
            <Avatar className="w-14 h-14 mx-auto rounded border-2 border-border shadow">
              <AvatarImage src={matchedUserAvatar} alt={matchedUserName} />
              <AvatarFallback className="bg-primary/15 text-foreground text-lg font-bold" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                {matchedUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="p-2">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>You</p>
            <Avatar className="w-14 h-14 mx-auto rounded border-2 border-border shadow">
              <AvatarFallback className="bg-secondary text-foreground text-lg font-bold" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* MSN Footer */}
      <div className="msn-footer px-3 py-1.5 text-center shrink-0 text-xs safe-area-bottom">
        {t('chat.footerTagline')}
      </div>

      {/* Follow-up Help Button */}
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
  );
}
