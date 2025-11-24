'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Plus, Users, LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { StarsBackground } from '@/components/ui/stars-background'

interface Group {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const router = useRouter()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      loadGroups()
    }
  }, [user])

  const loadGroups = async () => {
    setLoading(true)

    console.log('=== LOADING GROUPS DEBUG ===')
    console.log('User ID:', user?.id)

    // Get all groups where the user is a member
    const { data: memberData, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user?.id)

    console.log('Member data:', memberData)
    console.log('Member error:', memberError)

    if (memberData && memberData.length > 0) {
      const groupIds = memberData.map((m) => m.group_id)
      console.log('Group IDs:', groupIds)

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false })

      console.log('Groups data:', groupsData)
      console.log('Groups error:', groupsError)

      setGroups(groupsData || [])
    } else {
      console.log('No member data found')
    }

    setLoading(false)
  }

  const createGroup = async () => {
    if (!newGroupName.trim() || !user) return

    setCreating(true)

    try {
      // Generate invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      // Debug: Check auth session
      const { data: { session } } = await supabase.auth.getSession()
      console.log('=== GROUP CREATION DEBUG ===')
      console.log('User from context:', user?.id)
      console.log('Session exists:', !!session)
      console.log('Session user:', session?.user?.id)
      console.log('Access token exists:', !!session?.access_token)
      console.log('Creating group with name:', newGroupName, 'and code:', inviteCode)

      // Create group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName,
          invite_code: inviteCode,
        })
        .select()
        .single()

      if (groupError) {
        console.error('Error creating group:', groupError)
        console.error('Full error details:', JSON.stringify(groupError, null, 2))
        alert(`Failed to create group: ${groupError.message || 'Unknown error'}`)
        setCreating(false)
        return
      }

      console.log('Group created successfully:', groupData)

      // Add creator as member - CRITICAL: This must succeed or group is orphaned
      const { error: memberError } = await supabase.from('group_members').insert({
        group_id: groupData.id,
        user_id: user.id,
        role: 'admin',
      })

      if (memberError) {
        console.error('Error adding member:', memberError)

        // CLEANUP: Delete the orphaned group since creator is not a member
        console.log('Attempting to cleanup orphaned group...')
        const { error: deleteError } = await supabase
          .from('groups')
          .delete()
          .eq('id', groupData.id)

        if (deleteError) {
          console.error('Failed to cleanup orphaned group:', deleteError)
          alert(
            `CRITICAL: Group was created but you were not added as member. ` +
            `Group ID: ${groupData.id}. Please contact support or manually delete this group.`
          )
        } else {
          console.log('Orphaned group cleaned up successfully')
          alert(
            `Failed to add you as group member. The group was automatically deleted. ` +
            `Error: ${memberError.message}. Please try again.`
          )
        }

        setCreating(false)
        return
      }

      console.log('Member added successfully')

      // Success - reset form and reload groups
      setNewGroupName('')
      setShowCreateModal(false)
      setCreating(false)

      // Wait a moment before reloading to ensure DB consistency
      await new Promise(resolve => setTimeout(resolve, 500))
      loadGroups()
    } catch (err) {
      console.error('Unexpected error:', err)
      alert(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setCreating(false)
    }
  }

  const joinGroup = async () => {
    if (!inviteCode.trim() || !user) return

    setJoining(true)

    try {
      // Find group by invite code
      const { data: groupData, error: findError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

      if (findError || !groupData) {
        console.error('Error finding group:', findError)
        alert('Invalid invite code')
        setJoining(false)
        return
      }

      // Check if already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupData.id)
        .eq('user_id', user.id)
        .single()

      // Ignore PGRST116 error (no rows found) - this is expected for new members
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking membership:', checkError)
        alert(`Error checking group membership: ${checkError.message}`)
        setJoining(false)
        return
      }

      if (existingMember) {
        alert('You are already a member of this group')
        setJoining(false)
        return
      }

      // Add as member
      const { error: insertError } = await supabase.from('group_members').insert({
        group_id: groupData.id,
        user_id: user.id,
        role: 'member',
      })

      if (insertError) {
        console.error('Error joining group:', insertError)
        alert(
          `Failed to join group: ${insertError.message}. ` +
          `Please try again or contact support if the problem persists.`
        )
        setJoining(false)
        return
      }

      console.log('Successfully joined group:', groupData.name)

      // Success - reset form and reload groups
      setInviteCode('')
      setShowJoinModal(false)
      setJoining(false)

      // Wait a moment before reloading to ensure DB consistency
      await new Promise(resolve => setTimeout(resolve, 500))
      loadGroups()
    } catch (err) {
      console.error('Unexpected error joining group:', err)
      alert(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setJoining(false)
    }
  }

  const selectGroup = (groupId: string) => {
    // Store selected group in localStorage for the main app
    localStorage.setItem('selectedGroupId', groupId)
    router.push('/')
  }

  const copyInviteCode = async (code: string, groupId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent group selection when clicking code
    try {
      await navigator.clipboard.writeText(code)
      setCopiedGroupId(groupId)
      setTimeout(() => setCopiedGroupId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden">
      {/* Stars Background */}
      <StarsBackground factor={0.00005} speed={30} starColor="#ffffff" />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-display tracking-wider">
              SELECT SOLAR SYSTEM
            </h1>
            <p className="text-xs text-gray-400 font-mono mt-1 tracking-widest">
              CHOOSE A GROUP OR CREATE A NEW ONE
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-white font-mono text-sm transition-colors"
          >
            <LogOut className="h-4 w-4" />
            LOGOUT
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Action buttons */}
        <div className="flex gap-4 mb-8">
          <motion.button
            onClick={() => setShowCreateModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded font-display font-bold transition-all hover:bg-gray-200"
          >
            <Plus className="h-5 w-5" />
            CREATE NEW SYSTEM
          </motion.button>
          <motion.button
            onClick={() => setShowJoinModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-3 bg-black border border-white text-white rounded font-display font-bold transition-all hover:bg-white/5"
          >
            <Users className="h-5 w-5" />
            JOIN WITH CODE
          </motion.button>
        </div>

        {/* Groups grid */}
        {groups.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 font-mono tracking-wider">NO SOLAR SYSTEMS FOUND. CREATE OR JOIN ONE TO START.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, index) => (
              <motion.button
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => selectGroup(group.id)}
                className="bg-black/60 backdrop-blur-sm border border-white/20 hover:border-white rounded-lg p-6 text-left transition-all hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-xs font-mono text-gray-500">
                    {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white font-display mb-2">
                  {group.name}
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
                  <span>CODE:</span>
                  <code
                    onClick={(e) => copyInviteCode(group.invite_code, group.id, e)}
                    className="bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white cursor-pointer transition-colors"
                    title="Click to copy"
                  >
                    {copiedGroupId === group.id ? 'COPIED!' : group.invite_code}
                  </code>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black border border-white/20 rounded-lg p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white font-display mb-4 tracking-wider">
              CREATE NEW SYSTEM
            </h2>
            <p className="text-xs text-gray-400 font-mono mb-6 tracking-widest">
              NAME YOUR SOLAR SYSTEM (FRIEND GROUP)
            </p>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="The Squad"
              className="w-full px-4 py-3 bg-black border border-white/30 rounded text-white font-mono focus:outline-none focus:border-white transition-colors mb-6"
              onKeyDown={(e) => e.key === 'Enter' && createGroup()}
            />
            <div className="flex gap-3">
              <button
                onClick={createGroup}
                disabled={creating || !newGroupName.trim()}
                className="flex-1 bg-white text-black font-bold py-3 rounded font-display hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    CREATING...
                  </>
                ) : (
                  'CREATE'
                )}
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 border border-white/30 text-gray-400 rounded font-mono hover:bg-white/5 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black border border-white/20 rounded-lg p-8 max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold text-white font-display mb-4 tracking-wider">
              JOIN SYSTEM
            </h2>
            <p className="text-xs text-gray-400 font-mono mb-6 tracking-widest">
              ENTER THE INVITE CODE SHARED BY YOUR FRIENDS
            </p>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="ABC123XY"
              className="w-full px-4 py-3 bg-black border border-white/30 rounded text-white font-mono uppercase focus:outline-none focus:border-white transition-colors mb-6"
              onKeyDown={(e) => e.key === 'Enter' && joinGroup()}
            />
            <div className="flex gap-3">
              <button
                onClick={joinGroup}
                disabled={joining || !inviteCode.trim()}
                className="flex-1 bg-white text-black font-bold py-3 rounded font-display hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {joining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    JOINING...
                  </>
                ) : (
                  'JOIN'
                )}
              </button>
              <button
                onClick={() => setShowJoinModal(false)}
                className="px-6 py-3 border border-white/30 text-gray-400 rounded font-mono hover:bg-white/5 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
