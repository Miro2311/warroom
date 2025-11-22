'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, LayoutGrid, Trophy } from 'lucide-react'
import { motion } from 'framer-motion'
import { useStore } from '@/store/useStore'

export function DashboardHeader() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const partners = useStore(state => state.partners)

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  // Count graveyard partners
  const graveyardCount = partners.filter(p => p.status === 'Graveyard').length

  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-white font-display drop-shadow-lg tracking-wider">
          RWR <span className="text-xs text-gray-400 font-mono font-normal">v2.0</span>
        </h1>
        {user && (
          <div className="text-sm text-gray-400 font-mono">
            {user.email}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Betting Studio Button */}
        <div className="relative">
          {/* Golden glow around the button */}
          <motion.div
            className="absolute -inset-2 bg-yellow-400/20 blur-xl rounded-lg pointer-events-none"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.button
            onClick={() => {
              // Trigger betting studio panel
              const event = new CustomEvent('open-betting-studio')
              window.dispatchEvent(event)
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/70 border border-yellow-400/40 rounded text-yellow-400 font-mono text-sm transition-colors overflow-visible"
          >
            {/* Animated sparkles */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-yellow-400/10 via-yellow-400/5 to-transparent"
              animate={{
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <Trophy className="w-4 h-4 relative z-10" />
            <span className="relative z-10">BETTING STUDIO</span>
          </motion.button>
        </div>

        {/* Graveyard Button with fog around it */}
        <div className="relative">
          {/* Fog clouds around the button */}
          <motion.div
            className="absolute -inset-2 bg-toxic-green/10 blur-xl rounded-lg pointer-events-none"
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -inset-3 bg-toxic-green/5 blur-2xl rounded-lg pointer-events-none"
            animate={{
              opacity: [0.4, 0.2, 0.4],
              scale: [1.1, 1, 1.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.7,
            }}
          />

          <motion.button
            onClick={() => {
              // Trigger graveyard panel
              const event = new CustomEvent('open-graveyard-panel')
              window.dispatchEvent(event)
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex items-center gap-2 px-4 py-2 bg-black/60 hover:bg-black/70 border border-toxic-green/40 rounded text-toxic-green font-mono text-sm transition-colors overflow-visible"
          >
          {/* Animated fog layers */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-toxic-green/10 via-toxic-green/5 to-transparent"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-toxic-green/5 via-transparent to-toxic-green/10"
            animate={{
              opacity: [0.6, 0.3, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />

          {/* Cemetery ground */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-toxic-green/30 to-transparent" />

          {/* Tombstones */}
          <div className="flex items-end gap-0.5 relative z-10">
            <div className="w-2 h-3 bg-toxic-green/60 rounded-t-sm shadow-[0_0_4px_rgba(57,255,20,0.4)]" />
            <div className="w-2 h-4 bg-toxic-green/70 rounded-t shadow-[0_0_4px_rgba(57,255,20,0.4)]" />
            <div className="w-2 h-3 bg-toxic-green/60 rounded-t-sm shadow-[0_0_4px_rgba(57,255,20,0.4)]" />
          </div>

          {/* Animated ravens */}
          <div className="relative z-10 flex gap-1">
            <motion.div
              className="text-[8px]"
              animate={{
                y: [-2, 2, -2],
                rotate: [0, 5, 0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              🦅
            </motion.div>
            <motion.div
              className="text-[8px]"
              animate={{
                y: [2, -2, 2],
                rotate: [0, -5, 0, 5, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              🦅
            </motion.div>
          </div>

          <span className="relative z-10">GRAVEYARD</span>

          {/* Count badge */}
          {graveyardCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 w-5 h-5 bg-toxic-green/20 border border-toxic-green rounded-full flex items-center justify-center text-[10px] font-bold text-toxic-green shadow-[0_0_8px_rgba(57,255,20,0.6)]"
            >
              {graveyardCount}
            </motion.div>
          )}
          </motion.button>
        </div>
        <motion.button
          onClick={handleBackToDashboard}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-white font-mono text-sm transition-colors"
        >
          <LayoutGrid className="h-4 w-4" />
          SYSTEMS
        </motion.button>
        <motion.button
          onClick={signOut}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-white font-mono text-sm transition-colors"
        >
          <LogOut className="h-4 w-4" />
          LOGOUT
        </motion.button>
      </div>
    </div>
  )
}
