import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

type IphoneMockupProps = {
  src: string | StaticImageData;
  alt: string;
  /** Optional overlay (e.g. badge) inside the screen area */
  children?: ReactNode;
  className?: string;
};

export function IphoneMockup({ src, alt, children, className = "" }: IphoneMockupProps) {
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
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top"
          sizes="260px"
          priority={false}
        />
        {children}
      </div>
    </div>
  );
}
