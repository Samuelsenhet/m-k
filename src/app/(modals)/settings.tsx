import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/contexts/useAuth";
import { Card, Switch, Button } from "@/components/native";
import { toast } from "@/components/native";

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  border: "#333333",
  destructive: "#EF4444",
};

export default function SettingsModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    toast.success(t("settings.signed_out"));
    router.replace("/(auth)/login");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.delete_account_title"),
      t("settings.delete_account_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.delete"),
          style: "destructive",
          onPress: async () => {
            toast.info(t("settings.delete_requested"));
          },
        },
      ]
    );
  };

  const menuItems = [
    {
      icon: "document-text-outline" as const,
      label: t("settings.terms"),
      onPress: () => {},
    },
    {
      icon: "shield-checkmark-outline" as const,
      label: t("settings.privacy"),
      onPress: () => {},
    },
    {
      icon: "help-circle-outline" as const,
      label: t("settings.help"),
      onPress: () => {},
    },
    {
      icon: "information-circle-outline" as const,
      label: t("settings.about"),
      onPress: () => {},
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card variant="default" padding="md" style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.account")}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoLabelText}>{t("settings.email")}</Text>
          </View>
          <Text style={styles.infoValue}>{user?.email ?? "-"}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={styles.infoLabel}>
            <Ionicons name="call-outline" size={20} color={COLORS.textSecondary} />
            <Text style={styles.infoLabelText}>{t("settings.phone")}</Text>
          </View>
          <Text style={styles.infoValue}>{user?.phone ?? "-"}</Text>
        </View>
      </Card>

      <Card variant="default" padding="md" style={styles.section}>
        <Text style={styles.sectionTitle}>{t("settings.notifications")}</Text>
        <Switch
          label={t("settings.push_notifications")}
          description={t("settings.push_notifications_desc")}
          value={pushNotifications}
          onValueChange={setPushNotifications}
        />
        <View style={styles.divider} />
        <Switch
          label={t("settings.email_notifications")}
          description={t("settings.email_notifications_desc")}
          value={emailNotifications}
          onValueChange={setEmailNotifications}
        />
        <View style={styles.divider} />
        <Switch
          label={t("settings.match_alerts")}
          description={t("settings.match_alerts_desc")}
          value={matchAlerts}
          onValueChange={setMatchAlerts}
        />
        <View style={styles.divider} />
        <Switch
          label={t("settings.message_alerts")}
          description={t("settings.message_alerts_desc")}
          value={messageAlerts}
          onValueChange={setMessageAlerts}
        />
      </Card>

      <Card variant="default" padding="none" style={styles.section}>
        <Text style={[styles.sectionTitle, { paddingHorizontal: 16, paddingTop: 16 }]}>
          {t("settings.about")}
        </Text>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            onPress={item.onPress}
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name={item.icon} size={22} color={COLORS.text} />
              <Text style={styles.menuItemLabel}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </Pressable>
        ))}
      </Card>

      <View style={styles.buttonSection}>
        <Button
          title={t("settings.sign_out")}
          onPress={handleSignOut}
          variant="secondary"
          fullWidth
          size="lg"
        />
        <Button
          title={t("settings.delete_account")}
          onPress={handleDeleteAccount}
          variant="destructive"
          fullWidth
          size="lg"
        />
      </View>

      <Text style={styles.version}>MĀĀK v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoLabelText: {
    fontSize: 16,
    color: COLORS.text,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  menuItemPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  buttonSection: {
    marginTop: 8,
    gap: 12,
  },
  version: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 24,
  },
});
