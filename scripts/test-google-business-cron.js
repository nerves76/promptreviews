#!/usr/bin/env node

/**
 * Test script to check Google Business scheduled posts cron job
 * This will help diagnose why scheduled posts aren't going out
 */

const https = require('https');

// Configuration
const PRODUCTION_URL = 'https://app.promptreviews.app';
const CRON_ENDPOINT = '/api/cron/process-google-business-scheduled';

// Get the cron secret from environment or prompt
const CRON_SECRET = process.env.CRON_SECRET_TOKEN;

if (!CRON_SECRET) {
  console.error('❌ CRON_SECRET_TOKEN environment variable not set');
  console.log('\nTo test the cron job, you need to set the CRON_SECRET_TOKEN:');
  console.log('export CRON_SECRET_TOKEN="your-secret-token"');
  console.log('\nYou can find this in your Vercel environment variables.');
  process.exit(1);
}

console.log('🔍 Testing Google Business Scheduled Posts Cron Job\n');
console.log(`📍 Endpoint: ${PRODUCTION_URL}${CRON_ENDPOINT}`);
console.log(`🔑 Using CRON_SECRET_TOKEN: ${CRON_SECRET.substring(0, 4)}...${CRON_SECRET.slice(-4)}\n`);

// Function to make the request
function testCronEndpoint() {
  const url = new URL(PRODUCTION_URL + CRON_ENDPOINT);

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'User-Agent': 'PromptReviews-Cron-Test/1.0'
    }
  };

  console.log('📤 Sending request...\n');

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`📥 Response Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Headers:`, res.headers);
      console.log('\n📄 Response Body:');

      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));

        // Analyze the response
        console.log('\n📊 Analysis:');

        if (json.success) {
          console.log('✅ Cron job executed successfully');
          console.log(`📝 Processed ${json.processed || 0} scheduled posts`);

          if (json.summaries && Array.isArray(json.summaries)) {
            console.log('\n📋 Post Processing Summary:');
            json.summaries.forEach(summary => {
              console.log(`  - Post ID: ${summary.id}`);
              console.log(`    Status: ${summary.status || 'unknown'}`);
              console.log(`    Success: ${summary.successCount || 0}, Failed: ${summary.failureCount || 0}`);
              if (summary.error) {
                console.log(`    Error: ${summary.error}`);
              }
              if (summary.errors && Array.isArray(summary.errors)) {
                summary.errors.forEach(err => {
                  console.log(`    Location Error: ${err.locationId} - ${err.error}`);
                });
              }
            });
          } else if (json.processed === 0) {
            console.log('⚠️  No scheduled posts found to process');
            console.log('   This means either:');
            console.log('   1. No posts are scheduled for today or earlier');
            console.log('   2. All scheduled posts have already been processed');
            console.log('   3. Posts are stuck in non-pending status');
          }
        } else {
          console.log('❌ Cron job failed');
          if (json.error) {
            console.log(`   Error: ${json.error}`);
          }
        }
      } catch (e) {
        console.log('Raw response:', data);
        console.log('\n❌ Failed to parse response as JSON');

        if (res.statusCode === 401) {
          console.log('🔐 Authentication failed - check your CRON_SECRET_TOKEN');
        } else if (res.statusCode === 404) {
          console.log('🔍 Endpoint not found - cron job may not be deployed');
        } else if (res.statusCode === 500) {
          console.log('💥 Internal server error - check Vercel logs');
        }
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request failed:', e.message);
    if (e.code === 'ENOTFOUND') {
      console.log('   Could not resolve hostname - check your internet connection');
    } else if (e.code === 'ECONNREFUSED') {
      console.log('   Connection refused - the server may be down');
    }
  });

  req.end();
}

// Also provide info about checking the database
console.log('📚 To check your database for scheduled posts, run this SQL:\n');
console.log(`-- Posts that should have been processed today
SELECT
    id,
    scheduled_date,
    status,
    error_log
FROM google_business_scheduled_posts
WHERE scheduled_date <= CURRENT_DATE
  AND status = 'pending'
ORDER BY scheduled_date DESC;`);
console.log('\n---\n');

// Run the test
testCronEndpoint();