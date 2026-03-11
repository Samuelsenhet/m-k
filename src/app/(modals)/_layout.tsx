import { Stack } from "expo-router";
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme } from "react-native";

export default function ModalsLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          presentation: "modal",
          headerShown: true,
          animation: "slide_from_bottom",
        }}
      >
        <Stack.Screen
          name="settings"
          options={{
            title: "Inställningar",
          }}
        />
        <Stack.Screen
          name="match/[userId]"
          options={{
            title: "Profil",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}
