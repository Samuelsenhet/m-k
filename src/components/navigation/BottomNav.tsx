import { Link, useLocation } from 'react-router-dom';
import { Heart, MessageCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface NavItem {
  path: string;
  labelKey: string;
  icon: typeof Heart;
}

const allNavItems: NavItem[] = [
  { path: '/matches', labelKey: 'nav.matches', icon: Heart },
  { path: '/chat', labelKey: 'nav.chat', icon: MessageCircle },
  { path: '/profile', labelKey: 'nav.profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useTranslation();
  const navItems = allNavItems;
  const colCount = navItems.length;

  const activeIndex = navItems.findIndex(
    (item) =>
      location.pathname === item.path ||
      (item.path === '/chat' && location.pathname.startsWith('/chat'))
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/30 safe-area-bottom shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
      <div className="max-w-lg mx-auto relative">
        {/* Indicator row: same grid as links so bar is centered above each tab */}
        <div className={cn('absolute top-0 left-0 right-0 grid px-2 pointer-events-none', colCount === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
          {navItems.map((_, index) => (
            <div key={index} className="flex justify-center items-start">
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
        <div className={cn('grid items-center justify-items-center h-[72px] px-2', colCount === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
          {navItems.map((item, index) => {
            const itemActive = index === activeIndex;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 w-full h-full min-h-[44px] transition-bounce active:scale-90 touch-manipulation",
                  itemActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "relative flex items-center justify-center shrink-0 transition-transform",
                    itemActive && "scale-110"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-6 h-6 shrink-0 transition-all",
                      itemActive && "drop-shadow-lg"
                    )}
                    fill={itemActive ? "currentColor" : "none"}
                    strokeWidth={itemActive ? 2.5 : 2}
                  />
                  {itemActive && (
                    <div className="absolute inset-0 bg-gradient-rose-glow opacity-20 blur-md pointer-events-none" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] sm:text-xs font-medium transition-colors text-center shrink-0",
                    itemActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
