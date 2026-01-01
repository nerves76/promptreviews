import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

interface RssItemInput {
  itemId: string; // rss_feed_items.id
}

interface AddFromRssRequestBody {
  feedId: string;
  items: RssItemInput[];
}

function applyTemplate(template: string, item: {
  title?: string;
  description?: string;
  link?: string;
}, includeLink: boolean, maxLength: number): string {
  let content = template
    .replace('{title}', item.title || '')
    .replace('{description}', item.description || '')
    .replace('{link}', item.link || '');

  // Add link if configured
  if (includeLink && item.link && !content.includes(item.link)) {
    content = content.trim() + '\n\n' + item.link;
  }

  // Truncate to max length
  if (content.length > maxLength) {
    content = content.slice(0, maxLength - 3) + '...';
  }

  return content.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: AddFromRssRequestBody = await request.json();
    const { feedId, items } = body;

    if (!feedId) {
      return NextResponse.json(
        { success: false, error: 'feedId is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one item is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Unable to resolve account.' },
        { status: 400 }
      );
    }

    // Fetch the feed to get settings (target_locations, additional_platforms, template)
    const { data: feed, error: feedError } = await supabase
      .from('rss_feed_sources')
      .select('*')
      .eq('id', feedId)
      .eq('account_id', accountId)
      .single();

    if (feedError || !feed) {
      console.error('[AddFromRss] Feed not found:', feedError);
      return NextResponse.json(
        { success: false, error: 'Feed not found or access denied.' },
        { status: 404 }
      );
    }

    // Fetch the RSS feed items
    const itemIds = items.map((i) => i.itemId);
    const { data: rssItems, error: itemsError } = await supabase
      .from('rss_feed_items')
      .select('*')
      .eq('feed_source_id', feedId)
      .in('id', itemIds);

    if (itemsError) {
      console.error('[AddFromRss] Failed to fetch items:', itemsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch RSS items.' },
        { status: 500 }
      );
    }

    if (!rssItems || rssItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid RSS items found.' },
        { status: 400 }
      );
    }

    // Check which items are already in queue (have a scheduled_post_id)
    const alreadyQueued = rssItems.filter((item) => item.scheduled_post_id);
    const toQueue = rssItems.filter((item) => !item.scheduled_post_id);

    if (toQueue.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          addedCount: 0,
          skippedCount: alreadyQueued.length,
          message: 'All selected items are already in the queue.',
        },
      });
    }

    // Get max queue_order for this account's drafts
    const { data: maxOrderResult } = await supabase
      .from('google_business_scheduled_posts')
      .select('queue_order')
      .eq('account_id', accountId)
      .eq('status', 'draft')
      .order('queue_order', { ascending: false })
      .limit(1)
      .single();

    let nextOrder = (maxOrderResult?.queue_order ?? 0) + 1;

    // Create draft scheduled posts for each item
    const createdPosts: { postId: string; itemId: string }[] = [];
    const failedItems: { itemId: string; error: string }[] = [];

    for (const rssItem of toQueue) {
      // Apply template to create content
      const summary = applyTemplate(
        feed.post_template,
        {
          title: rssItem.title,
          description: rssItem.description,
          link: rssItem.item_url,
        },
        feed.include_link,
        feed.max_content_length
      );

      const insertPayload = {
        account_id: accountId,
        user_id: user.id,
        post_kind: 'post' as const,
        post_type: 'WHATS_NEW' as const,
        content: {
          summary,
          callToAction: rssItem.item_url ? {
            actionType: 'LEARN_MORE',
            url: rssItem.item_url,
          } : null,
          metadata: {
            rssTitle: rssItem.title,
            rssDescription: rssItem.description,
            rssLink: rssItem.item_url,
            rssImageUrl: rssItem.image_url,
          },
        },
        caption: null,
        scheduled_date: null, // Draft - no date yet
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, // Default timezone
        selected_locations: feed.target_locations || [],
        media_paths: [], // Could add image handling later
        additional_platforms: feed.additional_platforms || {},
        status: 'draft' as const,
        queue_order: nextOrder,
        source_type: 'rss',
        rss_feed_item_id: rssItem.id,
        error_log: null,
      };

      const { data: scheduled, error: insertError } = await supabase
        .from('google_business_scheduled_posts')
        .insert(insertPayload)
        .select('id')
        .single();

      if (insertError || !scheduled) {
        console.error('[AddFromRss] Failed to create draft:', insertError);
        failedItems.push({ itemId: rssItem.id, error: insertError?.message || 'Unknown error' });
        continue;
      }

      // Update the RSS item to link to the scheduled post
      const { error: updateError } = await supabase
        .from('rss_feed_items')
        .update({
          scheduled_post_id: scheduled.id,
          status: 'scheduled',
          processed_at: new Date().toISOString(),
        })
        .eq('id', rssItem.id);

      if (updateError) {
        console.error('[AddFromRss] Failed to update RSS item:', updateError);
        // Post was created, just logging the issue
      }

      createdPosts.push({ postId: scheduled.id, itemId: rssItem.id });
      nextOrder++;
    }

    return NextResponse.json({
      success: true,
      data: {
        addedCount: createdPosts.length,
        skippedCount: alreadyQueued.length,
        failedCount: failedItems.length,
        createdPosts,
        failedItems: failedItems.length > 0 ? failedItems : undefined,
      },
    });
  } catch (error) {
    console.error('[AddFromRss] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected error while adding items to queue.' },
      { status: 500 }
    );
  }
}
