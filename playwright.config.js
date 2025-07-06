module.exports = {
  testDir: './tests',
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },
  fullyParallel: false, // Run tests sequentially for auth testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for auth testing
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true, // Set to false to see browser during testing
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    launchOptions: {
      slowMo: 100 // Add small delay between actions for stability
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { ...require('@playwright/test').devices['Desktop Chrome'] },
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3002,
    reuseExistingServer: !process.env.CI,
    timeout: 120000 // 2 minutes to start the server
  }
}; 