import { maakTokens } from "@maak/core";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { i18n } from "@/lib/i18n";

type Props = {
  error: Error;
  retry: () => void;
};

// Expo Router renders this outside <I18nextProvider> when a tree crashes, so
// useTranslation() would fire NO_I18NEXT_INSTANCE. Use the i18n instance
// directly — t() is safe to call without a provider.
function localizedStrings() {
  const t = i18n.t.bind(i18n);
  return {
    title: t("errors.boundary_title", { defaultValue: "Något gick fel" }),
    body: t("errors.boundary_body", {
      defaultValue: "Vi stötte på ett oväntat fel. Prova igen eller starta om appen.",
    }),
    retry: t("common.retry", { defaultValue: "Försök igen" }),
  };
}

export function ErrorBoundaryFallback({ error, retry }: Props) {
  const strings = localizedStrings();

  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>🌿</Text>
      <Text style={styles.title}>{strings.title}</Text>
      <Text style={styles.body}>{strings.body}</Text>
      {__DEV__ ? <Text style={styles.detail}>{error.message}</Text> : null}
      <Pressable style={styles.btn} onPress={retry}>
        <Text style={styles.btnText}>{strings.retry}</Text>
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
