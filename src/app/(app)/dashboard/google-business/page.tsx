/**
 * Google Business Page - Feature Flag Router
 *
 * Controls which implementation to render:
 * - NEXT_PUBLIC_USE_REFACTORED_GBP=false (default): LegacyGoogleBusinessPage
 * - NEXT_PUBLIC_USE_REFACTORED_GBP=true: RefactoredGoogleBusinessPage
 *
 * This allows safe rollback during the refactoring process.
 */

'use client';

import { LegacyGoogleBusinessPage } from './LegacyGoogleBusinessPage';
import { RefactoredGoogleBusinessPage } from './RefactoredGoogleBusinessPage';

export default function GoogleBusinessPage() {
  const useRefactored = process.env.NEXT_PUBLIC_USE_REFACTORED_GBP === 'true';

  // Render only one implementation - never both
  // This prevents double-mount side effects (polling, localStorage, OAuth)
  if (useRefactored) {
    return <RefactoredGoogleBusinessPage />;
  }

  return <LegacyGoogleBusinessPage />;
}
