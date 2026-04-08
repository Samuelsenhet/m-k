import { Emoji } from "@/components/Emoji";
import {
  ARCHETYPE_INFO,
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

type Props = {
  result: PersonalityTestResult;
  onContinue: () => void;
};

export function PersonalityResultRN({ result, onContinue }: Props) {
  const { t } = useTranslation();
  const info = ARCHETYPE_INFO[result.archetype];
  const code = result.archetype as ArchetypeCode;

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

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Emoji style={styles.emoji}>{info.emoji}</Emoji>
        <Text style={styles.title}>{info.name}</Text>
        <Text style={styles.subtitle}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
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
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "700", color: maakTokens.foreground },
  subtitle: { fontSize: 16, color: maakTokens.primary, fontWeight: "600", marginTop: 4 },
  desc: {
    fontSize: 15,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  loveStyle: {
    fontSize: 14,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginTop: 14,
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
