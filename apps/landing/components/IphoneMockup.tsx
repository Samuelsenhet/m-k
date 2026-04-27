import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

type IphoneMockupProps = {
  /** When omitted, renders an empty maak-cream screen — caller provides content via children. */
  src?: string | StaticImageData;
  alt: string;
  /** Optional content inside the screen area (badges, chat bubbles, etc.). */
  children?: ReactNode;
  className?: string;
  /** Set true for the hero image so it gets eager-loaded for LCP. */
  priority?: boolean;
};

export function IphoneMockup({
  src,
  alt,
  children,
  className = "",
  priority = false,
}: IphoneMockupProps) {
  return (
    <div
      className={`relative mx-auto w-[min(100%,260px)] ${className}`}
      style={{ aspectRatio: "260 / 530" }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[1.85rem] bg-black shadow-lg shadow-black/20 ring-1 ring-black/10">
        <div
          className="absolute left-1/2 top-3 z-10 h-[28px] w-[88px] -translate-x-1/2 rounded-full bg-black"
          aria-hidden
        />
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover object-top"
            sizes="260px"
            priority={priority}
          />
        ) : (
          <div
            className="absolute inset-0 bg-maak-cream"
            role="img"
            aria-label={alt}
          />
        )}
        {children}
      </div>
    </div>
  );
}
