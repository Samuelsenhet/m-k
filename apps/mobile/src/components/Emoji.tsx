import { Platform, Text, type TextStyle } from "react-native";

// Force system font on iOS so emoji characters always use Apple Color Emoji
// fallback, even when nested in parents with custom fonts (Playfair, DM Sans).
// Without this, VS16-requiring emojis (⚔️ 🏛️ 🛡️) render as outlined text-glyphs
// on iOS 17 when the parent font is applied by inheritance.
const IOS_SYSTEM_FONT: TextStyle | null = Platform.OS === "ios" ? { fontFamily: "System" } : null;

export function Emoji({ children, style }: { children: string; style?: TextStyle }) {
  return (
    <Text allowFontScaling={false} style={[IOS_SYSTEM_FONT, style]}>
      {children}
    </Text>
  );
}
