/**
 * Community Feature - TypeScript Type Definitions
 *
 * Centralized type definitions for the global public community feature.
 *
 * Architecture: Global public community (no account isolation)
 */

export type ReactionType = 'thumbs_up' | 'star' | 'celebrate' | 'clap' | 'laugh';

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  category: 'discussion' | 'support' | 'wins' | 'announcements';
  is_active: boolean;
  admin_only_posting: boolean;
  sort_order: number;
  created_at: string;
  created_by?: string;
}

export interface CommunityProfile {
  user_id: string;
  username: string;
  display_name_override?: string;
  guidelines_accepted_at?: string;
  opted_out_at?: string;
  notify_mentions: boolean;
  notify_broadcasts: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthorInfo {
  id: string;
  username: string;
  display_name: string;
  business_name: string;
  logo_url?: string;
  profile_photo_url?: string;
  is_promptreviews_team: boolean;
}

export interface Post {
  id: string;
  channel_id: string;
  author_id: string;
  title: string;
  body?: string;
  external_url?: string;
  is_pinned: boolean;
  is_from_promptreviews_team: boolean;
  is_monthly_summary: boolean;
  summary_account_id?: string;
  summary_month?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Computed/joined data
  author?: AuthorInfo;
  channel?: Channel;
  reaction_counts?: ReactionCount[];
  comment_count?: number;
  user_reactions?: ReactionType[];
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;

  // Computed/joined data
  author?: AuthorInfo;
  reaction_counts?: ReactionCount[];
  user_reactions?: ReactionType[];
}

export interface Reaction {
  post_id?: string;
  comment_id?: string;
  user_id: string;
  emoji: ReactionType;
  created_at: string;
}

export interface ReactionCount {
  emoji: ReactionType;
  count: number;
  users: string[]; // User IDs for tooltip
}

export interface Mention {
  id: string;
  source_type: 'post' | 'comment';
  source_id: string;
  mentioned_user_id: string;
  author_id: string;
  created_at: string;
  read_at?: string;
}

export interface MentionableUser {
  user_id: string;
  username: string;
  display_name: string;
  business_name: string;
  logo_url?: string;
}

export interface PostFormData {
  title: string;
  body: string;
  external_url?: string;
}

export interface CommentFormData {
  body: string;
}

// API response types
export interface PostsResponse {
  data: Post[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CommentsResponse {
  data: Comment[];
  count: number;
}

export interface CreatePostRequest {
  channel_id: string;
  title: string;
  body?: string;
  external_url?: string;
}

export interface UpdatePostRequest {
  title?: string;
  body?: string;
  external_url?: string;
}

export interface CreateCommentRequest {
  post_id: string;
  body: string;
}

export interface ToggleReactionRequest {
  post_id?: string;
  comment_id?: string;
  emoji: ReactionType;
}

// Component prop types
export interface PostCardProps {
  post: Post;
  currentUserId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (emoji: ReactionType) => void;
  onComment: () => void;
}

export interface CommentCardProps {
  comment: Comment;
  currentUserId: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (emoji: ReactionType) => void;
}

export interface ReactionBarProps {
  targetId: string;
  targetType: 'post' | 'comment';
  reactions: ReactionCount[];
  userReactions: ReactionType[];
  onReact: (emoji: ReactionType) => void;
}

export interface MentionAutocompleteProps {
  query: string;
  onSelect: (user: MentionableUser) => void;
  position: { top: number; left: number };
}

export interface GuidelinesModalProps {
  isOpen: boolean;
  requireAcceptance: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export interface ChannelListProps {
  channels: Channel[];
  activeChannelSlug: string;
  onChannelSelect: (slug: string) => void;
}

// Utility types
export type SortOrder = 'asc' | 'desc';
export type PostFilter = 'all' | 'pinned' | 'my_posts';
