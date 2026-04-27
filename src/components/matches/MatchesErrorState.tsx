import { useEffect, useState } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';
import { CardV2, CardV2Content, CardV2Header, CardV2Title, ButtonPrimary } from '@/components/ui-v2';
import { BottomNav } from '@/components/navigation/BottomNav';
import { SCREEN_CONTAINER_CLASS } from '@/layout/screenLayout';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

function getTimeRemainingUntil(iso: string | undefined): string {
  if (!iso) return '24h';
  const now = Date.now();
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return '24h';
  const diff = end - now;
  if (diff <= 0) return '0m';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export interface MatchesErrorStateProps {
  /** Short title, e.g. "We're having trouble loading matches" */
  message: string;
  /** Reassurance line, e.g. "Something went wrong – I'll try again" */
  reassure?: string;
  /** Optional detail (e.g. error string from backend) */
  detail?: string;
  /** Retry button label */
  retryLabel?: string;
  onRetry: () => void;
  /** ISO timestamp for next match run – shows "Xh Ym till dina matchningar är redo" card. If omitted, next midnight is used. */
  nextMatchAvailable?: string;
}

/**
 * Error state for Matches when backend returns 401/5xx.
 * Shows 24h countdown card + mascot + error card with retry.
 */
export function MatchesErrorState({
  message,
  reassure,
  detail,
  retryLabel = 'Försök igen',
  onRetry,
  nextMatchAvailable,
}: MatchesErrorStateProps) {
  const { t } = useTranslation();
  const mascot = useMascot(MASCOT_SCREEN_STATES.LANDING_PROBLEM);

  const defaultNext = typeof nextMatchAvailable === 'string' ? nextMatchAvailable : (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  })();
  const [timeRemaining, setTimeRemaining] = useState(() => getTimeRemainingUntil(defaultNext));

  useEffect(() => {
    const update = () => setTimeRemaining(getTimeRemainingUntil(defaultNext));
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [defaultNext]);

  return (
    <>
      <div className={cn('min-h-screen gradient-hero flex flex-col items-center justify-center pb-24', SCREEN_CONTAINER_CLASS)}>
        <div className="w-full max-w-lg space-y-6">
          {mascot.shouldShow && <Mascot {...mascot} />}

          {/* Main card – same structure as WaitingPhase: title, nested countdown block, then CTA */}
          <CardV2 padding="none" className="rounded-3xl border border-primary/20 bg-card shadow-elevation-1">
            <CardV2Header className="text-center p-6 pb-0">
              <CardV2Title className="text-2xl font-heading">{message}</CardV2Title>
              {reassure && (
                <p className="text-sm text-muted-foreground mt-2">{reassure}</p>
              )}
            </CardV2Header>
            <CardV2Content className="p-6 pt-4 space-y-6">
              {/* Nested countdown block – same style as WaitingPhase (clock + time + "till dina matchningar är redo") */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold text-primary tabular-nums">{timeRemaining}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('matches.until_ready', 'till dina matchningar är redo')}
                  </div>
                </div>
              </div>

              {detail && (
                <p className="text-xs text-muted-foreground text-center">{detail}</p>
              )}
              <ButtonPrimary onClick={onRetry} className="w-full gap-2 rounded-2xl" size="lg">
                <RefreshCw className="w-4 h-4" />
                {retryLabel}
              </ButtonPrimary>
            </CardV2Content>
          </CardV2>
        </div>
      </div>
      <BottomNav />
    </>
  );
}
