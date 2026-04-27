import { useHostProfile } from "@/hooks/useHostProfile";
import { Ionicons } from "@expo/vector-icons";
import { maakTokens } from "@maak/core";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  /** The user being viewed - becomes user_a in the introduction picker. */
  targetUserId: string;
  /** Display name of the target - seeded into the picker's UI. */
  targetUserName?: string;
};

/**
 * "Introducera" button - lets an active Värd start an introduction flow
 * between the currently-viewed user and another one of their matches.
 *
 * Only renders for active hosts. On press, navigates to the picker screen
 * with the current user pre-selected as user_a - the picker prompts to
 * choose user_b and write an optional message, then calls the
 * introduction-create edge function.
 */
export function IntroduceButton({ targetUserId, targetUserName }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const host = useHostProfile();

  if (!host.isActive) return null;

  function handlePress() {
    // `/host/introduce` is a valid expo-router path but the typed-routes
    // cache may not have regenerated it yet on first compile. Cast until
    // `expo start` refreshes the routes index.
    router.push({
      pathname: "/host/introduce" as unknown as "/",
      params: {
        user_a_id: targetUserId,
        user_a_name: targetUserName ?? "",
      },
    });
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
  buttonPressed: { opacity: 0.7 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: maakTokens.primary,
  },
});
