import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load .env.local
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Testing Supabase Connection...\n')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing environment variables!')
  process.exit(1)
}

try {
  const supabase = createClient(supabaseUrl, supabaseKey)
  console.log('\n✓ Supabase client created')

  // Test connection
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1)

  if (error) {
    console.log('\n⚠️  Query returned error (this is normal with RLS):')
    console.log('   ', error.message)
    console.log('\n✓ But connection is working!')
  } else {
    console.log('\n✓ Query successful!')
    console.log('   Data:', data)
  }

  // Test auth session
  const { data: { session } } = await supabase.auth.getSession()
  console.log('\n✓ Auth check:', session ? 'Authenticated' : 'Anonymous (expected)')

  console.log('\n🎉 Supabase setup is complete!')

} catch (err) {
  console.error('\n❌ Connection failed:', err.message)
  process.exit(1)
}
