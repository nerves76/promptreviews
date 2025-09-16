const { test, expect } = require('@playwright/test');

test.describe('Focused Authentication Issues', () => {
  test('should identify specific UI and authentication issues', async ({ page }) => {
    console.log('🎭 Testing specific authentication issues...');

    // Issue 1: Business form not found
    console.log('\n📍 Issue 1: Business Form Analysis');
    await page.goto('http://localhost:3002/dashboard/create-business');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'test-results/create-business-page.png' });
    
    // Check for various form patterns
    const formSelectors = [
      'form',
      'input[name="name"]',
      'input[placeholder*="business"]',
      'input[placeholder*="company"]',
      'input[type="text"]',
      'button[type="submit"]',
      'button:has-text("Create")',
      'button:has-text("Save")',
      '.business-form',
      '#business-form',
      '#create-business-form'
    ];
    
    for (const selector of formSelectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements found`);
    }
    
    // Check page content
    const pageContent = await page.textContent('body');
    if (pageContent.includes('business')) {
      console.log('✅ Page contains business-related content');
    } else {
      console.log('❌ Page does not contain business-related content');
    }
    
    // Issue 2: Plan selection UI analysis
    console.log('\n📍 Issue 2: Plan Selection UI Analysis');
    await page.goto('http://localhost:3002/dashboard/plan');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/plan-page.png' });
    
    const planSelectors = [
      'button:has-text("Select")',
      'button:has-text("Choose")',
      'button:has-text("Upgrade")',
      '.pricing',
      '.plan',
      '[data-testid*="plan"]',
      'iframe[src*="stripe"]'
    ];
    
    for (const selector of planSelectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements found`);
    }
    
    // Issue 3: Team invitation UI analysis
    console.log('\n📍 Issue 3: Team Management UI Analysis');
    await page.goto('http://localhost:3002/dashboard/team');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/team-page.png' });
    
    const teamSelectors = [
      'button:has-text("Invite")',
      'button:has-text("Add")',
      'button:has-text("Team")',
      'input[type="email"]',
      'input[placeholder*="email"]',
      '.team-invite',
      '[data-testid*="invite"]'
    ];
    
    for (const selector of teamSelectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements found`);
    }
    
    // Issue 4: Authentication state testing
    console.log('\n📍 Issue 4: Authentication State Testing');
    
    // Clear cookies and test behavior
    await page.context().clearCookies();
    console.log('🍪 Cleared cookies');
    
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const dashboardUrl = page.url();
    console.log(`Dashboard URL after cookie clear: ${dashboardUrl}`);
    
    if (dashboardUrl.includes('/auth/sign-in')) {
      console.log('✅ Properly redirects to sign-in when not authenticated');
    } else {
      console.log('⚠️ Dashboard accessible without authentication');
    }
    
    // Issue 5: Team invitation link testing
    console.log('\n📍 Issue 5: Team Invitation Link Testing');
    
    const inviteParams = new URLSearchParams({
      token: 'test-token-123',
      email: 'test@example.com'
    });
    
    await page.goto(`http://localhost:3002/team/accept?${inviteParams.toString()}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const inviteUrl = page.url();
    console.log(`Team invite URL result: ${inviteUrl}`);
    
    if (inviteUrl.includes('/auth/sign-up')) {
      console.log('✅ Team invite redirects to sign-up');
      
      // Check if email is pre-filled
      const emailInput = page.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        const emailValue = await emailInput.inputValue();
        console.log(`Email input value: "${emailValue}"`);
        
        if (emailValue === 'test@example.com') {
          console.log('✅ Email pre-filled from invitation');
        } else {
          console.log('❌ Email not pre-filled from invitation');
        }
      }
    } else {
      console.log('❌ Team invite does not redirect to sign-up');
    }
    
    console.log('\n🎉 Focused authentication issue analysis complete!');
  });
  
  test('should test database connectivity and RLS policies', async ({ page }) => {
    console.log('🎭 Testing database connectivity and RLS policies...');
    
    // Monitor network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('rest/v1')) {
        requests.push({
          url: request.url(),
          method: request.method()
        });
      }
    });
    
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('rest/v1')) {
        responses.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.goto('http://localhost:3002/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);
    
    console.log('\n📊 Database Requests:');
    requests.forEach(req => {
      console.log(`${req.method} ${req.url}`);
    });
    
    console.log('\n📊 Database Responses:');
    responses.forEach(res => {
      console.log(`${res.status} ${res.url}`);
    });
    
    // Test specific API endpoints
    const apiEndpoints = [
      '/api/check-admin',
      '/api/check-env',
      '/api/debug-session',
      '/api/businesses',
      '/api/widgets'
    ];
    
    console.log('\n📍 Testing API Endpoints:');
    for (const endpoint of apiEndpoints) {
      await page.goto(`http://localhost:3002${endpoint}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const responseText = await page.textContent('body');
      console.log(`${endpoint}: ${responseText.slice(0, 100)}...`);
    }
    
    console.log('\n🎉 Database connectivity analysis complete!');
  });
}); 