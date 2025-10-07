/**
 * Mention Parser Utility
 *
 * Parses @username mentions from text and provides helper functions.
 */

export interface ParsedMention {
  username: string;
  startIndex: number;
  endIndex: number;
}

/**
 * Extracts all @username mentions from text
 * @param text - The text to parse
 * @returns Array of parsed mentions with positions
 */
export function extractMentions(text: string): ParsedMention[] {
  const mentionRegex = /@([a-z0-9-]+)/g;
  const mentions: ParsedMention[] = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push({
      username: match[1],
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  return mentions;
}

/**
 * Extracts unique usernames from text
 * @param text - The text to parse
 * @returns Array of unique usernames (without @ symbol)
 */
export function extractUsernames(text: string): string[] {
  const mentions = extractMentions(text);
  const usernames = mentions.map((m) => m.username);
  return Array.from(new Set(usernames)); // Remove duplicates
}

/**
 * Highlights mentions in text with React elements
 * @param text - The text to parse
 * @returns Array of text segments and mention elements
 */
export function highlightMentions(text: string): (string | { type: 'mention'; username: string })[] {
  const mentions = extractMentions(text);
  if (mentions.length === 0) return [text];

  const result: (string | { type: 'mention'; username: string })[] = [];
  let lastIndex = 0;

  mentions.forEach((mention) => {
    // Add text before mention
    if (mention.startIndex > lastIndex) {
      result.push(text.substring(lastIndex, mention.startIndex));
    }

    // Add mention object
    result.push({ type: 'mention', username: mention.username });

    lastIndex = mention.endIndex;
  });

  // Add remaining text after last mention
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }

  return result;
}

/**
 * Inserts a mention at cursor position
 * @param text - The current text
 * @param cursorPosition - The cursor position
 * @param username - The username to insert (without @)
 * @returns Object with new text and new cursor position
 */
export function insertMention(
  text: string,
  cursorPosition: number,
  username: string
): { text: string; cursorPosition: number } {
  // Find the @ symbol before cursor
  const textBeforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');

  if (lastAtIndex === -1) {
    // No @ found, insert at cursor
    const newText = text.substring(0, cursorPosition) + `@${username} ` + text.substring(cursorPosition);
    return {
      text: newText,
      cursorPosition: cursorPosition + username.length + 2, // @ + username + space
    };
  }

  // Replace from @ to cursor with mention
  const beforeAt = text.substring(0, lastAtIndex);
  const afterCursor = text.substring(cursorPosition);
  const newText = beforeAt + `@${username} ` + afterCursor;

  return {
    text: newText,
    cursorPosition: lastAtIndex + username.length + 2, // @ + username + space
  };
}

/**
 * Gets the current mention query at cursor
 * @param text - The current text
 * @param cursorPosition - The cursor position
 * @returns The mention query (text after @) or null if not in a mention
 */
export function getMentionQuery(text: string, cursorPosition: number): string | null {
  const textBeforeCursor = text.substring(0, cursorPosition);
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');

  if (lastAtIndex === -1) return null;

  // Check if there's a space between @ and cursor (indicates mention is complete)
  const queryText = textBeforeCursor.substring(lastAtIndex + 1);
  if (queryText.includes(' ')) return null;

  return queryText;
}

/**
 * Validates username format
 * @param username - The username to validate
 * @returns True if valid (lowercase alphanumeric and hyphens)
 */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9-]+$/.test(username);
}
