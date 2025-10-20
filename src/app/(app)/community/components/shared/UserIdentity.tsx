/**
 * UserIdentity Component
 *
 * Displays user identity as "Username • Business Name"
 * with optional admin badge
 */

'use client';

import { AuthorInfo } from '../../types/community';
import { AdminBadge } from './AdminBadge';

interface UserIdentityProps {
  author?: AuthorInfo;
  showBadge?: boolean;
  className?: string;
}

export function UserIdentity({ author, showBadge = true, className = '' }: UserIdentityProps) {
  // Fallback for missing author data
  if (!author) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-white/70">Unknown User</span>
      </div>
    );
  }

  // Prioritize profile photo over business logo
  const avatarUrl = author.profile_photo_url || author.logo_url;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Avatar - profile photo takes precedence over business logo */}
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={author.display_name}
          className="w-8 h-8 rounded-full object-cover border border-white/20"
        />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-white font-medium">{author.display_name}</span>
        <span className="text-white/50">@</span>
        <span className="text-white/70">{author.business_name}</span>

        {showBadge && author.is_promptreviews_team && <AdminBadge />}
      </div>
    </div>
  );
}
