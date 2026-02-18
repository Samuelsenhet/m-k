import * as React from "react";
import { MessageCircle, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CardV2 } from "./CardV2";
import { ButtonCoral, ButtonSecondary, ButtonGhost } from "../button";
import { InterestChipV2 } from "./InterestChipV2";

export interface MatchProfileCardLightProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  bio?: string;
  imageSrc?: string | null;
  imageAlt?: string;
  interests?: Array<{ label: string; icon?: React.ReactNode }>;
  onPassa?: () => void;
  onChatta?: () => void;
  onSeProfil?: () => void;
}

const MatchProfileCardLight = React.forwardRef<HTMLDivElement, MatchProfileCardLightProps>(
  (
    {
      className,
      name,
      bio,
      imageSrc,
      imageAlt,
      interests = [],
      onPassa,
      onChatta,
      onSeProfil,
      ...props
    },
    ref,
  ) => {
    return (
      <CardV2 ref={ref} variant="default" padding="none" className={cn("overflow-hidden", className)} {...props}>
        <div className="relative aspect-[3/4] w-full bg-muted">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt ?? name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <span className="text-6xl" aria-hidden>👤</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 p-4">
          <h3 className="text-lg font-semibold text-foreground">{name}</h3>
          {bio != null && bio !== "" && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{bio}</p>
          )}
          {interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {interests.map(({ label, icon }) => (
                <InterestChipV2 key={label} label={label} icon={icon} />
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <ButtonGhost size="default" onClick={onPassa} aria-label="Passa" className="rounded-full">
              <X className="size-5" />
            </ButtonGhost>
            <ButtonCoral size="default" onClick={onChatta} aria-label="Chatta" className="rounded-full gap-2">
              <MessageCircle className="size-5" />
              Chatta
            </ButtonCoral>
            <ButtonSecondary size="default" onClick={onSeProfil} aria-label="Se profil" className="rounded-full gap-2">
              <User className="size-5" />
              Se profil
            </ButtonSecondary>
          </div>
        </div>
      </CardV2>
    );
  },
);
MatchProfileCardLight.displayName = "MatchProfileCardLight";

export { MatchProfileCardLight };
