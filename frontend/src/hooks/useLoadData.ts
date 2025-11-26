'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/contexts/AuthContext'

export function useLoadData() {
  const { setUser, setPartners, setLoading, setCurrentGroupId } = useStore()
  const { user: authUser } = useAuth()

  useEffect(() => {
    if (authUser) {
      loadDataFromDB()
    }
  }, [authUser])

  async function loadDataFromDB() {
    if (!authUser) return

    try {
      setLoading(true)

      // 1. Load user profile from public.users table
      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userError) {
        // If error is PGRST116 (no rows returned), it means profile doesn't exist
        // Try to create it (this is expected for new users)
        if (userError.code === 'PGRST116') {
          const { data: newProfile } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              username: authUser.email?.split('@')[0] || 'User',
              current_xp: 0,
              level: 1,
            })
            .select()
            .single()

          if (newProfile) {
            setUser(newProfile)
          }
        }
        // Silently ignore all other errors (often RLS permission issues)

        setLoading(false)
        return
      }

      if (userProfile) {
        setUser(userProfile)

        // 2. Get selected group from localStorage
        const selectedGroupId = localStorage.getItem('selectedGroupId')

        if (!selectedGroupId) {
          setLoading(false)
          return
        }

        // Set current group ID in store for XP system
        setCurrentGroupId(selectedGroupId)

        // 3. Get all user IDs who are members of the current group
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', selectedGroupId)

        const memberUserIds = groupMembers?.map(m => m.user_id) || [authUser.id]

        // 4. Load ALL partners owned by users in this group
        // Partners are GLOBAL - they belong to a user, not a group
        // We show all partners from all users who are in this group
        const { data: partners } = await supabase
          .from('partners')
          .select('*')
          .in('user_id', memberUserIds)

        if (partners) {
          // Deduplicate by user_id + nickname (in case of legacy duplicates)
          const uniquePartners = new Map<string, typeof partners[0]>()

          // Sort by last_updated_at descending to keep most recent
          const sortedPartners = [...partners].sort(
            (a, b) => new Date(b.last_updated_at).getTime() - new Date(a.last_updated_at).getTime()
          )

          for (const partner of sortedPartners) {
            const key = `${partner.user_id}:${partner.nickname.toLowerCase()}`
            if (!uniquePartners.has(key)) {
              uniquePartners.set(key, partner)
            }
          }

          setPartners(Array.from(uniquePartners.values()))
        }
      }

      setLoading(false)
    } catch (error) {
      // Silently ignore errors
      setLoading(false)
    }
  }
}
