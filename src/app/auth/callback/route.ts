import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=Invalid code`)
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(sessionError.message)}`)
    }

    if (!session?.user) {
      console.error('No user in session')
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=No user in session`)
    }

    // Check if account exists
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (accountError && accountError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Account check error:', accountError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent('Error checking account status')}`)
    }

    // If no account exists, create one with default plan
    if (!accountData) {
      const plan = session.user.user_metadata?.plan || 'community_grower';
      const trialStart = session.user.user_metadata?.trial_start || new Date().toISOString();
      const trialEnd = session.user.user_metadata?.trial_end || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
      
      const { error: createError } = await supabase
        .from('accounts')
        .insert({
          id: session.user.id,
          plan,
          trial_start: trialStart,
          trial_end: trialEnd,
          is_free: plan === 'community_grower',
          custom_prompt_page_count: 0,
          contact_count: 0
        })

      if (createError) {
        console.error('Account creation error:', createError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent('Error creating account')}`)
      }
    }

    // Wait for the session to be set
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  } catch (error) {
    console.error('Error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`)
  }
} 