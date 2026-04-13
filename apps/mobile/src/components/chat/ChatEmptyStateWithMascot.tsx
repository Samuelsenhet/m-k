import { MascotAssets } from "@/lib/mascotAssets";
import { maakTokens } from "@maak/core";
import { Image, StyleSheet, Text, View } from "react-native";

/** Tom chattlista - `no_chats` → `mascot_practicing_mirror` (web `STATE_TOKEN_MAP`). */

export function ChatEmptyStateWithMascot({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.wrap}>
      <Image
        source={MascotAssets.practicingMirror}
        style={styles.mascot}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    minHeight: 200,
  },
  mascot: {
    width: 200,
    height: 200,
    maxWidth: "100%",
  },
  title: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "600",
    color: maakTokens.foreground,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: maakTokens.mutedForeground,
    textAlign: "center",
    maxWidth: 260,
    marginBottom: 24,
  },
});
