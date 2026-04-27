import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const PHILOSOPHY_KEYS = Array.from({ length: 16 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return `maak_moment_of_depth.lines_${n}` as const;
});

const EMPHASIS_LINES = [4, 10, 15];

export default function AboutScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("common.back")}
        >
          <Ionicons name="chevron-back" size={28} color={maakTokens.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>{t("about.title")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
          paddingBottom: insets.bottom + 32,
          paddingTop: 20,
        }}
      >
        <View style={styles.card}>
          <Image
            source={MascotAssets.onboarding}
            style={styles.mascot}
            resizeMode="contain"
          />
          <Text style={styles.cardTitle}>{t("about.about_maak")}</Text>
          <Text style={styles.p}>{t("about.intro")}</Text>
        </View>

        <View style={styles.philosophyCard}>
          <Text style={styles.philosophyHeading}>{t("about.philosophy_title", { defaultValue: "Vår filosofi" })}</Text>
          {PHILOSOPHY_KEYS.map((key, i) => (
            <Text
              key={key}
              style={[
                styles.philosophyLine,
                EMPHASIS_LINES.includes(i) && styles.philosophyEmphasis,
              ]}
            >
              {t(key)}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("maak_matching_story.title")}</Text>
          <Text style={styles.p}>{t("maak_matching_story.body_1")}</Text>
          <Text style={styles.p}>{t("maak_matching_story.body_2")}</Text>
          <Text style={styles.p}>{t("maak_matching_story.body_3")}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: maakTokens.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: maakTokens.screenPaddingHorizontal,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  mascot: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 16,
  },
  card: {
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 14,
    textAlign: "center",
  },
  p: {
    fontSize: 15,
    lineHeight: 23,
    color: maakTokens.mutedForeground,
    marginBottom: 14,
    textAlign: "center",
  },
  philosophyCard: {
    backgroundColor: `${maakTokens.primary}08`,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: `${maakTokens.primary}22`,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  philosophyHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: maakTokens.primary,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 20,
  },
  philosophyLine: {
    fontSize: 16,
    lineHeight: 25,
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 6,
    fontStyle: "italic",
  },
  philosophyEmphasis: {
    fontWeight: "700",
    fontStyle: "normal",
    color: maakTokens.primary,
    fontSize: 17,
    marginBottom: 10,
  },
});
