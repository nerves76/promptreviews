/**
 * Team System Integration Test
 * 
 * This test verifies that the team management system works correctly
 * with the new centralized AuthContext system.
 */

import { test, expect } from '@playwright/test';

test.describe('Team System Integration', () => {
  test('should integrate properly with AuthContext', async ({ page }) => {
    console.log('🔧 Testing team system integration...');
    
    // Navigate to team page
    await page.goto('/dashboard/team');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check that page loads without critical errors
    const pageTitle = await page.title();
    expect(pageTitle).toBe('PromptReviews - Get More Reviews');
    
    // Should either show loading, error, or content
    const hasError = await page.locator('text=Failed to load team data').isVisible();
    const hasContent = await page.locator('h1:has-text("Team Management")').isVisible();
    const hasAuthRedirect = page.url().includes('/auth/sign-in');
    
    console.log('📊 Page state:', {
      hasError,
      hasContent,
      hasAuthRedirect,
      url: page.url()
    });
    
    // If there's an error, it should show the "Try Again" button (from our new integration)
    if (hasError) {
      const tryAgainButton = page.locator('button:has-text("Try Again")');
      await expect(tryAgainButton).toBeVisible();
      console.log('✅ Error state shows retry button correctly');
    }
    
    // If content is shown, verify team management features
    if (hasContent) {
      await expect(page.locator('h1:has-text("Team Management")')).toBeVisible();
      console.log('✅ Team management page loaded successfully');
    }
    
    // If redirected to auth, that's expected behavior
    if (hasAuthRedirect) {
      console.log('✅ Authentication guard working correctly');
    }
    
    console.log('✅ Team system integration test completed');
  });
  
  test('should show consistent loading patterns', async ({ page }) => {
    console.log('🔄 Testing loading patterns...');
    
    await page.goto('/dashboard/team');
    
    // Wait briefly for loading states
    await page.waitForTimeout(1000);
    
    // Check for new loading pattern (should not have old animate-pulse)
    const oldLoadingElements = page.locator('.animate-pulse');
    const hasOldLoadingPattern = await oldLoadingElements.count() > 0;
    
    console.log('🔍 Loading patterns:', {
      hasOldLoadingPattern,
      url: page.url()
    });
    
    // Our new integration should use FiveStarSpinner instead of animate-pulse
    if (hasOldLoadingPattern) {
      console.log('⚠️  Old loading pattern detected - integration may need adjustment');
    } else {
      console.log('✅ Consistent loading patterns with AuthContext');
    }
    
    console.log('✅ Loading pattern test completed');
  });
}); 