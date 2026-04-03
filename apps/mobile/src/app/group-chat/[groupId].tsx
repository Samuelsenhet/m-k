import { GroupChatRoom } from "@/components/chat/GroupChatRoom";
import { useSupabase } from "@/contexts/SupabaseProvider";
import { fetchSamlingGroupById, useGroups, type SamlingGroup } from "@/hooks/useGroups";
import { maakTokens } from "@maak/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GroupChatScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { groupId: rawId } = useLocalSearchParams<{ groupId: string | string[] }>();
  const groupId = typeof rawId === "string" ? rawId : rawId?.[0];
  const { supabase, session, isReady } = useSupabase();
  const user = session?.user;
  const { leaveGroup, refreshGroups } = useGroups();

  const [group, setGroup] = useState<SamlingGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!groupId || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const g = await fetchSamlingGroupById(supabase, user.id, groupId);
      if (!g) {
        setNotFound(true);
        setGroup(null);
      } else {
        setGroup(g);
      }
    } finally {
      setLoading(false);
    }
  }, [groupId, user, supabase]);

  useEffect(() => {
    if (!isReady) return;
    if (!user) {
      router.replace("/phone-auth");
      return;
    }
    void load();
  }, [isReady, user, router, load]);

  const handleBack = useCallback(() => {
    void refreshGroups();
    router.back();
  }, [router, refreshGroups]);

  if (!isReady || !user) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={maakTokens.primary} />
        </View>
      </>
    );
  }

  if (!groupId) {
    return (
      <>
        <Stack.Screen options={{ title: t("groupChat.title"), headerShown: true }} />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Text style={styles.err}>{t("groupChat.notFoundOrNoAccess")}</Text>
          <Pressable style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnTxt}>{t("groupChat.backToList")}</Text>
          </Pressable>
        </View>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" color={maakTokens.primary} />
        </View>
      </>
    );
  }

  if (notFound || !group) {
    return (
      <>
        <Stack.Screen options={{ title: t("groupChat.title"), headerShown: true }} />
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <Text style={styles.err}>{t("groupChat.notFoundOrNoAccess")}</Text>
          <Pressable style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnTxt}>{t("groupChat.backToList")}</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <GroupChatRoom
        group={group}
        currentUserId={user.id}
        onBack={handleBack}
        leaveGroup={leaveGroup}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: maakTokens.background,
  },
  err: { color: maakTokens.destructive, textAlign: "center", marginBottom: 16 },
  btn: {
    backgroundColor: maakTokens.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: maakTokens.radiusLg,
  },
  btnTxt: { color: maakTokens.primaryForeground, fontWeight: "700" },
});
