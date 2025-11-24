'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { useAuth } from '@/contexts/AuthContext'

async function copyPartnersToNewGroup(userId: string, newGroupId: string) {
  try {
    // Find user's most recent group (that's not the new one)
    const { data: userPartners } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', userId)
      .neq('group_id', newGroupId)
      .order('last_updated_at', { ascending: false })

    if (!userPartners || userPartners.length === 0) {
      console.log('No partners found in other groups to copy')
      return
    }

    // Get the most recent group_id
    const mostRecentGroupId = userPartners[0].group_id

    // Get all partners from that group
    const partnersFromOldGroup = userPartners.filter(p => p.group_id === mostRecentGroupId)

    console.log(`Copying ${partnersFromOldGroup.length} partners from group ${mostRecentGroupId} to ${newGroupId}`)

    // Copy each partner to the new group
    for (const partner of partnersFromOldGroup) {
      const { id, created_at, ...partnerData } = partner

      const newPartner = {
        ...partnerData,
        group_id: newGroupId,
        // Keep all other data (nickname, status, financial_total, etc.)
      }

      const { error } = await supabase
        .from('partners')
        .insert(newPartner)

      if (error) {
        console.error('Error copying partner:', error)
      } else {
        console.log(`Copied partner: ${partner.nickname}`)
      }
    }

    console.log('✅ Successfully copied all partners to new group')
  } catch (error) {
    console.error('Error in copyPartnersToNewGroup:', error)
  }
}

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

        // 3. Check if user has partners in this group
        const { data: existingPartners } = await supabase
          .from('partners')
          .select('*')
          .eq('group_id', selectedGroupId)
          .eq('user_id', authUser.id)

        // If user has no partners in this group, copy from their most recent group
        if (!existingPartners || existingPartners.length === 0) {
          await copyPartnersToNewGroup(authUser.id, selectedGroupId)
        }

        // 4. Load ALL partners in this group (not just current user's)
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
