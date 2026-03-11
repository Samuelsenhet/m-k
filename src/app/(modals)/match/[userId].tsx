import { View, Text, StyleSheet, ScrollView, Image, Pressable } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

export default function MatchProfileModal() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const handleStartChat = () => {
    router.push("/(tabs)/chat");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>?</Text>
          </View>
        </View>
        
        <Text style={styles.name}>Användare</Text>
        <Text style={styles.archetype}>INFJ · Diplomaten</Text>
        <Text style={styles.compatibility}>87% kompatibilitet</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Om mig</Text>
        <Text style={styles.bio}>
          Profilbeskrivning laddas här...
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intressen</Text>
        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Musik</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Resor</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Matlagning</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personlighet</Text>
        <View style={styles.personalityGrid}>
          <View style={styles.personalityItem}>
            <Text style={styles.personalityLabel}>Introvert</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "70%" }]} />
            </View>
          </View>
          <View style={styles.personalityItem}>
            <Text style={styles.personalityLabel}>Intuition</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "85%" }]} />
            </View>
          </View>
          <View style={styles.personalityItem}>
            <Text style={styles.personalityLabel}>Känsla</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "65%" }]} />
            </View>
          </View>
          <View style={styles.personalityItem}>
            <Text style={styles.personalityLabel}>Bedömning</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "75%" }]} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={handleStartChat}>
          <Text style={styles.primaryButtonText}>Starta chatt</Text>
        </Pressable>
        
        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Tillbaka</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7f4",
  },
  content: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#e8f0e7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 48,
    color: "#4b6e48",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  archetype: {
    fontSize: 16,
    color: "#4b6e48",
    marginBottom: 4,
  },
  compatibility: {
    fontSize: 14,
    color: "#6b6860",
    backgroundColor: "#e8f0e7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b6860",
    marginBottom: 12,
  },
  bio: {
    fontSize: 16,
    color: "#1a1a1a",
    lineHeight: 24,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#e8f0e7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: "#4b6e48",
  },
  personalityGrid: {
    gap: 12,
  },
  personalityItem: {
    gap: 4,
  },
  personalityLabel: {
    fontSize: 14,
    color: "#1a1a1a",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#4b6e48",
    borderRadius: 4,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: "#4b6e48",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
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
