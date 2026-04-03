import { useAchievementsRN } from "@/hooks/useAchievementsRN";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { achievements, earnedAchievements, loading, totalPoints } = useAchievementsRN();

  const total = achievements.length;
  const earned = earnedAchievements.length;
  const pct = total > 0 ? Math.round((earned / total) * 100) : 0;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.topTitle}>{t("achievements.title")}</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
        >
          <Ionicons name="close" size={28} color={maakTokens.primaryForeground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
          paddingBottom: insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadLeft}>
              <Ionicons name="trophy" size={22} color={maakTokens.primary} />
              <Text style={styles.cardTitle}>{t("achievements.title")}</Text>
            </View>
            <View style={styles.ptsPill}>
              <Text style={styles.ptsPillTxt}>
                {t("achievements.points_abbr", { count: totalPoints })}
              </Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressMeta}>
              {earned} / {total}
            </Text>
            <Text style={styles.progressMeta}>{pct}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={maakTokens.primary} style={{ marginTop: 24 }} />
        ) : (
          <View style={{ gap: 12, marginTop: 16 }}>
            {achievements.map((a) => {
              const isEarned = !!a.earned_at;
              return (
                <View
                  key={a.id}
                  style={[styles.achCard, isEarned && styles.achCardEarned]}
                >
                  <View style={[styles.achIcon, isEarned ? styles.achIconOn : styles.achIconOff]}>
                    {isEarned ? (
                      <Text style={styles.emoji}>{a.icon}</Text>
                    ) : (
                      <Ionicons name="lock-closed" size={20} color={maakTokens.mutedForeground} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.achName}>{a.name}</Text>
                    <Text style={styles.achDesc}>{a.description}</Text>
                  </View>
                  <View style={styles.achPts}>
                    <Text style={styles.achPtsTxt}>
                      {t("achievements.points_abbr", { count: a.points })}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    paddingVertical: 12,
    backgroundColor: maakTokens.foreground,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.primaryForeground,
  },
  card: {
    marginTop: 8,
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius3xl,
    padding: 18,
    borderWidth: 1,
    borderColor: maakTokens.border,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeadLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  ptsPill: {
    backgroundColor: maakTokens.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  ptsPillTxt: {
    color: maakTokens.primaryForeground,
    fontWeight: "700",
    fontSize: 13,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  progressMeta: { fontSize: 13, color: maakTokens.mutedForeground, fontWeight: "600" },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: maakTokens.muted,
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: maakTokens.primary,
    borderRadius: 3,
  },
  achCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: maakTokens.radius2xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    backgroundColor: maakTokens.card,
  },
  achCardEarned: {
    borderColor: `${maakTokens.primary}55`,
    backgroundColor: `${maakTokens.primary}10`,
  },
  achIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  achIconOn: { backgroundColor: maakTokens.primary },
  achIconOff: { backgroundColor: maakTokens.muted },
  emoji: { fontSize: 22 },
  achName: {
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  achDesc: {
    fontSize: 13,
    color: maakTokens.mutedForeground,
    marginTop: 4,
    lineHeight: 18,
  },
  achPts: {
    borderWidth: 1,
    borderColor: maakTokens.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  achPtsTxt: { fontSize: 12, fontWeight: "700", color: maakTokens.mutedForeground },
});
