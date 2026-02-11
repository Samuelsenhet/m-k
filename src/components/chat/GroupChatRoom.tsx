import { GroupChatWindow } from "@/components/chat/GroupChatWindow";
import type { SamlingGroup } from "@/hooks/useGroups";

interface GroupChatRoomProps {
  group: SamlingGroup;
  currentUserId: string;
  onBack: () => void;
  leaveGroup: (groupId: string) => Promise<boolean>;
}

export function GroupChatRoom({
  group,
  onBack,
  leaveGroup,
}: GroupChatRoomProps) {
  const handleLeave = async () => {
    const ok = await leaveGroup(group.id);
    if (ok) onBack();
  };

  return (
    <GroupChatWindow
      collection={group}
      onBack={onBack}
      onLeave={handleLeave}
    />
  );
}
