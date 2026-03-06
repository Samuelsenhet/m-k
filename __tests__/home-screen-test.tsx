import { render } from '@testing-library/react-native';

import HomeScreen, { CustomText } from '@/app/index';

// Avoid expo-router Link zoom context crashing in Jest (Context.Consumer / "render is not a function")
jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Link: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

describe('<HomeScreen />', () => {
  test('Text renders correctly on HomeScreen', () => {
    const { getByText } = render(<HomeScreen />);

    getByText('Welcome!');
  });
});
