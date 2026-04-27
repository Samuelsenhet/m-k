import { MatchProfileScreen } from "@/components/profile/MatchProfileScreen";
import { maakTokens } from "@maak/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserProfileByIdScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string | string[] }>();
  const id = typeof userId === "string" ? userId : userId?.[0] ?? "";

  if (!id) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.err}>{t("common.error")}</Text>
      </View>
    );
  }

  return (
    <MatchProfileScreen
      userId={id}
      onBack={() => router.back()}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: maakTokens.background },
  err: { color: maakTokens.destructive },
});
