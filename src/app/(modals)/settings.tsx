import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from "react-native";
import { router } from "expo-router";
import { useState } from "react";

export default function SettingsModal() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSignOut = () => {
    // TODO: Implement sign out with Supabase
    router.replace("/(auth)/login");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Konto</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>E-post</Text>
          <Text style={styles.rowValue}>user@example.com</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Telefon</Text>
          <Text style={styles.rowValue}>+46 70 123 45 67</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifikationer</Text>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push-notiser</Text>
          <Switch
            value={pushNotifications}
            onValueChange={setPushNotifications}
            trackColor={{ false: "#d1d5db", true: "#4b6e48" }}
          />
        </View>
        
        <View style={styles.row}>
          <Text style={styles.rowLabel}>E-postnotiser</Text>
          <Switch
            value={emailNotifications}
            onValueChange={setEmailNotifications}
            trackColor={{ false: "#d1d5db", true: "#4b6e48" }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Om</Text>
        
        <Pressable style={styles.linkRow}>
          <Text style={styles.rowLabel}>Användarvillkor</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        
        <Pressable style={styles.linkRow}>
          <Text style={styles.rowLabel}>Integritetspolicy</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
        
        <Pressable style={styles.linkRow}>
          <Text style={styles.rowLabel}>Om MĀĀK</Text>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Logga ut</Text>
      </Pressable>

      <Pressable style={styles.deleteButton}>
        <Text style={styles.deleteText}>Radera konto</Text>
      </Pressable>

      <Text style={styles.version}>Version 1.0.0</Text>
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
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b6860",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e0e0e0",
  },
  rowLabel: {
    fontSize: 16,
    color: "#1a1a1a",
  },
  rowValue: {
    fontSize: 16,
    color: "#6b6860",
  },
  chevron: {
    fontSize: 20,
    color: "#6b6860",
  },
  signOutButton: {
    backgroundColor: "#4b6e48",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  signOutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
    marginBottom: 24,
  },
  deleteText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  version: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
  },
});
