#!/usr/bin/env node

/**
 * Check PRODUCTION database for scheduled Google Business posts
 * This connects to the live Supabase instance, not local
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Make sure we're using production credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🌐 Connecting to PRODUCTION database...');
console.log(`URL: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkProductionPosts() {
  console.log('🔍 Checking Google Business Scheduled Posts in PRODUCTION\n');
  console.log('=' .repeat(60));

  // 1. Check ALL posts regardless of date
  console.log('\n📅 ALL scheduled posts in the system:');
  const { data: allPosts, error: allError } = await supabase
    .from('google_business_scheduled_posts')
    .select('id, user_id, scheduled_date, timezone, status, post_kind, created_at')
    .order('scheduled_date', { ascending: false })
    .limit(20);

  if (allError) {
    console.error('Error fetching posts:', allError);
    return;
  }

  if (allPosts && allPosts.length > 0) {
    console.table(allPosts.map(p => ({
      id: p.id.substring(0, 8) + '...',
      scheduled_date: p.scheduled_date,
      status: p.status,
      type: p.post_kind,
      timezone: p.timezone || 'UTC',
      created: new Date(p.created_at).toLocaleDateString()
    })));

    // Check for 2025 dates
    const posts2025 = allPosts.filter(p => p.scheduled_date && p.scheduled_date.startsWith('2025'));
    if (posts2025.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${posts2025.length} posts scheduled for 2025!`);
      posts2025.forEach(p => {
        console.log(`   - ${p.post_kind} scheduled for ${p.scheduled_date} (Status: ${p.status})`);
      });
    }
  } else {
    console.log('No posts found in the database');
  }

  // 2. Specifically check for September 23, 2025 posts
  console.log('\n🎯 Checking for posts scheduled on 9/23/2025:');
  const { data: sept2025Posts, error: septError } = await supabase
    .from('google_business_scheduled_posts')
    .select('*')
    .eq('scheduled_date', '2025-09-23');

  if (septError) {
    console.error('Error:', septError);
  } else if (sept2025Posts && sept2025Posts.length > 0) {
    console.log(`\n✅ FOUND ${sept2025Posts.length} posts scheduled for Sept 23, 2025:`);
    sept2025Posts.forEach((post, i) => {
      console.log(`\nPost ${i + 1}:`);
      console.log(`  ID: ${post.id}`);
      console.log(`  Type: ${post.post_kind}`);
      console.log(`  Status: ${post.status}`);
      console.log(`  Scheduled: ${post.scheduled_date}`);
      console.log(`  Created: ${post.created_at}`);
      if (post.error_log) {
        console.log(`  Error: ${JSON.stringify(post.error_log)}`);
      }
    });

    console.log('\n🔧 TO FIX THESE POSTS:');
    console.log('Run this SQL in your Supabase dashboard:\n');
    console.log(`-- Change Sept 23, 2025 to Sept 23, 2024 (past date - will process immediately)
UPDATE google_business_scheduled_posts
SET
    scheduled_date = '2024-09-23',
    updated_at = NOW()
WHERE
    scheduled_date = '2025-09-23'
    AND status = 'pending';`);

    console.log('\nOR:\n');

    console.log(`-- Change to today (will process at next cron run - 1 PM UTC)
UPDATE google_business_scheduled_posts
SET
    scheduled_date = CURRENT_DATE,
    updated_at = NOW()
WHERE
    scheduled_date = '2025-09-23'
    AND status = 'pending';`);
  } else {
    console.log('No posts found for Sept 23, 2025');
  }

  // 3. Check for any pending posts that should have run
  console.log('\n⏰ Posts that SHOULD have been processed (date <= today, status = pending):');
  const today = new Date().toISOString().split('T')[0];
  const { data: shouldHaveRun, error: shouldError } = await supabase
    .from('google_business_scheduled_posts')
    .select('id, scheduled_date, status')
    .lte('scheduled_date', today)
    .eq('status', 'pending');

  if (shouldError) {
    console.error('Error:', shouldError);
  } else if (shouldHaveRun && shouldHaveRun.length > 0) {
    console.log(`Found ${shouldHaveRun.length} posts that should have been processed`);
    console.table(shouldHaveRun);
  } else {
    console.log('No posts that should have been processed');
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n📝 Summary:');
  console.log('1. If you have posts scheduled for 2025, they need to be fixed');
  console.log('2. The cron job runs daily at 1 PM UTC');
  console.log('3. Only posts with scheduled_date <= today and status = "pending" get processed');
  console.log('4. Use the SQL queries above in Supabase dashboard to fix the dates');
}

// Run the check
checkProductionPosts().catch(console.error);