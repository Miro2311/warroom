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
        console.error('Error loading user profile:', userError)
        setLoading(false)
        return
      }

      if (userProfile) {
        setUser(userProfile)
        console.log('✅ User profile loaded:', userProfile)

        // 2. Get selected group from localStorage
        const selectedGroupId = localStorage.getItem('selectedGroupId')
        console.log('📦 Selected group ID:', selectedGroupId)

        if (!selectedGroupId) {
          console.warn('⚠️ No group selected')
          setLoading(false)
          return
        }

        // Set current group ID in store for XP system
        setCurrentGroupId(selectedGroupId)

        // 3. Load partners for this user in this group
        console.log('🔍 Loading partners for user:', authUser.id, 'in group:', selectedGroupId)
        const { data: partners, error: partnersError } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', authUser.id)
          .eq('group_id', selectedGroupId)

        console.log('📊 Partners query result:', { partners, error: partnersError })

        if (partnersError) {
          console.error('❌ Error loading partners:', partnersError)
        }

        if (partners) {
          console.log('✅ Setting partners:', partners.length, 'partners found')
          setPartners(partners)
        } else {
          console.warn('⚠️ No partners data returned')
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to load data from DB:', error)
      setLoading(false)
    }
  }
}
