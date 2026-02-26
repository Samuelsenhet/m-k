import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users } from "lucide-react";
import { ButtonSecondary, AvatarV2, AvatarV2Fallback, ChatBubbleV2, ChatInputBarV2 } from "@/components/ui-v2";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COLORS } from "@/design/tokens";
import { cn } from "@/lib/utils";

const DEMO_ME_ID = "demo-me";

type DemoMember = { user_id: string; display_name: string };
type DemoGroup = { id: string; name: string; members: DemoMember[] };

const DEMO_GROUPS: DemoGroup[] = [
  {
    id: "demo-g1",
    name: "Fika-gänget",
    members: [
      { user_id: DEMO_ME_ID, display_name: "Du" },
      { user_id: "demo-1", display_name: "Emma" },
      { user_id: "demo-2", display_name: "Lucas" },
    ],
  },
  {
    id: "demo-g2",
    name: "Promenad & Picknick",
    members: [
      { user_id: DEMO_ME_ID, display_name: "Du" },
      { user_id: "demo-1", display_name: "Emma" },
      { user_id: "demo-3", display_name: "Sofia" },
      { user_id: "demo-4", display_name: "Alex" },
    ],
  },
];

const DEMO_MESSAGES: Record<string, { id: string; sender_id: string; content: string }[]> = {
  "demo-g1": [
    { id: "m1", sender_id: "demo-1", content: "Hej! Ska vi boka fika nästa vecka? ☕" },
    { id: "m2", sender_id: DEMO_ME_ID, content: "Ja gärna! Onsdag eller torsdag?" },
    { id: "m3", sender_id: "demo-2", content: "Torsdag passar mig bättre!" },
    { id: "m4", sender_id: "demo-1", content: "Torsdag 14:00 då? Jag kan boka bord." },
    { id: "m5", sender_id: DEMO_ME_ID, content: "Perfekt, jag är med 👍" },
  ],
  "demo-g2": [
    { id: "m1", sender_id: "demo-3", content: "Vädret blir fint i helgen – någon sugen på picknick?" },
    { id: "m2", sender_id: "demo-4", content: "Ja! Jag tar med filt och korg." },
    { id: "m3", sender_id: DEMO_ME_ID, content: "Jag fixar dryck och frukt 🍇" },
  ],
};

function DemoGroupAvatar({ members, size = 48 }: { members: DemoMember[]; size?: number }) {
  const small = size * 0.55;
  const display = members.slice(0, 4);
  if (display.length === 0) {
    return (
      <div
        className="rounded-full bg-muted flex items-center justify-center text-muted-foreground"
        style={{ width: size, height: size }}
      >
        <span style={{ fontSize: size * 0.4 }}>?</span>
      </div>
    );
  }
  if (display.length === 1) {
    const m = display[0];
    return (
      <AvatarV2 className="rounded-full border-2 border-background" style={{ width: size, height: size }}>
        <AvatarV2Fallback className="bg-primary/20 text-primary font-semibold" style={{ fontSize: size * 0.4 }}>
          {(m.display_name ?? "?").charAt(0).toUpperCase()}
        </AvatarV2Fallback>
      </AvatarV2>
    );
  }
  if (display.length === 2) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <AvatarV2
          className="absolute top-0 left-0 rounded-full border-2 border-background"
          style={{ width: small, height: small }}
        >
          <AvatarV2Fallback className="bg-primary/20 text-primary text-xs font-semibold">
            {display[0].display_name.charAt(0).toUpperCase()}
          </AvatarV2Fallback>
        </AvatarV2>
        <AvatarV2
          className="absolute bottom-0 right-0 rounded-full border-2 border-background"
          style={{ width: small, height: small }}
        >
          <AvatarV2Fallback className="bg-primary/20 text-primary text-xs font-semibold">
            {display[1].display_name.charAt(0).toUpperCase()}
          </AvatarV2Fallback>
        </AvatarV2>
      </div>
    );
  }
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {display.map((m, i) => {
        const row = i < 2 ? 0 : 1;
        const col = i % 2;
        const left = col === 0 ? 0 : size - small;
        const top = row === 0 ? 0 : size - small;
        return (
          <AvatarV2
            key={m.user_id}
            className="absolute rounded-full border-2 border-background"
            style={{ width: small * 0.9, height: small * 0.9, left, top }}
          >
            <AvatarV2Fallback className="bg-primary/20 text-primary text-xs font-semibold">
              {m.display_name.charAt(0).toUpperCase()}
            </AvatarV2Fallback>
          </AvatarV2>
        );
      })}
    </div>
  );
}

export default function DemoGroupChat() {
  const [selectedGroup, setSelectedGroup] = useState<DemoGroup | null>(null);
  const [extraMessages, setExtraMessages] = useState<Record<string, { id: string; sender_id: string; content: string }[]>>({});
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () =>
      selectedGroup
        ? [...(DEMO_MESSAGES[selectedGroup.id] ?? []), ...(extraMessages[selectedGroup.id] ?? [])]
        : [],
    [selectedGroup, extraMessages]
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !selectedGroup) return;
    setInput("");
    setExtraMessages((prev) => ({
      ...prev,
      [selectedGroup.id]: [
        ...(prev[selectedGroup.id] ?? []),
        { id: `extra-${Date.now()}`, sender_id: DEMO_ME_ID, content: text },
      ],
    }));
  };

  const senderName = (senderId: string) =>
    selectedGroup?.members.find((m) => m.user_id === senderId)?.display_name ?? "Användare";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between px-4 h-14">
          {selectedGroup ? (
            <button
              type="button"
              onClick={() => setSelectedGroup(null)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              aria-label="Tillbaka"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Tillbaka</span>
            </button>
          ) : (
            <Link to="/demo-seed" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Tillbaka till demo</span>
            </Link>
          )}
          <span className="font-semibold text-foreground">
            {selectedGroup ? selectedGroup.name : "Samlingar – demo"}
          </span>
          <span className="w-20" />
        </div>
        {!selectedGroup && (
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground">
              Klicka på en grupp för att se gruppchatten. I appen skapas grupper från dina matchningar.
            </p>
          </div>
        )}
      </header>

      {selectedGroup ? (
        <div className="flex flex-1 flex-col min-h-0">
          <div
            className="flex items-center gap-3 px-3 py-2.5 border-b border-border shrink-0"
            style={{ background: COLORS.primary[500], color: COLORS.neutral.white }}
          >
            <DemoGroupAvatar members={selectedGroup.members} size={44} />
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{selectedGroup.name}</h2>
              <p className="text-xs opacity-90">{selectedGroup.members.length} medlemmar</p>
            </div>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-1">
              {messages.map((msg) => {
                const isOwn = msg.sender_id === DEMO_ME_ID;
                const bubbleMessage = {
                  id: msg.id,
                  content: msg.content,
                  sender_id: msg.sender_id,
                  created_at: new Date().toISOString(),
                  is_read: false,
                };
                return (
                  <div key={msg.id} className={cn("flex gap-2", isOwn && "flex-row-reverse")}>
                    {!isOwn && (
                      <div className="text-xs text-muted-foreground shrink-0 w-16 truncate pt-1">
                        {senderName(msg.sender_id)}
                      </div>
                    )}
                    <ChatBubbleV2
                      message={bubbleMessage}
                      variant={isOwn ? "own" : "them"}
                      isOwn={isOwn}
                    />
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-border shrink-0">
            <ChatInputBarV2
              value={input}
              onChange={setInput}
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              placeholder={`Skriv till ${selectedGroup.name}...`}
              sendLabel="Skicka"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 p-4">
          <div className="max-w-lg mx-auto space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-6">
              <Users className="w-5 h-5" />
              <span className="font-medium">Gruppchatt (Samlingar)</span>
            </div>
            {DEMO_GROUPS.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setSelectedGroup(group)}
                className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-muted/50 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <DemoGroupAvatar members={group.members} size={52} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{group.name}</h3>
                  <p className="text-sm text-muted-foreground">{group.members.length} medlemmar</p>
                </div>
              </button>
            ))}
            <p className="text-center text-sm text-muted-foreground pt-4">
              I appen skapar du grupper från Chatt → Samlingar → + och väljer minst 2 matchningar.
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-border p-3 text-center">
        <ButtonSecondary asChild>
          <Link to="/">
            Gå till startsidan
          </Link>
        </ButtonSecondary>
      </div>
    </div>
  );
}
