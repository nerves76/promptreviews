#!/usr/bin/env node

/**
 * Stripe Mode Diagnostic Script
 * 
 * This script checks:
 * 1. Current Stripe API key mode (test vs production)
 * 2. Webhook endpoint configuration
 * 3. Recent webhook events and their processing status
 * 
 * This helps identify mode mismatches that could cause webhook failures
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY is not set in environment');
  process.exit(1);
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.error('❌ STRIPE_WEBHOOK_SECRET is not set in environment');
  process.exit(1);
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

console.log('🔍 Checking Stripe Configuration...\n');

// Check API Key
console.log('📊 API Key Analysis:');
if (process.env.STRIPE_SECRET_KEY) {
  const keyType = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
  console.log(`   API Key: ${keyType} mode`);
  console.log(`   Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 20)}...`);
} else {
  console.log('   ❌ STRIPE_SECRET_KEY not found in environment variables');
}

// Check Webhook Secret
console.log('\n🔐 Webhook Secret Analysis:');
if (process.env.STRIPE_WEBHOOK_SECRET) {
  const secretType = process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_test_') ? 'TEST' : 
                     process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_') ? 'CLI/TEST' : 'UNKNOWN';
  console.log(`   Webhook Secret: ${secretType} mode`);
  console.log(`   Secret: ${process.env.STRIPE_WEBHOOK_SECRET.substring(0, 20)}...`);
} else {
  console.log('   ❌ STRIPE_WEBHOOK_SECRET not found in environment variables');
}

// Check for mode compatibility
console.log('\n⚖️  Mode Compatibility Check:');
const apiKeyMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'TEST' : 'LIVE';
const webhookMode = process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_test_') ? 'TEST' : 
                    process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') ? 'CLI/TEST' : 'PRODUCTION';

if (apiKeyMode === 'TEST' && (webhookMode === 'TEST' || webhookMode === 'CLI/TEST')) {
  console.log('   ✅ COMPATIBLE: Both API key and webhook secret are in TEST mode');
} else if (apiKeyMode === 'LIVE' && webhookMode === 'PRODUCTION') {
  console.log('   ✅ COMPATIBLE: Both API key and webhook secret are in LIVE mode');
} else {
  console.log('   ❌ INCOMPATIBLE: API key and webhook secret are in different modes');
  console.log(`      API Key: ${apiKeyMode}, Webhook Secret: ${webhookMode}`);
}

// Check Stripe CLI status
console.log('\n🔧 Stripe CLI Status:');
const { execSync } = require('child_process');
try {
  const cliVersion = execSync('stripe version', { encoding: 'utf8' }).trim();
  console.log(`   ✅ Stripe CLI installed: ${cliVersion}`);
  
  // Check if CLI is logged in
  try {
    const whoami = execSync('stripe whoami', { encoding: 'utf8' }).trim();
    console.log(`   ✅ Logged in as: ${whoami}`);
  } catch (error) {
    console.log('   ❌ Not logged in to Stripe CLI');
    console.log('   💡 Run: stripe login');
  }
} catch (error) {
  console.log('   ❌ Stripe CLI not found');
  console.log('   💡 Install with: brew install stripe/stripe-cli/stripe');
}

// Check webhook endpoints
console.log('\n🌐 Webhook Endpoint Analysis:');
async function checkWebhookEndpoints() {
  try {
    const endpoints = await stripe.webhookEndpoints.list();
    console.log(`   📋 Found ${endpoints.data.length} webhook endpoints:`);
    
    endpoints.data.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. ${endpoint.url}`);
      console.log(`      Status: ${endpoint.status}`);
      console.log(`      Events: ${endpoint.enabled_events.length} configured`);
      console.log(`      API Version: ${endpoint.api_version || 'default'}`);
      console.log('');
    });
    
    // Check if any endpoint points to localhost (which won't work)
    const localhostEndpoints = endpoints.data.filter(ep => ep.url.includes('localhost'));
    if (localhostEndpoints.length > 0) {
      console.log('   ⚠️  WARNING: Found localhost endpoints (these won\'t work):');
      localhostEndpoints.forEach(ep => {
        console.log(`      - ${ep.url}`);
      });
      console.log('   💡 For local development, use Stripe CLI forwarding instead');
    }
  } catch (error) {
    console.log(`   ❌ Error fetching webhook endpoints: ${error.message}`);
  }
}

// Provide recommendations
console.log('\n📝 Recommendations:');

if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')) {
  console.log('   🧪 For TEST mode development:');
  console.log('   1. Use Stripe CLI for webhooks:');
  console.log('      stripe listen --forward-to localhost:3002/api/stripe-webhook');
  console.log('   2. Copy the webhook secret from CLI output to .env.local');
  console.log('   3. Restart your development server');
  console.log('   4. Test with: stripe trigger customer.subscription.created');
} else {
  console.log('   🏭 For PRODUCTION mode:');
  console.log('   1. Create webhook endpoint in Stripe Dashboard');
  console.log('   2. Use your production URL: https://yourdomain.com/api/stripe-webhook');
  console.log('   3. Configure webhook secret in production environment');
}

// Run the webhook endpoint check
if (process.env.STRIPE_SECRET_KEY) {
  checkWebhookEndpoints();
} else {
  console.log('\n❌ Cannot check webhook endpoints without STRIPE_SECRET_KEY');
} 