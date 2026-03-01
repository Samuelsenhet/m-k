import * as React from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RelationshipLevel } from "./CardV2";
import { getRelationshipBorder } from "@/lib/relationship-depth";
import { ButtonCoral } from "../button";
import { InterestChipV2 } from "./InterestChipV2";

export interface MatchProfileCardDarkProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  about?: string;
  imageSrc?: string | null;
  imageAlt?: string;
  interests?: Array<{ label: string; icon?: React.ReactNode }>;
  /** FAS Relationship Depth: 1=pending, 3=mutual; when >= 3 adds subtle left accent, keeps dark surface */
  relationshipLevel?: RelationshipLevel;
  onChatta?: () => void;
}

const MatchProfileCardDark = React.forwardRef<HTMLDivElement, MatchProfileCardDarkProps>(
  (
    {
      className,
      name,
      about,
      imageSrc,
      imageAlt,
      interests = [],
      relationshipLevel,
      onChatta,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl text-white shadow-elevation-2",
          "bg-warm-dark",
          getRelationshipBorder(relationshipLevel),
          className,
        )}
        {...props}
      >
        <div className="relative aspect-[4/5] w-full">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt ?? name}
              className="h-full w-full object-contain bg-transparent"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-warm-dark/80 text-white/60">
              <span className="text-6xl" aria-hidden>👤</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-warm-dark via-warm-dark/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-xl font-semibold text-white">{name}</h3>
          </div>
          <div className="absolute right-4 top-4">
            <ButtonCoral
              size="default"
              onClick={onChatta}
              aria-label="Chatta"
              className="rounded-full gap-2 shadow-elevation-2"
            >
              <MessageCircle className="size-5" />
              Chatta
            </ButtonCoral>
          </div>
        </div>
        {(about != null && about !== "") || interests.length > 0 ? (
          <div className="flex flex-col gap-3 p-4">
            {about != null && about !== "" && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-white">About</h4>
                <p className="line-clamp-3 text-sm text-white/90">{about}</p>
              </div>
            )}
            {interests.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-white">Interest</h4>
                <div className="flex flex-wrap gap-2">
                  {interests.map(({ label, icon }) => (
                    <InterestChipV2 key={label} label={label} icon={icon} variant="dark" />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  },
);
MatchProfileCardDark.displayName = "MatchProfileCardDark";

export { MatchProfileCardDark };
