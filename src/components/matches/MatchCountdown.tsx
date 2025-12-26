import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MatchCountdownProps {
  expiresAt: string;
  className?: string;
}

export function MatchCountdown({ expiresAt, className }: MatchCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Utgången');
        setIsUrgent(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours < 2) {
        setIsUrgent(true);
      } else {
        setIsUrgent(false);
      }

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${minutes}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        isUrgent ? 'text-destructive' : 'text-muted-foreground',
        className
      )}
    >
      <Clock className={cn('w-3 h-3', isUrgent && 'animate-pulse')} />
      <span>{timeLeft}</span>
    </div>
  );
}
