import PostHog from 'posthog-react-native';
import Constants from 'expo-constants';

const apiKey = Constants.expoConfig?.extra?.posthogProjectToken as string | undefined;
const host = Constants.expoConfig?.extra?.posthogHost as string | undefined;
const isPostHogConfigured = !!apiKey && apiKey.length > 0;

if (__DEV__) {
  console.log('[PostHog] config:', { apiKey: apiKey ? 'SET' : 'NOT SET', host: host ? 'SET' : 'NOT SET', isConfigured: isPostHogConfigured });
}

export const posthog = new PostHog(apiKey || 'placeholder_key', {
  ...(host ? { host } : {}),
  disabled: !isPostHogConfigured,
  captureAppLifecycleEvents: true,
  debug: __DEV__,
  flushAt: 20,
  flushInterval: 10000,
});
