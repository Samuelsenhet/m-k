import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProfileData } from './useProfileData';

const mockMaybeSingle = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: mockMaybeSingle,
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/profiles', () => ({
  getProfilesAuthKey: vi.fn().mockResolvedValue('id'),
}));

describe('useProfileData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMaybeSingle
      .mockResolvedValueOnce({ data: { archetype: 'DIPLOMAT' }, error: null })
      .mockResolvedValueOnce({ data: { display_name: 'Test User' }, error: null })
      .mockResolvedValueOnce({ data: null, error: null });
  });

  it('returns loading then data when userId is provided', async () => {
    const { result } = renderHook(() => useProfileData('user-123'));

    expect(result.current.loading).toBe(true);
    expect(result.current.archetype).toBe(null);
    expect(result.current.displayName).toBe(null);
    expect(result.current.isModerator).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.archetype).toBe('DIPLOMAT');
    expect(result.current.displayName).toBe('Test User');
    expect(result.current.isModerator).toBe(false);
    expect(typeof result.current.refetch).toBe('function');
  });

  it('returns not loading when userId is undefined', async () => {
    const { result } = renderHook(() => useProfileData(undefined));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.archetype).toBe(null);
    expect(result.current.displayName).toBe(null);
    expect(result.current.isModerator).toBe(null);
  });
});
