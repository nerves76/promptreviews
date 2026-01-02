/**
 * Google Business Page
 *
 * Manages Google Business Profile integration including:
 * - OAuth connection flow
 * - Location management
 * - Post creation (with cross-posting to Bluesky/LinkedIn)
 * - Reviews management
 * - Business info, photos, services editing
 * - Overview analytics
 */

'use client';

import { RefactoredGoogleBusinessPage } from './RefactoredGoogleBusinessPage';

export default function GoogleBusinessPage() {
  return <RefactoredGoogleBusinessPage />;
}
