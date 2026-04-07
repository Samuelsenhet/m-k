import { maakTokens } from "@maak/core";
import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const CONFETTI_COLORS = [
  maakTokens.primary,
  maakTokens.coral,
  "#FBBF24", // gold
  "#60A5FA", // blue
  maakTokens.sage,
  "#A78BFA", // purple
  "#34D399", // emerald
  "#FB923C", // orange
];

const PIECE_COUNT = 40;

type Piece = {
  x: number;
  delay: number;
  color: string;
  size: number;
  rotation: number;
  shape: "square" | "circle" | "strip";
};

function ConfettiPiece({ piece, screenHeight }: { piece: Piece; screenHeight: number }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      piece.delay,
      withTiming(screenHeight + 40, { duration: 2200 + Math.random() * 800, easing: Easing.out(Easing.quad) }),
    );
    translateX.value = withDelay(
      piece.delay,
      withTiming((Math.random() - 0.5) * 120, { duration: 2200 }),
    );
    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 360 * (1 + Math.random()), { duration: 2500 }),
    );
    opacity.value = withDelay(
      piece.delay + 1600,
      withTiming(0, { duration: 600 }),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: `translateY(${translateY.value}px) translateX(${translateX.value}px) rotate(${rotate.value}deg)`,
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute" as const,
          left: piece.x,
          top: -10,
          width: piece.shape === "strip" ? piece.size * 0.4 : piece.size,
          height: piece.shape === "strip" ? piece.size * 1.5 : piece.size,
          backgroundColor: piece.color,
          borderRadius: piece.shape === "circle" ? piece.size / 2 : 2,
        },
        style,
      ]}
    />
  );
}

type Props = {
  active: boolean;
  onComplete?: () => void;
};

export function ConfettiCannon({ active, onComplete }: Props) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const pieces = useMemo<Piece[]>(() => {
    if (!active) return [];
    const shapes: Piece["shape"][] = ["square", "circle", "strip"];
    return Array.from({ length: PIECE_COUNT }, () => ({
      x: Math.random() * screenWidth,
      delay: Math.random() * 500,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));
  }, [active, screenWidth]);

  useEffect(() => {
    if (!active || !onComplete) return;
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, i) => (
        <ConfettiPiece key={i} piece={piece} screenHeight={screenHeight} />
      ))}
    </View>
  );
}
