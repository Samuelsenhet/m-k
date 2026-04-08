import { Emoji } from "@/components/Emoji";
import { maakTokens } from "@maak/core";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type Props = {
  error: Error;
  retry: () => void;
};

export function ErrorBoundaryFallback({ error, retry }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <Emoji style={styles.emoji}>🌿</Emoji>
      <Text style={styles.title}>{t("errors.boundary_title", { defaultValue: "Något gick fel" })}</Text>
      <Text style={styles.body}>
        {t("errors.boundary_body", {
          defaultValue: "Vi stötte på ett oväntat fel. Prova igen eller starta om appen.",
        })}
      </Text>
      {__DEV__ ? <Text style={styles.detail}>{error.message}</Text> : null}
      <Pressable style={styles.btn} onPress={retry}>
        <Text style={styles.btnText}>{t("common.retry", { defaultValue: "Försök igen" })}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: maakTokens.background,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: maakTokens.foreground,
    textAlign: "center",
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    marginBottom: 20,
  },
  detail: {
    fontSize: 12,
    fontFamily: "monospace",
    color: maakTokens.destructive,
    marginBottom: 16,
    textAlign: "center",
  },
  btn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: maakTokens.radiusLg,
  },
  btnText: { color: maakTokens.primaryForeground, fontWeight: "600", fontSize: 16 },
});
