/**
 * Puppeteer Signup Flow Test
 *
 * Automates the full direct signup experience:
 * 1. Fill out the signup form (no email confirmation required)
 * 2. Validate the success state and navigate to sign-in
 * 3. Sign in with the newly created account and verify dashboard access
 * 4. Clean up the test user via Supabase admin API
 */

require('dotenv').config({ path: '.env.local' });

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3002';
const SIGNUP_URL = `${APP_URL}/auth/sign-up`;
const SIGNIN_URL = `${APP_URL}/auth/sign-in`;
const DASHBOARD_PATH_PREFIX = '/dashboard';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase environment variables are required to run the signup browser test.');
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findUserByEmail(email) {
  try {
    const { data, error } = await adminClient.auth.admin.listUsers({
      perPage: 200,
      page: 1,
      filter: { email }
    });

    if (error) {
      console.warn('⚠️  Unable to fetch user:', error.message);
      return null;
    }

    return data?.users?.find(user => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
  } catch (err) {
    console.warn('⚠️  findUserByEmail failed:', err.message);
    return null;
  }
}

async function waitForUserByEmail(email, attempts = 15, delayMs = 500) {
  for (let i = 0; i < attempts; i++) {
    const user = await findUserByEmail(email);
    if (user) {
      return user;
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  return null;
}

function makeTestUser() {
  const suffix = Date.now();
  return {
    email: `signup-e2e-${suffix}@example.com`,
    password: 'Test1234!',
    firstName: 'Signup',
    lastName: `E2E${suffix}`
  };
}

async function cleanupTestUser(email) {
  try {
    const user = await findUserByEmail(email);
    if (user) {
      await adminClient.auth.admin.deleteUser(user.id);
      console.log('🧹 Deleted test user:', email);
    }
  } catch (err) {
    console.warn('⚠️  Cleanup failed:', err.message);
  }
}

async function runSignupBrowserTest() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const testUser = makeTestUser();
  let supabaseUserRecord = null;
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);

  page.on('request', request => {
    if (request.url().startsWith(APP_URL)) {
      console.log(`➡️  ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().startsWith(APP_URL)) {
      console.log(`⬅️  ${response.status()} ${response.url()}`);
    }
  });

  // Log console output from the page to aid debugging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.error(`🔴 [console.${type}] ${text}`);
    } else if (type === 'warning' || text.toLowerCase().includes('error')) {
      console.warn(`🟠 [console.${type}] ${text}`);
    } else {
      console.log(`📝 [console.${type}] ${text}`);
    }
  });

  try {
    console.log('🌐 Opening signup page:', SIGNUP_URL);
    await page.goto(SIGNUP_URL, { waitUntil: 'networkidle0' });

    await page.waitForSelector('input[autocomplete="given-name"]');

    console.log('✏️  Filling signup form...');
    await page.type('input[autocomplete="given-name"]', testUser.firstName);
    await page.type('input[autocomplete="family-name"]', testUser.lastName);
    await page.type('input[autocomplete="email"]', testUser.email);
    await page.type('input[autocomplete="new-password"]', testUser.password);

    // Accept terms
    await page.click('#accept-terms');

    console.log('🚀 Submitting signup form');
    await Promise.all([
      page.waitForResponse(response =>
        response.url().includes('/api/auth/signup') && response.request().method() === 'POST'
      ),
      page.click('button[type="submit"]')
    ]);

    // Confirm success message is shown
    await page.waitForFunction(() =>
      document.body.innerText.includes('Account created successfully!')
    );
    console.log('✅ Signup success message displayed');

    console.log('➡️  Navigating to sign-in page');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('a[href="/auth/sign-in"]')
    ]);

    if (page.url() !== SIGNIN_URL) {
      console.log('ℹ️  Sign-in URL after navigation:', page.url());
    }

    await page.waitForSelector('input[autocomplete="email"]');

    console.log('🔐 Signing in with new credentials');
    await page.type('input[autocomplete="email"]', testUser.email);
    await page.type('input[autocomplete="current-password"]', testUser.password);

    await page.click('button[type="submit"]');

    // Wait for the business onboarding redirect to fire
    await page.waitForFunction(() => location.pathname === '/dashboard/create-business', { timeout: 15000 });

    console.log('🎯 Landed on:', await page.evaluate(() => location.pathname));

    // Fetch Supabase user record so we can verify account updates later
    supabaseUserRecord = await waitForUserByEmail(testUser.email, 20, 500);
    if (!supabaseUserRecord) {
      throw new Error('Unable to locate newly created Supabase user');
    }

    // Wait for account selection to hydrate for this user
    await page.waitForFunction(
      (userId, accountId) => {
        const storageKey = `promptreviews_selected_account_${userId}`;
        return localStorage.getItem(storageKey) === accountId;
      },
      { timeout: 20000 },
      supabaseUserRecord.id,
      supabaseUserRecord.id
    );

    // ===== New: Complete business profile =====
    const businessName = `QA ${testUser.lastName} LLC`;
    const city = 'Austin';
    const state = 'TX';
    const zip = '78701';

    const fillField = async (selector, value) => {
      await page.waitForSelector(selector, { visible: true });
      await page.focus(selector);
      await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, selector);
      await page.type(selector, value, { delay: 10 });
    };

    console.log('🧾 Filling business profile');
    await fillField('input[name="name"]', businessName);
    await fillField('input[name="business_email"]', testUser.email);
    await fillField('input#address_city', city);
    await fillField('input#address_state', state);
    await fillField('input#address_zip', zip);
    await page.select('select[name="address_country"]', 'United States');
    await page.click('input[name="referral_source"][value="google_search"]');

    console.log('💾 Submitting business profile via API');
    const businessPayload = {
      name: businessName,
      account_id: supabaseUserRecord.id,
      business_email: testUser.email,
      address_city: city,
      address_state: state,
      address_zip: zip,
      address_country: 'United States',
      industry: [],
      industries_other: '',
      phone: '',
    };

    const apiResult = await page.evaluate(async (payload) => {
      const response = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => null);
      return { status: response.status, data };
    }, businessPayload);

    if (!apiResult || apiResult.status < 200 || apiResult.status >= 300) {
      throw new Error(`Business creation API failed (${apiResult?.status}): ${JSON.stringify(apiResult?.data)}`);
    }

    const createdBusinessId = apiResult.data?.business?.id;
    if (createdBusinessId) {
      await page.evaluate(({ businessId, accountId }) => {
        window.dispatchEvent(new CustomEvent('businessCreated', { detail: { businessId, accountId } }));
      }, { businessId: createdBusinessId, accountId: supabaseUserRecord.id });
    }

    await page.goto(`${APP_URL}/dashboard?businessCreated=1`, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => location.pathname === '/dashboard', { timeout: 20000 });
    console.log('🚀 Redirected to dashboard after business creation');

    // ===== New: Handle Grower plan selection =====
    console.log('🕵️ Waiting for pricing modal');
    await page.waitForFunction(() => {
      return Array.from(document.querySelectorAll('h3')).some(h3 => h3.textContent?.includes('Grower'));
    }, { timeout: 20000 });

    console.log('🛒 Choosing Grower plan (trial)');
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const growerHeading = headings.find(h3 => h3.textContent?.includes('Grower'));
      if (!growerHeading) {
        throw new Error('Grower plan card not found');
      }
      const card = growerHeading.closest('div');
      if (!card) {
        throw new Error('Grower card container not found');
      }
      const chooseButton = card.querySelector('button');
      if (!(chooseButton instanceof HTMLButtonElement)) {
        throw new Error('Grower plan Choose button not found');
      }
      chooseButton.click();
    });

    await page.waitForFunction(() => !document.querySelector('div[class*="inset-0"][class*="z-50"]'), { timeout: 20000 });
    console.log('✅ Grower plan modal closed');

    // Give Supabase time to persist the plan update
    await new Promise(resolve => setTimeout(resolve, 2000));

    const verificationUser = supabaseUserRecord ?? await waitForUserByEmail(testUser.email, 10, 500);
    if (!verificationUser) {
      throw new Error('Unable to find signup user for plan verification');
    }

    const { data: accountRow, error: accountError } = await adminClient
      .from('accounts')
      .select('plan, business_creation_complete')
      .eq('id', verificationUser.id)
      .single();

    if (accountError) {
      throw new Error(`Failed to load account for verification: ${accountError.message}`);
    }

    if (accountRow?.plan !== 'grower') {
      throw new Error(`Expected Grower plan but found ${accountRow?.plan}`);
    }

    console.log('🧾 Account plan confirmed as Grower with business_creation_complete =', accountRow.business_creation_complete);

    console.log('🎉 Signup browser test completed successfully');
  } finally {
    await browser.close();
    await cleanupTestUser(testUser.email);
  }
}

if (require.main === module) {
  runSignupBrowserTest().catch(error => {
    console.error('❌ Signup browser test failed:', error);
    process.exitCode = 1;
  });
}

module.exports = { runSignupBrowserTest };
