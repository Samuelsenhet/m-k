import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Link } from "expo-router";

export default function HomeTab() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Välkommen till MĀĀK</Text>
        <Text style={styles.subtitle}>
          Hitta din perfekta matchning baserat på personlighet
        </Text>
        <Link href="/matches" style={styles.link}>
          Se dina matchningar
        </Link>
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
  link: {
    marginTop: 16,
    color: "#4b6e48",
    fontSize: 16,
  },
});
