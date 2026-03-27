import { MaakTabBar } from "@/components/navigation/MaakTabBar";
import Ionicons from "@expo/vector-icons/Ionicons";
import { maakTokens } from "@maak/core";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

/**
 * White tab bar, green indicator above active tab, outline/filled icons — reference parity.
 */
export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      // expo-router Tabs exposes additional bottom-tabs options at runtime,
      // but the type surface can lag behind. Cast to keep strict TS happy.
      screenOptions={
        ({
        headerShown: false,
        tabBarActiveTintColor: maakTokens.primary,
        tabBarInactiveTintColor: maakTokens.mutedForeground,
        tabBar: (props) => <MaakTabBar {...props} />,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
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
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={focused ? 26 : 24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
