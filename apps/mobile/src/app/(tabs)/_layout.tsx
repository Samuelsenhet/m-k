import { MaakTabBar } from "@/components/navigation/MaakTabBar";
import { useThemeTokens } from "@/hooks/useThemeTokens";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Platform } from "react-native";

/**
 * Theme-aware tab bar with green indicator above active tab, outline/filled icons.
 */
export default function TabLayout() {
  const { t } = useTranslation();
  const tokens = useThemeTokens();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          if (Platform.OS === "ios") {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
      }}
      screenOptions={
        ({
        headerShown: false,
        tabBarActiveTintColor: tokens.primary,
        tabBarInactiveTintColor: tokens.mutedForeground,
        tabBar: (props) => <MaakTabBar {...props} />,
        tabBarStyle: {
          backgroundColor: tokens.card,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        } as unknown as Record<string, unknown>)
      }
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.matches"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "heart" : "heart-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t("nav.chat"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={
          {
            title: t("nav.profile"),
            sceneContainerStyle: { backgroundColor: tokens.background },
            tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={focused ? 26 : 24}
                color={color}
              />
            ),
          } as Record<string, unknown>
        }
      />
    </Tabs>
  );
}
