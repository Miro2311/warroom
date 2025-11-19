import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('🌱 Seeding mock data from frontend...\n')

try {
  // 1. User erstellen (exakt wie MOCK_USER)
  console.log('📝 Creating user "Agent007"...')
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      username: 'Agent007',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Agent007',
      current_xp: 1250,
      level: 5
    })
    .select()
    .single()

  if (userError) {
    console.error('❌ User creation failed:', userError.message)
    throw userError
  }
  console.log('✓ User created:', user.username, `| Level ${user.level} | XP: ${user.current_xp}`)

  // 2. Group erstellen
  console.log('\n📝 Creating group...')
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: 'The War Room',
      invite_code: 'AGENT007'
    })
    .select()
    .single()

  if (groupError) {
    console.error('❌ Group creation failed:', groupError.message)
    throw groupError
  }
  console.log('✓ Group created:', group.name)

  // 3. User zur Group hinzufügen
  console.log('\n📝 Adding user to group...')
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin'
    })

  if (memberError) {
    console.error('❌ Group member creation failed:', memberError.message)
    throw memberError
  }
  console.log('✓ User added to group')

  // 4. Partners erstellen (exakt wie MOCK_PARTNERS)
  console.log('\n📝 Creating partners...')

  const mockPartners = [
    {
      user_id: user.id,
      group_id: group.id,
      nickname: 'The Barista',
      status: 'Talking',
      financial_total: 45,
      time_total: 3, // 3 Stunden
      intimacy_score: 3
    },
    {
      user_id: user.id,
      group_id: group.id,
      nickname: 'Gym Crush',
      status: "It's Complicated",
      financial_total: 120,
      time_total: 10, // 10 Stunden
      intimacy_score: 7
    }
  ]

  const { data: partners, error: partnersError } = await supabase
    .from('partners')
    .insert(mockPartners)
    .select()

  if (partnersError) {
    console.error('❌ Partners creation failed:', partnersError.message)
    throw partnersError
  }

  console.log(`✓ Created ${partners.length} partners:`)
  partners.forEach(p => {
    const simpIndex = ((p.financial_total + (p.time_total * 20)) / p.intimacy_score).toFixed(0)
    console.log(`   - ${p.nickname} (${p.status}) - Simp Index: ${simpIndex}`)
  })

  console.log('\n🎉 Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   User ID: ${user.id}`)
  console.log(`   Group ID: ${group.id}`)
  console.log(`   Partners: ${partners.length}`)
  console.log('\n✅ Frontend is now ready to load data from DB!')

} catch (error) {
  console.error('\n💥 Seeding failed:', error.message)
  console.log('\nℹ️  This might be due to:')
  console.log('   1. Row Level Security (RLS) blocking inserts')
  console.log('   2. Missing tables in database')
  console.log('   3. Incorrect credentials')
  console.log('\n💡 Solution: Disable RLS for now or update policies')
  process.exit(1)
}
