import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, { FadeInRight } from "react-native-reanimated";

import { useMatches } from "@/hooks/useMatches";
import { useAuth } from "@/contexts/useAuth";
import { Card, Badge, Avatar, Button } from "@/components/native";

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  mutual: "#22C55E",
  liked: "#3B82F6",
};

export default function MatchesTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { matches, loading, error, refreshMatches } = useMatches();

  const handleOpenChat = (matchId: string) => {
    router.push(`/(modals)/chat/${matchId}` as const);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/(modals)/match/${userId}`);
  };

  const mutualMatches = matches.filter((m) => m.status === "mutual");
  const likedMatches = matches.filter((m) => m.status === "liked");

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
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <Button title={t("common.retry")} onPress={refreshMatches} variant="outline" />
      </View>
    );
  }

  const renderMatchItem = ({ item, index }: { item: typeof matches[0]; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <Card
        variant="default"
        padding="md"
        style={styles.matchItem}
        onPress={() => handleViewProfile(item.matchedUser.userId)}
      >
        <View style={styles.matchContent}>
          <Avatar
            source={item.matchedUser.avatarUrl}
            name={item.matchedUser.displayName}
            size="lg"
            showOnlineIndicator
            isOnline={false}
          />
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>{item.matchedUser.displayName}</Text>
            {item.matchedUser.archetype && (
              <Text style={styles.matchArchetype}>{item.matchedUser.archetype}</Text>
            )}
            <View style={styles.matchMeta}>
              <Badge
                label={`${item.matchScore}%`}
                variant="primary"
                size="sm"
              />
              {item.status === "mutual" && (
                <Badge label={t("matches.mutual")} variant="success" size="sm" />
              )}
            </View>
          </View>
          {item.status === "mutual" && (
            <Pressable
              onPress={() => handleOpenChat(item.id)}
              style={styles.chatButton}
            >
              <Ionicons name="chatbubble" size={24} color={COLORS.primary} />
            </Pressable>
          )}
        </View>
      </Card>
    </Animated.View>
  );

  const sections = [
    { title: t("matches.mutual_matches"), data: mutualMatches, key: "mutual" },
    { title: t("matches.liked"), data: likedMatches, key: "liked" },
  ].filter((s) => s.data.length > 0);

  if (sections.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="heart-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{t("matches.no_connections_yet")}</Text>
        <Text style={styles.emptySubtitle}>{t("matches.start_swiping")}</Text>
        <Button
          title={t("matches.find_matches")}
          onPress={() => router.push("/(tabs)")}
          variant="primary"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.data.map((match, index) => (
              <View key={match.id}>
                {renderMatchItem({ item: match, index })}
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refreshMatches}
            tintColor={COLORS.primary}
          />
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
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  matchItem: {
    marginBottom: 12,
  },
  matchContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  matchArchetype: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },
  matchMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 16,
    textAlign: "center",
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
