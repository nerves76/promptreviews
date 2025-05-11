'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <h1 className="text-center text-3xl font-bold">Sign In Page</h1>
        <p className="text-center text-gray-600">This is a test page</p>
      </div>
    </div>
  )
} 