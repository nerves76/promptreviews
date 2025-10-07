/**
 * ChannelList Component
 *
 * Sidebar list of community channels with glassmorphic styling
 */

'use client';

import Link from 'next/link';
import { Channel } from '../../types/community';

interface ChannelListProps {
  channels: Channel[];
  activeChannelSlug: string;
  onChannelSelect?: (slug: string) => void;
}

export function ChannelList({ channels, activeChannelSlug, onChannelSelect }: ChannelListProps) {
  // Sort channels by sort_order
  const sortedChannels = [...channels].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <nav aria-label="Community channels" className="space-y-1">
      <h2 className="px-3 text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
        Channels
      </h2>

      {sortedChannels.map((channel) => {
        const isActive = channel.slug === activeChannelSlug;

        return (
          <Link
            key={channel.id}
            href={`/community?channel=${channel.slug}`}
            onClick={(e) => {
              if (onChannelSelect) {
                e.preventDefault();
                onChannelSelect(channel.slug);
              }
            }}
            className={`
              group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                isActive
                  ? 'bg-white/18 text-white border border-white/30'
                  : 'text-white/70 hover:bg-white/8 hover:text-white'
              }
            `}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-base" aria-hidden="true">
              #
            </span>
            <span className="flex-1 truncate">{channel.name}</span>

            {channel.admin_only_posting && (
              <svg
                className="w-3 h-3 text-white/50"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
                title="Admin-only posting"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
