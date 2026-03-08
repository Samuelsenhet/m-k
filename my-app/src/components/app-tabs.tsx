import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import React from 'react';
import { useColorScheme, View, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors, BottomTabInset } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList
        asChild
        style={[
          styles.tabList,
          {
            backgroundColor: colors.backgroundElement,
            paddingBottom: BottomTabInset,
          },
        ]}>
        <View>
          <TabTrigger name="home" href="/" asChild>
            <TabButton colors={colors}>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton colors={colors}>Explore</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  colors,
  ...props
}: TabTriggerSlotProps & { colors: (typeof Colors)['light'] }) {
  return (
    <Pressable {...props} style={({ pressed }) => [pressed && styles.pressed]}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButton}>
        <ThemedText
          type="small"
          style={{ color: isFocused ? colors.text : colors.textSecondary }}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
  tabList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pressed: {
    opacity: 0.8,
  },
});
