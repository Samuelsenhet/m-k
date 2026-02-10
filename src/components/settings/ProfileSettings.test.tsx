import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfileSettings } from './ProfileSettings';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const defaultUser = {
  id: 'user-1',
  email: 'test@example.com',
} as unknown as import('@supabase/supabase-js').User;

describe('ProfileSettings', () => {
  it('renders and calls onSignOut when logout is clicked', async () => {
    const onSignOut = vi.fn();
    render(
      <MemoryRouter>
        <ProfileSettings
          open={true}
          onOpenChange={vi.fn()}
          user={defaultUser}
          displayName={null}
          isModerator={false}
          onOpenAchievements={vi.fn()}
          onOpenNotifications={vi.fn()}
          onOpenPrivacy={vi.fn()}
          onSignOut={onSignOut}
          onDeleteAccount={vi.fn()}
          isDeleting={false}
        />
      </MemoryRouter>
    );

    const logoutButton = screen.getByRole('button', { name: /settings\.logout/i });
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
