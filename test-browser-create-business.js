const puppeteer = require('puppeteer');

async function testCreateBusinessPage() {
  console.log('🧪 BROWSER TEST: Create Business Page');
  console.log('═══════════════════════════════════════');

  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    devtools: true,   // Open DevTools
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Listen for console logs and errors
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        console.log(`🔴 Console Error: ${text}`);
      } else if (type === 'warn') {
        console.log(`🟡 Console Warning: ${text}`);
      } else if (text.includes('auth') || text.includes('Auth') || text.includes('Loading') || text.includes('CreateBusiness')) {
        console.log(`📝 Console Log (${type}): ${text}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`💥 Page Error: ${error.message}`);
    });

    // Navigate to create business page
    console.log('🔗 Navigating to: http://localhost:3002/dashboard/create-business');
    await page.goto('http://localhost:3002/dashboard/create-business', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Wait a bit for any async operations
    await page.waitForTimeout(5000);

    // Check if we're still on loading screen
    const loadingText = await page.$eval('body', el => el.innerText);
    
    if (loadingText.includes('Loading')) {
      console.log('❌ Page is stuck on loading screen');
      
      // Try to find what components are mounted
      const reactComponents = await page.evaluate(() => {
        // Look for React fiber nodes or component names in the DOM
        const elements = document.querySelectorAll('*');
        const components = [];
        
        elements.forEach(el => {
          if (el._reactInternalFiber || el._reactInternalInstance) {
            components.push(el.tagName);
          }
        });
        
        return components;
      });
      
      console.log('🔍 Mounted components:', reactComponents);
      
    } else {
      console.log('✅ Page loaded successfully');
      console.log('📄 Page content preview:', loadingText.substring(0, 200) + '...');
    }

    // Keep browser open for manual inspection
    console.log('🔍 Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCreateBusinessPage().catch(console.error); 