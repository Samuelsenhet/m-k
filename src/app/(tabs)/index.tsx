import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, { FadeInUp, FadeOutDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/useAuth";
import { Card, Badge, Button, Avatar } from "@/components/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  success: "#22C55E",
  error: "#EF4444",
};

export default function HomeTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { matches, loading, error, refreshMatches, likeMatch, passMatch, hasMore, fetchMoreMatches } = useMatches();

  const handleLike = useCallback(
    async (matchId: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await likeMatch(matchId);
    },
    [likeMatch]
  );

  const handlePass = useCallback(
    async (matchId: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await passMatch(matchId);
    },
    [passMatch]
  );

  const handleViewProfile = useCallback(
    (userId: string) => {
      router.push(`/(modals)/match/${userId}`);
    },
    [router]
  );

  const renderMatchCard = useCallback(
    ({ item, index }: { item: ReturnType<typeof useMatches>["matches"][0]; index: number }) => {
      if (item.status === "passed" || item.status === "liked") return null;

      return (
        <Animated.View
          entering={FadeInUp.delay(index * 100)}
          exiting={FadeOutDown}
          style={styles.cardWrapper}
        >
          <Card variant="elevated" padding="none" style={styles.matchCard}>
            <Pressable onPress={() => handleViewProfile(item.matchedUser.userId)}>
              {item.matchedUser.avatarUrl ? (
                <Image
                  source={{ uri: item.matchedUser.avatarUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={[styles.cardImage, styles.placeholderImage]}>
                  <Ionicons name="person" size={64} color={COLORS.textSecondary} />
                </View>
              )}
              <View style={styles.cardOverlay}>
                <View style={styles.cardHeader}>
                  <Badge
                    label={`${item.matchScore}% ${t("matches.compatibility")}`}
                    variant="primary"
                    size="md"
                  />
                  {item.matchType === "similar" ? (
                    <Badge label={t("matches.similar")} variant="success" size="sm" />
                  ) : (
                    <Badge label={t("matches.complementary")} variant="warning" size="sm" />
                  )}
                </View>
              </View>
            </Pressable>

            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{item.matchedUser.displayName}</Text>
              {item.matchedUser.archetype && (
                <Text style={styles.cardArchetype}>{item.matchedUser.archetype}</Text>
              )}
              {item.matchedUser.bio && (
                <Text style={styles.cardBio} numberOfLines={2}>
                  {item.matchedUser.bio}
                </Text>
              )}

              {item.interests.length > 0 && (
                <View style={styles.interestsContainer}>
                  {item.interests.slice(0, 3).map((interest, idx) => (
                    <Badge key={idx} label={interest} variant="secondary" size="sm" />
                  ))}
                </View>
              )}

              {item.personalityInsight && (
                <View style={styles.insightContainer}>
                  <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                  <Text style={styles.insightText} numberOfLines={2}>
                    {item.personalityInsight}
                  </Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <Pressable
                  onPress={() => handlePass(item.id)}
                  style={[styles.actionButton, styles.passButton]}
                >
                  <Ionicons name="close" size={28} color={COLORS.error} />
                </Pressable>
                <Pressable
                  onPress={() => handleLike(item.id)}
                  style={[styles.actionButton, styles.likeButton]}
                >
                  <Ionicons name="heart" size={28} color={COLORS.success} />
                </Pressable>
              </View>
            </View>
          </Card>
        </Animated.View>
      );
    },
    [t, handleLike, handlePass, handleViewProfile]
  );

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

  if (loading && matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t("matches.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button title={t("common.retry")} onPress={refreshMatches} variant="outline" />
      </View>
    );
  }

  const pendingMatches = matches.filter((m) => m.status === "pending");

  if (pendingMatches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="heart-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{t("matches.no_matches_title")}</Text>
        <Text style={styles.emptySubtitle}>{t("matches.no_matches_subtitle")}</Text>
        <Button
          title={t("common.refresh")}
          onPress={refreshMatches}
          variant="outline"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={pendingMatches}
        keyExtractor={(item) => item.id}
        renderItem={renderMatchCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshMatches}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={() => hasMore && fetchMoreMatches()}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && matches.length > 0 ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : null
        }
      />
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
  listContent: {
    padding: 24,
    gap: 24,
  },
  cardWrapper: {
    width: CARD_WIDTH,
  },
  matchCard: {
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 320,
  },
  placeholderImage: {
    backgroundColor: COLORS.card,
    justifyContent: "center",
    alignItems: "center",
  },
  cardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardContent: {
    padding: 16,
    gap: 8,
  },
  cardName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardArchetype: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  cardBio: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  insightContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    fontStyle: "italic",
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 32,
    marginTop: 16,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  passButton: {
    borderColor: COLORS.error,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  likeButton: {
    borderColor: COLORS.success,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    textAlign: "center",
    marginVertical: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
});
