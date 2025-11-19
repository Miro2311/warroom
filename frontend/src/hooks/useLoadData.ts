'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export function useLoadData() {
  const { setUser, setPartners, setLoading } = useStore()

  useEffect(() => {
    loadDataFromDB()
  }, [])

  async function loadDataFromDB() {
    try {
      setLoading(true)

      // 1. Load first user (für jetzt nehmen wir den ersten)
      // Später: Load based on auth session
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1)
        .single()

      if (userError) {
        console.warn('No user data available:', userError.message)
        // Set mock data for development
        setUser({
          id: 'dev-user-1',
          username: 'Dev User',
          avatar_url: null,
          current_xp: 0,
          level: 1,
          created_at: new Date().toISOString()
        })
        setLoading(false)
        return
      }

      if (users) {
        setUser(users)

        // 2. Load partners for this user
        const { data: partners, error: partnersError } = await supabase
          .from('partners')
          .select('*')
          .eq('user_id', users.id)

        if (partnersError) {
          console.warn('No partners data available:', partnersError.message)
        }

        if (partners) {
          setPartners(partners)
        }
      }

      setLoading(false)
    } catch (error) {
      console.error('Failed to load data from DB:', error)
      // Set mock data for development
      setUser({
        id: 'dev-user-1',
        username: 'Dev User',
        avatar_url: null,
        current_xp: 0,
        level: 1,
        created_at: new Date().toISOString()
      })
      setLoading(false)
    }
  }
}
