'use client'

import { useState } from 'react'
import AuthForm from '@/components/auth/AuthForm'
import { useAuth } from '@/contexts/AuthContext'
import { StarsBackground } from '@/components/ui/stars-background'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const { signIn, signUp } = useAuth()

  const handleAuth = async (email: string, password: string, username?: string) => {
    if (mode === 'login') {
      return await signIn(email, password)
    } else {
      return await signUp(email, password, username || '')
    }
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }

  return (
    <div className="min-h-screen-safe w-full bg-black flex items-center justify-center relative overflow-hidden safe-all">
      {/* Stars Background */}
      <StarsBackground factor={0.00005} speed={30} starColor="#ffffff" />

      {/* Logo/Title at top */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-10">
        <h1 className="text-6xl font-bold text-white font-display tracking-wider">
          RWR
        </h1>
        <p className="text-xs text-gray-400 font-mono mt-2 tracking-widest">
          RELATIONSHIP WAR ROOM
        </p>
      </div>

      {/* Auth Form */}
      <div className="relative z-10">
        <AuthForm mode={mode} onSubmit={handleAuth} onModeChange={toggleMode} />
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 right-6 text-right opacity-50 z-10">
        <p className="text-[10px] text-gray-400 font-mono tracking-widest">
          SYSTEM: ONLINE // AUTH REQUIRED
        </p>
      </div>
    </div>
  )
}
