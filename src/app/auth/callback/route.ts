import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const response = NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    try {
      // Exchange the code for a session
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin));
      }

      if (!session?.user) {
        console.error('No user in session');
        return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin));
      }

      // Get the business name from the user's metadata
      const businessName = session.user.user_metadata.business_name;

      if (!businessName) {
        console.error('No business name in user metadata');
        return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin));
      }

      // Check if business profile already exists
      const { data: existingBusiness, error: checkError } = await supabase
        .from('businesses')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing business:', checkError);
        return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin));
      }

      if (!existingBusiness) {
        // Create the business profile
        const { error: businessError } = await supabase
          .from('businesses')
          .insert({
            id: session.user.id,
            name: businessName,
          });

        if (businessError) {
          console.error('Business creation error:', businessError);
          // Store the error in the URL for the dashboard to handle
          return NextResponse.redirect(
            new URL(`/dashboard?error=${encodeURIComponent('Failed to create business profile. Please try again.')}`, requestUrl.origin)
          );
        }
      }

      return response;
    } catch (error) {
      console.error('Unexpected error in callback:', error);
      return NextResponse.redirect(
        new URL(`/auth/sign-in?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`, requestUrl.origin)
      );
    }
  }

  // If no code is present, redirect to sign in
  return NextResponse.redirect(new URL('/auth/sign-in', requestUrl.origin));
} 