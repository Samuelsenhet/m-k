import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatBubbleV2, ChatInputBarV2, ChatHeaderV2, ChatEmptyStateV2, ButtonPrimary, ButtonGhost, ButtonIcon, ButtonSecondary, AvatarV2, AvatarV2Image, AvatarV2Fallback } from '@/components/ui-v2';
import { COLORS } from '@/design/tokens';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Loader2, Sparkles, Brain, Laugh, Heart, Coffee, MessageCircle, HelpCircle, Paperclip, Video, Mic, Image, MoreVertical, AlertCircle, Ban, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiedBadge } from '@/components/ui-v2';
import { TypingIndicator } from './TypingIndicator';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useIcebreakerAnalytics } from '@/hooks/useIcebreakerAnalytics';
import { useAchievementsContextOptional } from '@/contexts/AchievementsContext';
import { useEmotionalState } from '@/hooks/useEmotionalState';
import type { IcebreakerCategory } from '@/types/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// Category configuration with icons – design-system archetype tokens
const CATEGORY_CONFIG: { key: IcebreakerCategory; icon: typeof Laugh; color: string }[] = [
  { key: 'general', icon: Sparkles, color: 'text-personality-diplomat' },
  { key: 'funny', icon: Laugh, color: 'text-coral-500' },
  { key: 'deep', icon: Heart, color: 'text-personality-strateger' },
  { key: 'activity', icon: Coffee, color: 'text-primary' },
  { key: 'compliment', icon: MessageCircle, color: 'text-personality-upptackare' },
];

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

// FAS 7 – Message bubble uses ChatBubbleV2 (token-based, read state)

interface ChatWindowProps {
  matchId: string;
  matchedUserId: string;
  matchedUserName: string;
  matchedUserAvatar?: string;
  matchedUserVerified?: boolean;
  /** FAS Relationship Depth: optional 1–5 for header divider accent */
  relationshipLevel?: 1 | 2 | 3 | 4 | 5;
  icebreakers?: string[];
  onBack: () => void;
  onStartVideo?: () => void;
  showPostVideoCard?: boolean;
  onDismissPostVideoCard?: () => void;
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
  const navigate = useNavigate();
  const achievementsCtx = useAchievementsContextOptional();
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
  const [matchTypeExplanation, setMatchTypeExplanation] = useState<string | null>(null);
  // Follow-up suggestions state
  const [showFollowupPanel, setShowFollowupPanel] = useState(false);
  const [followups, setFollowups] = useState<string[]>([]);
  const [loadingFollowups, setLoadingFollowups] = useState(false);
  const [followupsRemaining, setFollowupsRemaining] = useState<number | null>(null);
  const [postVideoSuggestion, setPostVideoSuggestion] = useState<string | null>(null);
  const [loadingPostVideo, setLoadingPostVideo] = useState(false);
  const [kemiCheckSuggestionDismissed, setKemiCheckSuggestionDismissed] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { surfaceClass: emotionalSurfaceClass } = useEmotionalState({
    screen: "chat",
    relationshipLevel: relationshipLevel ?? undefined,
    hasMessages: messages.length > 0,
  });

  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching messages:', error);
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
        if (import.meta.env.DEV) console.error('Post-video AI error:', error);
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
      if (import.meta.env.DEV) console.error('Error sending message:', error);
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error(t('chat.followup_error'));
        setLoadingAI(false);
        return;
      }
      const { data, error } = await supabase.functions.invoke('generate-icebreakers', {
        body: {
          matchId,
          matchedUserId,
          category,
        },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      const icebreakersData = data.icebreakers as string[];
      if (icebreakersData && icebreakersData.length > 0) {
        setAiIcebreakers(icebreakersData.slice(0, 3));
        setMatchTypeExplanation((data.matchTypeExplanation as string) ?? null);
        // Track that icebreakers were shown (fire-and-forget)
        trackIcebreakersShown(matchId, icebreakersData.slice(0, 3), category);
      } else {
        toast.error(t('chat.followup_error'));
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('AI Icebreaker error:', error);
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
      if (import.meta.env.DEV) console.error('Followup error:', error);
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

  // Show "boka Kemi-Check" suggestion when conversation is between 10–20 messages
  const KEMI_CHECK_SUGGESTION_MIN = 10;
  const KEMI_CHECK_SUGGESTION_MAX = 20;
  const showKemiCheckSuggestion =
    messages.length >= KEMI_CHECK_SUGGESTION_MIN &&
    messages.length <= KEMI_CHECK_SUGGESTION_MAX &&
    !kemiCheckSuggestionDismissed &&
    !loading;

  // Kemi-Check (FaceTime) icon only after 10+ messages
  const KEMI_CHECK_MESSAGE_THRESHOLD = 10;
  const showKemiCheckIcon = messages.length >= KEMI_CHECK_MESSAGE_THRESHOLD;

  return (
    <div className="msn-chat flex flex-1 flex-col min-h-0 min-w-0">
      {/* FAS 7 – Chat header V2: AvatarWithRing, video, dropdown unchanged */}
      <ChatHeaderV2
        variant="light"
        onBack={onBack}
        avatarSrc={matchedUserAvatar}
        displayName={matchedUserName}
        verified={matchedUserVerified}
        relationshipLevel={relationshipLevel}
        online
        onlineLabel={t('chat.online_now')}
        backLabel={t('common.back')}
        videoLabel={t('chat.videoCall')}
        showVideoButton={showKemiCheckIcon}
        onVideoClick={onStartVideo}
        rightSlot={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="p-2 hover:opacity-80 transition-opacity rounded-full [color:inherit]" aria-label={t('chat.more_options', 'Fler alternativ')}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px] rounded-b-xl bg-primary-foreground/95 border-border">
              <DropdownMenuItem onClick={() => setShowBlockConfirm(true)} className="cursor-pointer text-foreground focus:bg-muted">
                <Ban className="w-4 h-4 mr-2" />
                {t('chat.block_user')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="cursor-pointer text-foreground focus:bg-muted">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('chat.delete_person')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => navigate(`/report?userId=${encodeURIComponent(matchedUserId)}&matchId=${encodeURIComponent(matchId)}&context=chat`)}
                className="cursor-pointer text-foreground focus:bg-muted"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {t('report.report_user')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Block User confirmation */}
      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-[340px] gap-4 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">{t('chat.block_user')}</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/90">
              {t('chat.block_user_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel
              onClick={() => setShowBlockConfirm(false)}
              className="rounded-xl border-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 order-2"
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowBlockConfirm(false);
                toast.success(t('chat.block_user'));
                // TODO: call block API
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1"
            >
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Person confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl max-w-[340px] gap-4 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground">{t('chat.delete_person')}</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/90">
              {t('chat.delete_person_confirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel
              onClick={() => setShowDeleteConfirm(false)}
              className="rounded-xl border-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 order-2"
            >
              {t('common.no')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteConfirm(false);
                toast.success(t('chat.delete_person'));
                onBack();
              }}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1"
            >
              {t('common.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* MÄÄK Action Toolbar – dating/relationship goals */}
      <div className="msn-toolbar flex items-center gap-1 px-4 py-1.5 shrink-0 flex-wrap">
        <button type="button" className="msn-toolbar-btn p-2 flex flex-col items-center gap-0.5 text-[10px]" title={t('chat.sendPhoto')} aria-label={t('chat.sendPhoto')} onClick={() => toast.info(t('chat.coming_soon'))}>
          <Paperclip className="w-4 h-4" />
          <span>{t('chat.sendPhoto')}</span>
        </button>
        {showKemiCheckIcon && (
          <button type="button" className="msn-toolbar-btn p-2 flex flex-col items-center gap-0.5 text-[10px]" title={t('chat.kemiCheckTooltip')} onClick={onStartVideo} aria-label={t('chat.kemiCheck')}>
            <Video className="w-4 h-4" />
            <span>{t('chat.kemiCheck')}</span>
          </button>
        )}
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

              {/* Why likhet/motsatt – attractive card */}
              {matchTypeExplanation && (
                <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-card">
                  <p className="flex items-center gap-2 text-base font-bold text-primary mb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/20 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </span>
                    {t('chat.why_you_matched', 'Varför ni matchade')}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed pl-10">{matchTypeExplanation}</p>
                </div>
              )}

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
                    <ButtonGhost
                      size="sm"
                      onClick={() => generateAIIcebreakers(selectedCategory)}
                      className="w-full mt-3 gap-2 border border-border"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('chat.generate_new')}
                    </ButtonGhost>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-4"
                  >
                    <ButtonPrimary
                      onClick={() => generateAIIcebreakers(selectedCategory)}
                      className="gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {t('chat.generate_icebreakers')}
                    </ButtonPrimary>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main: messages + avatar panels */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Messages area */}
        <div className="msn-messages-area flex-1 flex flex-col min-w-0 overflow-hidden rounded-br">
          <ScrollArea className="flex-1 px-4 py-4">
            {/* AI-Wingman: suggest booking Kemi-Check when conversation is going well (e.g. 20+ messages) */}
            {showKemiCheckSuggestion && (
              <div className="mb-4 p-4 rounded-xl border-2 border-primary/30 bg-primary/5 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-semibold text-sm text-foreground">{t('chat.kemiCheck')}</h3>
                </div>
                <p className="text-sm text-foreground leading-relaxed" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                  {t('chat.aiSuggestKemiCheck')}
                </p>
                <div className="flex gap-2">
                  <ButtonPrimary
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => {
                      setKemiCheckSuggestionDismissed(true);
                      onStartVideo?.();
                    }}
                  >
                    <Video className="w-4 h-4" />
                    {t('chat.bookKemiCheck')}
                  </ButtonPrimary>
                  <ButtonSecondary
                    size="sm"
                    onClick={() => setKemiCheckSuggestionDismissed(true)}
                  >
                    {t('chat.postVideoDismiss')}
                  </ButtonSecondary>
                </div>
              </div>
            )}
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
                <ButtonSecondary
                  size="sm"
                  onClick={onDismissPostVideoCard}
                  className="w-full"
                >
                  {t('chat.postVideoDismiss')}
                </ButtonSecondary>
              </div>
            )}
            {loading ? (
              <div className="flex justify-center items-center h-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 && showIcebreakers ? (
              <ChatEmptyStateV2
                icebreakers={icebreakers.length > 0 ? icebreakers : []}
                onIcebreakerClick={handleIcebreakerClick}
                onAIClick={() => {
                  setShowAIPanel(true);
                  if (aiIcebreakers.length === 0) generateAIIcebreakers();
                }}
                aiLabel={t('chat.ai_icebreakers')}
                emotionalConfig={{
                  screen: "chat",
                  relationshipLevel: relationshipLevel ?? undefined,
                  hasMessages: false,
                }}
              />
            ) : (
              <div
                className={cn(
                  "pb-4",
                  relationshipLevel != null && relationshipLevel >= 4 && "space-y-5",
                  relationshipLevel === 3 && "space-y-4",
                  (relationshipLevel == null || relationshipLevel <= 2) && "space-y-2",
                )}
                role="list"
                aria-label={t("chat.messages")}
              >
                {/* Date divider – design system: "Idag" with sage-200 lines */}
                <div className="flex items-center gap-4 mb-4" style={{ color: COLORS.neutral.gray }}>
                  <div className="flex-1 h-px" style={{ background: COLORS.sage[200] }} />
                  <span className="text-xs">{t("chat.today", "Idag")}</span>
                  <div className="flex-1 h-px" style={{ background: COLORS.sage[200] }} />
                </div>
                {messages.map((message) => (
                  <ChatBubbleV2
                    key={message.id}
                    message={message}
                    variant={message.sender_id === user?.id ? "own" : "them"}
                    isOwn={message.sender_id === user?.id}
                    relationshipLevel={relationshipLevel}
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

          {/* FAS Conversation Depth + Emotional: input surface by level; emotional surface when warm */}
          <div
            className={cn(
              "px-4 py-3 shrink-0 border-t bg-background",
              relationshipLevel != null && relationshipLevel >= 4 && "border-t-primary/30 bg-[hsl(var(--relationship-glow-calm))] shadow-[0_-4px_20px_hsl(var(--primary)/0.08)]",
              relationshipLevel === 3 && "border-t-primary/20 bg-[hsl(var(--relationship-glow-calm))] backdrop-blur-[2px]",
              relationshipLevel != null && relationshipLevel <= 2 && "border-border",
              relationshipLevel == null && "border-border",
              emotionalSurfaceClass,
            )}
          >
            <ChatInputBarV2
              value={newMessage}
              onChange={(value) => {
                setNewMessage(value);
                broadcastTyping();
              }}
              onSubmit={handleSubmit}
              placeholder={
                relationshipLevel != null && relationshipLevel >= 4
                  ? t("chat.placeholderDepthDeep", "Skriv något ni vill dela…")
                  : relationshipLevel != null && relationshipLevel >= 3
                    ? t("chat.placeholderDepthMutual", "Skriv till varandra…")
                    : t("chat.typeMessage")
              }
              disabled={sending}
              sending={sending}
              onImageClick={() => toast.info(t('chat.coming_soon'))}
              onVoiceClick={() => toast.info(t('chat.coming_soon'))}
              onAIClick={() => {
                setShowAIPanel(true);
                if (aiIcebreakers.length === 0) generateAIIcebreakers();
              }}
              sendLabel={t('chat.send')}
            />
          </div>
        </div>

        {/* Right: Avatar panels (MSN-style) */}
        <div className="msn-avatar-panel w-24 sm:w-28 flex flex-col border-l shrink-0 overflow-auto">
          <div className="p-2 border-b border-border/80">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>{t('chat.myMatch')}</p>
            <AvatarV2 className="w-14 h-14 mx-auto rounded border-2 border-border shadow">
              <AvatarV2Image src={matchedUserAvatar} alt={matchedUserName} />
              <AvatarV2Fallback className="bg-primary/15 text-foreground text-lg font-bold" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                {matchedUserName.charAt(0).toUpperCase()}
              </AvatarV2Fallback>
            </AvatarV2>
          </div>
          <div className="p-2">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>You</p>
            <AvatarV2 className="w-14 h-14 mx-auto rounded border-2 border-border shadow">
              <AvatarV2Fallback className="bg-secondary text-foreground text-lg font-bold" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                {user?.email?.charAt(0).toUpperCase() || '?'}
              </AvatarV2Fallback>
            </AvatarV2>
          </div>
        </div>
      </div>

      {/* MSN Footer */}
      <div className="msn-footer px-4 py-1.5 text-center shrink-0 text-xs safe-area-bottom">
        {t('chat.footerTagline')}
      </div>

      {/* Follow-up Help Button */}
      {showFollowupButton && (
          <Sheet open={showFollowupPanel} onOpenChange={setShowFollowupPanel}>
            <SheetTrigger asChild>
              <ButtonIcon
                className="text-primary"
                aria-label={t('chat.followup_help')}
                onClick={() => {
                  setShowFollowupPanel(true);
                  if (followups.length === 0) {
                    generateFollowups();
                  }
                }}
              >
                <HelpCircle className="w-5 h-5" />
              </ButtonIcon>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[60vh]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 font-serif">
                  <HelpCircle className="w-5 h-5 text-primary" />
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
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
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
                          className="w-full p-3 text-left text-sm bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 transition-colors"
                        >
                          {followup}
                        </motion.button>
                      ))}
                      <ButtonGhost
                        size="sm"
                        onClick={generateFollowups}
                        disabled={followupsRemaining === 0}
                        className="w-full mt-3 gap-2 border border-border"
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('chat.generate_new')}
                      </ButtonGhost>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-4"
                    >
                      <ButtonPrimary
                        onClick={generateFollowups}
                        className="gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {t('chat.followup_suggestions')}
                      </ButtonPrimary>
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
