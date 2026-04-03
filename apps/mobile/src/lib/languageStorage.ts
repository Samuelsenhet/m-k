import AsyncStorage from "@react-native-async-storage/async-storage";

/** Same key as inställningar → språk (ProfileSettingsSheet). */
export const LANG_STORAGE_KEY = "@maak/language";

export type StoredAppLanguage = "sv" | "en";

export async function readStoredLanguage(): Promise<StoredAppLanguage | null> {
  try {
    const lng = await AsyncStorage.getItem(LANG_STORAGE_KEY);
    if (lng === "en" || lng === "sv") return lng;
  } catch {
    /* ignore */
  }
  return null;
}
