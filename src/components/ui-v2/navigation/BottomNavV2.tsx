import { Link, useLocation } from "react-router-dom";
import { Heart, MessageCircle, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { isDemoEnabled } from "@/config/supabase";
import { COLORS } from "@/design/tokens";
import { useTotalUnreadCount } from "@/hooks/useTotalUnreadCount";

interface NavItem {
  path: string;
  label: string;
  icon: typeof Heart;
  showUnreadBadge?: boolean;
}

const allNavItems: NavItem[] = [
  { path: "/matches", label: "Matchning", icon: Heart },
  { path: "/chat", label: "Chatt", icon: MessageCircle, showUnreadBadge: true },
  { path: "/demo-seed", label: "Demo", icon: Sparkles },
  { path: "/profile", label: "Profil", icon: User },
];

/**
 * BottomNav V2 – design system: COLORS tokens, primary-50 active, neutral.gray inactive,
 * coral badge for unread, backdrop-blur, border sage-100, fixed bottom.
 */
export function BottomNavV2() {
  const location = useLocation();
  const unreadCount = useTotalUnreadCount();
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
      className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl safe-area-bottom"
      style={{
        borderTop: `1px solid ${COLORS.sage[100]}`,
        background: `${COLORS.neutral.white}ee`,
      }}
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
                  className="w-12 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: COLORS.primary[500] }}
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
            const showBadge = item.showUnreadBadge && unreadCount > 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-full h-full min-h-[44px] rounded-xl transition-colors duration-normal active:scale-95 touch-manipulation",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                )}
                style={{
                  color: itemActive ? COLORS.primary[600] : COLORS.neutral.gray,
                  background: itemActive ? COLORS.primary[50] : "transparent",
                }}
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
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: COLORS.coral[500] }}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] sm:text-xs font-medium text-center shrink-0"
                  style={{
                    color: itemActive ? COLORS.primary[600] : COLORS.neutral.gray,
                  }}
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
