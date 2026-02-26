import * as React from "react";
import { Send, Loader2, Image, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/design/tokens";

export interface ChatInputBarV2Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  sending?: boolean;
  onImageClick?: () => void;
  onVoiceClick?: () => void;
  onAIClick?: () => void;
  /** Accessibility label for send button */
  sendLabel?: string;
}

const ChatInputBarV2 = React.forwardRef<HTMLTextAreaElement, ChatInputBarV2Props>(
  (
    {
      value,
      onChange,
      onSubmit,
      placeholder,
      disabled,
      sending,
      onImageClick,
      onVoiceClick,
      onAIClick,
      sendLabel = "Skicka",
    },
    ref,
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      const el = e.target;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    };

    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const hasMessage = value.trim().length > 0;
    return (
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {/* Quick actions – design system: Bild, Röst, Isbrytare (sage-100) */}
        <div className="flex gap-2 overflow-x-auto">
          {onImageClick != null && (
            <button
              type="button"
              onClick={onImageClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
              style={{ background: COLORS.sage[100], color: COLORS.primary[600] }}
              aria-label="Bild"
            >
              <Image className="w-4 h-4" />
              Bild
            </button>
          )}
          {onVoiceClick != null && (
            <button
              type="button"
              onClick={onVoiceClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
              style={{ background: COLORS.sage[100], color: COLORS.primary[600] }}
              aria-label="Röst"
            >
              <Mic className="w-4 h-4" />
              Röst
            </button>
          )}
          {onAIClick != null && (
            <button
              type="button"
              onClick={onAIClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all hover:scale-105"
              style={{ background: COLORS.sage[100], color: COLORS.primary[600] }}
              aria-label="Isbrytare"
            >
              <Sparkles className="w-4 h-4" />
              Isbrytare
            </button>
          )}
        </div>
        <div className="flex items-end gap-2">
          <div
            className="flex flex-1 min-w-0 items-end gap-2 rounded-2xl border px-3 py-2 transition-colors duration-normal focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
            style={{
              background: COLORS.neutral.cream,
              borderColor: COLORS.sage[200],
            }}
          >
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                "min-h-[40px] max-h-[120px] flex-1 resize-none bg-transparent py-2 text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              )}
              style={{ color: COLORS.neutral.charcoal }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
            />
          </div>
          <button
            type="submit"
            disabled={!hasMessage || disabled || sending}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0 disabled:opacity-50"
            style={{
              background: hasMessage
                ? `linear-gradient(135deg, ${COLORS.primary[500]} 0%, ${COLORS.primary[400]} 100%)`
                : COLORS.sage[200],
              color: hasMessage ? COLORS.neutral.white : COLORS.neutral.gray,
            }}
            aria-label={sendLabel}
          >
            {sending ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Send className="size-5" />
            )}
          </button>
        </div>
      </form>
    );
  },
);
ChatInputBarV2.displayName = "ChatInputBarV2";

export { ChatInputBarV2 };
