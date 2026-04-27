import { useSupabase } from "@/contexts/SupabaseProvider";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

type ShowActionsOpts = {
  matchId?: string;
  onBlocked?: () => void;
};

export function useBlockUser() {
  const { supabase, session } = useSupabase();
  const userId = session?.user?.id;
  const { t } = useTranslation();
  const router = useRouter();

  const blockUser = useCallback(
    (otherUserId: string, onBlocked?: () => void) => {
      Alert.alert(
        t("chat.block_user"),
        t("chat.block_user_confirm"),
        [
          { text: t("common.cancel"), style: "cancel" },
          {
            text: t("chat.block_user"),
            style: "destructive",
            onPress: async () => {
              if (!userId) return;
              const { error } = await supabase.from("blocked_users").insert({
                blocker_id: userId,
                blocked_id: otherUserId,
              });
              if (error) {
                Alert.alert(t("common.error"), error.message);
                return;
              }
              onBlocked?.();
            },
          },
        ],
      );
    },
    [supabase, userId, t],
  );

  const showActions = useCallback(
    (otherUserId: string, otherUserName: string, opts: ShowActionsOpts = {}) => {
      Alert.alert(otherUserName, undefined, [
        {
          text: t("chat.block_user"),
          style: "destructive",
          onPress: () => blockUser(otherUserId, opts.onBlocked),
        },
        {
          text: t("report.report_user"),
          onPress: () => {
            const params: Record<string, string> = { userId: otherUserId };
            if (opts.matchId) params.matchId = opts.matchId;
            router.push({ pathname: "/report", params } as never);
          },
        },
        { text: t("common.cancel"), style: "cancel" },
      ]);
    },
    [blockUser, router, t],
  );

  return { blockUser, showActions };
}
