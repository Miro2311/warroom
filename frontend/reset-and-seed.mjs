import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

console.log('🧹 Cleaning database...\n')

try {
  // 1. Clean tables (cascade will handle foreign keys)
  console.log('🗑️  Deleting old data...')

  await supabase.from('sticky_notes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('assets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('partners').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('group_members').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('groups').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  console.log('✓ Database cleaned\n')

  // 2. User erstellen (exakt wie MOCK_USER)
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

  if (userError) throw userError
  console.log('✓ User created:', user.username, `| Level ${user.level} | XP: ${user.current_xp}`)

  // 3. Group erstellen
  console.log('\n📝 Creating group...')
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name: 'The War Room',
      invite_code: 'AGENT007'
    })
    .select()
    .single()

  if (groupError) throw groupError
  console.log('✓ Group created:', group.name)

  // 4. User zur Group hinzufügen
  console.log('\n📝 Adding user to group...')
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: 'admin'
    })

  if (memberError) throw memberError
  console.log('✓ User added to group')

  // 5. Partners erstellen (exakt wie MOCK_PARTNERS)
  console.log('\n📝 Creating partners...')

  const mockPartners = [
    {
      user_id: user.id,
      group_id: group.id,
      nickname: 'The Barista',
      status: 'Talking',
      financial_total: 45,
      time_total: 3,
      intimacy_score: 3
    },
    {
      user_id: user.id,
      group_id: group.id,
      nickname: 'Gym Crush',
      status: "It's Complicated",
      financial_total: 120,
      time_total: 10,
      intimacy_score: 7
    }
  ]

  const { data: partners, error: partnersError } = await supabase
    .from('partners')
    .insert(mockPartners)
    .select()

  if (partnersError) throw partnersError

  console.log(`✓ Created ${partners.length} partners:`)
  partners.forEach(p => {
    const simpIndex = ((p.financial_total + (p.time_total * 20)) / p.intimacy_score).toFixed(0)
    console.log(`   - ${p.nickname} (${p.status}) - Simp Index: ${simpIndex}`)
  })

  console.log('\n🎉 Reset & Seed completed!')
  console.log('\n📊 Summary:')
  console.log(`   User ID: ${user.id}`)
  console.log(`   Group ID: ${group.id}`)
  console.log(`   Partners: ${partners.length}`)
  console.log('\n✅ Ready to update frontend!')

} catch (error) {
  console.error('\n💥 Failed:', error.message)
  process.exit(1)
}
