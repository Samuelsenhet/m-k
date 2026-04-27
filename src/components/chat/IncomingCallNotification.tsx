import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface IncomingCallNotificationProps {
  callerName: string;
  callerAvatarUrl?: string | null;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  callerName,
  callerAvatarUrl,
  onAccept,
  onDecline,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95 backdrop-blur-md">
      {/* Blurred dark overlay – Kemi-Check incoming style */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-950/90" aria-hidden />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-12 pb-8">
        {/* Caller avatar – large circle, MSN/MÄÄK style */}
        <Avatar className="h-32 w-32 rounded-full border-4 border-primary/40 shadow-2xl ring-4 ring-white/10 mb-6">
          {callerAvatarUrl && <AvatarImage src={callerAvatarUrl} alt={callerName} />}
          <AvatarFallback className="bg-primary/30 text-primary-foreground text-4xl font-bold">
            {callerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="text-xl font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-sans), Tahoma, Arial, sans-serif' }}>
          {callerName}
        </p>
        <p className="text-sm text-white/80">{t('chat.incomingCall')}</p>
      </div>

      {/* Bottom: slide to answer + decline */}
      <div className="relative px-6 pb-10 safe-area-bottom space-y-4">
        {/* Slide to answer – green button with phone icon, MÄÄK primary */}
        <button
          type="button"
          onClick={onAccept}
          className={cn(
            'w-full flex items-center justify-center gap-3 rounded-2xl py-4 px-6',
            'bg-primary hover:bg-primary/90 text-primary-foreground font-medium',
            'shadow-lg shadow-primary/25 transition-all active:scale-[0.98]'
          )}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Phone className="h-6 w-6" />
          </span>
          <span>{t('chat.slideToAnswer')}</span>
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="w-full flex items-center justify-center gap-2 py-3 text-white/70 hover:text-white text-sm font-medium transition-colors"
        >
          <PhoneOff className="h-4 w-4" />
          {t('chat.decline')}
        </button>
      </div>
    </div>
  );
};
