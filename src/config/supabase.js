import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check for environment variables
const hasValidConfig = supabaseUrl && 
                      supabaseAnonKey && 
                      supabaseUrl !== 'your_supabase_project_url' &&
                      supabaseAnonKey !== 'your_supabase_anon_key' &&
                      !supabaseUrl.includes('your_supabase') && 
                      !supabaseAnonKey.includes('your_supabase') &&
                      supabaseUrl.startsWith('http') &&
                      supabaseAnonKey.startsWith('eyJ')

if (!hasValidConfig) {
  // Log warning but don't throw error - allows app to load
  console.warn('⚠️ Missing or invalid Supabase environment variables!')
  console.warn('Current values:', {
    url: supabaseUrl ? 'Set (but may be invalid)' : 'Missing',
    key: supabaseAnonKey ? 'Set (but may be invalid)' : 'Missing'
  })
  console.warn('Please set in Netlify: Site settings → Environment variables')
  console.warn('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

// Create client - use placeholder values if invalid to prevent crashes
// The app will load but authentication won't work until env vars are set
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      persistSession: hasValidConfig,
      autoRefreshToken: hasValidConfig,
      detectSessionInUrl: true,
    },
  }
)

// Log configuration for debugging
if (hasValidConfig) {
  console.log('✅ Supabase client initialized', {
    url: supabaseUrl?.substring(0, 30) + '...',
    keyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
  })
} else {
  console.error('❌ Supabase client NOT properly configured!')
  console.error('URL:', supabaseUrl || 'MISSING')
  console.error('Key:', supabaseAnonKey ? 'Set but invalid' : 'MISSING')
}

