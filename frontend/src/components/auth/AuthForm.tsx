'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (email: string, password: string, username?: string) => Promise<{ error: any }>
  onModeChange: () => void
}

const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return null;
}

export default function AuthForm({ mode, onSubmit, onModeChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Only validate password strength on signup, not login
    if (mode === 'signup') {
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setLoading(true)

    const { error } = await onSubmit(email, password, username)

    if (error) {
      setError(error.message)
    }

    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white font-display mb-2 tracking-wider">
            {mode === 'login' ? 'WAR ROOM ACCESS' : 'JOIN THE WAR ROOM'}
          </h1>
          <p className="text-sm text-gray-400 font-mono">
            {mode === 'login' ? 'Enter your credentials' : 'Create your account'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded mb-6 font-mono"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <Input
              label="USERNAME"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="agent_007"
            />
          )}

          <Input
            label="EMAIL"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="agent@warroom.com"
          />

          <Input
            label="PASSWORD"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
            placeholder="••••••••"
          />
          {mode === 'signup' && (
            <p className="text-xs text-gray-500 font-mono -mt-3">
              Min. 8 characters with uppercase, lowercase, and number
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="lg"
            className="w-full mt-6 bg-white text-black hover:bg-gray-200"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {mode === 'login' ? 'ACCESSING...' : 'CREATING...'}
              </>
            ) : (
              <>{mode === 'login' ? 'LOGIN' : 'SIGN UP'}</>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={onModeChange}
            type="button"
            className="text-sm text-gray-300 hover:text-white transition-colors font-mono underline underline-offset-4"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
