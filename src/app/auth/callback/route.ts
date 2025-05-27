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

    // Wait for the session to be set
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  } catch (error) {
    console.error('Error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`)
  }
} 