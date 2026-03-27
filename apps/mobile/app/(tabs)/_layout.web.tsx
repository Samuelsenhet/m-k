import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import Ionicons from "@expo/vector-icons/Ionicons";
import { maakTokens } from "@maak/core";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

/**
 * Web: native tabs fall back to a basic UI; we keep JS tabs for predictable web UX.
 */
export default function TabLayoutWeb() {
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: maakTokens.primary,
        tabBarInactiveTintColor: maakTokens.mutedForeground,
        headerShown: useClientOnlyValue(false, true),
        tabBarStyle: {
          borderTopColor: maakTokens.border,
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.matches"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("nav.chat"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("nav.profile"),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
