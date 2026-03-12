import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

import HomeTab from '@/app/(tabs)/index';

jest.mock('expo-router', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) =>
    React.createElement(Text, props, children),
}));

describe('<HomeTab />', () => {
  test('Text renders correctly on HomeTab', () => {
    const { getByText } = render(<HomeTab />);

    getByText('Välkommen till MĀĀK');
  });
});
