import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
}

/** Shows a verified-account icon when the user has id_verification_status === 'approved'. */
export function VerifiedBadge({ className, size = 'md', title = 'Verifierad användare' }: VerifiedBadgeProps) {
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <span
      className={cn('inline-flex items-center text-primary', className)}
      role="img"
      aria-label={title}
      title={title}
    >
      <BadgeCheck className={sizeClass} />
    </span>
  );
}
