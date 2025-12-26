import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission | 'default';
  loading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    permission: 'default',
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Check if push notifications are supported
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    
    setState(prev => ({
      ...prev,
      isSupported,
      permission: isSupported ? Notification.permission : 'default',
    }));
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications are not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission, loading: false }));
      
      if (permission === 'granted') {
        // Show a test notification
        new Notification('MÄÄK', {
          body: 'Du kommer nu få notiser om nya matchningar!',
          icon: '/pwa-192x192.png',
        });
        return true;
      }
      
      return false;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Kunde inte aktivera notifikationer' 
      }));
      return false;
    }
  }, [state.isSupported]);

  const sendLocalNotification = useCallback((title: string, body: string, data?: any) => {
    if (state.permission !== 'granted') return;
    
    try {
      new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        data,
        tag: data?.type || 'general',
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }, [state.permission]);

  return {
    ...state,
    requestPermission,
    sendLocalNotification,
  };
}
