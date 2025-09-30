#!/usr/bin/env node

/**
 * Check scheduled Google Business posts in the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkScheduledPosts() {
  console.log('🔍 Checking Google Business Scheduled Posts\n');
  console.log('=' .repeat(60));

  // 1. Check posts that should have been processed
  console.log('\n📅 Posts that should have been processed (scheduled <= today):');
  const { data: pendingPosts, error: pendingError } = await supabase
    .from('google_business_scheduled_posts')
    .select('id, user_id, scheduled_date, timezone, status, error_log, created_at')
    .lte('scheduled_date', new Date().toISOString().split('T')[0])
    .in('status', ['pending', 'failed'])
    .order('scheduled_date', { ascending: false });

  if (pendingError) {
    console.error('Error fetching pending posts:', pendingError);
  } else if (pendingPosts && pendingPosts.length > 0) {
    console.table(pendingPosts.map(p => ({
      id: p.id.substring(0, 8) + '...',
      scheduled_date: p.scheduled_date,
      status: p.status,
      timezone: p.timezone,
      error: p.error_log ? JSON.stringify(p.error_log).substring(0, 50) : null
    })));
    console.log(`\n⚠️  Found ${pendingPosts.length} posts that should have been processed`);
  } else {
    console.log('✅ No pending posts that should have been processed');
  }

  // 2. Check posts stuck in processing
  console.log('\n⏳ Posts stuck in "processing" status:');
  const { data: processingPosts, error: processingError } = await supabase
    .from('google_business_scheduled_posts')
    .select('id, scheduled_date, status, updated_at')
    .eq('status', 'processing');

  if (processingError) {
    console.error('Error fetching processing posts:', processingError);
  } else if (processingPosts && processingPosts.length > 0) {
    console.table(processingPosts.map(p => ({
      id: p.id.substring(0, 8) + '...',
      scheduled_date: p.scheduled_date,
      stuck_since: p.updated_at
    })));
    console.log(`\n⚠️  Found ${processingPosts.length} posts stuck in processing`);
  } else {
    console.log('✅ No posts stuck in processing');
  }

  // 3. Check recently failed posts
  console.log('\n❌ Recently failed posts (last 7 days):');
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: failedPosts, error: failedError } = await supabase
    .from('google_business_scheduled_posts')
    .select('id, scheduled_date, status, error_log, updated_at')
    .eq('status', 'failed')
    .gte('updated_at', sevenDaysAgo.toISOString())
    .order('updated_at', { ascending: false });

  if (failedError) {
    console.error('Error fetching failed posts:', failedError);
  } else if (failedPosts && failedPosts.length > 0) {
    failedPosts.forEach(post => {
      console.log(`\n  Post ID: ${post.id}`);
      console.log(`  Scheduled: ${post.scheduled_date}`);
      console.log(`  Failed at: ${post.updated_at}`);
      if (post.error_log) {
        console.log(`  Error: ${JSON.stringify(post.error_log, null, 2)}`);
      }
    });
    console.log(`\n⚠️  Found ${failedPosts.length} failed posts in the last 7 days`);
  } else {
    console.log('✅ No failed posts in the last 7 days');
  }

  // 4. Check for users with expired tokens
  console.log('\n🔑 Checking Google Business Profile tokens:');
  const { data: tokenStatus, error: tokenError } = await supabase
    .from('google_business_profiles')
    .select('user_id, expires_at, selected_account_id')
    .lt('expires_at', new Date().toISOString());

  if (tokenError) {
    console.error('Error checking tokens:', tokenError);
  } else if (tokenStatus && tokenStatus.length > 0) {
    console.log(`⚠️  Found ${tokenStatus.length} users with expired Google tokens`);
    tokenStatus.forEach(t => {
      console.log(`  User: ${t.user_id.substring(0, 8)}... - Expired: ${t.expires_at}`);
    });
  } else {
    console.log('✅ All Google Business tokens are valid');
  }

  // 5. Summary statistics
  console.log('\n📊 Summary Statistics (last 30 days):');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: stats, error: statsError } = await supabase
    .from('google_business_scheduled_posts')
    .select('status')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (statsError) {
    console.error('Error fetching stats:', statsError);
  } else if (stats) {
    const statusCounts = stats.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {});

    console.table(Object.entries(statusCounts).map(([status, count]) => ({
      Status: status,
      Count: count
    })));
  }

  console.log('\n' + '=' .repeat(60));
  console.log('\n📝 Next Steps:');
  console.log('1. If posts are pending and past scheduled date, the cron may not be running');
  console.log('2. Check Vercel dashboard for cron execution logs');
  console.log('3. Run: node scripts/test-google-business-cron.js (with CRON_SECRET_TOKEN set)');
  console.log('4. Check error_log field for specific failure reasons');
}

// Run the check
checkScheduledPosts().catch(console.error);