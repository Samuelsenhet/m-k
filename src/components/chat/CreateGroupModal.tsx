import { CreateCollectionModal } from "@/components/chat/CreateCollectionModal";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (groupId: string) => void;
  createGroup?: (name: string, memberUserIds: string[]) => Promise<{ id: string } | null>;
}

/**
 * Adapter for Chat page: maps to CreateCollectionModal props.
 * createGroup is unused; CreateCollectionModal uses useCollections internally.
 */
export function CreateGroupModal({
  open,
  onClose,
  onCreated,
}: CreateGroupModalProps) {
  return (
    <CreateCollectionModal
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      onCreateSuccess={(id) => onCreated(id)}
    />
  );
}
