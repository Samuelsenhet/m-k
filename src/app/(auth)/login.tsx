import { View, Text, StyleSheet, Pressable } from "react-native";
import { Link, router } from "expo-router";

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>MĀĀK</Text>
        <Text style={styles.title}>Välkommen tillbaka</Text>
        <Text style={styles.subtitle}>
          Logga in för att fortsätta hitta din perfekta matchning
        </Text>

        <Link href="/(auth)/phone-auth" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Logga in med telefon</Text>
          </Pressable>
        </Link>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>eller</Text>
          <View style={styles.dividerLine} />
        </View>

        <Link href="/(auth)/onboarding" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Skapa nytt konto</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f8f7f4",
  },
  content: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    gap: 16,
  },
  logo: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4b6e48",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    textAlign: "center",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b6860",
    textAlign: "center",
    marginBottom: 24,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: "#4b6e48",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    paddingHorizontal: 16,
    color: "#6b6860",
    fontSize: 14,
  },
  secondaryButton: {
    width: "100%",
    backgroundColor: "transparent",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4b6e48",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#4b6e48",
    fontSize: 16,
    fontWeight: "600",
  },
});
