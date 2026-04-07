import { useThemeTokens } from "@/hooks/useThemeTokens";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

/**
 * Theme-aware tab bar + green pill above the active tab.
 */
export function MaakTabBar(props: BottomTabBarProps) {
  const { state } = props;
  const tokens = useThemeTokens();

  const dynamicStyles = useMemo(
    () => ({
      outer: { backgroundColor: tokens.card, borderTopColor: tokens.border } as const,
      indicator: { backgroundColor: tokens.primary } as const,
      bar: { backgroundColor: tokens.card } as const,
    }),
    [tokens],
  );

  return (
    <View style={[styles.outer, dynamicStyles.outer]}>
      <View style={styles.indicatorTrack} pointerEvents="none">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <View key={route.key} style={styles.indicatorCell}>
              {focused ? (
                <View style={[styles.indicator, dynamicStyles.indicator]} />
              ) : (
                <View style={styles.indicatorSpacer} />
              )}
            </View>
          );
        })}
      </View>
      <BottomTabBar {...props} style={[styles.bar, dynamicStyles.bar]} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  indicatorTrack: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: 4,
    height: 8,
  },
  indicatorCell: {
    flex: 1,
    alignItems: "center",
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  indicatorSpacer: {
    height: 4,
    width: 40,
  },
  bar: {
    borderTopWidth: 0,
    elevation: 0,
  },
});
