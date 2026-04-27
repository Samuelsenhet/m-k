import { Emoji } from "@/components/Emoji";
import {
  ARCHETYPE_INFO,
  CATEGORY_INFO,
  maakTokens,
  type ArchetypeCode,
  type PersonalityTestResult,
} from "@maak/core";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORY_COLORS: Record<string, string> = {
  DIPLOMAT: "#7C3AED",
  STRATEGER: "#2563EB",
  BYGGARE: "#16A34A",
  UPPTÄCKARE: "#D97706",
};

type Props = {
  result: PersonalityTestResult;
  onContinue: () => void;
};

export function PersonalityResultRN({ result, onContinue }: Props) {
  const { t } = useTranslation();
  const info = ARCHETYPE_INFO[result.archetype];
  const code = result.archetype as ArchetypeCode;
  const category = result.category;
  const categoryInfo = CATEGORY_INFO[category];
  const categoryColor = CATEGORY_COLORS[category] ?? maakTokens.primary;

  const title = t(`personality.archetypes.${code}.title`, { defaultValue: info.title });
  const description = t(`personality.archetypes.${code}.description`, {
    defaultValue: info.description,
  });
  const strengthsRaw = t(`personality.archetypes.${code}.strengths`, {
    returnObjects: true,
  });
  const strengths = Array.isArray(strengthsRaw)
    ? (strengthsRaw as string[])
    : info.strengths;
  const loveStyle = t(`personality.archetypes.${code}.loveStyle`, {
    defaultValue: info.loveStyle,
  });

  const categoryTitle = t(`personality.categories.${category}.title`, {
    defaultValue: categoryInfo.title,
  });
  const categoryDesc = t(`personality.categories.${category}.description`, {
    defaultValue: categoryInfo.description,
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}18` }]}>
          <Emoji style={styles.categoryEmoji}>{categoryInfo.emoji}</Emoji>
          <Text style={[styles.categoryLabel, { color: categoryColor }]}>{categoryTitle}</Text>
        </View>

        <Emoji style={styles.emoji}>{info.emoji}</Emoji>
        <Text style={styles.archetype}>{info.name}</Text>
        <Text style={styles.subtitle}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>

        <View style={[styles.categoryCard, { borderColor: `${categoryColor}33` }]}>
          <Text style={[styles.categoryCardTitle, { color: categoryColor }]}>
            {categoryTitle}
          </Text>
          <Text style={styles.categoryCardDesc}>{categoryDesc}</Text>
        </View>

        <Text style={styles.loveStyle}>
          <Text style={styles.loveStyleLead}>{t("profile.in_relationships_label")}</Text>
          {loveStyle}
        </Text>

        <View style={styles.tags}>
          {strengths.map((s, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.btn} onPress={onContinue}>
          <Text style={styles.btnText}>{t("mobile.wizard.continue")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: maakTokens.background },
  scroll: { padding: 24, alignItems: "center" },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  categoryEmoji: { fontSize: 20 },
  categoryLabel: { fontSize: 14, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  emoji: { fontSize: 56, marginBottom: 12 },
  archetype: { fontSize: 28, fontWeight: "700", color: maakTokens.foreground },
  subtitle: { fontSize: 16, color: maakTokens.primary, fontWeight: "600", marginTop: 4 },
  desc: {
    fontSize: 15,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  categoryCard: {
    marginTop: 20,
    width: "100%",
    backgroundColor: maakTokens.card,
    borderRadius: maakTokens.radiusXl,
    borderWidth: 1,
    padding: 18,
  },
  categoryCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  categoryCardDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: maakTokens.mutedForeground,
    textAlign: "center",
  },
  loveStyle: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 18,
    lineHeight: 21,
    paddingHorizontal: 8,
  },
  loveStyleLead: { fontWeight: "600", color: maakTokens.foreground },
  tags: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 20 },
  tag: {
    backgroundColor: `${maakTokens.primary}18`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  tagText: { fontSize: 13, color: maakTokens.primary, fontWeight: "500" },
  btn: {
    marginTop: 28,
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: maakTokens.radiusLg,
    alignSelf: "stretch",
    alignItems: "center",
  },
  btnText: { color: maakTokens.primaryForeground, fontSize: 16, fontWeight: "600" },
});
