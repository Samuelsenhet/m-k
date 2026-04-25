import { Sparkles } from "lucide-react";

// Stylad chat-mockup som visas inuti IphoneMockup för "Chatta"-steget.
// Visar ett kort utbyte + AI-isbrytarpill i botten.
export function ChatBubbles() {
  return (
    <div className="absolute inset-0 flex flex-col gap-2 px-3 pb-3 pt-12 text-[10px] leading-snug">
      <div className="self-start max-w-[80%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-maak-foreground shadow-sm">
        Hej! Jag såg att du också gillar Murakami.
      </div>
      <div className="self-end max-w-[80%] rounded-2xl rounded-br-md bg-maak-primary px-3 py-2 text-white shadow-sm">
        Yes - Norwegian Wood är min favorit. Du då?
      </div>
      <div className="self-start max-w-[80%] rounded-2xl rounded-tl-md bg-white px-3 py-2 text-maak-foreground shadow-sm">
        Kafka on the Shore. Ses vi över kaffe?
      </div>
      <div className="mt-auto flex items-center gap-1.5 self-center rounded-full bg-maak-card px-3 py-1.5 text-[9px] font-medium text-maak-muted-fg shadow-sm ring-1 ring-maak-border/60">
        <Sparkles className="h-3 w-3 text-maak-primary" aria-hidden />
        AI-förslag
      </div>
    </div>
  );
}
