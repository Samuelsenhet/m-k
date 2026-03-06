/**
 * Expo Router initial route (URL: /).
 * First index.tsx found is the initial route when the app opens.
 */
import { View, Text, type TextProps } from "react-native";
import { Link } from "expo-router";

export function CustomText(props: TextProps) {
  return <Text {...props} />;
}

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <CustomText style={{ fontSize: 18, marginBottom: 16 }}>Welcome!</CustomText>
      <Text style={{ color: "#6b6860", textAlign: "center", marginBottom: 24 }}>
        Initial route (src/app/index.tsx). Add more screens under src/app.
      </Text>
      <Link href="/home" style={{ color: "#4b6e48", fontSize: 16 }}>
        Go to /home
      </Link>
    </View>
  );
}
