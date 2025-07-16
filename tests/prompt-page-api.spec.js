const { test, expect } = require('@playwright/test');

test.describe('Prompt Page API Endpoint', () => {
  test('should return combined prompt page and business data', async ({ page, request }) => {
    console.log('🧪 Testing combined prompt page API endpoint...');
    
    // Test API endpoint directly
    const apiResponse = await request.get('/api/prompt-pages/universal-md3qeuq9');
    
    expect(apiResponse.status()).toBe(200);
    
    const responseData = await apiResponse.json();
    
    // Validate response structure
    expect(responseData).toHaveProperty('promptPage');
    expect(responseData).toHaveProperty('businessProfile');
    
    // Validate prompt page data
    expect(responseData.promptPage).toHaveProperty('id');
    expect(responseData.promptPage).toHaveProperty('slug');
    expect(responseData.promptPage).toHaveProperty('account_id');
    
    // Validate business profile data
    expect(responseData.businessProfile).toHaveProperty('name');
    expect(responseData.businessProfile).toHaveProperty('primary_color');
    
    console.log('✅ API endpoint validation passed');
  });
  
  test('should return 404 for non-existent slug', async ({ request }) => {
    console.log('🧪 Testing 404 error handling...');
    
    const apiResponse = await request.get('/api/prompt-pages/non-existent-slug-test');
    
    expect(apiResponse.status()).toBe(404);
    
    const responseData = await apiResponse.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('not found');
    
    console.log('✅ 404 error handling works correctly');
  });
  
  test('should have proper caching headers', async ({ request }) => {
    console.log('🧪 Testing caching headers...');
    
    const apiResponse = await request.get('/api/prompt-pages/universal-md3qeuq9');
    
    expect(apiResponse.status()).toBe(200);
    
    const cacheHeader = apiResponse.headers()['cache-control'];
    expect(cacheHeader).toContain('s-maxage=300');
    expect(cacheHeader).toContain('max-age=60');
    
    console.log('✅ Caching headers are properly set');
  });
  
  test('should load prompt page in browser using new API', async ({ page }) => {
    console.log('🧪 Testing prompt page loading in browser...');
    
    // Monitor network requests
    const apiCall = page.waitForResponse(response => 
      response.url().includes('/api/prompt-pages/universal-md3qeuq9') && 
      response.status() === 200
    );
    
    // Navigate to prompt page
    await page.goto('/r/universal-md3qeuq9');
    
    // Wait for API call to complete
    const response = await apiCall;
    
    // Verify the page loads content
    await expect(page.locator('body')).not.toHaveText('Page not found');
    
    console.log('✅ Prompt page loads successfully using new API');
  });
}); 