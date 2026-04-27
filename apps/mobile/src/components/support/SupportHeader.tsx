import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
};

export function SupportHeader({ title }: Props) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t("common.back")}
      >
        <Ionicons name="chevron-back" size={28} color={maakTokens.foreground} />
      </Pressable>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <View style={{ width: 28 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: maakTokens.foreground,
    fontFamily: Platform.select({ ios: "Georgia", default: "serif" }),
  },
});
