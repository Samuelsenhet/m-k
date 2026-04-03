import { Text as RNText, type TextProps as RNTextProps } from "react-native";

export type MonoTextProps = RNTextProps;

/**
 * Simple monospaced text used by Expo template screens (EditScreenInfo).
 * Font is loaded in `apps/mobile/src/app/_layout.tsx` via `@expo-google-fonts/space-mono`.
 */
export function MonoText({ style, ...rest }: MonoTextProps) {
  return (
    <RNText {...rest} style={[{ fontFamily: "SpaceMono_400Regular" }, style]} />
  );
}

