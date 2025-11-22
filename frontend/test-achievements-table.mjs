import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qwtdvbeppohvohkifnxv.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ei0DqgpGOJNb3rBZoDX4Vg_wzv0RIXf';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAchievementsTable() {
  console.log('Testing achievements table...\n');

  // Test 1: Check if we can query the table at all
  console.log('Test 1: Basic table query');
  const { data: allData, error: allError } = await supabase
    .from('achievements')
    .select('*')
    .limit(1);

  if (allError) {
    console.error('Error:', allError);
    console.error('Error code:', allError.code);
    console.error('Error message:', allError.message);
    console.error('Error details:', allError.details);
  } else {
    console.log('Success! Data:', allData);
  }

  console.log('\n---\n');

  // Test 2: Check current auth session
  console.log('Test 2: Check authentication');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('Session error:', sessionError);
  } else if (session) {
    console.log('Authenticated as:', session.user.id);
    console.log('User email:', session.user.email);
  } else {
    console.log('Not authenticated - this is likely the issue!');
  }

  console.log('\n---\n');

  // Test 3: Try to list all tables (if permissions allow)
  console.log('Test 3: Check if table exists');
  const { data: tablesData, error: tablesError } = await supabase
    .rpc('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public');

  if (tablesError) {
    console.log('Could not list tables (expected if RPC not set up)');
  } else {
    console.log('Public tables:', tablesData);
  }
}

testAchievementsTable().catch(console.error);
