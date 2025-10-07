/**
 * Community Page
 *
 * Main community page with channel navigation, post feed, and real-time updates
 */

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/auth/providers/supabase';
import { CommunityLayout } from './components/layout/CommunityLayout';
import { PostFeed } from './components/posts/PostFeed';
import { InlinePostComposer } from './components/posts/InlinePostComposer';
import { GuidelinesModal } from './components/modals/GuidelinesModal';
import { EditDisplayNameModal } from './components/modals/EditDisplayNameModal';
import { Channel, ReactionType } from './types/community';
import { usePosts } from './hooks/usePosts';
import { useReactions } from './hooks/useReactions';

export default function CommunityPage() {
  const { user, account, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelSlug, setActiveChannelSlug] = useState('general');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [requireGuidelinesAcceptance, setRequireGuidelinesAcceptance] = useState(false);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [displayName, setDisplayName] = useState<string>('');
  const [showEditDisplayName, setShowEditDisplayName] = useState(false);

  // Get active channel from query params or default to 'general'
  useEffect(() => {
    const channelParam = searchParams?.get('channel');
    if (channelParam) {
      setActiveChannelSlug(channelParam);
    }
  }, [searchParams]);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/sign-in');
    }
  }, [authLoading, user, router]);

  // Load channels
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const { data, error } = await supabase
          .from('channels')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        setChannels(data || []);
      } catch (error) {
        console.error('Error loading channels:', error);
      } finally {
        setIsLoadingChannels(false);
      }
    };

    if (user) {
      loadChannels();
    }
  }, [user, supabase]);

  // Check if user has accepted guidelines and fetch display name
  useEffect(() => {
    const checkGuidelines = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('community_profiles')
          .select('guidelines_ack_at, display_name_override')
          .eq('user_id', user.id)
          .single();

        if (error || !data?.guidelines_ack_at) {
          setRequireGuidelinesAcceptance(true);
          setShowGuidelines(true);
        }

        // Set display name if available
        if (data?.display_name_override) {
          setDisplayName(data.display_name_override);
        }
      } catch (error) {
        console.error('Error checking guidelines:', error);
      }
    };

    checkGuidelines();
  }, [user, supabase]);

  // Get active channel
  const activeChannel = channels.find((c) => c.slug === activeChannelSlug);

  // Hooks
  const { posts, isLoading, hasMore, fetchPosts, loadMore, createPost, deletePost } = usePosts(activeChannel?.id || '');
  const { toggleReaction } = useReactions();

  // Fetch posts when channel changes
  useEffect(() => {
    if (activeChannel?.id) {
      fetchPosts();
    }
  }, [activeChannel?.id, fetchPosts]);

  // Handle channel selection
  const handleChannelSelect = (slug: string) => {
    setActiveChannelSlug(slug);
    router.push(`/community?channel=${slug}`);
  };

  // Handle post creation
  const handleCreatePost = async (data: { title: string; body?: string }) => {
    if (!account?.id) {
      throw new Error('No account selected');
    }

    try {
      await createPost({ ...data, account_id: account.id });
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  // Handle post deletion
  const handleDeletePost = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  // Handle reaction toggle
  const handlePostReact = async (postId: string, emoji: ReactionType) => {
    try {
      await toggleReaction(postId, 'post', emoji);
      // Optimistically update UI - refetch or update local state
      await fetchPosts();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  // Handle guidelines acceptance
  const handleGuidelinesAccept = async () => {
    if (!user) return;

    try {
      // Get user's first name from metadata
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const firstName = authUser?.user_metadata?.first_name ||
                       authUser?.user_metadata?.firstName ||
                       'User';

      // First, generate a username for the user
      const { data: usernameData, error: usernameError } = await supabase.rpc('generate_username', {
        p_user_id: user.id
      });

      if (usernameError) {
        console.error('Username generation error:', usernameError.message);
        throw usernameError;
      }

      if (!usernameData) {
        throw new Error('Failed to generate username');
      }

      const username = usernameData;

      // Then create/update the profile with first name as display name override
      const { error } = await supabase.from('community_profiles').upsert({
        user_id: user.id,
        username: username,
        display_name_override: firstName,
        guidelines_ack_at: new Date().toISOString(),
        opted_in_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

      if (error) {
        console.error('Profile upsert error:', error.message);
        throw error;
      }

      setShowGuidelines(false);
      setRequireGuidelinesAcceptance(false);
    } catch (error: any) {
      console.error('Error accepting guidelines:', error?.message || error);
    }
  };

  // Loading state
  if (authLoading || isLoadingChannels) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <CommunityLayout
        channels={channels}
        activeChannelSlug={activeChannelSlug}
        accountName={account?.business_name || 'Your Business'}
        displayName={displayName}
        onGuidelinesClick={() => setShowGuidelines(true)}
        onEditDisplayName={() => setShowEditDisplayName(true)}
        onChannelSelect={handleChannelSelect}
      >
        <div className="flex flex-col h-full">
          {/* Channel header */}
          <div className="bg-white/8 backdrop-blur-[10px] px-6 py-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-white/70">#</span>
              {activeChannel?.name || 'General'}
            </h2>
            {activeChannel?.description && <p className="text-sm text-white/70 mt-0.5">{activeChannel.description}</p>}
          </div>

          {/* Post Feed */}
          <div className="flex-1 overflow-y-auto">
            <PostFeed
              posts={posts}
              currentUserId={user.id}
              accountId={account?.id || ''}
              isLoading={isLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
              onPostDelete={handleDeletePost}
              onPostReact={handlePostReact}
            />
          </div>

          {/* Inline Post Composer at Bottom */}
          <InlinePostComposer
            channelName={activeChannel?.name || 'General'}
            onSubmit={handleCreatePost}
          />
        </div>
      </CommunityLayout>

      {/* Guidelines Modal */}
      <GuidelinesModal
        isOpen={showGuidelines}
        requireAcceptance={requireGuidelinesAcceptance}
        onAccept={handleGuidelinesAccept}
        onClose={() => !requireGuidelinesAcceptance && setShowGuidelines(false)}
        onDecline={() => router.push('/dashboard')}
      />

      {/* Edit Display Name Modal */}
      {user && (
        <EditDisplayNameModal
          isOpen={showEditDisplayName}
          currentDisplayName={displayName}
          businessName={account?.business_name || 'Your Business'}
          userId={user.id}
          onClose={() => setShowEditDisplayName(false)}
          onUpdate={(newDisplayName) => {
            setDisplayName(newDisplayName);
            fetchPosts(); // Refresh posts to show updated display name
          }}
        />
      )}
    </>
  );
}
