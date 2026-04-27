import Image from "next/image";

// Stylad mockup av matches-tabben i appen — 3 kort + "+2 till" för att antyda
// "5 dagliga matchningar" utan att kräva en riktig app-screenshot.
const MOCK_MATCHES = [
  {
    name: "Sofia, 28",
    archetype: "ENFP",
    score: 92,
    src: "/screenshots/landing-profile-sofia.webp",
  },
  {
    name: "Erik, 31",
    archetype: "INTJ",
    score: 87,
    src: "/screenshots/landing-profile-erik.webp",
  },
  {
    name: "Merbel, 27",
    archetype: "ISFJ",
    score: 84,
    src: "/screenshots/landing-profile-merbel.webp",
  },
];

export function MatchesPreview() {
  return (
    <div className="absolute inset-0 flex flex-col gap-2 px-3 pb-3 pt-11">
      <div className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-maak-muted-fg">
        Idag · 5 matchningar
      </div>
      {MOCK_MATCHES.map((m) => (
        <div
          key={m.name}
          className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-sm ring-1 ring-maak-border/50"
        >
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full">
            <Image src={m.src} alt="" fill className="object-cover" sizes="36px" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="truncate text-[11px] font-semibold text-maak-foreground">
              {m.name}
            </div>
            <div className="text-[9px] text-maak-muted-fg">
              {m.archetype} · {m.score}% match
            </div>
          </div>
        </div>
      ))}
      <div className="mt-auto text-center text-[9px] text-maak-muted-fg">
        + 2 till nedan
      </div>
    </div>
  );
}
