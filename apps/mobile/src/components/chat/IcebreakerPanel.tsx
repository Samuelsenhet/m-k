import { useSupabase } from "@/contexts/SupabaseProvider";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  matchId: string;
  matchedUserId: string;
  onSelectSuggestion: (text: string) => void;
};

export function IcebreakerPanel({ matchId, matchedUserId, onSelectSuggestion }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { supabase } = useSupabase();

  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitHit, setLimitHit] = useState(false);
  const generatingRef = useRef(false);

  const generate = useCallback(async () => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setError(null);
    setSuggestions([]);
    setLoading(true);
    try {
      const {
        data: { session: s },
      } = await supabase.auth.getSession();
      if (!s?.access_token) {
        setError(t("matches.must_be_logged_in"));
        return;
      }
      const { data, error: fnError } = await supabase.functions.invoke("generate-icebreakers", {
        body: { matchId, matchedUserId, category: "general" },
        headers: { Authorization: `Bearer ${s.access_token}` },
      });
      if (fnError) throw fnError;
      const body = data as { error?: string; code?: string; icebreakers?: string[] };
      if (body?.code === "free_tier_ai_cap") {
        setLimitHit(true);
        setError(t("chat.icebreaker_limit_reached"));
        return;
      }
      if (body?.error) {
        setError(body.error);
        return;
      }
      if (Array.isArray(body?.icebreakers) && body.icebreakers.length > 0) {
        setSuggestions(body.icebreakers.slice(0, 3));
      } else {
        setError(t("chat.followup_error"));
      }
    } catch (e) {
      if (__DEV__) console.error("[IcebreakerPanel]", e);
      setError(t("chat.followup_error"));
    } finally {
      setLoading(false);
      generatingRef.current = false;
    }
  }, [matchId, matchedUserId, supabase, t]);

  return (
    <View style={styles.bar}>
      <Text style={styles.intro}>{t("maak_narrative_variants.icebreaker_intro")}</Text>
      <Pressable onPress={() => setOpen((o) => !o)} style={styles.toggle} accessibilityRole="button">
        <Text style={styles.toggleText}>
          {t("maak_narrative_variants.ai_suggestions_label")}
          {open ? " ▲" : " ▼"}
        </Text>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          <Pressable
            style={styles.genBtn}
            onPress={() => void generate()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={maakTokens.primary} size="small" />
            ) : (
              <Text style={styles.genTxt}>{t("chat.generate_new")}</Text>
            )}
          </Pressable>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {limitHit ? (
            <Pressable
              style={styles.upgradeBtn}
              onPress={() => router.push({ pathname: "/paywall" })}
            >
              <Text style={styles.upgradeTxt}>{t("chat.icebreaker_upgrade")}</Text>
            </Pressable>
          ) : null}
          {suggestions.map((line, idx) => (
            <Pressable
              key={`${matchId}-icebreaker-${idx}`}
              style={styles.chip}
              onPress={() => {
                onSelectSuggestion(line);
                setOpen(false);
              }}
            >
              <Text style={styles.chipText}>{line}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: maakTokens.border,
    backgroundColor: maakTokens.card,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  intro: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
    marginBottom: 8,
    textAlign: "center",
  },
  toggle: { paddingVertical: 6 },
  toggleText: { fontSize: 14, fontWeight: "600", color: maakTokens.primary },
  body: { paddingBottom: 8, gap: 8 },
  genBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: maakTokens.radiusMd,
    backgroundColor: `${maakTokens.primary}18`,
    borderWidth: 1,
    borderColor: `${maakTokens.primary}44`,
  },
  genTxt: { fontSize: 14, fontWeight: "600", color: maakTokens.primary },
  error: { fontSize: 13, color: maakTokens.destructive },
  upgradeBtn: {
    backgroundColor: maakTokens.primary,
    borderRadius: maakTokens.radiusMd,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  upgradeTxt: { color: maakTokens.primaryForeground, fontSize: 13, fontWeight: "600" },
  chip: {
    padding: 12,
    borderRadius: maakTokens.radiusLg,
    backgroundColor: maakTokens.muted,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  chipText: { fontSize: 15, lineHeight: 21, color: maakTokens.foreground },
});
