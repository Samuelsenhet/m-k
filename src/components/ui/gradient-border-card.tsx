import React from 'react';
import { cn } from '@/lib/utils';

interface GradientBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  gradient?: string;
}

export const GradientBorderCard = React.forwardRef<HTMLDivElement, GradientBorderCardProps>(
  ({ children, className, gradient = 'from-primary to-accent', ...props }, ref) => (
    <div ref={ref} className={cn('relative p-[2px] rounded-3xl bg-gradient-to-r', gradient, className)} {...props}>
      <div className="bg-card rounded-[22px] p-6 h-full">
        {children}
      </div>
    </div>
  )
);

GradientBorderCard.displayName = 'GradientBorderCard';
