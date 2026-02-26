import { RefreshCw } from 'lucide-react';
import { Mascot } from '@/components/system/Mascot';
import { useMascot } from '@/hooks/useMascot';
import { MASCOT_SCREEN_STATES } from '@/lib/mascot';
import { CardV2, CardV2Content, CardV2Header, CardV2Title, ButtonPrimary } from '@/components/ui-v2';
import { BottomNav } from '@/components/navigation/BottomNav';
import { SCREEN_CONTAINER_CLASS } from '@/layout/screenLayout';
import { cn } from '@/lib/utils';

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
}

/**
 * Error state for Matches when backend returns 401/5xx.
 * Same layout as waiting screen: gradient-hero, mascot on top, then one friendly card with retry.
 */
export function MatchesErrorState({
  message,
  reassure,
  detail,
  retryLabel = 'Försök igen',
  onRetry,
}: MatchesErrorStateProps) {
  const mascot = useMascot(MASCOT_SCREEN_STATES.WAITING);

  return (
    <>
      <div className={cn('min-h-screen gradient-hero flex flex-col items-center justify-center pb-24', SCREEN_CONTAINER_CLASS)}>
        <div className="w-full max-w-lg space-y-6">
          {mascot.shouldShow && <Mascot {...mascot} />}
          <p className="text-center text-sm text-muted-foreground">
            Vi förbereder dina matchningar – ibland behöver vi bara ett ögonblick till.
          </p>

          <CardV2 padding="none" className="border border-primary/20">
            <CardV2Header className="text-center p-6 pb-0">
              <CardV2Title className="text-2xl">{message}</CardV2Title>
              {reassure && (
                <p className="text-sm text-muted-foreground mt-2">{reassure}</p>
              )}
            </CardV2Header>
            <CardV2Content className="p-6 pt-4 space-y-4">
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
