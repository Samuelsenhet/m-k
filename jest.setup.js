// Jest setup for React Native / Expo tests

// Mock react-native-worklets BEFORE reanimated
jest.mock('react-native-worklets', () => ({
  Worklets: {
    defaultContext: {},
    createContext: jest.fn(),
    createRunOnJS: jest.fn(() => jest.fn()),
    createRunOnUI: jest.fn(() => jest.fn()),
  },
  useWorklet: jest.fn(),
  useSharedValue: jest.fn((init) => ({ value: init })),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    default: {
      call: jest.fn(),
      createAnimatedComponent: (Component) => Component,
      View: require('react-native').View,
      Text: require('react-native').Text,
      Image: require('react-native').Image,
      ScrollView: require('react-native').ScrollView,
      FlatList: require('react-native').FlatList,
    },
    useSharedValue: jest.fn((init) => ({ value: init })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((val) => val),
    withSpring: jest.fn((val) => val),
    withDelay: jest.fn((_, val) => val),
    withSequence: jest.fn((...vals) => vals[0]),
    withRepeat: jest.fn((val) => val),
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      bezier: jest.fn(),
    },
    FadeIn: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
    FadeOut: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })) },
    FadeInUp: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })), delay: jest.fn(() => ({ duration: jest.fn(() => ({})) })) },
    FadeInDown: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })), delay: jest.fn(() => ({ duration: jest.fn(() => ({})) })) },
    FadeInRight: { duration: jest.fn(() => ({ delay: jest.fn(() => ({})) })), delay: jest.fn(() => ({ duration: jest.fn(() => ({})) })) },
    FadeOutUp: { duration: jest.fn(() => ({})) },
    FadeOutDown: { duration: jest.fn(() => ({})) },
    FadeOutLeft: { duration: jest.fn(() => ({})) },
    SlideInRight: { duration: jest.fn(() => ({})) },
    SlideOutLeft: { duration: jest.fn(() => ({})) },
    Layout: { duration: jest.fn(() => ({})) },
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    createAnimatedComponent: (Component) => Component,
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock expo-image
jest.mock('expo-image', () => ({
  Image: require('react-native').Image,
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        expand: jest.fn(),
        close: jest.fn(),
        snapToIndex: jest.fn(),
      }));
      return React.createElement(View, props, props.children);
    }),
    BottomSheetView: View,
    BottomSheetBackdrop: View,
  };
});

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: ({ children }) => children,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '/',
  Stack: {
    Screen: () => null,
  },
}));

// Mock react-native-toast-message
jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
  hide: jest.fn(),
}));

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
};
