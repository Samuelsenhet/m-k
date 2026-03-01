import { Clock, Zap, Users, Sparkles, Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardV2, CardV2Content, MatchListItemCard } from "@/components/ui-v2";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { useEmotionalState } from "@/hooks/useEmotionalState";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import type { ArchetypeKey } from "@/components/ui-v2/badge/ArchetypeBadge";

export interface MatchForSuccess {
  id: string;
  matchedUser: {
    displayName: string;
    category?: string;
    archetype?: string;
    photos?: string[];
  };
  interests: string[];
  matchType: "similar" | "complementary";
  personalityInsight?: string | null;
  status: string;
}

function toArchetypeKey(category: string | undefined): ArchetypeKey {
  if (!category) return "diplomat";
  const key = category.toLowerCase();
  if (key === "diplomat" || key === "strateger" || key === "byggare" || key === "upptackare") return key as ArchetypeKey;
  return "diplomat";
}

/** Preview line: first common interest or personality insight (one line, truncated) */
function getPreviewText(match: MatchForSuccess): string {
  if (match.interests?.length > 0 && match.interests[0]) return match.interests[0];
  const insight = match.personalityInsight;
  if (typeof insight === "string" && insight.trim()) {
    const oneLine = insight.split(/[.\n]/)[0]?.trim() ?? "";
    return oneLine.slice(0, 60) + (oneLine.length > 60 ? "…" : "");
  }
  return "";
}

export interface MatchesSuccessStateProps {
  /** Pending matches (discovery list) */
  pendingMatches: MatchForSuccess[];
  /** Mutual matches (show at top with Chatta) */
  mutualMatches: MatchForSuccess[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onChat: (matchId: string) => void;
  onViewProfile: (matchId: string) => void;
  getPhotoUrl: (storagePath: string) => string;
  /** Optional: show demo link in header */
  isDemoEnabled?: boolean;
  /** Optional: render AI panel toggle and refresh in header */
  headerActions?: React.ReactNode;
  /** When true, do not render title/subtitle/actions (page uses PageHeader) */
  hideHeader?: boolean;
}

/**
 * MÄÄK Match list success state: calm, curated, no scores/timers.
 * Header, Insight card, filter tabs, list (MatchListItemCard V2), footer, mascot (small, corner).
 */
export function MatchesSuccessState({
  pendingMatches,
  mutualMatches,
  activeTab,
  onTabChange,
  onChat,
  onViewProfile,
  getPhotoUrl,
  isDemoEnabled = false,
  headerActions,
  hideHeader = false,
}: MatchesSuccessStateProps) {
  const { t } = useTranslation();
  const pending = pendingMatches ?? [];
  const mutual = mutualMatches ?? [];
  const hasMatches = pending.length > 0 || mutual.length > 0;
  const emotionalConfig = {
    screen: "matches" as const,
    hasMatches,
  };
  const { surfaceClass: emotionalSurfaceClass } = useEmotionalState(emotionalConfig);
  const mascot = useMascot(MASCOT_SCREEN_STATES.MATCHES_SUCCESS, { emotionalConfig });

  const similarMatches = pending.filter((m) => m.matchType === "similar");
  const complementaryMatches = pending.filter((m) => m.matchType === "complementary");
  const filteredPending =
    activeTab === "similar"
      ? similarMatches
      : activeTab === "complementary"
        ? complementaryMatches
        : pending;

  return (
    <div className="relative">
      {!hideHeader && (
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1 font-heading">
              {t("matches.title")}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {t("matches.subtitle")}
            </p>
          </div>
          {headerActions}
        </div>
      )}

      {/* Insight Card – CardV2 + emotional surface (curious) */}
      <div className="mb-6">
        <CardV2 variant="default" padding="default" className={emotionalSurfaceClass}>
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
                    {similarMatches.length} Likhets-match
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-coral/30 bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral">
                    <Sparkles className="w-3.5 h-3.5" />
                    {complementaryMatches.length} Motsats-match
                  </span>
                </div>
              </div>
            </div>
          </CardV2Content>
        </CardV2>
      </div>

      {/* Filter tabs – emotional labels */}
      <div className="mb-4">
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/50 p-1">
            <TabsTrigger value="all" className="rounded-full text-xs">
              Alla ({pendingMatches.length})
            </TabsTrigger>
            <TabsTrigger value="similar" className="rounded-full text-xs gap-1">
              <Users className="w-3 h-3" />
              Likhets-match ({similarMatches.length})
            </TabsTrigger>
            <TabsTrigger value="complementary" className="rounded-full text-xs gap-1">
              <Sparkles className="w-3 h-3" />
              Motsats-match ({complementaryMatches.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mutual matches – compact list with Chatta (Coral) */}
      {mutual.length > 0 && (
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
            Ömsesidiga matchningar ({mutualMatches.length})
          </h2>
          <div className="space-y-3">
            {mutualMatches.map((match) => {
              const archetypeKey = toArchetypeKey(match.matchedUser.category);
              const primaryPhoto = match.matchedUser.photos?.[0];
              const avatarSrc = primaryPhoto ? getPhotoUrl(primaryPhoto) : null;
              return (
                <MatchListItemCard
                  key={match.id}
                  displayName={match.matchedUser.displayName ?? "Anonym"}
                  archetype={archetypeKey}
                  previewText={getPreviewText(match)}
                  avatarSrc={avatarSrc}
                  avatarFallback={match.matchedUser.displayName?.slice(0, 2).toUpperCase() ?? "?"}
                  isNewToday={false}
                  relationshipLevel={3}
                  onChat={() => onChat(match.id)}
                />
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Pending matches list – MatchListItemCard V2 */}
      <div className="space-y-3 mb-8">
        {filteredPending.map((match, index) => {
          const archetypeKey = toArchetypeKey(match.matchedUser.category);
          const primaryPhoto = match.matchedUser.photos?.[0];
          const avatarSrc = primaryPhoto ? getPhotoUrl(primaryPhoto) : null;
          return (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <MatchListItemCard
                displayName={match.matchedUser.displayName ?? "Anonym"}
                archetype={archetypeKey}
                previewText={getPreviewText(match)}
                avatarSrc={avatarSrc}
                avatarFallback={match.matchedUser.displayName?.slice(0, 2).toUpperCase() ?? "?"}
                isNewToday
                relationshipLevel={1}
                onChat={() => onChat(match.id)}
                onViewProfile={() => onViewProfile(match.id)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Footer – rhythm text */}
      <p className="text-center text-sm text-muted-foreground py-4">
        Nya matchningar kommer i morgon.
      </p>

      {mascot.shouldShow && <Mascot {...mascot} className="opacity-90" />}
    </div>
  );
}
