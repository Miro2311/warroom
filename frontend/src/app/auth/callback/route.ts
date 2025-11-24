import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_callback_error`)
    }

    if (data.user) {
      // Check if user profile exists, create if not
      const { data: existingProfile, error: profileError } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      // If profile doesn't exist, create it
      if (profileError && profileError.code === 'PGRST116') {
        const username = data.user.user_metadata?.username || data.user.email?.split('@')[0] || 'User'

        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            current_xp: 0,
            level: 1,
          })

        if (insertError) {
          console.error('Error creating user profile in callback:', insertError)
        }
      }

      // Redirect to dashboard after successful email confirmation
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    }
  }

  // If no code or something went wrong, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login`)
}
