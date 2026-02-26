import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ButtonSecondary,
  ButtonCoral,
  AvatarV2,
  AvatarV2Fallback,
  CardV2,
  CardV2Content,
  MatchListItemCard,
  ArchetypeBadge,
} from '@/components/ui-v2';
import type { ArchetypeKey } from '@/components/ui-v2/badge/ArchetypeBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Heart, ArrowLeft, Sparkles, Users, Zap, Clock, Video, Mic, MoreVertical, Send, Search, Ban, Trash2, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BottomNavV2 } from '@/components/ui-v2';
import { COLORS } from '@/design/tokens';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ARCHETYPE_INFO } from '@/types/personality';
import type { ArchetypeCode, PersonalityCategory } from '@/types/personality';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
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

function toArchetypeKey(category: string): ArchetypeKey {
  const key = category?.toLowerCase?.() ?? '';
  if (['diplomat', 'strateger', 'byggare', 'upptackare'].includes(key)) return key as ArchetypeKey;
  return 'diplomat';
}

// Ömsesidiga matchningar – redan matchade, kan chatta
const DEMO_MUTUAL = [
  { id: 'demo-1', displayName: 'Emma', initial: 'E', archetype: 'ENFP' as ArchetypeCode, category: 'DIPLOMAT' as PersonalityCategory },
  { id: 'demo-2', displayName: 'Lucas', initial: 'L', archetype: 'INFJ' as ArchetypeCode, category: 'DIPLOMAT' as PersonalityCategory },
];

// Dagens matchningar – discoverykort (Gilla / Passa / Se profil) + explanation so it shows directly in profile
const DEMO_PENDING = [
  { id: 'demo-3', displayName: 'Sofia', initial: 'S', archetype: 'ENTP' as ArchetypeCode, category: 'STRATEGER' as PersonalityCategory, matchScore: 88, matchType: 'complementary' as const, bio: 'Älskar nya idéer och en bra debatt över fika.', matchExplanation: 'Du är Diplomaten – du är empatisk och värdesätter djupa relationer och harmoni. Sofia är Strategen – hen är analytisk och målinriktad med förmåga att se helheten. Som motsatsmatch kompletterar ni varandra: Din empati och värme kan mjuka upp deras analytiska sida, medan deras tydlighet kan hjälpa dig att sätta gränser.' },
  { id: 'demo-4', displayName: 'Alex', initial: 'A', archetype: 'INFP' as ArchetypeCode, category: 'DIPLOMAT' as PersonalityCategory, matchScore: 91, matchType: 'similar' as const, bio: 'Drömmer om meningsfulla samtal och äkta koppling.', matchExplanation: 'Du och Alex är båda Diplomaten – ni är empatiska och värdesätter djupa relationer och harmoni. Som likhetsmatch delar ni samma personlighetskategori, vilket ofta gör det lättare att förstå varandras behov och värdesätta samma saker i en relation.' },
];

// För Chat-fliken: lista med senaste meddelande
const SEED_MATCHES = [
  { id: 'demo-1', displayName: 'Emma', initial: 'E', lastMessage: 'Hej! Så kul att vi matchade 🎉', lastAt: '2 min sedan', unread: 1 },
  { id: 'demo-2', displayName: 'Lucas', initial: 'L', lastMessage: 'Vill du fika någon dag?', lastAt: 'Igår', unread: 0 },
  { id: 'demo-3', displayName: 'Sofia', initial: 'S', lastMessage: 'Tack för isbrytaren, haha!', lastAt: 'Igår', unread: 0 },
  { id: 'demo-4', displayName: 'Alex', initial: 'A', lastMessage: 'Ska vi ta en promenad i helgen?', lastAt: 'Igår', unread: 0 },
];


const SEED_CHATS: Record<string, { from: 'me' | 'them'; text: string }[]> = {
  'demo-1': [
    { from: 'them', text: 'Hej! Så kul att vi matchade 🎉' },
    { from: 'me', text: 'Hej Emma! Ja, verkligen – din profil var supertrevlig.' },
    { from: 'them', text: 'Tack! Du också. Ska vi ta en fika någon dag?' },
    { from: 'me', text: 'Gärna! När passar dig?' },
    { from: 'them', text: 'T.ex. onsdag? ☕' },
    { from: 'me', text: 'Onsdag funkar!' },
    { from: 'them', text: 'Perfekt, 14:00?' },
    { from: 'me', text: 'Ja, 14:00 är bra.' },
    { from: 'them', text: 'Ser fram emot det 😊' },
    { from: 'me', text: 'Samma här!' },
  ],
  'demo-2': [
    { from: 'them', text: 'Vill du fika någon dag?' },
    { from: 'me', text: 'Ja gärna! Nästa vecka?' },
  ],
  'demo-3': [
    { from: 'them', text: 'Tack för isbrytaren, haha!' },
    { from: 'me', text: 'Haha, ingen orsak! 😄' },
  ],
  'demo-4': [
    { from: 'them', text: 'Ska vi ta en promenad i helgen?' },
    { from: 'me', text: 'Ja, gärna! Lördag?' },
  ],
};

type DemoProfileMatch = (typeof DEMO_MUTUAL)[number] | (typeof DEMO_PENDING)[number];

function getProfileById(id: string): DemoProfileMatch | undefined {
  return DEMO_PENDING.find((m) => m.id === id) ?? DEMO_MUTUAL.find((m) => m.id === id);
}

export default function DemoSeed() {
  const [activeTab, setActiveTab] = useState<'matches' | 'chat'>('matches');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>('demo-1');
  const [pendingFilter, setPendingFilter] = useState<'all' | 'similar' | 'complementary'>('all');
  const [profileMatchId, setProfileMatchId] = useState<string | null>(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t } = useTranslation();

  const selectedMatch = SEED_MATCHES.find((m) => m.id === selectedMatchId);
  const chatQuery = chatSearchQuery.trim().toLowerCase();
  const filteredSeedMatches = chatQuery
    ? SEED_MATCHES.filter((m) => m.displayName.toLowerCase().includes(chatQuery))
    : SEED_MATCHES;
  const messages = selectedMatchId ? SEED_CHATS[selectedMatchId] ?? [] : [];
  const profileMatch = profileMatchId ? getProfileById(profileMatchId) : null;

  const similarCount = DEMO_PENDING.filter((m) => m.matchType === 'similar').length;
  const complementaryCount = DEMO_PENDING.filter((m) => m.matchType === 'complementary').length;
  const filteredPending =
    pendingFilter === 'similar'
      ? DEMO_PENDING.filter((m) => m.matchType === 'similar')
      : pendingFilter === 'complementary'
        ? DEMO_PENDING.filter((m) => m.matchType === 'complementary')
        : DEMO_PENDING;

  const openChat = (id: string) => {
    setSelectedMatchId(id);
    setActiveTab('chat');
  };

  const openProfile = (id: string) => {
    setProfileMatchId(id);
  };

  const closeProfileAndOpenChat = (id: string) => {
    setProfileMatchId(null);
    setSelectedMatchId(id);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen flex flex-col pb-20 safe-area-bottom" style={{ background: COLORS.neutral.offWhite }}>
      {/* Verifiering: om du ser denna text laddas rätt build (senast uppdaterad). */}
      <p className="sr-only" aria-hidden>Demo-sida laddad – rätt projekt</p>
      {/* Profile sheet – opens when "Se profil" is clicked */}
      <Sheet open={!!profileMatchId} onOpenChange={(open) => !open && setProfileMatchId(null)}>
        <SheetContent side="right" className="flex flex-col p-0 w-full max-w-md">
          {profileMatch && (() => {
            const archetypeInfo = ARCHETYPE_INFO[profileMatch.archetype];
            const archetypeKey = toArchetypeKey(profileMatch.category);
            return (
              <>
                <SheetHeader className="p-4 border-b border-border shrink-0">
                  <SheetTitle className="text-xl font-bold text-foreground">{profileMatch.displayName}</SheetTitle>
                  <SheetDescription className="flex items-center gap-2 mt-1">
                    <ArchetypeBadge archetype={archetypeKey} />
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-6">
                    <div className="flex justify-center">
                      <div className="w-24 h-24 rounded-2xl bg-primary/15 flex items-center justify-center text-5xl text-primary">
                        {archetypeInfo?.emoji ?? '💫'}
                      </div>
                    </div>
                    {archetypeInfo && (
                      <p className="text-sm text-muted-foreground leading-relaxed">{archetypeInfo.description}</p>
                    )}
                    {archetypeInfo && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Styrkor</p>
                        <div className="flex flex-wrap gap-2">
                          {archetypeInfo.strengths.map((s, i) => (
                            <span key={i} className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {'bio' in profileMatch && profileMatch.bio && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Bio</p>
                        <p className="text-sm text-foreground italic border-l-4 border-primary pl-4">{profileMatch.bio}</p>
                      </div>
                    )}
                    {'matchExplanation' in profileMatch && profileMatch.matchExplanation && (
                      <CardV2 variant="default" padding="default" className="border-primary/20 bg-primary/5">
                        <CardV2Content className="p-4">
                          <p className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            Varför ni matchade
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{profileMatch.matchExplanation}</p>
                        </CardV2Content>
                      </CardV2>
                    )}
                  </div>
                </ScrollArea>
                <SheetFooter className="p-4 border-t border-border gap-2 flex-row sm:flex-row">
                  <ButtonSecondary onClick={() => setProfileMatchId(null)} className="flex-1">
                    Stäng
                  </ButtonSecondary>
                  <ButtonCoral className="flex-1 gap-2" onClick={() => closeProfileAndOpenChat(profileMatch.id)}>
                    <MessageCircle className="w-4 h-4" />
                    Chatta
                  </ButtonCoral>
                </SheetFooter>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

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
            Määk demo
            <span className="text-xs font-normal text-muted-foreground">(uppdaterad)</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Så här ser matchningar och chatt ut i appen – ingen inloggning.
          </p>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'matches' | 'chat')} className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b border-border bg-transparent p-0 h-12 shrink-0">
          <TabsTrigger value="matches" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5">
            <Heart className="w-4 h-4" />
            Matchningar
          </TabsTrigger>
          <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent gap-1.5">
            <MessageCircle className="w-4 h-4" />
            Chatt
          </TabsTrigger>
          <Link
            to="/demo-samlingar"
            className="flex items-center justify-center gap-1.5 rounded-none border-b-2 border-transparent py-3 px-4 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent [&.active]:border-primary [&.active]:text-foreground"
          >
            <Users className="w-4 h-4" />
            Samlingar
          </Link>
        </TabsList>

        {/* Matchningar-tab: design system – CardV2, MatchListItemCard, inga procent */}
        <TabsContent value="matches" forceMount className="flex-1 m-0 overflow-auto data-[state=inactive]:hidden">
          <div className="min-h-full" style={{ background: COLORS.neutral.offWhite }}>
            <div className="max-w-lg mx-auto px-4 py-6">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-1 font-heading">
                    Dagens matchningar
                  </h2>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    24h löpande • Kvalitetsfokus
                  </p>
                </div>
              </div>

              {/* Insight Card – CardV2 (design system) */}
              <div className="mb-6">
                <CardV2 variant="default" padding="default">
                  <CardV2Content className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-foreground mb-1">
                          Smart personlighetsanalys
                        </h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          Baserad på 30 frågor • 16 arketyper • 4 kategorier
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                            <Users className="w-3.5 h-3.5" />
                            {similarCount} Likhets-match
                          </span>
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral">
                            <Sparkles className="w-3.5 h-3.5" />
                            {complementaryCount} Motsats-match
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardV2Content>
                </CardV2>
              </div>

              {/* Filter tabs – design system */}
              <div className="mb-4">
                <Tabs value={pendingFilter} onValueChange={(v) => setPendingFilter(v as 'all' | 'similar' | 'complementary')}>
                  <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/50 p-1">
                    <TabsTrigger value="all" className="rounded-full text-xs">
                      Alla ({DEMO_PENDING.length})
                    </TabsTrigger>
                    <TabsTrigger value="similar" className="rounded-full text-xs gap-1">
                      <Users className="w-3 h-3" />
                      Likhets-match ({similarCount})
                    </TabsTrigger>
                    <TabsTrigger value="complementary" className="rounded-full text-xs gap-1">
                      <Sparkles className="w-3 h-3" />
                      Motsats-match ({complementaryCount})
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Ömsesidiga matchningar – MatchListItemCard + ButtonCoral (Coral) */}
              {DEMO_MUTUAL.length > 0 && (
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                    <span className="flex w-8 h-8 items-center justify-center rounded-xl bg-coral/15 text-coral">
                      <Heart className="w-4 h-4" fill="currentColor" />
                    </span>
                    Ömsesidiga matchningar ({DEMO_MUTUAL.length})
                  </h2>
                  <div className="space-y-3">
                    {DEMO_MUTUAL.map((match) => (
                      <MatchListItemCard
                        key={match.id}
                        displayName={match.displayName}
                        archetype={toArchetypeKey(match.category)}
                        previewText={ARCHETYPE_INFO[match.archetype]?.description?.slice(0, 60) + '…'}
                        avatarSrc={null}
                        avatarFallback={match.initial}
                        isNewToday={false}
                        relationshipLevel={3}
                        onChat={() => openChat(match.id)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Dagens matchningar – MatchListItemCard, Se profil via klick på rad */}
              <div className="space-y-3 mb-8">
                {filteredPending.map((match, index) => {
                  const preview =
                    'matchExplanation' in match && match.matchExplanation
                      ? match.matchExplanation.split(/[.\n]/)[0]?.trim().slice(0, 60) + '…'
                      : 'bio' in match && match.bio
                        ? match.bio.slice(0, 60) + (match.bio.length > 60 ? '…' : '')
                        : undefined;
                  return (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        if (!(e.target as HTMLElement).closest('button')) openProfile(match.id);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && openProfile(match.id)}
                      className="cursor-pointer"
                    >
                      <MatchListItemCard
                        displayName={match.displayName}
                        archetype={toArchetypeKey(match.category)}
                        previewText={preview ?? undefined}
                        avatarSrc={null}
                        avatarFallback={match.initial}
                        isNewToday
                        relationshipLevel={1}
                        onChat={() => openChat(match.id)}
                        onViewProfile={() => openProfile(match.id)}
                      />
                    </motion.div>
                  );
                })}
              </div>

              <p className="text-center text-sm text-muted-foreground py-4">
                Nya matchningar kommer i morgon.
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Chatt-tab: samma layout som appens chatt (msn-chat) – ny header + input */}
        <TabsContent value="chat" forceMount className="flex-1 m-0 flex flex-col min-h-0 overflow-hidden data-[state=inactive]:hidden">
          {selectedMatch ? (
            <div className="msn-chat flex flex-col flex-1 min-h-0">
              {/* Chat header: back, avatar, name + Active Now, Kemi-Check (when 10+ msgs), more (Block / Delete) – same as app */}
              <div className="msn-title-bar flex items-center gap-3 px-3 py-2.5 safe-area-top shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedMatchId(null)}
                  className="p-1.5 rounded hover:bg-white/20 text-white shrink-0"
                  aria-label={t('common.back')}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative shrink-0">
                  <AvatarV2 className="w-10 h-10 rounded-full border-2 border-white/30 shadow">
                    <AvatarV2Fallback className="bg-primary/20 text-primary-foreground text-sm font-bold" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                      {selectedMatch.initial}
                    </AvatarV2Fallback>
                  </AvatarV2>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[var(--msn-title-bar-bg,#0ea5a4)]" aria-hidden />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-sm font-semibold truncate text-primary-foreground" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
                    {selectedMatch.displayName}
                  </span>
                  <span className="text-xs text-primary-foreground/80 truncate">{t('chat.activeNow')}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {messages.length >= 10 && (
                    <button type="button" className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground" title={t('chat.kemiCheckTooltip')} aria-label={t('chat.kemiCheck')} onClick={() => toast.info('Demo – starta Kemi-Check')}>
                      <Video className="w-4 h-4" />
                    </button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button type="button" className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-primary-foreground" aria-label={t('chat.more_options')}>
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Block User confirmation (demo) */}
              <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
                <AlertDialogContent className="rounded-2xl max-w-[340px] gap-4 p-6">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-foreground">{t('chat.block_user')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground/90">{t('chat.block_user_confirm')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
                    <AlertDialogCancel onClick={() => setShowBlockConfirm(false)} className="rounded-xl border-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 order-2">
                      {t('common.no')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setShowBlockConfirm(false);
                        toast.success(t('chat.block_user'));
                      }}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1"
                    >
                      {t('common.yes')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Delete Person confirmation (demo) */}
              <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent className="rounded-2xl max-w-[340px] gap-4 p-6">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-foreground">{t('chat.delete_person')}</AlertDialogTitle>
                    <AlertDialogDescription className="text-foreground/90">{t('chat.delete_person_confirm')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
                    <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)} className="rounded-xl border-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 order-2">
                      {t('common.no')}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        toast.success(t('chat.delete_person'));
                        setSelectedMatchId(null);
                      }}
                      className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 order-1"
                    >
                      {t('common.yes')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {/* Meddelandeområde – appens bubblor */}
              <div className="msn-messages-area flex-1 flex flex-col min-h-0 overflow-hidden rounded-br">
                <ScrollArea className="flex-1 px-3 py-4">
                  <div className="space-y-2 pb-4" role="list" aria-label="Meddelanden">
                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28, delay: i * 0.03 }}
                        className={cn('flex mb-2', msg.from === 'me' ? 'justify-end' : 'justify-start')}
                      >
                        <div className={cn('max-w-[80%] px-3 py-2 text-sm', msg.from === 'me' ? 'msn-bubble-own' : 'msn-bubble-them')}>
                          <p className="leading-relaxed" style={{ fontFamily: 'Tahoma, Arial, sans-serif' }}>{msg.text}</p>
                          <div className={cn('flex items-center gap-1.5 mt-1', msg.from === 'me' ? 'justify-end' : '')}>
                            <span className="text-xs text-gray-600">
                              {msg.from === 'me' ? '12:34' : '12:33'}
                            </span>
                            {msg.from === 'me' && (
                              <CheckCheck className="w-3 h-3 text-gray-600" aria-label="Läst" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
                {/* Message input: "Write Your Message" + mic + send (demo – disabled) */}
                <div className="px-3 py-3 shrink-0 border-t border-border/80 bg-background/95">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      placeholder="Skriv ditt meddelande"
                      className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-muted/80 border border-border text-sm placeholder:text-muted-foreground"
                      style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}
                    />
                    <button type="button" disabled className="p-2.5 rounded-full bg-muted/80 text-foreground opacity-60" aria-label="Röst">
                      <Mic className="w-5 h-5" />
                    </button>
                    <button type="button" disabled className="p-2.5 rounded-full bg-primary/60 text-primary-foreground opacity-60" aria-label="Skicka">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
              {/* Same chat list layout as app: header + search + Recent Match + list */}
              <div className="flex items-center justify-center px-3 py-3 border-b border-border shrink-0">
                <h1 className="font-semibold text-lg text-foreground">Chatt</h1>
              </div>
              <div className="px-3 py-2 border-b border-border shrink-0">
                <div className="flex items-center gap-2 rounded-xl border-2 border-primary/30 bg-muted/30 px-3 py-2.5 focus-within:border-primary/60 focus-within:bg-background transition-colors">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="search"
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    placeholder="Sök"
                    className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto">
                {filteredSeedMatches.length > 0 ? (
                  <>
                    <div className="px-3 pt-4 pb-3 border-b border-border">
                      <h2 className="font-semibold text-foreground text-sm mb-3">Senaste match</h2>
                      <ScrollArea className="w-full whitespace-nowrap">
                        <div className="flex gap-4 pb-2 w-max min-w-full">
                          {filteredSeedMatches.map((match) => (
                            <button
                              key={match.id}
                              type="button"
                              onClick={() => setSelectedMatchId(match.id)}
                              className="flex flex-col items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl p-1 transition-colors hover:bg-muted/50"
                            >
                              <AvatarV2 className="w-14 h-14 rounded-full border-2 border-primary/20 bg-primary/10">
                                <AvatarV2Fallback className="bg-primary/20 text-primary text-lg font-semibold">{match.initial}</AvatarV2Fallback>
                              </AvatarV2>
                              <span className="text-xs font-medium text-foreground truncate max-w-[72px]">{match.displayName}</span>
                            </button>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                    <div className="divide-y divide-border">
                      {filteredSeedMatches.map((match) => (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => setSelectedMatchId(match.id)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                            selectedMatchId === match.id && 'bg-primary/5'
                          )}
                        >
                          <AvatarV2 className="w-12 h-12 rounded-full border-2 border-primary/20 bg-primary/10 shrink-0">
                            <AvatarV2Fallback className="bg-primary/20 text-primary font-semibold">{match.initial}</AvatarV2Fallback>
                          </AvatarV2>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="font-semibold text-foreground truncate">{match.displayName}</h4>
                              <span className="text-xs text-muted-foreground shrink-0">{match.lastAt}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-sm text-muted-foreground truncate flex-1 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                {match.lastMessage}
                              </p>
                              <div className="shrink-0 w-5 flex justify-end">
                                {match.unread ? (
                                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
                                    {match.unread}
                                  </span>
                                ) : (
                                  <CheckCheck className="w-5 h-5 text-destructive" aria-hidden />
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">Inga träffar</div>
                )}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="border-t border-border p-3 text-center">
        <Link to="/">
          <ButtonSecondary size="sm">
            Gå till Määk-appen
          </ButtonSecondary>
        </Link>
      </div>
      <BottomNavV2 currentPath="/demo-seed" />
    </div>
  );
}
