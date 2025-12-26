import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    setupRealtimeSubscription();
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
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
  };

  const setupRealtimeSubscription = () => {
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {format(new Date(message.created_at), 'HH:mm', { locale: sv })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
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
