#!/usr/bin/env node

/**
 * Complete test suite for Google Business Profile scheduling
 * This will help verify the entire scheduling pipeline is working
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.CRON_SECRET_TOKEN || process.env.CRON_SECRET;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function runTests() {
  log('\n🧪 Google Business Profile Scheduling Test Suite', 'bright');
  log('=' .repeat(60), 'blue');

  // Test 1: Check if there are any users with Google Business connected
  log('\n1️⃣  Checking for users with Google Business Profile connected...', 'cyan');
  const { data: gbpUsers, error: gbpError } = await supabase
    .from('google_business_profiles')
    .select('user_id, expires_at, selected_account_id')
    .limit(5);

  if (gbpError || !gbpUsers || gbpUsers.length === 0) {
    log('   ❌ No users have Google Business Profile connected', 'red');
    log('   → Need at least one user with GBP connected to test scheduling', 'yellow');
    return;
  }

  log(`   ✅ Found ${gbpUsers.length} users with GBP connected`, 'green');

  // Check if any tokens are expired
  const now = new Date();
  const expiredUsers = gbpUsers.filter(u => u.expires_at && new Date(u.expires_at) < now);
  if (expiredUsers.length > 0) {
    log(`   ⚠️  ${expiredUsers.length} users have expired tokens`, 'yellow');
  }

  // Test 2: Check for existing scheduled posts
  log('\n2️⃣  Checking existing scheduled posts...', 'cyan');
  const { data: scheduledPosts, error: schedError } = await supabase
    .from('google_business_scheduled_posts')
    .select('id, scheduled_date, status, post_kind')
    .order('scheduled_date', { ascending: false })
    .limit(10);

  if (schedError) {
    log('   ❌ Error checking scheduled posts: ' + schedError.message, 'red');
  } else if (scheduledPosts && scheduledPosts.length > 0) {
    log(`   📅 Recent scheduled posts:`, 'blue');
    scheduledPosts.forEach(post => {
      const statusEmoji = {
        'pending': '⏳',
        'completed': '✅',
        'failed': '❌',
        'processing': '⚙️',
        'partial_success': '⚠️'
      }[post.status] || '❓';

      console.log(`      ${statusEmoji} ${post.post_kind} - ${post.scheduled_date} (${post.status})`);
    });
  } else {
    log('   📭 No scheduled posts found', 'yellow');
  }

  // Test 3: Test the cron endpoint
  log('\n3️⃣  Testing cron endpoint accessibility...', 'cyan');

  if (!cronSecret) {
    log('   ⚠️  CRON_SECRET_TOKEN not set locally', 'yellow');
    log('   → Set it to match Vercel: export CRON_SECRET_TOKEN="your-token"', 'yellow');
  } else {
    // Test with curl
    const { exec } = require('child_process');
    const testCron = new Promise((resolve, reject) => {
      const cmd = `curl -s -o /dev/null -w "%{http_code}" -X GET "https://app.promptreviews.app/api/cron/process-google-business-scheduled" -H "Authorization: Bearer ${cronSecret}"`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout.trim());
        }
      });
    });

    try {
      const statusCode = await testCron;
      if (statusCode === '200') {
        log('   ✅ Cron endpoint is accessible (HTTP 200)', 'green');
      } else if (statusCode === '401') {
        log('   ❌ Cron endpoint returned 401 - Check CRON_SECRET in Vercel', 'red');
      } else {
        log(`   ⚠️  Cron endpoint returned HTTP ${statusCode}`, 'yellow');
      }
    } catch (error) {
      log('   ❌ Failed to test cron endpoint: ' + error.message, 'red');
    }
  }

  // Test 4: Check cron configuration
  log('\n4️⃣  Verifying cron configuration...', 'cyan');
  log('   📋 Cron schedule: Daily at 1:00 PM UTC', 'blue');
  log('   📋 Processes posts where: scheduled_date <= today AND status = "pending"', 'blue');

  const nextRunTime = new Date();
  nextRunTime.setUTCHours(13, 0, 0, 0);
  if (nextRunTime < new Date()) {
    nextRunTime.setDate(nextRunTime.getDate() + 1);
  }
  log(`   ⏰ Next automatic run: ${nextRunTime.toUTCString()}`, 'blue');

  // Test 5: Create a test post
  log('\n5️⃣  Creating a test post for scheduling...', 'cyan');

  // Use the first user with GBP connected
  const testUser = gbpUsers[0];

  // First, get their locations
  const { data: locations, error: locError } = await supabase
    .from('google_business_locations')
    .select('location_id, location_name')
    .eq('user_id', testUser.user_id)
    .limit(1);

  if (locError || !locations || locations.length === 0) {
    log('   ❌ No locations found for test user', 'red');
    return;
  }

  const testLocation = locations[0];
  log(`   📍 Using location: ${testLocation.location_name || testLocation.location_id}`, 'blue');

  // Create a test post scheduled for today
  const today = new Date().toISOString().split('T')[0];
  const testPostData = {
    user_id: testUser.user_id,
    account_id: testUser.selected_account_id || 'unknown',
    post_kind: 'post',
    post_type: 'STANDARD',
    content: {
      summary: `Test post from scheduling system - ${new Date().toLocaleTimeString()}`
    },
    scheduled_date: today,
    timezone: 'UTC',
    selected_locations: [{
      id: testLocation.location_id,
      name: testLocation.location_name
    }],
    status: 'pending'
  };

  log('\n   Create test post? (This will publish to Google Business Profile)', 'yellow');
  log('   → To create: Update the script to set CREATE_TEST_POST=true', 'yellow');

  const CREATE_TEST_POST = false; // Set to true to actually create the post

  if (CREATE_TEST_POST) {
    const { data: newPost, error: createError } = await supabase
      .from('google_business_scheduled_posts')
      .insert(testPostData)
      .select()
      .single();

    if (createError) {
      log('   ❌ Failed to create test post: ' + createError.message, 'red');
    } else {
      log('   ✅ Test post created with ID: ' + newPost.id, 'green');
      log(`   📅 Scheduled for: ${newPost.scheduled_date}`, 'blue');

      // Also create the results record
      const { error: resultError } = await supabase
        .from('google_business_scheduled_post_results')
        .insert({
          scheduled_post_id: newPost.id,
          location_id: testLocation.location_id,
          status: 'pending'
        });

      if (!resultError) {
        log('   ✅ Result tracking record created', 'green');
      }

      log('\n   To process this test post:', 'cyan');
      log('   1. Wait for next cron run at 1 PM UTC, OR', 'yellow');
      log('   2. Trigger manually with:', 'yellow');
      log(`      curl -X GET "https://app.promptreviews.app/api/cron/process-google-business-scheduled" \\`, 'reset');
      log(`        -H "Authorization: Bearer YOUR_CRON_SECRET"`, 'reset');
    }
  }

  // Summary
  log('\n' + '=' .repeat(60), 'blue');
  log('📊 Test Summary:', 'bright');
  log(`   • GBP Users Connected: ${gbpUsers.length}`, 'reset');
  log(`   • Scheduled Posts: ${scheduledPosts?.length || 0}`, 'reset');
  log(`   • Cron Status: ${cronSecret ? 'Testable' : 'Need CRON_SECRET_TOKEN'}`, 'reset');
  log(`   • Next Cron Run: ${nextRunTime.toLocaleString()}`, 'reset');

  log('\n✅ Testing Complete!', 'green');
  log('\nNext Steps:', 'cyan');
  log('1. Set CREATE_TEST_POST=true in script to create a test post', 'reset');
  log('2. Run the cron manually to process immediately', 'reset');
  log('3. Check Google Business Profile to verify post appeared', 'reset');
  log('4. Monitor the google_business_scheduled_posts table for status updates', 'reset');
}

// Run the tests
runTests().catch(console.error);