import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'rose' | 'violet' | 'emerald' | 'none';
  hover?: boolean;
  interactive?: boolean;
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ children, className, glow = 'none', hover = true, interactive = false, ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    const glowClasses = {
      rose: 'shadow-glow-rose',
      violet: 'shadow-glow-violet',
      emerald: 'shadow-glow-emerald',
      none: '',
    };

    return (
      <div
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'card-premium rounded-3xl transition-premium',
          hover && 'hover:scale-[1.02] hover:shadow-xl',
          interactive && 'cursor-pointer active:scale-[0.98] touch-manipulation',
          glow !== 'none' && glowClasses[glow],
          isHovered && glow !== 'none' && 'scale-[1.02]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCard.displayName = 'PremiumCard';
