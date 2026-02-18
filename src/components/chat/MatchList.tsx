import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { sv, enUS } from 'date-fns/locale';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { getProfilesAuthKey } from '@/lib/profiles';
import { ChatListItemCard, AvatarWithRing } from '@/components/ui-v2';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';

interface Match {
  id: string;
  matched_user_id: string;
  match_type: string;
  match_score: number;
  status: string;
  created_at: string;
  matched_profile?: {
    display_name: string;
    avatar_url: string | null;
    id_verification_status?: string | null;
  };
  last_message?: {
    content: string;
    created_at: string;
  };
  unread_count?: number;
}

interface MatchListProps {
  onSelectMatch: (match: Match) => void;
  selectedMatchId?: string;
  /** Filter conversations by display name (from main Chat page search) */
  searchQuery?: string;
}

type ProfileLookupRow = {
  display_name: string | null;
  avatar_url: string | null;
} & Record<string, unknown>;

export function MatchList({ onSelectMatch, selectedMatchId, searchQuery = '' }: MatchListProps) {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const dateLocale = i18n.language === 'sv' ? sv : enUS;
  const noChatsMascot = useMascot(MASCOT_SCREEN_STATES.NO_CHATS);

  const query = searchQuery.trim().toLowerCase();
  const displayName = (m: Match) => m.matched_profile?.display_name ?? 'Användare';
  const filteredMatches = query
    ? matches.filter((m) => displayName(m).toLowerCase().includes(query))
    : matches;

  const fetchMutualMatches = useCallback(async () => {
    if (!user) return;

    try {
      // Fetch mutual matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq('status', 'mutual')
        .order('created_at', { ascending: false });

      if (matchesError) {
        console.error('Error fetching matches:', matchesError);
        setLoading(false);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get all matched user IDs
      const matchedUserIds = matchesData.map(match => 
        match.user_id === user.id ? match.matched_user_id : match.user_id
      );
      const matchIds = matchesData.map(m => m.id);

      // Batch fetch all profiles at once
      const profileKey = await getProfilesAuthKey(user.id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select(`${profileKey}, display_name, avatar_url, id_verification_status`)
        .in(profileKey, matchedUserIds);

      // Batch fetch last messages for all matches (using a subquery approach)
      const { data: lastMessagesData } = await supabase
        .from('messages')
        .select('match_id, content, created_at')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      // Batch fetch unread counts - get all unread messages and count per match
      const { data: unreadData } = await supabase
        .from('messages')
        .select('match_id')
        .in('match_id', matchIds)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      // Create lookup maps
      const profileMap = new Map<string, ProfileLookupRow>();
      (profilesData as unknown as ProfileLookupRow[] | null | undefined)?.forEach((p) => {
        const keyValue = p?.[profileKey];
        if (typeof keyValue === 'string') {
          profileMap.set(keyValue, p);
        }
      });
      
      // Get last message per match (first occurrence since ordered desc)
      const lastMessageMap = new Map<string, { content: string; created_at: string }>();
      lastMessagesData?.forEach(msg => {
        if (!lastMessageMap.has(msg.match_id)) {
          lastMessageMap.set(msg.match_id, { content: msg.content, created_at: msg.created_at });
        }
      });

      // Count unreads per match
      const unreadCountMap = new Map<string, number>();
      unreadData?.forEach(msg => {
        unreadCountMap.set(msg.match_id, (unreadCountMap.get(msg.match_id) || 0) + 1);
      });

      // Combine data
      const matchesWithProfiles = matchesData.map(match => {
        const matchedUserId = match.user_id === user.id 
          ? match.matched_user_id 
          : match.user_id;

        const profile = profileMap.get(matchedUserId);
        const lastMessage = lastMessageMap.get(match.id);
        const unreadCount = unreadCountMap.get(match.id) || 0;

        return {
          ...match,
          matched_user_id: matchedUserId,
          matched_profile: profile || { display_name: 'Användare', avatar_url: null },
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      });

      setMatches(matchesWithProfiles);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMutualMatches();
  }, [fetchMutualMatches]);

  const getPhotoUrl = (path: string | null) => {
    if (!path) return undefined;
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Mascot {...noChatsMascot} className="mb-4" />
        <h3 className="font-heading font-semibold text-foreground mb-2">
          {t('matches.noMatches')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('chat.chooseIcebreaker')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Recent Match – horizontal scroll of avatars + names */}
      {filteredMatches.length > 0 && (
        <div className="px-3 pt-4 pb-3 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm mb-3">{t('chat.recentMatch')}</h2>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-2">
              {filteredMatches.map((match) => (
                <button
                  key={match.id}
                  type="button"
                  onClick={() => onSelectMatch(match)}
                  className="flex flex-col items-center gap-2 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl p-1 transition-colors duration-normal hover:bg-muted/50"
                >
                  <AvatarWithRing
                    showRing
                    ringVariant="coral"
                    src={getPhotoUrl(match.matched_profile?.avatar_url ?? null)}
                    fallback={displayName(match).slice(0, 2).toUpperCase()}
                    size="lg"
                  />
                  <span className="text-xs font-medium text-foreground truncate max-w-[72px]">
                    {displayName(match)}
                  </span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Conversation list – avatar | name + last message | time + read/unread */}
      <div className="divide-y divide-border">
        {filteredMatches.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {query ? t('chat.noResults', 'Inga träffar') : t('matches.noMatches')}
          </div>
        ) : (
          filteredMatches.map((match) => {
            const hasUnread = (match.unread_count ?? 0) > 0;
            const lastMsg = match.last_message;
            const chatStatus = !lastMsg
              ? ('start-chat' as const)
              : hasUnread
                ? ('your-turn' as const)
                : undefined;
            const timeLabel = lastMsg
              ? format(new Date(lastMsg.created_at), 'p', { locale: dateLocale })
              : '';
            const preview = lastMsg ? lastMsg.content : t('chat.chooseIcebreaker');
            return (
              <ChatListItemCard
                key={match.id}
                displayName={displayName(match)}
                lastMessagePreview={preview}
                timeLabel={timeLabel}
                status={chatStatus}
                avatarSrc={getPhotoUrl(match.matched_profile?.avatar_url ?? null)}
                avatarFallback={displayName(match).slice(0, 2).toUpperCase()}
                showRing={hasUnread}
                state={selectedMatchId === match.id ? 'active' : hasUnread ? 'unread' : 'idle'}
                verified={match.matched_profile?.id_verification_status === 'approved'}
                onClick={() => onSelectMatch(match)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
