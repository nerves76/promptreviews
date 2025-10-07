/**
 * Linkify Utility
 *
 * Detects URLs in text and provides helper functions for rendering them as links.
 */

export interface ParsedLink {
  url: string;
  displayUrl: string;
  startIndex: number;
  endIndex: number;
}

/**
 * URL detection regex
 * Matches:
 * - URLs with protocol: https://example.com
 * - URLs without protocol: example.com, www.example.com
 * - URLs with paths: example.com/path/to/page
 * - URLs with query params: example.com?foo=bar
 */
const URL_REGEX = /(https?:\/\/[^\s]+|(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;

/**
 * Extracts all URLs from text
 * @param text - The text to parse
 * @returns Array of parsed links with positions
 */
export function extractLinks(text: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  let match;
  const regex = new RegExp(URL_REGEX);

  while ((match = regex.exec(text)) !== null) {
    const rawUrl = match[0];

    // Add https:// if no protocol
    const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `https://${rawUrl}`;

    links.push({
      url,
      displayUrl: rawUrl,
      startIndex: match.index,
      endIndex: match.index + rawUrl.length,
    });
  }

  return links;
}

/**
 * Linkifies text with React elements
 * @param text - The text to parse
 * @returns Array of text segments and link objects
 */
export function linkifyText(text: string): (string | { type: 'link'; url: string; displayUrl: string })[] {
  const links = extractLinks(text);
  if (links.length === 0) return [text];

  const result: (string | { type: 'link'; url: string; displayUrl: string })[] = [];
  let lastIndex = 0;

  links.forEach((link) => {
    // Add text before link
    if (link.startIndex > lastIndex) {
      result.push(text.substring(lastIndex, link.startIndex));
    }

    // Add link object
    result.push({
      type: 'link',
      url: link.url,
      displayUrl: link.displayUrl
    });

    lastIndex = link.endIndex;
  });

  // Add remaining text after last link
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}

/**
 * Combines mention and link parsing for full text formatting
 * @param text - The text to parse
 * @returns Array of text segments, mentions, and links
 */
export function parseTextContent(
  text: string
): (string | { type: 'mention'; username: string } | { type: 'link'; url: string; displayUrl: string })[] {
  // First parse links
  const linkSegments = linkifyText(text);

  // Then parse mentions in each text segment
  const result: (string | { type: 'mention'; username: string } | { type: 'link'; url: string; displayUrl: string })[] = [];

  linkSegments.forEach((segment) => {
    if (typeof segment === 'string') {
      // Parse mentions in this text segment
      const mentionRegex = /@([a-z0-9-]+)/g;
      const mentions: { username: string; startIndex: number; endIndex: number }[] = [];
      let match;

      while ((match = mentionRegex.exec(segment)) !== null) {
        mentions.push({
          username: match[1],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }

      if (mentions.length === 0) {
        result.push(segment);
      } else {
        let lastIndex = 0;
        mentions.forEach((mention) => {
          if (mention.startIndex > lastIndex) {
            result.push(segment.substring(lastIndex, mention.startIndex));
          }
          result.push({ type: 'mention', username: mention.username });
          lastIndex = mention.endIndex;
        });
        if (lastIndex < segment.length) {
          result.push(segment.substring(lastIndex));
        }
      }
    } else {
      // Already a link object, pass through
      result.push(segment);
    }
  });

  return result;
}
