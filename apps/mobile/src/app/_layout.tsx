import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
  useFonts as usePlayfairFonts,
} from '@expo-google-fonts/playfair-display';
import {
  SpaceMono_400Regular,
  useFonts as useSpaceMonoFonts,
} from '@expo-google-fonts/space-mono';
import { SupabaseProvider } from '@/contexts/SupabaseProvider';
import { i18n } from '@/lib/i18n';
import { readStoredLanguage } from '@/lib/languageStorage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import 'react-native-reanimated';

/** react-i18next + React 19 JSX: FC return type includes Promise<ReactNode>; cast at root only. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- upstream I18nextProvider vs @types/react 19
const I18nRoot = I18nextProvider as any;

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [playfairLoaded, playfairError] = usePlayfairFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });
  const [monoLoaded, monoError] = useSpaceMonoFonts({
    SpaceMono_400Regular,
  });
  const loaded = playfairLoaded && monoLoaded;
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const lng = await readStoredLanguage();
        if (lng) await i18n.changeLanguage(lng);
      } catch {
        /* ignore */
      } finally {
        setI18nReady(true);
      }
    })();
  }, []);

  // Expo Router uses Error Boundaries to catch errors thrown by the Layout component.
  useEffect(() => {
    if (playfairError) throw playfairError;
    if (monoError) throw monoError;
  }, [playfairError, monoError]);

  useEffect(() => {
    if (loaded && i18nReady) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, i18nReady]);

  if (!loaded || !i18nReady) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <I18nRoot i18n={i18n}>
      <SupabaseProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="landing" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="phone-auth" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="view-match" options={{ headerShown: false }} />
            <Stack.Screen name="group-chat/[groupId]" options={{ headerShown: false }} />
            <Stack.Screen name="terms" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="reporting" options={{ headerShown: false }} />
            <Stack.Screen name="personality-guide" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="report-history" options={{ headerShown: false }} />
            <Stack.Screen name="report" options={{ headerShown: false }} />
            <Stack.Screen name="appeal" options={{ headerShown: false }} />
            <Stack.Screen name="admin-reports" options={{ headerShown: false }} />
            <Stack.Screen name="achievements" options={{ headerShown: false }} />
            <Stack.Screen name="user/[userId]" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </SupabaseProvider>
    </I18nRoot>
  );
}
