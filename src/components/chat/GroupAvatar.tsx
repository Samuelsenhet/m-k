import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface GroupAvatarUser {
  id: string;
  avatarUrl?: string | null;
}

interface GroupAvatarProps {
  users: GroupAvatarUser[];
  size?: "sm" | "md";
  className?: string;
  /** Optional seed for deterministic placeholder color (e.g. collection.avatar_seed) */
  avatarSeed?: string | null;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

export function GroupAvatar({ users, size = "md", className, avatarSeed }: GroupAvatarProps) {
  const display = useMemo(() => users.slice(0, 3), [users]);
  const s = sizeClasses[size];
  const overlap = size === "sm" ? "ml-[-6px]" : "ml-[-8px]";

  const placeholderBg = "bg-primary/20 text-primary";

  if (display.length === 0) {
    return (
      <div
        role="img"
        aria-label="Gruppavatar"
        className={cn(
          "rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0",
          s,
          placeholderBg,
          className
        )}
      >
        ?
      </div>
    );
  }

  return (
    <div className={cn("flex items-center flex-shrink-0", className)} role="img" aria-label="Medlemsavatarer">
      {display.map((u, i) => (
        <div
          key={u.id}
          className={cn(
            "rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center text-xs font-medium",
            s,
            i > 0 ? overlap : ""
          )}
          style={{ zIndex: display.length - i }}
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className={placeholderBg}>{(u.id?.slice(0, 1) ?? "?").toUpperCase()}</span>
          )}
        </div>
      ))}
    </div>
  );
}
