/**
 * Centralized Supabase URL helper
 * Constructs URL from multiple possible sources
 */

export function getSupabaseUrl(): string {
  // Try direct URL first
  const url = import.meta.env.VITE_SUPABASE_URL;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  // If URL is provided and valid, use it
  if (url && 
      url.startsWith('https://') && 
      url.includes('.supabase.co') &&
      !url.includes('your_project') &&
      !url.includes('your-project') &&
      !url.includes('placeholder')) {
    return url;
  }

  // Try to construct from project ID
  if (projectId && 
      !projectId.includes('your_project') &&
      !projectId.includes('your-project') &&
      !projectId.includes('placeholder')) {
    return `https://${projectId}.supabase.co`;
  }

  // Fallback - will be caught by validation
  return '';
}

export function validateSupabaseConfig(): { valid: boolean; url: string; error?: string } {
  const url = getSupabaseUrl();
  const anon =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!url) {
    return {
      valid: false,
      url: '',
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID'
    };
  }

  if (!anon || anon.includes('your_anon') || anon.includes('placeholder') || anon.length < 20) {
    return {
      valid: false,
      url,
      error: 'Missing or invalid VITE_SUPABASE_PUBLISHABLE_KEY'
    };
  }

  return { valid: true, url };
}
