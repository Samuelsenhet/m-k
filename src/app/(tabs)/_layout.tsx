import { Tabs } from "expo-router";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type IconName = keyof typeof Ionicons.glyphMap;

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const getTabBarIcon = (routeName: string, focused: boolean, color: string) => {
    let iconName: IconName;

    switch (routeName) {
      case "index":
        iconName = focused ? "home" : "home-outline";
        break;
      case "matches":
        iconName = focused ? "heart" : "heart-outline";
        break;
      case "chat":
        iconName = focused ? "chatbubbles" : "chatbubbles-outline";
        break;
      case "notifications":
        iconName = focused ? "notifications" : "notifications-outline";
        break;
      case "profile":
        iconName = focused ? "person" : "person-outline";
        break;
      default:
        iconName = "help-outline";
    }

    return <Ionicons name={iconName} size={24} color={color} />;
  };

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color }) => getTabBarIcon(route.name, focused, color),
          tabBarActiveTintColor: "#4b6e48",
          tabBarInactiveTintColor: "#6b6860",
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colorScheme === "dark" ? "#1a1a1a" : "#ffffff",
            borderTopColor: colorScheme === "dark" ? "#333" : "#e0e0e0",
          },
        })}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hem",
          }}
        />
        <Tabs.Screen
          name="matches"
          options={{
            title: "Matchningar",
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chatt",
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notiser",
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
