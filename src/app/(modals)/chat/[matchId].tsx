import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

import { useAuth } from "@/contexts/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar } from "@/components/native";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at?: string | null;
}

interface OtherUser {
  id: string;
  display_name: string;
  avatar_url?: string;
}

const COLORS = {
  background: "#0A0A0A",
  card: "#1A1A1A",
  primary: "#D4AF37",
  text: "#FFFFFF",
  textSecondary: "#AAAAAA",
  myMessage: "#D4AF37",
  theirMessage: "#2A2A2A",
  inputBg: "#1A1A1A",
  border: "#333333",
};

export default function ChatModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    if (!matchId) return;

    try {
      const { data: matchData } = await supabase
        .from("matches")
        .select("user_id, matched_user_id")
        .eq("id", matchId)
        .single();

      if (matchData && user) {
        const otherUserId =
          matchData.user_id === user.id ? matchData.matched_user_id : matchData.user_id;

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .eq("id", otherUserId)
          .single();

        if (profileData) {
          setOtherUser({
            id: profileData.id,
            display_name: profileData.display_name ?? "Användare",
            avatar_url: profileData.avatar_url ?? undefined,
          });
        }
      }

      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(messagesData ?? []);

      if (user) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("match_id", matchId)
          .neq("sender_id", user.id)
          .is("read_at", null);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  }, [matchId, user]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, matchId]);

  const handleSend = async () => {
    if (!inputText.trim() || !user || !matchId || sending) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const { error } = await supabase.from("messages").insert({
        match_id: matchId,
        sender_id: user.id,
        content,
      });

      if (error) throw error;
    } catch (err) {
      console.error("Error sending message:", err);
      setInputText(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 20).duration(200)}
        style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}
      >
        {!isMe && (
          <Avatar source={otherUser?.avatar_url} name={otherUser?.display_name} size="sm" />
        )}
        <View
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text style={[styles.messageText, isMe && styles.myMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMe && styles.myMessageTime]}>
            {formatDistanceToNow(new Date(item.created_at), {
              addSuffix: true,
              locale: sv,
            })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: otherUser?.display_name ?? t("chat.title"),
          headerRight: () => (
            <Pressable
              onPress={() => otherUser && router.push(`/(modals)/match/${otherUser.id}`)}
              style={{ marginRight: 8 }}
            >
              <Avatar
                source={otherUser?.avatar_url}
                name={otherUser?.display_name}
                size="sm"
              />
            </Pressable>
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("chat.no_messages")}</Text>
              <Text style={styles.emptySubtext}>{t("chat.say_hello")}</Text>
            </View>
          }
        />

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t("chat.type_message")}
            placeholderTextColor={COLORS.textSecondary}
            multiline
            maxLength={1000}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#1A1A1A" />
            ) : (
              <Ionicons name="send" size={20} color="#1A1A1A" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </>
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
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  myMessageBubble: {
    backgroundColor: COLORS.myMessage,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.theirMessage,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 22,
  },
  myMessageText: {
    color: "#1A1A1A",
  },
  messageTime: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "rgba(26, 26, 26, 0.6)",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.primary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.inputBg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
