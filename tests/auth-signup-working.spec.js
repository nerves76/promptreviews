const { test, expect } = require('@playwright/test');

test.describe('Authentication Sign-Up Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for server to be ready
    await page.goto('http://localhost:3002');
    await page.waitForLoadState('networkidle');
  });

  test('should load sign-up page without compilation errors', async ({ page }) => {
    console.log('🧪 Testing sign-up page loads correctly...');
    
    // Navigate to sign-up page
    await page.goto('http://localhost:3002/auth/sign-up');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded successfully (no 500 errors)
    const response = await page.goto('http://localhost:3002/auth/sign-up');
    expect(response.status()).toBe(200);
    
    // Verify key elements are present
    await expect(page.locator('h1')).toContainText('Create your account');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Sign-up page loaded successfully');
  });

  test('should not show "supabase is not defined" error on form submission', async ({ page }) => {
    console.log('🧪 Testing form submission without supabase errors...');
    
    // Navigate to sign-up page
    await page.goto('http://localhost:3002/auth/sign-up');
    await page.waitForLoadState('networkidle');
    
    // Listen for console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Fill out the form with test data
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait a moment for any errors to appear
    await page.waitForTimeout(2000);
    
    // Check that we don't have the specific "supabase is not defined" error
    const supabaseErrors = consoleErrors.filter(error => 
      error.includes('supabase is not defined') || 
      error.includes('ReferenceError: supabase is not defined')
    );
    
    expect(supabaseErrors).toHaveLength(0);
    
    // The form submission might fail due to other reasons (like email already exists)
    // but it should not fail due to "supabase is not defined"
    console.log('✅ No supabase reference errors detected');
  });

  test('should handle authentication flow without compilation errors', async ({ page }) => {
    console.log('🧪 Testing authentication flow...');
    
    // Navigate to sign-up page
    await page.goto('http://localhost:3002/auth/sign-up');
    await page.waitForLoadState('networkidle');
    
    // Verify no JavaScript errors in the page
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
    });
    
    // Fill and submit form
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for JavaScript runtime errors
    const compilationErrors = pageErrors.filter(error => 
      error.includes('Expected') && error.includes('got') ||
      error.includes('SyntaxError') ||
      error.includes('Unexpected token')
    );
    
    expect(compilationErrors).toHaveLength(0);
    
    console.log('✅ No compilation errors during authentication flow');
  });

  test('should have working supabase client in debug page', async ({ page }) => {
    console.log('🧪 Testing debug page functionality...');
    
    // Navigate to debug page
    await page.goto('http://localhost:3002/auth/debug-auth');
    await page.waitForLoadState('networkidle');
    
    // Check page loads successfully
    const response = await page.goto('http://localhost:3002/auth/debug-auth');
    expect(response.status()).toBe(200);
    
    // Verify debug elements are present
    await expect(page.locator('h1')).toContainText('Authentication Debug');
    
    // Check that supabase client information is displayed
    await expect(page.getByText('Environment Check')).toBeVisible();
    await expect(page.getByText('Session Check')).toBeVisible();
    
    console.log('✅ Debug page loaded successfully');
  });

  test('should not have syntax errors in console', async ({ page }) => {
    console.log('🧪 Testing for syntax errors across the app...');
    
    const syntaxErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && (
        msg.text().includes('SyntaxError') ||
        msg.text().includes('Expected') ||
        msg.text().includes('Unexpected token')
      )) {
        syntaxErrors.push(msg.text());
      }
    });
    
    // Test multiple pages to ensure no syntax errors
    const pagesToTest = [
      'http://localhost:3002',
      'http://localhost:3002/auth/sign-up',
      'http://localhost:3002/auth/sign-in',
      'http://localhost:3002/auth/debug-auth'
    ];
    
    for (const url of pagesToTest) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Give time for any errors to appear
    }
    
    expect(syntaxErrors).toHaveLength(0);
    
    if (syntaxErrors.length > 0) {
      console.log('❌ Found syntax errors:', syntaxErrors);
    } else {
      console.log('✅ No syntax errors found across tested pages');
    }
  });
}); 