/**
 * RSS Parser Service
 * Fetches and parses RSS/Atom feeds
 */

import Parser from 'rss-parser';
import { ParsedFeed, ParsedFeedItem } from '../types';

// Image file extensions for fallback detection
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

// Configure parser with custom fields for media
const parser = new Parser({
  customFields: {
    feed: [
      ['itunes:image', 'itunesImage'],
    ],
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
      ['enclosure', 'enclosure'],
      ['itunes:image', 'itunesImage'],
    ],
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Fetch and parse an RSS feed from a URL
 */
export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  try {
    const feed = await parser.parseURL(feedUrl);

    const items: ParsedFeedItem[] = feed.items.map((item) => ({
      guid: extractGuid(item),
      title: item.title || '',
      description: extractDescription(item),
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
      imageUrl: extractImageUrl(item),
    }));

    return {
      title: feed.title,
      description: feed.description,
      link: feed.link,
      items,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse RSS feed: ${message}`);
  }
}

/**
 * Validate that a URL is a valid RSS feed
 */
export async function validateFeed(
  feedUrl: string
): Promise<{ valid: boolean; error?: string; feed?: ParsedFeed }> {
  try {
    // Basic URL validation
    const url = new URL(feedUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    const feed = await parseFeed(feedUrl);

    if (!feed.items || feed.items.length === 0) {
      return { valid: false, error: 'Feed contains no items' };
    }

    return { valid: true, feed };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: message };
  }
}

/**
 * Extract the unique identifier for a feed item
 * Prefers guid, falls back to link
 */
function extractGuid(item: Parser.Item): string {
  // Check for explicit guid
  if (item.guid) {
    return item.guid;
  }

  // Fall back to link
  if (item.link) {
    return item.link;
  }

  // Last resort: create hash from title and pubDate
  const title = item.title || '';
  const pubDate = item.pubDate || '';
  return `${title}-${pubDate}`.replace(/[^a-zA-Z0-9]/g, '-');
}

/**
 * Extract description/content from item
 * Prefers content:encoded, falls back to description/summary
 */
function extractDescription(item: Parser.Item): string {
  // Try content:encoded first (full HTML content)
  const contentEncoded = (item as Record<string, unknown>)['content:encoded'];
  if (typeof contentEncoded === 'string') {
    return stripHtml(contentEncoded);
  }

  // Try content
  if (item.content) {
    return stripHtml(item.content);
  }

  // Fall back to summary/description
  if (item.contentSnippet) {
    return item.contentSnippet;
  }

  if (item.summary) {
    return stripHtml(item.summary);
  }

  return '';
}

/**
 * Check if a URL looks like an image based on file extension
 */
function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Extract image URL from item
 * Checks enclosure, media:content, media:thumbnail, itunes:image
 * Skips non-image media (audio, video) commonly found in podcast feeds
 */
function extractImageUrl(item: Parser.Item): string | null {
  const typedItem = item as Record<string, unknown>;

  // Check enclosure - only if it's an image type
  // Podcasts use enclosure for audio files, so we must filter by MIME type
  const enclosure = typedItem.enclosure as { url?: string; type?: string } | undefined;
  if (enclosure?.url) {
    // If MIME type is provided, check if it's an image
    if (enclosure.type?.startsWith('image/')) {
      return enclosure.url;
    }
    // If no MIME type, fall back to extension check
    if (!enclosure.type && isImageUrl(enclosure.url)) {
      return enclosure.url;
    }
    // Otherwise skip (likely audio/video)
  }

  // Check itunes:image (common in podcast feeds for artwork)
  const itunesImage = typedItem.itunesImage as { $?: { href?: string } } | string | undefined;
  if (itunesImage) {
    if (typeof itunesImage === 'string') {
      return itunesImage;
    }
    if (itunesImage.$?.href) {
      return itunesImage.$.href;
    }
  }

  // Check media:content - only images
  const mediaContent = typedItem.mediaContent as Array<{ $?: { url?: string; medium?: string; type?: string } }> | undefined;
  if (mediaContent && Array.isArray(mediaContent)) {
    for (const media of mediaContent) {
      if (media.$?.url) {
        // Check medium attribute or MIME type
        const isImage = media.$.medium === 'image' ||
                       media.$.type?.startsWith('image/') ||
                       (!media.$.medium && !media.$.type && isImageUrl(media.$.url));
        if (isImage) {
          return media.$.url;
        }
      }
    }
  }

  // Check media:thumbnail (always images)
  const mediaThumbnail = typedItem.mediaThumbnail as Array<{ $?: { url?: string } }> | undefined;
  if (mediaThumbnail && Array.isArray(mediaThumbnail)) {
    const thumb = mediaThumbnail[0];
    if (thumb?.$?.url) {
      return thumb.$.url;
    }
  }

  // Try to extract first image from content/description
  const content = item.content || (typedItem['content:encoded'] as string) || item.summary || '';
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch?.[1]) {
    return imgMatch[1];
  }

  return null;
}

/**
 * Strip HTML tags from string
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp;
    .replace(/&amp;/g, '&') // Replace &amp;
    .replace(/&lt;/g, '<') // Replace &lt;
    .replace(/&gt;/g, '>') // Replace &gt;
    .replace(/&quot;/g, '"') // Replace &quot;
    .replace(/&#39;/g, "'") // Replace &#39;
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}
