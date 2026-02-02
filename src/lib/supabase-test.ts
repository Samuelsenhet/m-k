/**
 * Utility to test Supabase connection and edge functions
 * Use this in browser console: window.testSupabase()
 */

// Helper to get Supabase URL from multiple sources
function getSupabaseUrl(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

  // If URL is provided and valid, use it
  if (url && 
      url.startsWith('https://') && 
      url.includes('.supabase.co') &&
      !url.includes('your_project') &&
      !url.includes('placeholder')) {
    return url;
  }

  // Try to construct from project ID
  if (projectId && 
      !projectId.includes('your_project') &&
      !projectId.includes('placeholder')) {
    return `https://${projectId}.supabase.co`;
  }

  return null;
}

export async function testSupabaseConnection() {
  const url = getSupabaseUrl();
  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  console.log('🔍 Testing Supabase Connection...\n');

  // Check env vars
  if (!url || !anon) {
    console.error('❌ Missing environment variables');
    console.log('📝 You need to set either:');
    console.log('   - VITE_SUPABASE_URL (full URL)');
    console.log('   - OR VITE_SUPABASE_PROJECT_ID (project ID only)');
    console.log('   - AND VITE_SUPABASE_PUBLISHABLE_KEY\n');
    return { success: false, error: 'Missing environment variables' };
  }

  // Check for placeholders
  const isPlaceholder = 
    url.includes('your_project') || 
    url.includes('your-project') ||
    url.includes('placeholder') ||
    anon.includes('your_anon') ||
    anon.includes('your-anon') ||
    anon.includes('placeholder') ||
    anon.length < 20;

  if (isPlaceholder) {
    console.error('❌ Placeholder values detected in .env file');
    console.log('📝 Please update your .env file with real values from:');
    console.log('   https://supabase.com/dashboard → Settings → API\n');
    return { success: false, error: 'Placeholder values detected' };
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${url.substring(0, 30)}...`);
  console.log(`   Key: ${anon.substring(0, 20)}...\n`);

  // Test basic connection (401 is normal without proper auth, just checking if URL is reachable)
  try {
    console.log('🔗 Testing basic connection...');
    const healthCheck = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': anon,
      },
    });
    
    // 401 is actually OK - it means the server is reachable, just needs auth
    // 404 would mean wrong URL, network errors mean unreachable
    if (healthCheck.status === 401 || healthCheck.status === 200) {
      console.log('✅ Supabase URL is reachable (401 is normal without auth)\n');
    } else if (healthCheck.status === 404) {
      console.warn(`⚠️  URL might be incorrect (404). Check your Supabase URL.\n`);
    } else {
      console.warn(`⚠️  Connection returned status: ${healthCheck.status}\n`);
    }
  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.log('💡 This might mean:');
    console.log('   - Supabase project is paused (check dashboard)');
    console.log('   - Network connectivity issue');
    console.log('   - URL is incorrect\n');
    return { success: false, error: 'Connection failed', details: error };
  }

  // Test edge functions
  const functions = ['twilio-send-otp', 'twilio-verify-otp'];
  const results: Record<string, boolean> = {};

  for (const func of functions) {
    try {
      console.log(`🔧 Testing edge function: ${func}...`);
      const response = await fetch(`${url}/functions/v1/${func}`, {
        method: 'OPTIONS', // CORS preflight
        headers: {
          'Authorization': `Bearer ${anon}`,
        },
      });

      // 200, 204, or even 401/403 means the function exists (CORS is working)
      // Network errors mean function doesn't exist or CORS is blocking
      if (response.ok || response.status === 200 || response.status === 204 || response.status === 401 || response.status === 403) {
        console.log(`✅ ${func} is deployed and accessible`);
        results[func] = true;
      } else if (response.status === 404) {
        console.warn(`⚠️  ${func} returned 404 - function may not be deployed`);
        results[func] = false;
      } else {
        console.warn(`⚠️  ${func} returned status: ${response.status}`);
        results[func] = false;
      }
    } catch (error) {
      console.error(`❌ ${func} failed:`, error);
      results[func] = false;
    }
  }

  const allFunctionsWorking = Object.values(results).every(r => r);
  
  if (allFunctionsWorking) {
    console.log('\n✅ All edge functions are accessible!');
    return { success: true, functions: results };
  } else {
    console.log('\n⚠️  Some edge functions may not be deployed');
    console.log('📝 To deploy edge functions, run:');
    console.log('   supabase functions deploy twilio-send-otp');
    console.log('   supabase functions deploy twilio-verify-otp\n');
    return { success: false, functions: results };
  }
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as unknown as { testSupabase?: () => Promise<unknown> }).testSupabase = testSupabaseConnection;
}
