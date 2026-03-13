import { Stack } from "expo-router";

const COLORS = {
  background: "#0A0A0A",
  text: "#FFFFFF",
  primary: "#D4AF37",
};

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: "modal",
        headerShown: true,
        animation: "slide_from_bottom",
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: "600",
        },
        contentStyle: {
          backgroundColor: COLORS.background,
        },
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
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="chat/[matchId]"
        options={{
          title: "Chatt",
        }}
      />
    </Stack>
  );
}
