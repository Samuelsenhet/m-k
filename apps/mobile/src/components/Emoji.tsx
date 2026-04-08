import { Platform, Text, type TextStyle } from "react-native";

const systemFont = Platform.select({ ios: "System", default: "sans-serif" });

/** Renders emoji with the system font so glyphs are visible even when a parent
 *  Text uses a custom font (e.g. Playfair Display) that lacks emoji support. */
export function Emoji({ children, style }: { children: string; style?: TextStyle }) {
  return <Text style={[{ fontFamily: systemFont }, style]}>{children}</Text>;
}
