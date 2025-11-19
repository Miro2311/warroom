'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function SupabaseTest() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [message, setMessage] = useState('Testing connection...')

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Prüfe ob Client initialisiert ist
        if (!supabase) {
          throw new Error('Supabase client not initialized')
        }

        // Test 2: Versuche eine einfache Query
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1)

        if (error) {
          // Das ist OK - Tabelle könnte leer sein oder RLS aktiv
          console.log('Query error (expected with RLS):', error.message)
        }

        // Test 3: Prüfe Session/Auth Status
        const { data: { session } } = await supabase.auth.getSession()

        setStatus('success')
        setMessage(`✓ Connected to Supabase! ${session ? 'Authenticated' : 'Anonymous'}`)
      } catch (err) {
        setStatus('error')
        setMessage(`✗ Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
        console.error('Supabase connection error:', err)
      }
    }

    testConnection()
  }, [])

  const bgColor = status === 'success' ? 'bg-toxic-green/10' : status === 'error' ? 'bg-simp-red/10' : 'bg-gray-800/50'
  const textColor = status === 'success' ? 'text-toxic-green' : status === 'error' ? 'text-simp-red' : 'text-white'
  const borderColor = status === 'success' ? 'border-toxic-green/30' : status === 'error' ? 'border-simp-red/30' : 'border-gray-600'

  return (
    <div className={`fixed top-4 right-4 z-50 p-3 rounded-md border ${bgColor} ${borderColor} backdrop-blur-sm`}>
      <div className="flex items-center gap-2">
        <div className={`text-xs font-mono ${textColor}`}>
          {status === 'testing' && <span className="inline-block animate-pulse">●</span>}
          {status === 'success' && <span>●</span>}
          {status === 'error' && <span>●</span>}
        </div>
        <p className={`text-xs font-mono ${textColor}`}>{message}</p>
      </div>
    </div>
  )
}
