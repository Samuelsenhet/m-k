import { Mascot } from "@/components/system/Mascot";
import { useMascot } from "@/hooks/useMascot";
import { MASCOT_SCREEN_STATES } from "@/lib/mascot";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
  variant?: "default" | "compact" | "icon-only";
}

export const Logo = ({ 
  size = 48, 
  className,
  showText = true,
  variant = "default"
}: LogoProps) => {
  const mascot = useMascot(MASCOT_SCREEN_STATES.HOME_IDLE);

  if (variant === "icon-only") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <Mascot {...mascot} />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex-shrink-0">
        <Mascot {...mascot} />
      </div>
      {showText && (
        <span className={cn(
          "font-bold text-gradient",
          variant === "compact" ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
        )}>
          MÄÄK
        </span>
      )}
    </div>
  );
};

export default Logo;
