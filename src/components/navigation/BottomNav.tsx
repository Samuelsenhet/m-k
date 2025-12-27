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
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="container max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/chat' && location.pathname.startsWith('/chat'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "relative flex flex-col items-center justify-center w-full h-full transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon 
                  className={cn(
                    "w-6 h-6 transition-transform",
                    isActive && "scale-110"
                  )} 
                  fill={isActive ? "currentColor" : "none"}
                />
                <span className={cn(
                  "text-xs mt-1 font-medium",
                  isActive && "text-primary"
                )}>
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
