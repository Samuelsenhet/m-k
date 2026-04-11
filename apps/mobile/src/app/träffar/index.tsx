import { useHostProfile } from "@/hooks/useHostProfile";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Träffar — public IRL events feed. Värd-program scaffolding.
 *
 * This is a placeholder "coming soon" state. When the program launches
 * post-App-Store-release we'll wire up the supabase query against the
 * träffar table (see supabase/migrations/20260411180000_vardar_foundations.sql
 * and docs/VARDAR.md).
 *
 * For now the screen:
 *   - Renders a hero + explanation of what Träffar will be
 *   - Shows the current user's host status if they have one
 *   - Surfaces a "Skapa träff" action for active hosts (still a no-op)
 *
 * We ship this screen in Fas 2 so links from Profile → Träffar work
 * and users see that something is planned.
 */
export default function TraffarScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const host = useHostProfile();

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
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>
              {t("traffar.eyebrow", { defaultValue: "Kommer snart" })}
            </Text>
          </View>
          <Text style={styles.heroTitle}>
            {t("traffar.hero_title", {
              defaultValue: "Riktiga möten. I din stad.",
            })}
          </Text>
          <Text style={styles.heroBody}>
            {t("traffar.hero_body", {
              defaultValue:
                "Träffar är små IRL-event arrangerade av Värdar – personer som gör mer än att matcha. Brunch, afterwork, promenader. Anmäl dig, dyk upp, träffas.",
            })}
          </Text>
        </View>

        {/* Host status pill */}
        {host.isActive && (
          <View style={styles.hostCard}>
            <Ionicons name="star" size={18} color={maakTokens.primary} />
            <Text style={styles.hostCardText}>
              {t("traffar.you_are_host", {
                defaultValue: "Du är Värd. Du kan skapa Träffar.",
              })}
            </Text>
          </View>
        )}
        {host.isPending && (
          <View style={styles.hostCard}>
            <Ionicons name="time" size={18} color={maakTokens.primary} />
            <Text style={styles.hostCardText}>
              {t("traffar.you_are_pending", {
                defaultValue:
                  "Vi har sett din aktivitet. Du är nominerad som Värd — vi hör av oss.",
              })}
            </Text>
          </View>
        )}
        {host.isPaused && (
          <View style={styles.hostCard}>
            <Ionicons name="pause-circle" size={18} color={maakTokens.mutedForeground} />
            <Text style={styles.hostCardText}>
              {t("traffar.you_are_paused", {
                defaultValue:
                  "Din Värd-status är pausad. Skapa en ny Samling eller Träff för att aktivera igen.",
              })}
            </Text>
          </View>
        )}

        {/* Coming soon empty state */}
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-outline" size={48} color={maakTokens.mutedForeground} />
          <Text style={styles.emptyTitle}>
            {t("traffar.empty_title", {
              defaultValue: "Inga Träffar än",
            })}
          </Text>
          <Text style={styles.emptyBody}>
            {t("traffar.empty_body", {
              defaultValue:
                "Programmet lanseras efter att MÄÄK öppnat på App Store. När det händer dyker event upp här — sorterade på din stad och personlighetstema.",
            })}
          </Text>
        </View>

        {/* Info section */}
        <View style={styles.infoSection}>
          <Text style={styles.infoHeading}>
            {t("traffar.info_heading", { defaultValue: "Så fungerar det" })}
          </Text>
          <InfoRow
            icon="calendar"
            title={t("traffar.info_create_title", {
              defaultValue: "Värdar skapar Träffar",
            })}
            body={t("traffar.info_create_body", {
              defaultValue:
                "Tid, plats, max antal deltagare. Träffen publiceras i din stad.",
            })}
          />
          <InfoRow
            icon="checkmark-circle"
            title={t("traffar.info_rsvp_title", {
              defaultValue: "Du anmäler dig",
            })}
            body={t("traffar.info_rsvp_body", {
              defaultValue:
                "När 4+ personer har anmält sig bekräftas Träffen och du får en påminnelse.",
            })}
          />
          <InfoRow
            icon="people"
            title={t("traffar.info_meet_title", {
              defaultValue: "Ni träffas på riktigt",
            })}
            body={t("traffar.info_meet_body", {
              defaultValue:
                "Ingen gruppchatt mellan anmälan och eventet — bara själva mötet. Efteråt kan du matcha med de du gillade.",
            })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: "calendar" | "checkmark-circle" | "people";
  title: string;
  body: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={20} color={maakTokens.primary} />
      </View>
      <View style={styles.infoRowText}>
        <Text style={styles.infoRowTitle}>{title}</Text>
        <Text style={styles.infoRowBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: maakTokens.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  hero: {
    paddingTop: 24,
    paddingBottom: 12,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.08)",
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F97068",
  },
  eyebrowText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: maakTokens.primary,
    textTransform: "uppercase",
  },
  heroTitle: {
    marginTop: 14,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
    color: maakTokens.foreground,
    letterSpacing: -0.5,
  },
  heroBody: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.mutedForeground,
  },
  hostCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
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
  infoSection: {
    marginTop: 32,
  },
  infoHeading: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: maakTokens.mutedForeground,
    marginBottom: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(37, 61, 44, 0.06)",
    marginBottom: 10,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#D9EDE4",
    justifyContent: "center",
    alignItems: "center",
  },
  infoRowText: {
    flex: 1,
  },
  infoRowTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  infoRowBody: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: maakTokens.mutedForeground,
  },
});
