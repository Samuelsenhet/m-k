import { Text, type TextStyle } from "react-native";

export function Emoji({ children, style }: { children: string; style?: TextStyle }) {
  return (
    <Text allowFontScaling={false} style={style}>
      {children}
    </Text>
  );
}
