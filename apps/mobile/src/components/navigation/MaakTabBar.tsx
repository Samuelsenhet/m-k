import { maakTokens } from "@maak/core";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";

/**
 * White tab bar + green pill above the active tab (reference screenshots).
 */
export function MaakTabBar(props: BottomTabBarProps) {
  const { state } = props;

  return (
    <View style={styles.outer}>
      <View style={styles.indicatorTrack} pointerEvents="none">
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <View key={route.key} style={styles.indicatorCell}>
              {focused ? <View style={styles.indicator} /> : <View style={styles.indicatorSpacer} />}
            </View>
          );
        })}
      </View>
      <BottomTabBar {...props} style={styles.bar} />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: maakTokens.border,
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
    backgroundColor: maakTokens.primary,
  },
  indicatorSpacer: {
    height: 4,
    width: 40,
  },
  bar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 0,
    elevation: 0,
  },
});
