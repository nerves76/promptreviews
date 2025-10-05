'use client'

import { ReactNode, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Footer from '@/components/Footer'

interface DocsLayoutProps {
  children: ReactNode
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-white/20 backdrop-blur-md border border-white/30 rounded-full p-3 text-white hover:bg-white/30 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Mobile menu overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
            <div className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-indigo-800 via-purple-700 to-fuchsia-600 p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
                <Sidebar />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-8">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-4">
              <Sidebar />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>

      <Footer />
    </>
  )
}