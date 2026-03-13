import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import Animated, { FadeInRight } from "react-native-reanimated";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

import { useAuth } from "@/contexts/useAuth";
import { useNotificationFeed, ProfileViewItem, InterestItem } from "@/hooks/useNotificationFeed";
import { Card, Avatar, Button, Badge } from "@/components/native";

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  success: "#22C55E",
  error: "#EF4444",
};

type NotificationItem = 
  | { type: "view"; data: ProfileViewItem }
  | { type: "interest"; data: InterestItem };

export default function NotificationsTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { profileViews, interests, loading, refresh, acceptInterest, rejectInterest } = useNotificationFeed();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/(modals)/match/${userId}` as const);
  };

  const handleAccept = async (matchId: string) => {
    await acceptInterest(matchId);
  };

  const handleReject = async (matchId: string) => {
    await rejectInterest(matchId);
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

  if (loading && profileViews.length === 0 && interests.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const notifications: NotificationItem[] = [
    ...interests.map((item): NotificationItem => ({ type: "interest", data: item })),
    ...profileViews.map((item): NotificationItem => ({ type: "view", data: item })),
  ].sort((a, b) => {
    return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime();
  });

  if (notifications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="notifications-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{t("notifications.empty_title")}</Text>
        <Text style={styles.emptySubtitle}>{t("notifications.empty_subtitle")}</Text>
      </View>
    );
  }

  const renderNotification = ({ item, index }: { item: NotificationItem; index: number }) => {
    if (item.type === "interest") {
      const interest = item.data;
      return (
        <Animated.View entering={FadeInRight.delay(index * 50)}>
          <Card variant="default" padding="md" style={styles.notificationItem}>
            <View style={styles.notificationContent}>
              <Pressable onPress={() => handleViewProfile(interest.user_id)}>
                <Avatar
                  source={interest.liker_avatar_url ?? undefined}
                  name={interest.liker_display_name ?? undefined}
                  size="lg"
                />
              </Pressable>
              <View style={styles.notificationInfo}>
                <Text style={styles.notificationTitle}>
                  <Text style={styles.highlightText}>{interest.liker_display_name ?? "Någon"}</Text>
                  {" "}gillar dig!
                </Text>
                <Text style={styles.notificationTime}>
                  {formatDistanceToNow(new Date(interest.created_at), {
                    addSuffix: true,
                    locale: sv,
                  })}
                </Text>
                <View style={styles.actionRow}>
                  <Pressable style={styles.acceptButton} onPress={() => handleAccept(interest.id)}>
                    <Ionicons name="heart" size={20} color={COLORS.success} />
                  </Pressable>
                  <Pressable style={styles.rejectButton} onPress={() => handleReject(interest.id)}>
                    <Ionicons name="close" size={20} color={COLORS.error} />
                  </Pressable>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>
      );
    }

    const view = item.data;
    return (
      <Animated.View entering={FadeInRight.delay(index * 50)}>
        <Card
          variant="default"
          padding="md"
          style={styles.notificationItem}
          onPress={() => handleViewProfile(view.viewer_id)}
        >
          <View style={styles.notificationContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="eye" size={24} color={COLORS.primary} />
            </View>
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>
                <Text style={styles.highlightText}>{view.viewer_display_name ?? "Någon"}</Text>
                {" "}tittade på din profil
              </Text>
              <Text style={styles.notificationTime}>
                {formatDistanceToNow(new Date(view.created_at), {
                  addSuffix: true,
                  locale: sv,
                })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => `${item.type}-${item.data.id}`}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
  notificationItem: {
    marginBottom: 12,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  notificationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  notificationTitle: {
    fontSize: 15,
    color: COLORS.text,
  },
  highlightText: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    justifyContent: "center",
    alignItems: "center",
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
