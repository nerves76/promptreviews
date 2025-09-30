#!/usr/bin/env node

/**
 * Fix scheduled posts that were accidentally scheduled for 2025 instead of 2024
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixScheduledDates() {
  console.log('🔍 Finding posts scheduled for 2025...\n');

  // First, let's find all posts scheduled for 2025
  const { data: futurePosts, error: fetchError } = await supabase
    .from('google_business_scheduled_posts')
    .select('id, scheduled_date, status, post_kind, created_at')
    .gte('scheduled_date', '2025-01-01')
    .eq('status', 'pending')
    .order('scheduled_date');

  if (fetchError) {
    console.error('Error fetching posts:', fetchError);
    return;
  }

  if (!futurePosts || futurePosts.length === 0) {
    console.log('No posts found scheduled for 2025');
    return;
  }

  console.log(`Found ${futurePosts.length} posts scheduled for 2025:\n`);
  futurePosts.forEach(post => {
    console.log(`  ID: ${post.id}`);
    console.log(`  Type: ${post.post_kind}`);
    console.log(`  Scheduled: ${post.scheduled_date}`);
    console.log(`  Created: ${post.created_at}`);
    console.log('---');
  });

  console.log('\n⚠️  These posts are scheduled for 2025 (next year)!');
  console.log('They should probably be 2024 dates.\n');

  // Offer to fix them
  console.log('To fix these posts, you can:');
  console.log('1. Change them to 2024 dates (will process immediately if date is in past)');
  console.log('2. Change them to today (will process at next cron run - 1 PM UTC)');
  console.log('3. Leave them as-is\n');

  // Create SQL to fix them
  console.log('📝 SQL to fix these posts:\n');
  console.log('-- Option 1: Change 2025 to 2024 (keeping same month/day)');
  console.log(`UPDATE google_business_scheduled_posts
SET
    scheduled_date = scheduled_date - INTERVAL '1 year',
    updated_at = NOW()
WHERE
    scheduled_date >= '2025-01-01'
    AND scheduled_date < '2026-01-01'
    AND status = 'pending';`);

  console.log('\n-- Option 2: Change all to today (process at next cron)');
  console.log(`UPDATE google_business_scheduled_posts
SET
    scheduled_date = CURRENT_DATE,
    updated_at = NOW()
WHERE
    scheduled_date >= '2025-01-01'
    AND status = 'pending';`);

  console.log('\n-- Option 3: Fix specific posts (9/23/2025 → 9/23/2024)');
  console.log(`UPDATE google_business_scheduled_posts
SET
    scheduled_date = '2024-09-23',
    updated_at = NOW()
WHERE
    scheduled_date = '2025-09-23'
    AND status = 'pending';`);

  console.log('\n💡 Run one of these SQL queries in your Supabase dashboard');
  console.log('   Then the cron job will process them at the next run (1 PM UTC daily)');
  console.log('   Or run the cron manually with: node scripts/test-google-business-cron.js');
}

// Optionally provide auto-fix functionality
async function autoFix() {
  const args = process.argv.slice(2);

  if (args[0] === '--fix-to-2024') {
    console.log('\n🔧 Auto-fixing: Changing 2025 dates to 2024...\n');

    const { data, error } = await supabase
      .rpc('fix_scheduled_posts_year', {
        from_year: '2025-01-01',
        to_year_offset: '-1 year'
      });

    // Since RPC might not exist, use direct update
    const { data: updateData, error: updateError } = await supabase
      .from('google_business_scheduled_posts')
      .update({
        scheduled_date: new Date().toISOString().split('T')[0], // Set to today
        updated_at: new Date().toISOString()
      })
      .gte('scheduled_date', '2025-01-01')
      .eq('status', 'pending')
      .select();

    if (updateError) {
      console.error('Error updating posts:', updateError);
    } else if (updateData) {
      console.log(`✅ Updated ${updateData.length} posts to today's date`);
      console.log('They will be processed at the next cron run (1 PM UTC)');
    }
  }
}

// Run the check
fixScheduledDates()
  .then(() => autoFix())
  .catch(console.error);