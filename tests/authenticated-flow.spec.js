const { test, expect } = require('@playwright/test');

test.describe('Authenticated User Flow Testing', () => {
  
  test('should test dashboard pages with simulated authentication', async ({ page }) => {
    console.log('🎭 Testing authenticated user flows...');

    // Method 1: Try to access dashboard with development bypass
    console.log('\n📍 Method 1: Testing with development environment');
    
    // Set cookies that might indicate a session
    await page.context().addCookies([
      {
        name: 'sb-access-token',
        value: 'mock-token-for-testing',
        domain: 'localhost',
        path: '/'
      },
      {
        name: 'sb-refresh-token', 
        value: 'mock-refresh-token',
        domain: 'localhost',
        path: '/'
      }
    ]);

    await page.goto('http://localhost:3002/dashboard/create-business');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    let content = await page.textContent('body');
    console.log(`📄 Create Business (with mock cookies): ${content.includes('Sign in') ? 'Still showing sign-in' : 'Showing dashboard content'}`);
    
    // Method 2: Check if there's a way to bypass auth in development
    console.log('\n📍 Method 2: Testing direct API access');
    
    // Test API endpoints that might work without auth
    const apiTests = [
      { path: '/api/debug-session', description: 'Session Debug' },
      { path: '/api/check-env', description: 'Environment Check' },
      { path: '/api/businesses', description: 'Businesses API' }
    ];
    
    for (const apiTest of apiTests) {
      await page.goto(`http://localhost:3002${apiTest.path}`);
      await page.waitForLoadState('domcontentloaded');
      const apiContent = await page.textContent('body');
      console.log(`🔧 ${apiTest.description}: ${apiContent.substring(0, 100)}...`);
    }
    
    // Method 3: Test the actual authentication flow
    console.log('\n📍 Method 3: Testing Sign-Up/Sign-In Flow');
    
    await page.goto('http://localhost:3002/auth/sign-up');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Check if sign-up form is properly rendered
    const signupContent = await page.textContent('body');
    console.log(`📝 Sign-up page: ${signupContent.includes('Create') ? 'Has create account content' : 'Missing create content'}`);
    
    // Look for actual form elements on sign-up
    const signupForms = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map(form => ({
        inputCount: form.querySelectorAll('input').length,
        buttonCount: form.querySelectorAll('button').length,
        hasEmailInput: !!form.querySelector('input[type="email"]'),
        hasPasswordInput: !!form.querySelector('input[type="password"]'),
        buttonText: form.querySelector('button')?.textContent?.trim()
      }));
    });
    
    console.log('📋 Sign-up form analysis:', JSON.stringify(signupForms, null, 2));
    
    // Method 4: Test team invitation with different parameters
    console.log('\n📍 Method 4: Testing Team Invitation Variations');
    
    const inviteVariations = [
      { token: 'test', email: 'test@example.com', desc: 'Simple test token' },
      { token: '', email: 'test@example.com', desc: 'Empty token' },
      { token: 'test', email: '', desc: 'Empty email' },
      { token: 'valid-invite-123', email: 'newuser@example.com', desc: 'Different token format' }
    ];
    
    for (const variation of inviteVariations) {
      const inviteUrl = `http://localhost:3002/team/accept?token=${variation.token}&email=${encodeURIComponent(variation.email)}`;
      await page.goto(inviteUrl);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const inviteContent = await page.textContent('body');
      const isInvalid = inviteContent.includes('Invalid');
      const finalUrl = page.url();
      
      console.log(`🔗 ${variation.desc}: ${isInvalid ? 'Invalid invitation' : 'Valid invitation'} - Final URL: ${finalUrl.includes('sign-up') ? 'Redirects to sign-up' : 'Stays on invite page'}`);
    }
    
    // Method 5: Test middleware behavior
    console.log('\n📍 Method 5: Testing Middleware Behavior');
    
    // Clear all cookies and test
    await page.context().clearCookies();
    
    const protectedPaths = [
      '/dashboard',
      '/dashboard/create-business', 
      '/dashboard/plan',
      '/dashboard/team',
      '/dashboard/analytics'
    ];
    
    for (const path of protectedPaths) {
      await page.goto(`http://localhost:3002${path}`);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const finalUrl = page.url();
      const redirectsToSignIn = finalUrl.includes('/auth/sign-in');
      
      console.log(`🔒 ${path}: ${redirectsToSignIn ? 'Redirects to sign-in ✅' : 'Accessible without auth ⚠️'}`);
    }
    
    console.log('\n🎉 Authenticated flow testing complete!');
  });

  test('should test real authentication flow if possible', async ({ page }) => {
    console.log('🎭 Testing real authentication possibilities...');
    
    // Check if we can create a test user or access test endpoints
    console.log('\n📍 Checking for test/development endpoints');
    
    const testEndpoints = [
      '/api/test-auth',
      '/api/create-test-user', 
      '/api/dev/login',
      '/api/debug/auth',
      '/.well-known/test'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        await page.goto(`http://localhost:3002${endpoint}`);
        await page.waitForLoadState('domcontentloaded');
        const status = await page.evaluate(() => {
          return document.body.textContent?.includes('404') ? 404 : 200;
        });
        
        if (status === 200) {
          const content = await page.textContent('body');
          console.log(`✅ Found test endpoint ${endpoint}: ${content.substring(0, 100)}...`);
        } else {
          console.log(`❌ ${endpoint}: Not found`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: Error accessing`);
      }
    }
    
    // Check environment variables or configuration
    console.log('\n📍 Checking development configuration');
    
    await page.goto('http://localhost:3002/api/check-env');
    await page.waitForLoadState('domcontentloaded');
    const envContent = await page.textContent('body');
    
    try {
      const envData = JSON.parse(envContent);
      console.log('🔧 Environment check:', {
        success: envData.success,
        hasSupabase: !!envData.envCheck?.supabaseUrl,
        nodeEnv: envData.envCheck?.nodeEnv
      });
    } catch (e) {
      console.log('⚠️ Could not parse environment data');
    }
    
    console.log('\n🎉 Real authentication testing complete!');
  });
}); 