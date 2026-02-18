import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import { ButtonGhost } from "../button/ButtonGhost";

interface ChatEmptyStateV2Props {
  icebreakers: string[];
  onIcebreakerClick: (text: string) => void;
  onAIClick?: () => void;
  aiLabel?: string;
  className?: string;
}

export function ChatEmptyStateV2({
  icebreakers,
  onIcebreakerClick,
  onAIClick,
  aiLabel,
  className,
}: ChatEmptyStateV2Props) {
  const mascot = useMascot(MASCOT_SCREEN_STATES.NO_CHATS);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-12 px-4", className)}>
      <Mascot {...mascot} className="mb-2" />

      <p className="text-muted-foreground text-sm text-center">
        Starta konversationen med en icebreaker!
      </p>

      {icebreakers.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center max-w-sm">
          {icebreakers.map((text, i) => (
            <button
              key={i}
              type="button"
              className="rounded-full bg-sage-100 text-primary-600 px-3 py-1.5 text-xs font-medium hover:bg-sage-200 transition-colors duration-normal"
              onClick={() => onIcebreakerClick(text)}
            >
              {text}
            </button>
          ))}
        </div>
      )}

      {onAIClick && (
        <ButtonGhost
          size="sm"
          className="gap-1.5 text-primary"
          onClick={onAIClick}
        >
          <Sparkles className="w-4 h-4" />
          {aiLabel ?? "AI-förslag"}
        </ButtonGhost>
      )}
    </div>
  );
}
