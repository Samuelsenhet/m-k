import { Emoji } from "@/components/Emoji";
import { maakTokens } from "@maak/core";
import {
  ARCHETYPE_CODES_BY_CATEGORY,
  ARCHETYPE_INFO,
  CATEGORY_INFO,
  DIMENSION_LABELS,
  type ArchetypeCode,
  type DimensionKey,
  type PersonalityCategory,
} from "@maak/core";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CATEGORY_ORDER: PersonalityCategory[] = [
  "DIPLOMAT",
  "STRATEGER",
  "BYGGARE",
  "UPPTÄCKARE",
];

const CATEGORY_BORDER: Record<PersonalityCategory, string> = {
  DIPLOMAT: "#A78BFA",
  STRATEGER: "#60A5FA",
  BYGGARE: "#4ADE80",
  UPPTÄCKARE: "#FBBF24",
};

export function PersonalityGuideRN() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const toggle = (code: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [code]: !prev[code] }));
  };

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
        <Text style={styles.headerTitle}>{t("personality_guide.title")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: maakTokens.screenPaddingHorizontal,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator
      >
        <View style={styles.introBlock}>
          <Text style={styles.introTitle}>{t("personality_guide.learn_title")}</Text>
          <Text style={styles.introP}>{t("personality_guide.intro")}</Text>
          <View style={{ gap: 8, marginTop: 8 }}>
            <Text style={styles.bullet}>
              <Text style={styles.bulletNum}>1.</Text>{" "}
              {t("personality.main_category_label")} - {t("personality.main_category_sub")}
            </Text>
            <Text style={styles.bullet}>
              <Text style={styles.bulletNum}>2.</Text>{" "}
              {t("personality.four_archetypes_label")} - {t("personality.four_archetypes_sub")}
            </Text>
          </View>
        </View>

        {CATEGORY_ORDER.map((categoryKey) => {
          const category = CATEGORY_INFO[categoryKey];
          const codes = ARCHETYPE_CODES_BY_CATEGORY[categoryKey];
          const border = CATEGORY_BORDER[categoryKey];
          const catTitle = t(`personality.guide_category_${categoryKey}_title`, {
            defaultValue: category.title,
          });
          const catDesc = t(`personality.guide_category_${categoryKey}_desc`, {
            defaultValue: category.description,
          });

          return (
            <View
              key={categoryKey}
              style={[styles.catCard, { borderColor: border }]}
            >
              <View style={styles.catHead}>
                <Emoji style={styles.catEmoji}>{category.emoji}</Emoji>
                <Text style={styles.catTitle}>{catTitle}</Text>
              </View>
              <Text style={styles.catDesc}>{catDesc}</Text>

              {codes.map((code) => {
                const info = ARCHETYPE_INFO[code as ArchetypeCode];
                const expanded = !!open[code];
                const archTitle = t(`personality.archetypes.${code}.title`, {
                  defaultValue: info.title,
                });
                const archDesc = t(`personality.archetypes.${code}.description`, {
                  defaultValue: info.description,
                });
                const strengthsRaw = t(`personality.archetypes.${code}.strengths`, {
                  returnObjects: true,
                });
                const archStrengths = Array.isArray(strengthsRaw)
                  ? (strengthsRaw as string[])
                  : info.strengths;
                const archLoveStyle = t(`personality.archetypes.${code}.loveStyle`, {
                  defaultValue: info.loveStyle,
                });
                return (
                  <View key={code} style={styles.archWrap}>
                    <Pressable
                      style={[styles.archRow, { borderColor: border }]}
                      onPress={() => toggle(code)}
                    >
                      <Emoji style={styles.archEmoji}>{info.emoji}</Emoji>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.archTitle}>{archTitle}</Text>
                        <Text style={styles.archCode}>{info.name}</Text>
                      </View>
                      <Ionicons
                        name={expanded ? "chevron-up" : "chevron-down"}
                        size={22}
                        color={border}
                      />
                    </Pressable>
                    {expanded ? (
                      <View style={[styles.archBody, { borderLeftColor: border }]}>
                        <Text style={styles.sectionLabel}>{t("personality.overview")}</Text>
                        <Text style={styles.bodyTxt}>{archDesc}</Text>
                        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                          {t("personality.strengths")}
                        </Text>
                        {archStrengths.map((s, i) => (
                          <Text key={i} style={styles.li}>
                            ● {s}
                          </Text>
                        ))}
                        <Text style={[styles.sectionLabel, { marginTop: 12 }]}>
                          {t("personality_guide.in_relationships")}
                        </Text>
                        <Text style={styles.bodyTxt}>{archLoveStyle}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={styles.abbrevCard}>
          <Text style={styles.abbrevTitle}>{t("personality_guide.abbreviations_title")}</Text>
          <Text style={styles.abbrevIntro}>{t("personality_guide.abbreviations_intro")}</Text>
          {(["ei", "sn", "tf", "jp"] as DimensionKey[]).map((dim) => {
            const labels = DIMENSION_LABELS[dim];
            const leftLetter = dim === "ei" ? "I" : dim === "sn" ? "S" : dim === "tf" ? "T" : "J";
            const rightLetter = dim === "ei" ? "E" : dim === "sn" ? "N" : dim === "tf" ? "F" : "P";
            const leftLabel = t(`personality.dimensions.${dim}.left`, { defaultValue: labels.left });
            const rightLabel = t(`personality.dimensions.${dim}.right`, {
              defaultValue: labels.right,
            });
            return (
              <View key={dim} style={styles.dimRow}>
                <View style={styles.dimPair}>
                  <Text style={styles.mono}>{leftLetter}</Text>
                  <Text style={styles.dimTxt}>{leftLabel}</Text>
                </View>
                <View style={styles.dimPair}>
                  <Text style={styles.mono}>{rightLetter}</Text>
                  <Text style={styles.dimTxt}>{rightLabel}</Text>
                </View>
              </View>
            );
          })}
          <Text style={styles.exampleNote}>{t("personality_guide.example_code")}</Text>
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
    backgroundColor: maakTokens.background,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
  },
  introBlock: { paddingTop: 20, paddingBottom: 8 },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.foreground,
    marginBottom: 10,
  },
  introP: {
    fontSize: 14,
    lineHeight: 21,
    color: maakTokens.mutedForeground,
  },
  bullet: { fontSize: 14, lineHeight: 20, color: maakTokens.mutedForeground },
  bulletNum: { fontWeight: "700", color: maakTokens.foreground },
  catCard: {
    marginTop: 20,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1.5,
    padding: 16,
    backgroundColor: maakTokens.card,
  },
  catHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  catEmoji: { fontSize: 22,  },
  catTitle: { fontSize: 18, fontWeight: "700", color: maakTokens.foreground },
  catDesc: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
    marginBottom: 12,
  },
  archWrap: { marginBottom: 8 },
  archRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
    backgroundColor: maakTokens.muted,
  },
  archEmoji: { fontSize: 22,  },
  archTitle: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground },
  archCode: { fontSize: 12, color: maakTokens.mutedForeground, marginTop: 2 },
  archBody: {
    marginTop: 8,
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    paddingVertical: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: maakTokens.mutedForeground,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  bodyTxt: { fontSize: 14, lineHeight: 20, color: maakTokens.foreground },
  li: { fontSize: 14, lineHeight: 22, color: maakTokens.foreground },
  abbrevCard: {
    marginTop: 24,
    marginBottom: 8,
    borderRadius: maakTokens.radius3xl,
    borderWidth: 1,
    borderColor: maakTokens.border,
    padding: 18,
    backgroundColor: maakTokens.card,
  },
  abbrevTitle: { fontSize: 16, fontWeight: "700", color: maakTokens.foreground, marginBottom: 8 },
  abbrevIntro: { fontSize: 14, color: maakTokens.mutedForeground, marginBottom: 12 },
  dimRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: maakTokens.border,
  },
  dimPair: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    columnGap: 8,
  },
  mono: {
    fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
    fontWeight: "700",
    width: 18,
    color: maakTokens.foreground,
  },
  dimTxt: { fontSize: 13, color: maakTokens.mutedForeground, flexShrink: 1 },
  exampleNote: { fontSize: 12, color: maakTokens.mutedForeground, marginTop: 12 },
});
