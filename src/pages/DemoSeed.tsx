import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/navigation/BottomNav';

// Seed data for demo view
const SEED_MATCHES = [
  { id: 'demo-1', displayName: 'Emma', initial: 'E', lastMessage: 'Hej! Så kul att vi matchade 🎉', lastAt: '2 min sedan', unread: 1 },
  { id: 'demo-2', displayName: 'Lucas', initial: 'L', lastMessage: 'Vill du fika någon dag?', lastAt: 'Igår', unread: 0 },
  { id: 'demo-3', displayName: 'Sofia', initial: 'S', lastMessage: 'Tack för isbrytaren, haha!', lastAt: 'Igår', unread: 0 },
];

const SEED_CHATS: Record<string, { from: 'me' | 'them'; text: string }[]> = {
  'demo-1': [
    { from: 'them', text: 'Hej! Så kul att vi matchade 🎉' },
    { from: 'me', text: 'Hej Emma! Ja, verkligen – din profil var supertrevlig.' },
    { from: 'them', text: 'Tack! Du också. Ska vi ta en fika någon dag?' },
    { from: 'me', text: 'Gärna! När passar dig?' },
  ],
  'demo-2': [
    { from: 'them', text: 'Vill du fika någon dag?' },
    { from: 'me', text: 'Ja gärna! Nästa vecka?' },
  ],
  'demo-3': [
    { from: 'them', text: 'Tack för isbrytaren, haha!' },
    { from: 'me', text: 'Haha, ingen orsak! 😄' },
  ],
};

export default function DemoSeed() {
  const [activeTab, setActiveTab] = useState<'matches' | 'chat'>('matches');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>('demo-1');

  const selectedMatch = SEED_MATCHES.find((m) => m.id === selectedMatchId);
  const messages = selectedMatchId ? SEED_CHATS[selectedMatchId] ?? [] : [];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Till startsidan</span>
          </Link>
          <span className="font-serif font-semibold text-foreground">Määk</span>
          <span className="w-20" />
        </div>
        <div className="px-4 pb-2">
          <h1 className="font-serif text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Määk demo seed
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Demo med exempel på matchningar och chatt – ingen inloggning.
          </p>
        </div>
      </header>

      {/* Tabs: Matches | Chat */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'matches' | 'chat')} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="w-full grid grid-cols-2 rounded-none border-b border-border bg-transparent p-0 h-12 shrink-0">
          <TabsTrigger value="matches" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5">
            <Heart className="w-4 h-4" />
            Matchningar
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5">
            <MessageCircle className="w-4 h-4" />
            Chatt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matches" forceMount className="flex-1 m-0 p-4 overflow-auto min-h-[280px] data-[state=inactive]:hidden">
          <div className="space-y-2 max-w-lg mx-auto">
            {SEED_MATCHES.map((match) => (
              <Card
                key={match.id}
                className={cn(
                  'p-3 cursor-pointer transition-all',
                  selectedMatchId === match.id && 'ring-2 ring-primary bg-primary/5'
                )}
                onClick={() => {
                  setSelectedMatchId(match.id);
                  setActiveTab('chat');
                }}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {match.initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground truncate">{match.displayName}</h4>
                      <span className="text-xs text-muted-foreground">{match.lastAt}</span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{match.lastMessage}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="chat" forceMount className="flex-1 m-0 flex flex-col min-h-[320px] overflow-hidden data-[state=inactive]:hidden">
          {selectedMatch ? (
            <>
              <div className="border-b border-border px-4 py-2 flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedMatchId(null)} className="shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedMatch.initial}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold text-foreground">{selectedMatch.displayName}</span>
              </div>
              <div className="flex-1 overflow-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex',
                      msg.from === 'me' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                        msg.from === 'me'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted text-foreground rounded-bl-md'
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-border text-center text-xs text-muted-foreground">
                Demo – skicka inte meddelanden här.
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Välj en matchning i fliken Matchningar, eller välj nedan.</p>
              <div className="mt-4 space-y-2 w-full max-w-sm">
                {SEED_MATCHES.map((match) => (
                  <Button
                    key={match.id}
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={() => setSelectedMatchId(match.id)}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {match.initial}
                      </AvatarFallback>
                    </Avatar>
                    {match.displayName}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="border-t border-border p-3 text-center">
        <Link to="/">
          <Button variant="outline" size="sm">
            Gå till Määk-appen
          </Button>
        </Link>
      </div>
    </div>
  );
}
