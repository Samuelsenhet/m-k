import * as React from "react";
import { Send, Loader2, Image, Mic, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonPrimary } from "../button";
import { ButtonIcon } from "../button";

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

    return (
      <form onSubmit={onSubmit} className="flex items-end gap-2">
        <div className="flex flex-1 min-w-0 items-end gap-2 rounded-2xl border border-border bg-muted/80 px-3 py-2 focus-within:border-primary/40 focus-within:bg-background transition-colors duration-normal">
          {onImageClick != null && (
            <ButtonIcon
              type="button"
              size="sm"
              onClick={onImageClick}
              aria-label="Bild"
              className="shrink-0"
            >
              <Image className="size-4" />
            </ButtonIcon>
          )}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "min-h-[40px] max-h-[120px] flex-1 resize-none bg-transparent py-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e as unknown as React.FormEvent);
              }
            }}
          />
          {onVoiceClick != null && (
            <ButtonIcon
              type="button"
              size="sm"
              onClick={onVoiceClick}
              aria-label="Röst"
              className="shrink-0"
            >
              <Mic className="size-4" />
            </ButtonIcon>
          )}
          {onAIClick != null && (
            <ButtonIcon
              type="button"
              size="sm"
              onClick={onAIClick}
              aria-label="AI-förslag"
              className="shrink-0"
            >
              <Sparkles className="size-4" />
            </ButtonIcon>
          )}
        </div>
        <ButtonPrimary
          type="submit"
          disabled={!value.trim() || disabled || sending}
          size="default"
          className="shrink-0 rounded-full h-11 w-11 p-0"
          aria-label={sendLabel}
        >
          {sending ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Send className="size-5" />
          )}
        </ButtonPrimary>
      </form>
    );
  },
);
ChatInputBarV2.displayName = "ChatInputBarV2";

export { ChatInputBarV2 };
