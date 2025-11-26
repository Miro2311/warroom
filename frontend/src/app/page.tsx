'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import SolarSystem from '@/components/canvas/SolarSystem'
import { Loader2 } from 'lucide-react'
import { LevelUpModal } from '@/components/ui/LevelUpModal'
import { useStore } from '@/store/useStore'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { levelUpResult, showLevelUpModal, setShowLevelUpModal } = useStore()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user) {
      const selectedGroupId = localStorage.getItem('selectedGroupId')
      if (!selectedGroupId) {
        router.push('/dashboard')
      }
    }
  }, [user, router])

  if (authLoading || !user) {
    return (
      <div className="min-h-screen-safe w-full bg-deep-void flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-holo-cyan animate-spin" />
      </div>
    )
  }

  return (
    <main className="w-screen h-screen-safe overflow-hidden relative safe-bottom">
      <div className="w-full h-full">
        <SolarSystem />
      </div>

      {/* UI Overlay */}
      <div className="absolute bottom-4 right-4 z-10 text-right pointer-events-none opacity-70">
        <p className="text-xs text-white font-display tracking-widest uppercase">Relationship War Room</p>
        <p className="text-[10px] text-holo-cyan font-mono mt-1">System: Active // Monitoring</p>
      </div>

      {/* Level Up Modal */}
      <LevelUpModal
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        result={levelUpResult}
      />
    </main>
  )
}
