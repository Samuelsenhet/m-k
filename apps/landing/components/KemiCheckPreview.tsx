import Image from "next/image";
import { Mic, PhoneOff, Video } from "lucide-react";

// Mockup av Kemi-Check (video-samtal innan IRL-möte).
// Stor video-tile + PIP + control-row. Använder existerande
// landing-portrait-bilder som video-stand-ins.
export function KemiCheckPreview() {
  return (
    <div className="absolute inset-0 flex flex-col gap-2 px-2 pb-3 pt-9">
      <div className="text-center text-[9px] font-semibold uppercase tracking-[0.18em] text-white drop-shadow-md">
        Kemi-Check · 03:24
      </div>

      <div className="relative flex-1 overflow-hidden rounded-2xl">
        <Image
          src="/screenshots/landing-profile-erik.webp"
          alt=""
          fill
          className="object-cover"
          sizes="240px"
        />
        <div className="absolute left-2 top-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[8px] font-medium text-white backdrop-blur-sm">
          Erik
        </div>
        <div className="absolute bottom-2 right-2 h-16 w-12 overflow-hidden rounded-xl border-2 border-white/40 shadow-lg">
          <Image
            src="/screenshots/landing-profile-merbel.webp"
            alt=""
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Mute"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
        >
          <Mic className="h-3 w-3" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Avsluta"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
        >
          <PhoneOff className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Stäng kamera"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
        >
          <Video className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}
