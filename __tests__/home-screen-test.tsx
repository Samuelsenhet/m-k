import { render } from '@testing-library/react-native';
import React from 'react';

// Mock hooks before importing component
jest.mock('@/hooks/useMatches', () => ({
  useMatches: () => ({
    matches: [],
    loading: false,
    error: null,
    refreshMatches: jest.fn(),
    likeMatch: jest.fn(),
    passMatch: jest.fn(),
    hasMore: false,
    fetchMoreMatches: jest.fn(),
  }),
}));

jest.mock('@/contexts/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.login_required': 'Du måste logga in',
        'common.login': 'Logga in',
      };
      return translations[key] || key;
    },
  }),
}));

import HomeTab from '@/app/(tabs)/index';

describe('<HomeTab />', () => {
  test('Shows login required when no user', () => {
    const { getByText } = render(<HomeTab />);
    getByText('Du måste logga in');
  });
});
