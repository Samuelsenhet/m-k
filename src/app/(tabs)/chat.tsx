import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function ChatTab() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Chatt</Text>
        <Text style={styles.subtitle}>
          Dina konversationer med matchningar visas här
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b6860",
    textAlign: "center",
    maxWidth: 280,
  },
});
