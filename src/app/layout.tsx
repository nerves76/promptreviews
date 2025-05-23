import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientRoot from './ClientRoot'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PromptReviews - AI Review Request App',
  description: 'Generate and manage review requests for your business',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-br from-[#452F9F]/5 via-white to-[#452F9F]/5 overscroll-x-auto`}>
        <ClientRoot>
          {children}
        </ClientRoot>
      </body>
    </html>
  )
}
