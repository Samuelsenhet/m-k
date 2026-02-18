import * as React from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonPrimary } from "../button/ButtonPrimary";
import { ButtonGhost } from "../button/ButtonGhost";

export interface ActionButtonsProps {
  onPassa: () => void;
  onChatta: () => void;
  onSeProfil: () => void;
  passaLabel?: string;
  chattaLabel?: string;
  seProfilLabel?: string;
  className?: string;
}

export function ActionButtons({
  onPassa,
  onChatta,
  onSeProfil,
  passaLabel = "Passa",
  chattaLabel = "Chatta",
  seProfilLabel = "Se profil",
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <ButtonGhost
        onClick={onPassa}
        className="flex-1 min-w-[80px] border border-border"
      >
        {passaLabel}
      </ButtonGhost>
      <ButtonPrimary
        onClick={onChatta}
        className="flex-[2] min-w-[120px] gap-2"
      >
        <MessageCircle className="w-4 h-4" />
        {chattaLabel}
      </ButtonPrimary>
      <ButtonGhost
        onClick={onSeProfil}
        className="flex-1 min-w-[80px] border border-border"
      >
        {seProfilLabel}
      </ButtonGhost>
    </div>
  );
}
