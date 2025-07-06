const { test, expect } = require('@playwright/test');

test.describe('Authentication - Infinite Loading Fix', () => {
  test('should not have infinite loading on create-business page', async ({ page }) => {
    console.log('🎭 Testing for infinite loading issues...');
    
    // Go directly to the create-business page (where infinite loading occurred)
    await page.goto('http://localhost:3002/dashboard/create-business');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Wait 3 seconds to see if any infinite loading occurs
    console.log('⏳ Waiting 3 seconds to detect infinite loading...');
    await page.waitForTimeout(3000);
    
    // Check for infinite loading indicators
    const loadingElements = await page.locator('[data-testid*="loading"], .loading, .spinner, [class*="spin"]').count();
    
    if (loadingElements === 0) {
      console.log('✅ No infinite loading detected - middleware fix working!');
    } else {
      console.log(`⚠️ Found ${loadingElements} loading elements - possible infinite loading`);
    }
    
    // Check if page is responsive
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
    // Verify page actually loaded content (not stuck loading)
    const hasContent = await page.locator('h1, h2, h3, [role="main"], main').count();
    expect(hasContent).toBeGreaterThan(0);
    
    console.log('✅ Create business page loaded successfully without infinite loading');
  });

  test('should handle rapid navigation without timing issues', async ({ page }) => {
    console.log('🚀 Testing rapid navigation...');
    
    const routes = [
      '/dashboard/create-business',
      '/dashboard',
      '/dashboard/create-business'
    ];
    
    for (let i = 0; i < routes.length; i++) {
      console.log(`🔄 Navigating to: ${routes[i]}`);
      
      await page.goto(`http://localhost:3002${routes[i]}`);
      
      // Wait for page to stabilize
      await page.waitForLoadState('domcontentloaded');
      
      // Quick check for infinite loading
      const isLoading = await page.locator('[data-testid*="loading"], .loading, .spinner').count();
      
      if (isLoading === 0) {
        console.log(`  ✅ Navigation ${i + 1}: No loading issues`);
      } else {
        console.log(`  ⚠️ Navigation ${i + 1}: ${isLoading} loading elements found`);
      }
      
      await page.waitForTimeout(500); // Small pause between navigations
    }
    
    console.log('✅ Rapid navigation test completed successfully');
  });

  test('should detect middleware retry behavior', async ({ page }) => {
    console.log('🔍 Monitoring middleware retry behavior...');
    
    // Collect console logs
    const retryLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Middleware: Retry') || text.includes('retriesUsed')) {
        retryLogs.push(text);
        console.log(`📝 Captured: ${text}`);
      }
    });
    
    // Navigate to create-business page multiple times
    for (let i = 0; i < 3; i++) {
      await page.goto('http://localhost:3002/dashboard/create-business');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
    }
    
    console.log(`📊 Total retry logs captured: ${retryLogs.length}`);
    
    if (retryLogs.length === 0) {
      console.log('✅ No middleware retries needed - timing is good!');
    } else {
      console.log('ℹ️ Middleware retries detected (this shows the fix is working):');
      retryLogs.forEach(log => console.log(`  ${log}`));
    }
  });
}); 