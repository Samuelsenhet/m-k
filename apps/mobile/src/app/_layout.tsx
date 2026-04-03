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
import { Stack, useGlobalSearchParams, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import 'react-native-reanimated';

/** react-i18next + React 19 JSX: FC return type includes Promise<ReactNode>; cast at root only. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- upstream I18nextProvider vs @types/react 19
const I18nRoot = I18nextProvider as any;

import { useColorScheme } from '@/components/useColorScheme';
import { trackScreenView } from '@/lib/analytics';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
void SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore: splash may already be hidden in some startup paths.
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
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

  // Do not hard-crash production if custom font loading fails.
  // We can safely continue with system font fallback.
  useEffect(() => {
    if (playfairError || monoError) {
      console.error(
        '[startup] font load failed, continuing with fallback fonts',
        playfairError ?? monoError,
      );
    }
  }, [playfairError, monoError]);

  useEffect(() => {
    if (loaded && i18nReady) {
      void SplashScreen.hideAsync();
    }
  }, [loaded, i18nReady]);

  if (!loaded || !i18nReady) {
    // iOS: spinner must contrast with background (default gray on white is nearly invisible in light mode).
    const bootBg = colorScheme === "dark" ? "#000000" : "#FFFFFF";
    const bootTint = colorScheme === "dark" ? "#EBEBF5" : "#3C3C43";
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: bootBg,
        }}
      >
        <ActivityIndicator size="large" color={bootTint} />
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  useEffect(() => {
    trackScreenView({
      pathname,
      params: { ...params },
    });
  }, [pathname, params]);

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
