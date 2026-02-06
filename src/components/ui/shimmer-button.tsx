import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'glass';
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'icon';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  shimmer?: boolean;
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  ({ children, variant = 'primary', size = 'default', className, disabled, loading, icon: Icon, shimmer = true, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-primary-foreground shadow-glow-primary hover:opacity-90',
      secondary: 'bg-secondary text-secondary-foreground shadow-card hover:bg-secondary/80',
      accent: 'bg-accent text-accent-foreground shadow-glow-violet hover:opacity-90',
      outline: 'border-2 border-border bg-card/80 backdrop-blur-sm hover:border-primary hover:bg-primary/5 text-foreground',
      ghost: 'bg-transparent hover:bg-muted/80 text-foreground',
      danger: 'bg-destructive text-destructive-foreground shadow-glow-rose hover:opacity-90',
      glass: 'bg-card/20 backdrop-blur-xl border border-border text-foreground hover:bg-card/30',
    };
    const sizes = { 
      xs: 'px-3 py-2 text-xs rounded-lg gap-1.5 min-h-[36px]', 
      sm: 'px-4 py-2.5 text-sm rounded-xl gap-2 min-h-[40px]', 
      default: 'px-6 py-3 rounded-2xl font-medium gap-2 min-h-[44px]', 
      lg: 'px-8 py-4 text-lg rounded-2xl font-semibold gap-3 min-h-[56px]', 
      icon: 'p-3 rounded-xl min-h-[44px] min-w-[44px]' 
    };
    
    return (
      <button 
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden transition-all duration-300 ease-out',
          'hover:scale-[1.02] active:scale-[0.98] touch-manipulation',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variants[variant], 
          sizes[size], 
          className
        )} 
        disabled={disabled || loading} 
        {...props}
      >
        {/* Shimmer effect */}
        {shimmer && variant !== 'outline' && variant !== 'ghost' && (
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        )}
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {Icon && !loading && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  }
);

ShimmerButton.displayName = 'ShimmerButton';
