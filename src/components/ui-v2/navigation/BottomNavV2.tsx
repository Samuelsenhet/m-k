import { Link, useLocation } from "react-router-dom";
import { Heart, MessageCircle, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { isDemoEnabled } from "@/config/supabase";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Heart;
}

const allNavItems: NavItem[] = [
  { path: "/matches", label: "Matchning", icon: Heart },
  { path: "/chat", label: "Chatt", icon: MessageCircle },
  { path: "/demo-seed", label: "Demo", icon: Sparkles },
  { path: "/profile", label: "Profil", icon: User },
];

/**
 * FAS 5 – BottomNav V2. Token-based: surface, primary gradient active indicator,
 * muted/primary icon states, safe-area, no hardcoded colors.
 */
export function BottomNavV2() {
  const location = useLocation();
  const navItems = isDemoEnabled
    ? allNavItems
    : allNavItems.filter((item) => item.path !== "/demo-seed");
  const colCount = navItems.length;

  const activeIndex = navItems.findIndex(
    (item) =>
      location.pathname === item.path ||
      (item.path === "/chat" && location.pathname.startsWith("/chat")),
  );

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border bg-card/95 backdrop-blur-xl",
        "shadow-elevation-1 safe-area-bottom",
      )}
      aria-label="Huvudnavigering"
    >
      <div className="max-w-lg mx-auto relative">
        <div
          className={cn(
            "absolute top-0 left-0 right-0 grid px-2 pointer-events-none",
            colCount === 3 ? "grid-cols-3" : "grid-cols-4",
          )}
        >
          {navItems.map((_, index) => (
            <div key={index} className="flex justify-center items-start">
              {index === activeIndex && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="w-12 h-1.5 rounded-full gradient-primary flex-shrink-0"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div
          className={cn(
            "grid items-center justify-items-center h-[72px] px-2",
            colCount === 3 ? "grid-cols-3" : "grid-cols-4",
          )}
        >
          {navItems.map((item, index) => {
            const itemActive = index === activeIndex;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-full h-full min-h-[44px]",
                  "transition-colors duration-normal active:scale-95 touch-manipulation",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  itemActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center shrink-0 transition-transform duration-normal",
                    itemActive && "scale-110",
                  )}
                >
                  <item.icon
                    className="w-6 h-6 shrink-0"
                    fill={itemActive ? "currentColor" : "none"}
                    strokeWidth={itemActive ? 2.5 : 2}
                  />
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium text-center shrink-0",
                    itemActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
