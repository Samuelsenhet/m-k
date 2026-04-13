import { useSupabase } from "@/contexts/SupabaseProvider";
import { useHostProfile } from "@/hooks/useHostProfile";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Träffar - public IRL events feed for the Värdar (Hosts) program.
 *
 * Flow:
 *   1. Load all open/confirmed träffar starting in the future, with their
 *      current rsvp count from the träff_rsvp_counts view
 *   2. Load which träffar the current user has already rsvped to
 *   3. Render a feed with RSVP / Cancel buttons that call the traff-rsvp
 *      edge function
 *
 * Host profile state is surfaced at the top if the user is pending/active/
 * paused - mostly as a signal that MÄÄK sees them as a Värd candidate.
 */

type Träff = {
  id: string;
  host_user_id: string;
  title: string;
  description: string;
  location_label: string;
  location_city: string;
  starts_at: string;
  duration_minutes: number;
  max_attendees: number;
  min_confirm_attendees: number;
  personality_theme: string | null;
  status: "open" | "confirmed" | string;
  rsvp_count: number;
  user_rsvped: boolean;
};

export default function TraffarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { supabase, session } = useSupabase();
  const host = useHostProfile();

  const [träffar, setTräffar] = useState<Träff[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyTräffId, setBusyTräffId] = useState<string | null>(null);

  const fetchTräffar = useCallback(async () => {
    const userId = session?.user?.id;
    try {
      // 1. Base list of future open/confirmed träffar.
      const { data: rows, error: listError } = await supabase
        .from("träffar")
        .select(
          "id, host_user_id, title, description, location_label, location_city, starts_at, duration_minutes, max_attendees, min_confirm_attendees, personality_theme, status",
        )
        .in("status", ["open", "confirmed"])
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true });
      if (listError) throw listError;
      const list = (rows ?? []) as Omit<Träff, "rsvp_count" | "user_rsvped">[];

      if (list.length === 0) {
        setTräffar([]);
        return;
      }

      const ids = list.map((t) => t.id);

      // 2. Join RSVP counts via the aggregated view. We use "*" here
      // because the Supabase TS select parser chokes on the unicode `ä`
      // in "träff_id, rsvp_count". Cast the result once at the boundary.
      const { data: countRowsRaw } = await supabase
        .from("träff_rsvp_counts")
        .select("*")
        .in("träff_id", ids);
      const countRows = (countRowsRaw ?? []) as unknown as Array<{
        träff_id: string;
        rsvp_count: number | null;
      }>;
      const countMap = new Map<string, number>();
      for (const row of countRows) {
        countMap.set(row.träff_id, Number(row.rsvp_count ?? 0));
      }

      // 3. My own RSVPs (only the träffar shown). Same "*" trick for the
      // ä in the column name - select-string parser can't handle it.
      const rsvpedSet = new Set<string>();
      if (userId) {
        const { data: myRsvpsRaw } = await supabase
          .from("träff_rsvps")
          .select("*")
          .eq("user_id", userId)
          .in("träff_id", ids);
        const myRsvps = (myRsvpsRaw ?? []) as unknown as Array<{
          träff_id: string;
        }>;
        for (const r of myRsvps) {
          rsvpedSet.add(r.träff_id);
        }
      }

      setTräffar(
        list.map((t) => ({
          ...t,
          rsvp_count: countMap.get(t.id) ?? 0,
          user_rsvped: rsvpedSet.has(t.id),
        })),
      );
    } catch (err) {
      if (__DEV__) console.error("[träffar] fetch error:", err);
      setTräffar([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase, session?.user?.id]);

  useEffect(() => {
    void fetchTräffar();
  }, [fetchTräffar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchTräffar();
  }, [fetchTräffar]);

  const callRsvp = useCallback(
    async (träffId: string, action: "rsvp" | "cancel") => {
      setBusyTräffId(träffId);
      try {
        const sess = (await supabase.auth.getSession()).data.session;
        if (!sess?.access_token) {
          Alert.alert(
            t("common.error", { defaultValue: "Fel" }),
            t("traffar.error_not_logged_in", {
              defaultValue: "Du behöver vara inloggad.",
            }),
          );
          return;
        }
        const { data, error: fnError } = await supabase.functions.invoke(
          "traff-rsvp",
          {
            body: { träff_id: träffId, action },
            headers: { Authorization: `Bearer ${sess.access_token}` },
          },
        );
        if (fnError) throw fnError;
        if (data && typeof data === "object" && "error" in data) {
          throw new Error(String((data as { error: string }).error));
        }
        await fetchTräffar();
      } catch (err) {
        if (__DEV__) console.error("[träffar] rsvp error:", err);
        Alert.alert(
          t("common.error", { defaultValue: "Fel" }),
          action === "rsvp"
            ? t("traffar.error_rsvp", {
                defaultValue: "Kunde inte anmäla dig. Försök igen.",
              })
            : t("traffar.error_cancel", {
                defaultValue: "Kunde inte avboka. Försök igen.",
              }),
        );
      } finally {
        setBusyTräffId(null);
      }
    },
    [supabase, fetchTräffar, t],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.close", { defaultValue: "Stäng" })}
        >
          <Ionicons name="arrow-back" size={26} color={maakTokens.foreground} />
        </Pressable>
        <Text style={styles.topTitle}>
          {t("traffar.title", { defaultValue: "Träffar" })}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            {t("traffar.hero_title_real", {
              defaultValue: "Riktiga möten, nära dig.",
            })}
          </Text>
          <Text style={styles.heroBody}>
            {t("traffar.hero_body_real", {
              defaultValue:
                "Värdar skapar små IRL-event. Anmäl dig, dyk upp, träffas.",
            })}
          </Text>
        </View>

        {host.isActive && (
          <Pressable
            onPress={() =>
              router.push("/träffar/create" as unknown as "/")
            }
            style={styles.hostCard}
            accessibilityRole="button"
            accessibilityLabel={t("traffar.create_button_a11y", {
              defaultValue: "Skapa en ny Träff",
            })}
          >
            <Ionicons name="add-circle" size={22} color={maakTokens.primary} />
            <Text style={styles.hostCardText}>
              {t("traffar.create_button", {
                defaultValue: "Du är Värd - skapa en Träff",
              })}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={maakTokens.primary}
            />
          </Pressable>
        )}
        {host.isPending && (
          <View style={styles.hostCard}>
            <Ionicons name="time" size={18} color={maakTokens.primary} />
            <Text style={styles.hostCardText}>
              {t("traffar.you_are_pending", {
                defaultValue:
                  "Vi har sett din aktivitet. Du är nominerad som Värd - vi hör av oss.",
              })}
            </Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={maakTokens.primary} />
          </View>
        ) : träffar.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={maakTokens.mutedForeground}
            />
            <Text style={styles.emptyTitle}>
              {t("traffar.empty_title", {
                defaultValue: "Inga Träffar just nu",
              })}
            </Text>
            <Text style={styles.emptyBody}>
              {t("traffar.empty_body_real", {
                defaultValue:
                  "Värdar skapar nya event varje vecka. Kolla tillbaka eller dra ner för att uppdatera.",
              })}
            </Text>
          </View>
        ) : (
          träffar.map((t2) => (
            <TräffCard
              key={t2.id}
              träff={t2}
              busy={busyTräffId === t2.id}
              onRsvp={() => callRsvp(t2.id, "rsvp")}
              onCancel={() => callRsvp(t2.id, "cancel")}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function TräffCard({
  träff,
  busy,
  onRsvp,
  onCancel,
}: {
  träff: Träff;
  busy: boolean;
  onRsvp: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const startsAt = new Date(träff.starts_at);
  const dateLabel = startsAt.toLocaleDateString("sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeLabel = startsAt.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const full = träff.rsvp_count >= träff.max_attendees;
  const confirmed = träff.status === "confirmed";

  return (
    <View style={styles.träffCard}>
      <View style={styles.träffHeader}>
        <View style={styles.träffDateBlock}>
          <Text style={styles.träffDate}>{dateLabel}</Text>
          <Text style={styles.träffTime}>{timeLabel}</Text>
        </View>
        {confirmed && (
          <View style={styles.confirmedPill}>
            <Ionicons name="checkmark-circle" size={12} color={maakTokens.primary} />
            <Text style={styles.confirmedText}>
              {t("traffar.confirmed", { defaultValue: "Bekräftad" })}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.träffTitle}>{träff.title}</Text>
      <Text style={styles.träffLocation}>{träff.location_label}</Text>
      <Text style={styles.träffDescription} numberOfLines={3}>
        {träff.description}
      </Text>
      <View style={styles.träffFooter}>
        <Text style={styles.träffCount}>
          {träff.rsvp_count} / {träff.max_attendees}{" "}
          {t("traffar.going", { defaultValue: "anmälda" })}
        </Text>
        {träff.user_rsvped ? (
          <Pressable
            onPress={onCancel}
            disabled={busy}
            style={[styles.rsvpButton, styles.rsvpButtonCancel]}
          >
            {busy ? (
              <ActivityIndicator size="small" color={maakTokens.primary} />
            ) : (
              <Text style={styles.rsvpCancelLabel}>
                {t("traffar.cancel_rsvp", { defaultValue: "Avboka" })}
              </Text>
            )}
          </Pressable>
        ) : full ? (
          <View style={[styles.rsvpButton, styles.rsvpButtonFull]}>
            <Text style={styles.rsvpFullLabel}>
              {t("traffar.full", { defaultValue: "Fullt" })}
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onRsvp}
            disabled={busy}
            style={[styles.rsvpButton, styles.rsvpButtonActive]}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.rsvpLabel}>
                {t("traffar.rsvp", { defaultValue: "Anmäl mig" })}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topTitle: { fontSize: 17, fontWeight: "700", color: maakTokens.foreground },
  hero: { paddingTop: 16, paddingBottom: 8 },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 34,
    color: maakTokens.foreground,
    letterSpacing: -0.4,
  },
  heroBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#D9EDE4",
    borderWidth: 1,
    borderColor: "rgba(75, 110, 72, 0.2)",
  },
  hostCardText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: maakTokens.primary,
    lineHeight: 18,
  },
  loadingWrap: { padding: 40, alignItems: "center" },
  emptyCard: {
    marginTop: 24,
    padding: 28,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: maakTokens.mutedForeground,
  },
  träffCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
  },
  träffHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  träffDateBlock: { flexDirection: "row", alignItems: "center", gap: 8 },
  träffDate: {
    fontSize: 13,
    fontWeight: "700",
    color: maakTokens.primary,
    textTransform: "capitalize",
  },
  träffTime: {
    fontSize: 13,
    fontWeight: "600",
    color: maakTokens.mutedForeground,
  },
  confirmedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#D9EDE4",
  },
  confirmedText: {
    fontSize: 11,
    fontWeight: "700",
    color: maakTokens.primary,
  },
  träffTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginTop: 2,
  },
  träffLocation: {
    fontSize: 13,
    color: maakTokens.mutedForeground,
    marginTop: 2,
  },
  träffDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.foreground,
    marginTop: 10,
  },
  träffFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
  },
  träffCount: {
    fontSize: 12,
    fontWeight: "600",
    color: maakTokens.mutedForeground,
  },
  rsvpButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  rsvpButtonActive: { backgroundColor: maakTokens.primary },
  rsvpButtonCancel: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: maakTokens.primary,
  },
  rsvpButtonFull: { backgroundColor: "#EBEAE8" },
  rsvpLabel: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  rsvpCancelLabel: {
    color: maakTokens.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  rsvpFullLabel: {
    color: maakTokens.mutedForeground,
    fontSize: 13,
    fontWeight: "700",
  },
});
