const { test, expect } = require('@playwright/test');

test.describe('Debug Page Content', () => {
  test('should examine actual HTML content of key pages', async ({ page }) => {
    console.log('🎭 Debugging actual page content...');

    // Test 1: Create Business Page Content
    console.log('\n📍 Create Business Page Analysis');
    await page.goto('http://localhost:3002/dashboard/create-business');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Get the full page text content
    const createBusinessContent = await page.textContent('body');
    console.log('📄 Create Business Page Text Content:');
    console.log('='.repeat(80));
    console.log(createBusinessContent.substring(0, 1000) + '...');
    console.log('='.repeat(80));
    
    // Check for specific text patterns
    const hasSignInMessage = createBusinessContent.includes('sign in') || createBusinessContent.includes('Sign in');
    const hasBusinessText = createBusinessContent.includes('business') || createBusinessContent.includes('Business');
    const hasFormText = createBusinessContent.includes('form') || createBusinessContent.includes('Form');
    const hasCreateText = createBusinessContent.includes('create') || createBusinessContent.includes('Create');
    
    console.log(`Contains sign in text: ${hasSignInMessage}`);
    console.log(`Contains business text: ${hasBusinessText}`);
    console.log(`Contains form text: ${hasFormText}`);
    console.log(`Contains create text: ${hasCreateText}`);
    
    // Check actual form structure
    const formElements = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map(form => ({
        id: form.id || 'no-id',
        class: form.className || 'no-class',
        inputs: Array.from(form.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name || 'no-name',
          placeholder: input.placeholder || 'no-placeholder',
          id: input.id || 'no-id'
        })),
        buttons: Array.from(form.querySelectorAll('button')).map(button => ({
          type: button.type,
          text: button.textContent?.trim() || 'no-text',
          class: button.className || 'no-class'
        }))
      }));
    });
    
    console.log('\n📝 Form Structure:');
    console.log(JSON.stringify(formElements, null, 2));

    // Test 2: Plan Page Content
    console.log('\n📍 Plan Page Analysis');
    await page.goto('http://localhost:3002/dashboard/plan');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const planContent = await page.textContent('body');
    console.log('💳 Plan Page Text Content:');
    console.log('='.repeat(80));
    console.log(planContent.substring(0, 1000) + '...');
    console.log('='.repeat(80));
    
    // Test 3: Team Page Content
    console.log('\n📍 Team Page Analysis');
    await page.goto('http://localhost:3002/dashboard/team');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const teamContent = await page.textContent('body');
    console.log('👥 Team Page Text Content:');
    console.log('='.repeat(80));
    console.log(teamContent.substring(0, 1000) + '...');
    console.log('='.repeat(80));
    
    // Test 4: Team Invitation Endpoint
    console.log('\n📍 Team Invitation Endpoint Analysis');
    await page.goto('http://localhost:3002/team/accept?token=test-token&email=test@example.com');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const inviteContent = await page.textContent('body');
    const inviteUrl = page.url();
    
    console.log(`🔗 Final URL: ${inviteUrl}`);
    console.log('📄 Team Invite Page Content:');
    console.log('='.repeat(80));
    console.log(inviteContent.substring(0, 500) + '...');
    console.log('='.repeat(80));
    
    // Test 5: Check Authentication State
    console.log('\n📍 Authentication State Analysis');
    
    // Try to access a protected endpoint
    const authCheckResponse = await page.goto('http://localhost:3002/api/check-admin');
    const authCheckText = await page.textContent('body');
    console.log(`🔐 Auth Check Response: ${authCheckText}`);
    
    // Check session debugging
    await page.goto('http://localhost:3002/api/debug-session');
    const sessionDebugText = await page.textContent('body');
    console.log(`🔍 Session Debug: ${sessionDebugText.substring(0, 200)}...`);
    
    console.log('\n🎉 Page content analysis complete!');
  });
}); 