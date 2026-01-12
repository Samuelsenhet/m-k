import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Send, Loader2, ArrowLeft, Sparkles, Check, CheckCheck, Brain, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { TypingIndicator } from './TypingIndicator';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

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
    }
    setSending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(newMessage);
  };

  const handleIcebreakerClick = (icebreaker: string) => {
    sendMessage(icebreaker);
    setShowAIPanel(false);
  };

  const generateAIIcebreakers = async () => {
    if (!user) return;
    
    setLoadingAI(true);
    setAiIcebreakers([]);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          userId: user.id,
          type: 'icebreakers',
          matchedUserId,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Parse the icebreakers from the AI response
      const suggestion = data.suggestion as string;
      const lines = suggestion.split('\n').filter(line => 
        line.trim() && 
        (line.match(/^\d+\./) || line.startsWith('-') || line.startsWith('•'))
      );
      
      const parsed = lines.map(line => 
        line.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, '').replace(/^[""]|[""]$/g, '').trim()
      ).filter(line => line.length > 10);

      if (parsed.length > 0) {
        setAiIcebreakers(parsed.slice(0, 3));
      } else {
        // Fallback: try to extract sentences
        const sentences = suggestion.match(/[""][^""]+[""]/g);
        if (sentences) {
          setAiIcebreakers(sentences.map(s => s.replace(/[""]|[""]/g, '').trim()).slice(0, 3));
        } else {
          toast.error('Kunde inte generera isbrytare');
        }
      }
    } catch (error) {
      console.error('AI Icebreaker error:', error);
      toast.error('Kunde inte generera AI-isbrytare');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Avatar className="w-10 h-10">
          <AvatarImage src={matchedUserAvatar} />
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
          <SheetContent side="bottom" className="h-auto max-h-[60vh]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 font-serif">
                <Sparkles className="w-5 h-5 text-primary" />
                AI-genererade isbrytare
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted-foreground">
                Personliga konversationsstartare baserade på era profiler
              </p>
              
              {loadingAI ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Genererar förslag...</p>
                  </div>
                </div>
              ) : aiIcebreakers.length > 0 ? (
                <div className="space-y-2">
                  {aiIcebreakers.map((icebreaker, index) => (
                    <button
                      key={index}
                      onClick={() => handleIcebreakerClick(icebreaker)}
                      className="w-full p-3 text-left text-sm bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 transition-colors"
                    >
                      {icebreaker}
                    </button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAIIcebreakers}
                    className="w-full mt-3 gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generera nya förslag
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Button
                    onClick={generateAIIcebreakers}
                    className="gradient-primary text-primary-foreground gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generera isbrytare
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
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
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
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
                          <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                        ) : (
                          <Check className="w-3 h-3 text-primary-foreground/50" />
                        )
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
