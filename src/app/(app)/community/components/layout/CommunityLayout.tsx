/**
 * CommunityLayout Component
 *
 * Main layout wrapper for community pages with sidebar and header
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Channel } from '../../types/community';
import { ChannelList } from './ChannelList';
import { CommunityHeader } from './CommunityHeader';
import { Button } from '@/app/(app)/components/ui/button';

interface CommunityLayoutProps {
  children: React.ReactNode;
  channels: Channel[];
  activeChannelSlug: string;
  accountName: string;
  displayName?: string;
  onGuidelinesClick: () => void;
  onEditDisplayName?: () => void;
  onChannelSelect?: (slug: string) => void;
}

export function CommunityLayout({
  children,
  channels,
  activeChannelSlug,
  accountName,
  displayName,
  onGuidelinesClick,
  onEditDisplayName,
  onChannelSelect,
}: CommunityLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative z-10">
        <CommunityHeader
          accountName={accountName}
          displayName={displayName}
          onGuidelinesClick={onGuidelinesClick}
          onEditDisplayName={onEditDisplayName}
        />
      </div>

      <div className="flex h-[calc(100vh-5rem)]">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Desktop Sidebar - always visible */}
        <aside className="hidden md:flex flex-col w-64 bg-white/8 backdrop-blur-[10px] p-6 overflow-y-auto">
          <div className="flex-1">
            <ChannelList
              channels={channels}
              activeChannelSlug={activeChannelSlug}
              onChannelSelect={(slug) => {
                if (onChannelSelect) onChannelSelect(slug);
              }}
            />
          </div>

          {/* Community Image */}
          <div className="mt-auto mb-6 relative w-full h-44 rounded-lg overflow-hidden">
            <Image
              src="/images/the-prompt-reviews-community.png"
              alt="Prompt Reviews Community"
              fill
              className="object-cover"
            />
          </div>

          <button
            onClick={onGuidelinesClick}
            className="w-full flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
            aria-label="View community guidelines"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Guidelines
          </button>
        </aside>

        {/* Mobile Sidebar - slides in when open */}
        <aside
          className={`
            md:hidden fixed top-0 left-0 h-full w-64 z-40 flex flex-col
            bg-white/8 backdrop-blur-[10px] p-6 overflow-y-auto
            transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex-1">
            <ChannelList
              channels={channels}
              activeChannelSlug={activeChannelSlug}
              onChannelSelect={(slug) => {
                if (onChannelSelect) onChannelSelect(slug);
                setSidebarOpen(false);
              }}
            />
          </div>

          {/* Community Image */}
          <div className="mt-auto mb-6 relative w-full h-44 rounded-lg overflow-hidden">
            <Image
              src="/images/the-prompt-reviews-community.png"
              alt="Prompt Reviews Community"
              fill
              className="object-cover"
            />
          </div>

          <button
            onClick={() => {
              onGuidelinesClick();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
            aria-label="View community guidelines"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Guidelines
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile hamburger button */}
          <div className="md:hidden sticky top-0 z-20 bg-white/8 backdrop-blur-[10px] px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-white/70 hover:text-white hover:bg-white/10"
              aria-label="Toggle channel list"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
