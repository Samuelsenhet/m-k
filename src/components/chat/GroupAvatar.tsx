import { AvatarV2, AvatarV2Fallback, AvatarV2Image } from "@/components/ui-v2";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

function getPhotoUrl(storagePath: string | null | undefined) {
  if (!storagePath) return undefined;
  try {
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(storagePath);
    return data?.publicUrl ?? undefined;
  } catch { return undefined; }
}

export interface GroupMemberDisplay {
  user_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface GroupAvatarProps {
  members: GroupMemberDisplay[];
  size?: number;
  className?: string;
  showCount?: boolean;
}

export function GroupAvatar({ members, size = 48, className, showCount }: GroupAvatarProps) {
  const small = size * 0.55;
  const displayMembers = members.slice(0, 4);
  if (displayMembers.length === 0) {
    return (<div className={cn("rounded-full flex items-center justify-center bg-muted text-muted-foreground", className)} style={{ width: size, height: size }}><span style={{ fontSize: size * 0.4 }}>?</span></div>);
  }
  if (displayMembers.length === 1) {
    const m = displayMembers[0];
    return (
      <div className={cn("relative", className)} style={{ width: size, height: size }}>
        <AvatarV2 className="rounded-full border-2 border-background" style={{ width: size, height: size }}>
          <AvatarV2Image src={getPhotoUrl(m.avatar_url ?? undefined)} />
          <AvatarV2Fallback className="bg-primary/20 text-primary font-semibold" style={{ fontSize: size * 0.4 }}>{(m.display_name ?? "?").charAt(0).toUpperCase()}</AvatarV2Fallback>
        </AvatarV2>
        {showCount && members.length > 1 && (<span className="absolute -bottom-1 -right-1 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center" style={{ width: size * 0.4, height: size * 0.4 }}>+{members.length - 1}</span>)}
      </div>
    );
  }
  if (displayMembers.length === 2) {
    return (
      <div className={cn("relative", className)} style={{ width: size, height: size }}>
        <AvatarV2 className="absolute top-0 left-0 rounded-full border-2 border-background" style={{ width: small, height: small }}>
          <AvatarV2Image src={getPhotoUrl(displayMembers[0].avatar_url ?? undefined)} />
          <AvatarV2Fallback className="bg-primary/20 text-primary text-xs font-semibold">{(displayMembers[0].display_name ?? "?").charAt(0).toUpperCase()}</AvatarV2Fallback>
        </AvatarV2>
        <AvatarV2 className="absolute bottom-0 right-0 rounded-full border-2 border-background" style={{ width: small, height: small }}>
          <AvatarV2Image src={getPhotoUrl(displayMembers[1].avatar_url ?? undefined)} />
          <AvatarV2Fallback className="bg-primary/20 text-primary text-xs font-semibold">{(displayMembers[1].display_name ?? "?").charAt(0).toUpperCase()}</AvatarV2Fallback>
        </AvatarV2>
      </div>
    );
  }
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <AvatarV2 className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full border-2 border-background" style={{ width: small * 0.9, height: small * 0.9 }}>
        <AvatarV2Image src={getPhotoUrl(displayMembers[0]?.avatar_url ?? undefined)} />
        <AvatarV2Fallback className="bg-primary/20 text-primary text-xs font-semibold">{(displayMembers[0]?.display_name ?? "?").charAt(0).toUpperCase()}</AvatarV2Fallback>
      </AvatarV2>
      <AvatarV2 className="absolute bottom-0 left-0 rounded-full border-2 border-background" style={{ width: small * 0.9, height: small * 0.9 }}>
        <AvatarV2Image src={getPhotoUrl(displayMembers[1]?.avatar_url ?? undefined)} />
        <AvatarV2Fallback className="bg-primary/20 text-primary text-xs font-semibold">{(displayMembers[1]?.display_name ?? "?").charAt(0).toUpperCase()}</AvatarV2Fallback>
      </AvatarV2>
      <div className="absolute bottom-0 right-0 rounded-full border-2 border-background flex items-center justify-center bg-muted text-muted-foreground font-bold text-xs" style={{ width: small * 0.9, height: small * 0.9 }}>
        {displayMembers[2] ? (displayMembers[2].display_name ?? "?").charAt(0).toUpperCase() : "+" + (members.length - 2)}
      </div>
    </div>
  );
}
