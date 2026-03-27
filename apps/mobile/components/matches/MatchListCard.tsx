import type { Match } from "@/hooks/useMatches";
import { archetypeDisplayTitle } from "@/lib/archetypeTitle";
import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

function previewText(match: Match): string {
  const insight = match.personalityInsight;
  if (typeof insight === "string" && insight.trim()) {
    const oneLine = insight.split(/[.\n]/)[0]?.trim() ?? "";
    return oneLine.slice(0, 72) + (oneLine.length > 72 ? "…" : "");
  }
  if (match.interests?.length && match.interests[0]) return match.interests[0];
  return "";
}

function resolveAvatarUri(
  photos: string[] | undefined,
  getPublicUrl: (path: string) => string,
): string | null {
  const p = photos?.[0];
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  return getPublicUrl(p);
}

type Props = {
  match: Match;
  getPublicUrl: (path: string) => string;
  onChat: () => void;
  onViewProfile: () => void;
  mutual?: boolean;
};

export function MatchListCard({
  match,
  getPublicUrl,
  onChat,
  onViewProfile,
  mutual = false,
}: Props) {
  const { t } = useTranslation();
  const uri = resolveAvatarUri(match.matchedUser.photos, getPublicUrl);
  const initials = (match.matchedUser.displayName ?? "?").slice(0, 2).toUpperCase();
  const preview = previewText(match);
  const typeLabel =
    match.matchType === "similar" ? t("matches.similar") : t("matches.complementary");
  const archLabel = archetypeDisplayTitle(match.matchedUser.archetype ?? null, t);

  return (
    <View style={[styles.card, mutual && styles.cardMutual]}>
      <View style={styles.row}>
        {uri ? (
          <Image source={{ uri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.name}>{match.matchedUser.displayName ?? t("matches.anonymous")}</Text>
          <Text style={styles.badge}>
            {archLabel ?? "—"} · {typeLabel} ·{" "}
            {Math.round(match.matchScore)}%
          </Text>
          {preview ? <Text style={styles.preview} numberOfLines={2}>{preview}</Text> : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={onViewProfile}>
          <Text style={styles.secondaryText}>{t("nav.profile")}</Text>
        </Pressable>
        <Pressable style={[styles.primaryBtn, mutual && styles.primaryBtnMutual]} onPress={onChat}>
          <Text style={styles.primaryText}>{t("matches.open_chat")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    padding: 14,
    borderWidth: 1,
    borderColor: maakTokens.border,
    gap: 12,
  },
  cardMutual: { borderColor: `${maakTokens.coral}66` },
  row: { flexDirection: "row", gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 14 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: maakTokens.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: maakTokens.primary },
  meta: { flex: 1, minWidth: 0 },
  name: { fontSize: 17, fontWeight: "700", color: maakTokens.foreground },
  badge: { fontSize: 12, color: maakTokens.mutedForeground, marginTop: 2 },
  preview: { fontSize: 13, color: maakTokens.mutedForeground, marginTop: 6, lineHeight: 18 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: maakTokens.radiusMd,
    borderWidth: 1,
    borderColor: maakTokens.primary,
  },
  secondaryText: { fontSize: 14, fontWeight: "600", color: maakTokens.primary },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: maakTokens.primary,
  },
  primaryBtnMutual: { backgroundColor: maakTokens.coral },
  primaryText: { fontSize: 14, fontWeight: "600", color: maakTokens.primaryForeground },
});
