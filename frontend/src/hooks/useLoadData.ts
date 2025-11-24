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

        // 3. Load ALL partners in this group (not just current user's)
        const { data: partners } = await supabase
          .from('partners')
          .select('*')
          .eq('group_id', selectedGroupId)

        if (partners) {
          setPartners(partners)
        }
      }

      setLoading(false)
    } catch (error) {
      // Silently ignore errors
      setLoading(false)
    }
  }
}
