import { useHostProfile } from "@/hooks/useHostProfile";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

type Props = {
  /** The user currently viewed — we'll introduce them to one of our other matches. */
  targetUserId: string;
  /** Display name of the target — used in alerts. */
  targetUserName?: string;
};

/**
 * "Introducera" button — lets an active Värd start an introduction flow
 * between two of their own matches.
 *
 * This is scaffolding — the actual picker + introduction-create edge
 * function is built in Fas 4. For now the button just shows a
 * "coming soon" alert when pressed, and is only visible to active
 * hosts so we don't surface a feature to non-hosts that they can't use.
 */
export function IntroduceButton({ targetUserId: _targetUserId, targetUserName }: Props) {
  const { t } = useTranslation();
  const host = useHostProfile();

  if (!host.isActive) return null;

  function handlePress() {
    Alert.alert(
      t("host.introduce.coming_soon_title", {
        defaultValue: "Kommer snart",
      }),
      t("host.introduce.coming_soon_body", {
        defaultValue:
          "Snart kan du som Värd koppla ihop två av dina matchningar du tror passar. Vi öppnar funktionen efter lansering.",
        name: targetUserName ?? "",
      }),
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      accessibilityRole="button"
      accessibilityLabel={t("host.introduce.button_a11y", {
        defaultValue: "Introducera personer",
      })}
    >
      <Ionicons name="people-circle-outline" size={18} color={maakTokens.primary} />
      <Text style={styles.label}>
        {t("host.introduce.button_label", { defaultValue: "Introducera" })}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#D9EDE4",
    borderWidth: 1,
    borderColor: "rgba(75, 110, 72, 0.2)",
  },
  buttonPressed: {
    opacity: 0.7,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: maakTokens.primary,
  },
});
