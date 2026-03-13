import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { supabase } from "@/integrations/supabase/client";
import { Card, Badge, Button, Avatar } from "@/components/native";

interface MatchProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  age?: number;
  archetype?: string;
  interests?: string[];
  photos?: string[];
  profession?: string;
  location?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  border: "#333333",
};

export default function MatchProfileModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [profile, setProfile] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) throw error;
        setProfile(data as MatchProfile);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleStartChat = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
    router.push("/(tabs)/chat");
  };

  const handleReport = () => {
    // TODO: Implement report modal
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t("profile.not_found")}</Text>
        <Button title={t("common.go_back")} onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const photos = profile.photos ?? (profile.avatar_url ? [profile.avatar_url] : []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={COLORS.text} />
        </Pressable>
        <Pressable onPress={handleReport} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={COLORS.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {photos.length > 0 ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
                setActiveImageIndex(index);
              }}
            >
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.heroImage}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
            {photos.length > 1 && (
              <View style={styles.pagination}>
                {photos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === activeImageIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </Animated.View>
        ) : (
          <View style={styles.placeholderImage}>
            <Avatar name={profile.display_name} size="xl" />
          </View>
        )}

        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.profileInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.display_name}</Text>
            {profile.age && <Text style={styles.age}>, {profile.age}</Text>}
          </View>

          {profile.archetype && (
            <Badge label={profile.archetype} variant="primary" size="md" style={styles.badge} />
          )}

          {(profile.profession || profile.location) && (
            <View style={styles.metaRow}>
              {profile.profession && (
                <View style={styles.metaItem}>
                  <Ionicons name="briefcase-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{profile.profession}</Text>
                </View>
              )}
              {profile.location && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{profile.location}</Text>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {profile.bio && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Card variant="default" padding="md" style={styles.section}>
              <Text style={styles.sectionTitle}>{t("profile.about_me")}</Text>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </Card>
          </Animated.View>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300).duration(400)}>
            <Card variant="default" padding="md" style={styles.section}>
              <Text style={styles.sectionTitle}>{t("profile.interests")}</Text>
              <View style={styles.interestsContainer}>
                {profile.interests.map((interest, index) => (
                  <Badge key={index} label={interest} variant="secondary" size="md" />
                ))}
              </View>
            </Card>
          </Animated.View>
        )}

        <View style={styles.actionButtons}>
          <Button
            title={t("profile.start_chat")}
            onPress={handleStartChat}
            variant="primary"
            fullWidth
            size="lg"
            leftIcon={<Ionicons name="chatbubble" size={20} color="#1A1A1A" />}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 400,
  },
  placeholderImage: {
    width: SCREEN_WIDTH,
    height: 300,
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  profileInfo: {
    padding: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  age: {
    fontSize: 24,
    fontWeight: "400",
    color: COLORS.textSecondary,
  },
  badge: {
    marginTop: 8,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bioText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButtons: {
    padding: 16,
    paddingTop: 24,
  },
  errorText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
});
