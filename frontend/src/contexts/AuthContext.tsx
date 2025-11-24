'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Handle specific error cases
      if (error.message.includes('Email not confirmed')) {
        return {
          error: new Error('Please confirm your email address before logging in. Check your inbox for the confirmation link.')
        }
      }
      if (error.message.includes('Invalid login credentials')) {
        return {
          error: new Error('Invalid email or password. If you just signed up, please check your email for a confirmation link.')
        }
      }
      return { error }
    }

    if (!data.user) {
      return { error: new Error('Sign in succeeded but no user data returned') }
    }

    // Check if user profile exists, create if not
    const { data: existingProfile, error: profileError } = await supabase
      .from('users')
      .select('id')
      .eq('id', data.user.id)
      .single()

    // If error is PGRST116 (no rows), profile doesn't exist - create it
    if (profileError && profileError.code === 'PGRST116') {
      console.log('User profile does not exist, creating...')

      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'User',
          current_xp: 0,
          level: 1,
        })

      if (insertError) {
        console.error('Error creating user profile during sign in:', insertError)
        return {
          error: new Error(
            `Failed to create user profile: ${insertError.message}. ` +
            `Please contact support or try signing up again.`
          )
        }
      }

      console.log('User profile created successfully')
    } else if (profileError) {
      // Some other error occurred while checking for profile
      console.error('Error checking for user profile:', profileError)
      return {
        error: new Error(
          `Failed to verify user profile: ${profileError.message}. ` +
          `Please try again or contact support.`
        )
      }
    }

    console.log('Sign in successful, profile exists')

    // Wait a moment to ensure DB consistency before routing
    await new Promise(resolve => setTimeout(resolve, 300))

    router.push('/dashboard')
    return { error: null }
  }

  const signUp = async (email: string, password: string, username: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    })

    if (error) {
      return { error }
    }

    if (!data.user) {
      return { error: new Error('Sign up succeeded but no user data returned') }
    }

    // Check if email confirmation is required (no session means confirmation needed)
    const emailConfirmationRequired = data.session === null

    if (emailConfirmationRequired) {
      // Email confirmation is required - user will need to click the link in their email
      console.log('Email confirmation required for user:', data.user.id)

      // Still create the profile so it exists when they confirm
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username,
          current_xp: 0,
          level: 1,
        })

      if (profileError && profileError.code !== '23505') {
        // Ignore duplicate key errors (profile already exists)
        console.error('Error creating user profile:', profileError)
      }

      return {
        error: new Error('Account created! Please check your email to confirm your account before logging in.')
      }
    }

    // No email confirmation required - create profile and log in immediately
    console.log('No email confirmation required, creating profile and logging in')

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        username,
        current_xp: 0,
        level: 1,
      })

    if (profileError) {
      console.error('Error creating user profile:', profileError)

      // Clean up auth user if profile creation fails
      console.log('Attempting to delete auth user due to profile creation failure...')
      await supabase.auth.admin.deleteUser(data.user.id).catch((deleteError) => {
        console.error('Failed to cleanup auth user:', deleteError)
      })

      return {
        error: new Error(
          `Failed to create user profile: ${profileError.message}. ` +
          `Please try signing up again.`
        )
      }
    }

    console.log('User profile created successfully, routing to dashboard')

    // Wait a moment to ensure DB consistency before routing
    await new Promise(resolve => setTimeout(resolve, 500))

    router.push('/dashboard')
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
