import { useMemo } from "react";
import { Text as RNText, View as RNView, type TextProps as RNTextProps, type ViewProps as RNViewProps } from "react-native";
import { useColorScheme } from "./useColorScheme";

type ThemeColorProps = {
  lightColor?: string;
  darkColor?: string;
};

type TextThemedProps = RNTextProps & ThemeColorProps;
type ViewThemedProps = RNViewProps & ThemeColorProps;

function resolveColor(scheme: "light" | "dark", lightColor?: string, darkColor?: string) {
  if (scheme === "dark") return darkColor ?? lightColor;
  return lightColor ?? darkColor;
}

export function Text({ style, lightColor, darkColor, ...rest }: TextThemedProps) {
  const scheme = useColorScheme();

  const colorStyle = useMemo(() => {
    const color = resolveColor(scheme, lightColor, darkColor);
    return color ? [{ color }] : undefined;
  }, [scheme, lightColor, darkColor]);

  return <RNText {...rest} style={[colorStyle, style]} />;
}

export function View({ style, lightColor, darkColor, ...rest }: ViewThemedProps) {
  const scheme = useColorScheme();

  const bgStyle = useMemo(() => {
    const color = resolveColor(scheme, lightColor, darkColor);
    return color ? [{ backgroundColor: color }] : undefined;
  }, [scheme, lightColor, darkColor]);

  return <RNView {...rest} style={[bgStyle, style]} />;
}

