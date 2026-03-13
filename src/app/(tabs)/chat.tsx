import React, { useEffect, useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Avatar, Card, Badge, Button } from "@/components/native";

interface ChatConversation {
  matchId: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
}

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  unread: "#22C55E",
};

export default function ChatTab() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      const { data: matches, error: matchesError } = await supabase
        .from("matches")
        .select(`
          id,
          user_id,
          matched_user_id,
          status
        `)
        .or(`user_id.eq.${user.id},matched_user_id.eq.${user.id}`)
        .eq("status", "mutual");

      if (matchesError) throw matchesError;
      if (!matches || matches.length === 0) {
        setConversations([]);
        return;
      }

      const conversationData: ChatConversation[] = await Promise.all(
        matches.map(async (match) => {
          const otherUserId = match.user_id === user.id ? match.matched_user_id : match.user_id;

          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("id", otherUserId)
            .single();

          const { data: messages } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, read_at")
            .eq("match_id", match.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const { count: unreadCount } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("match_id", match.id)
            .neq("sender_id", user.id)
            .is("read_at", null);

          const lastMessage = messages?.[0];

          return {
            matchId: match.id,
            otherUser: {
              id: otherUserId,
              displayName: profile?.display_name ?? "Användare",
              avatarUrl: profile?.avatar_url ?? undefined,
            },
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  createdAt: lastMessage.created_at,
                  isFromMe: lastMessage.sender_id === user.id,
                }
              : undefined,
            unreadCount: unreadCount ?? 0,
          };
        })
      );

      conversationData.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });

      setConversations(conversationData);
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleOpenChat = (matchId: string) => {
    router.push(`/(modals)/chat/${matchId}` as const);
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textSecondary} />
        <Text style={styles.emptyTitle}>{t("chat.no_conversations")}</Text>
        <Text style={styles.emptySubtitle}>{t("chat.start_matching")}</Text>
        <Button
          title={t("matches.find_matches")}
          onPress={() => router.push("/(tabs)")}
          variant="primary"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  const renderConversation = ({ item, index }: { item: ChatConversation; index: number }) => (
    <Animated.View entering={FadeInRight.delay(index * 50)}>
      <Card
        variant="default"
        padding="md"
        style={styles.conversationItem}
        onPress={() => handleOpenChat(item.matchId)}
      >
        <View style={styles.conversationContent}>
          <View style={styles.avatarContainer}>
            <Avatar
              source={item.otherUser.avatarUrl}
              name={item.otherUser.displayName}
              size="lg"
            />
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 9 ? "9+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.conversationInfo}>
            <View style={styles.conversationHeader}>
              <Text
                style={[
                  styles.conversationName,
                  item.unreadCount > 0 && styles.unreadName,
                ]}
              >
                {item.otherUser.displayName}
              </Text>
              {item.lastMessage && (
                <Text style={styles.conversationTime}>
                  {formatDistanceToNow(new Date(item.lastMessage.createdAt), {
                    addSuffix: true,
                    locale: sv,
                  })}
                </Text>
              )}
            </View>
            {item.lastMessage ? (
              <Text
                style={[
                  styles.lastMessage,
                  item.unreadCount > 0 && styles.unreadMessage,
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.isFromMe ? `${t("chat.you")}: ` : ""}
                {item.lastMessage.content}
              </Text>
            ) : (
              <Text style={styles.noMessages}>{t("chat.say_hello")}</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      </Card>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.matchId}
        renderItem={renderConversation}
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
  conversationItem: {
    marginBottom: 12,
  },
  conversationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  unreadBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: COLORS.unread,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  conversationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  conversationName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  unreadName: {
    fontWeight: "700",
  },
  conversationTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  unreadMessage: {
    color: COLORS.text,
    fontWeight: "500",
  },
  noMessages: {
    fontSize: 14,
    color: COLORS.primary,
    fontStyle: "italic",
    marginTop: 2,
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
