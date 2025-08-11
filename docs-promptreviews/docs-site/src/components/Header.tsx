'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import PromptReviewsLogo from './PromptReviewsLogo'

interface HeaderProps {
  onSearchClick?: () => void
}

export default function Header({ onSearchClick }: HeaderProps) {

  return (
    <header className="bg-transparent backdrop-blur-sm mt-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3 group">
              <span className="h-14 w-auto flex items-center" aria-label="Prompt Reviews Logo">
                <PromptReviewsLogo size={110} color="#FFFFFF" />
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white/70 -mt-1">Help Docs</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Removed for cleaner look */}

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button
              onClick={onSearchClick}
              className="flex items-center space-x-2 px-3 py-1.5 text-sm text-white/70 hover:text-white border border-white/30 rounded-lg hover:border-white/50 transition-colors backdrop-blur-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search docs...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 border border-white/30 rounded text-xs font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Back to Site */}
            <Link
              href="https://promptreviews.app"
              className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <span>Back to Site</span>
            </Link>

            {/* App Link */}
            <Link
              href="https://app.promptreviews.app/dashboard"
              className="hidden sm:inline-flex items-center space-x-2 px-4 py-2 bg-slate-blue text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <span>Open App</span>
            </Link>

          </div>
        </div>
      </div>

    </header>
  )
}