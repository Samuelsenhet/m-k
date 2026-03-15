import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";

import { useAuth } from "@/contexts/useAuth";
import { useProfileData } from "@/hooks/useProfileData";
import { supabase } from "@/integrations/supabase/client";
import { Card, Badge, Avatar, Button } from "@/components/native";

interface FullProfile {
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  archetype?: string;
  interests?: string[];
  photos?: string[];
  profession?: string;
  location?: string;
}

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  border: "#333333",
};

export default function ProfileTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const profileData = useProfileData(user?.id);

  const [fullProfile, setFullProfile] = useState<FullProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFullProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) {
      setFullProfile(data as FullProfile);
    }
  }, [user]);

  useEffect(() => {
    fetchFullProfile();
  }, [fetchFullProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([profileData.refetch(), fetchFullProfile()]);
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    router.push("/(modals)/settings");
  };

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signOut();
    router.replace("/(auth)/login");
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyTitle}>{t("common.login_required")}</Text>
        <Button
          title={t("common.login")}
          onPress={() => router.replace("/(auth)/login")}
          variant="primary"
        />
      </View>
    );
  }

  if (profileData.loading && !fullProfile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const photos: string[] = fullProfile?.photos ?? [];
  const interests: string[] = fullProfile?.interests ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      <View style={styles.header}>
        <Avatar
          source={fullProfile?.avatar_url}
          name={profileData.displayName ?? fullProfile?.display_name}
          size="xl"
        />
        <Text style={styles.displayName}>
          {profileData.displayName ?? fullProfile?.display_name ?? "Användare"}
        </Text>
        {profileData.archetype && (
          <Badge label={profileData.archetype} variant="primary" size="md" />
        )}
        <Button
          title={t("profile.edit_profile")}
          onPress={handleEditProfile}
          variant="outline"
          size="sm"
          style={{ marginTop: 12 }}
        />
      </View>

      {fullProfile?.bio && (
        <Card variant="default" padding="md" style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.about_me")}</Text>
          <Text style={styles.bioText}>{fullProfile.bio}</Text>
        </Card>
      )}

      {photos.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.photos")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {photos.map((photo: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {interests.length > 0 && (
        <Card variant="default" padding="md" style={styles.section}>
          <Text style={styles.sectionTitle}>{t("profile.interests")}</Text>
          <View style={styles.interestsContainer}>
            {interests.map((interest: string, index: number) => (
              <Badge key={index} label={interest} variant="secondary" size="md" />
            ))}
          </View>
        </Card>
      )}

      <Card variant="default" padding="md" style={styles.section}>
        <Text style={styles.sectionTitle}>{t("profile.details")}</Text>
        <View style={styles.detailsContainer}>
          {fullProfile?.age && (
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{fullProfile.age} {t("profile.years_old")}</Text>
            </View>
          )}
          {fullProfile?.location && (
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{fullProfile.location}</Text>
            </View>
          )}
          {fullProfile?.profession && (
            <View style={styles.detailRow}>
              <Ionicons name="briefcase-outline" size={20} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>{fullProfile.profession}</Text>
            </View>
          )}
        </View>
      </Card>

      <View style={styles.menuSection}>
        <Pressable style={styles.menuItem} onPress={handleEditProfile}>
          <Ionicons name="settings-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>{t("profile.settings")}</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => router.push("/(modals)/settings")}>
          <Ionicons name="shield-checkmark-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>{t("profile.privacy")}</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </Pressable>
        <Pressable style={styles.menuItem} onPress={() => router.push("/(modals)/settings")}>
          <Ionicons name="help-circle-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>{t("profile.help")}</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      <Button
        title={t("profile.sign_out")}
        onPress={handleSignOut}
        variant="destructive"
        fullWidth
        style={{ marginTop: 16 }}
      />

      <Text style={styles.versionText}>MĀĀK v1.0.0</Text>
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
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  photosContainer: {
    flexDirection: "row",
    gap: 12,
  },
  photo: {
    width: 120,
    height: 160,
    borderRadius: 12,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailsContainer: {
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailText: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  menuSection: {
    marginTop: 24,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  versionText: {
    textAlign: "center",
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 24,
  },
});
