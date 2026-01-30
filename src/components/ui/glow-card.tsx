import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface GlowCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glowColor?: 'rose' | 'emerald' | 'violet' | 'amber';
  hover?: boolean;
}

export const GlowCard = React.forwardRef<HTMLDivElement, GlowCardProps>(
  ({ children, className, onClick, glowColor = 'rose', hover = true, ...props }, ref) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);

    // Use callback ref to handle both forwarded ref and internal ref
    const setRefs = useCallback((node: HTMLDivElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const element = internalRef.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const glowColors = {
      rose: 'hsl(var(--primary) / 0.2)',
      emerald: 'hsl(var(--byggare) / 0.2)',
      violet: 'hsl(var(--accent) / 0.2)',
      amber: 'hsl(var(--upptackare) / 0.2)',
    };

    return (
      <div
        ref={setRefs}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        className={cn(
          'relative bg-card/90 backdrop-blur-xl rounded-3xl border border-border p-6 transition-all duration-normal touch-manipulation',
          hover && 'hover:border-primary/30 hover:shadow-card hover:-translate-y-1 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          onClick && 'cursor-pointer active:scale-[0.98]',
          className
        )}
        style={{
          background: isHovered
            ? `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${glowColors[glowColor]}, transparent 40%), hsl(var(--card) / 0.9)`
            : undefined
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlowCard.displayName = 'GlowCard';
