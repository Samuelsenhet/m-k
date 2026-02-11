import { GroupAvatar, type GroupAvatarUser } from "@/components/chat/GroupAvatar";
import { cn } from "@/lib/utils";
import type { CollectionWithMeta } from "@/hooks/useCollections";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";

interface CollectionListItemProps {
  collection: CollectionWithMeta;
  memberAvatars?: GroupAvatarUser[];
  onClick: () => void;
  isSelected?: boolean;
  className?: string;
}

export function CollectionListItem({
  collection,
  memberAvatars = [],
  onClick,
  isSelected,
  className,
}: CollectionListItemProps) {
  const preview = collection.last_message_preview
    ? collection.last_message_preview.slice(0, 40) + (collection.last_message_preview.length > 40 ? "…" : "")
    : "Inga meddelanden än";

  const timeAgo = collection.last_message_at
    ? formatDistanceToNow(new Date(collection.last_message_at), { addSuffix: true, locale: sv })
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors",
        "hover:bg-muted/60 active:bg-muted",
        isSelected && "bg-primary/10",
        className
      )}
    >
      <GroupAvatar
        users={memberAvatars}
        size="md"
        avatarSeed={collection.avatar_seed}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-foreground truncate">{collection.name}</span>
          {timeAgo && (
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">{preview}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {collection.member_count} {collection.member_count === 1 ? "medlem" : "medlemmar"}
          </span>
        </div>
      </div>
    </button>
  );
}
