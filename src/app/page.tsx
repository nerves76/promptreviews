'use client';

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getUserOrMock } from '@/utils/supabase'
import FiveStarSpinner from '@/app/components/FiveStarSpinner'

export default function Home() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await getUserOrMock(supabase)
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/auth/sign-in')
      }
    }
    getUser()
  }, [supabase.auth, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-indigo-300 to-purple-300 flex items-center justify-center" style={{ minHeight: '100vh', alignItems: 'flex-start' }}>
      <div className="text-center text-white mt-[150px] w-full">
        <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
        <FiveStarSpinner />
        <p className="mt-4 text-white">Loading...</p>
      </div>
    </div>
  )
}
