import * as WebBrowser from "expo-web-browser";
import { Alert, InteractionManager, Platform } from "react-native";
import { i18n } from "@/lib/i18n";

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Open an external URL in an in-app browser, safely.
 *
 * On iOS, opening WebBrowser from inside (or right after closing) a React Native Modal
 * can leave a transparent overlay that "freezes" the app. To avoid this we:
 * - run an optional `beforeOpen()` (e.g. close a sheet)
 * - wait for interactions + a tiny delay (allows Modal to unmount)
 * - then open the browser
 */
export async function openExternalUrl(
  url: string,
  opts?: {
    beforeOpen?: () => void;
    title?: string;
  },
): Promise<void> {
  try {
    opts?.beforeOpen?.();

    // Let the UI apply state updates (Modal close) before presenting WebBrowser.
    await new Promise<void>((resolve) => InteractionManager.runAfterInteractions(() => resolve()));
    await wait(Platform.OS === "ios" ? 80 : 0);

    await WebBrowser.openBrowserAsync(url);
  } catch (e) {
    if (__DEV__) console.warn("[openExternalUrl]", e);
    Alert.alert(opts?.title ?? i18n.t("common.error"), i18n.t("common.link_open_failed"));
  }
}

