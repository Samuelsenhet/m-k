import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface NavItem {
  path: string;
  label: string;
  icon: typeof Heart;
}

const navItems: NavItem[] = [
  { path: '/matches', label: 'Matchning', icon: Heart },
  { path: '/chat', label: 'Chatt', icon: MessageCircle },
  { path: '/profile', label: 'Profil', icon: User },
];

export function BottomNav() {
  const location = useLocation();

  const activeIndex = navItems.findIndex(
    (item) =>
      location.pathname === item.path ||
      (item.path === '/chat' && location.pathname.startsWith('/chat'))
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/30 safe-area-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
      <div className="max-w-lg mx-auto relative">
        {/* Indicator row: same grid as links so bar is centered above each tab */}
        <div className="absolute top-0 left-0 right-0 grid grid-cols-3 px-2 pointer-events-none">
          {navItems.map((_, index) => (
            <div key={index} className="flex justify-center">
              {index === activeIndex && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="w-12 h-1.5 gradient-primary rounded-full shadow-glow-primary flex-shrink-0"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 items-center justify-items-center h-[72px] px-2">
          {navItems.map((item, index) => {
            const itemActive = index === activeIndex;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full min-h-[44px] transition-bounce active:scale-90 touch-manipulation",
                  itemActive ? "text-rose-500" : "text-gray-500"
                )}
              >
                <div
                  className={cn(
                    "relative flex flex-col items-center transition-all",
                    itemActive && "scale-110"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-6 h-6 transition-all",
                      itemActive && "drop-shadow-lg"
                    )}
                    fill={itemActive ? "currentColor" : "none"}
                    strokeWidth={itemActive ? 2.5 : 2}
                  />
                  {itemActive && (
                    <div className="absolute inset-0 bg-gradient-rose-glow opacity-20 blur-md" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs mt-1 font-bold transition-colors text-center",
                    itemActive ? "text-primary" : "text-muted-foreground"
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
