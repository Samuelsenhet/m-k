/**
 * Expo Router page: route /home
 */
import { View, Text } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <Text style={{ fontSize: 18, marginBottom: 16 }}>Home</Text>
      <Link href="/" style={{ color: "#4b6e48", fontSize: 16 }}>
        Back to index
      </Link>
    </View>
  );
}
