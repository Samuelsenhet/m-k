import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet } from "react-native";

export default function ModalScreen() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("mobile.expo_modal_title")}</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <Text style={styles.hint}>{t("mobile.expo_modal_hint")}</Text>
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  hint: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
});
