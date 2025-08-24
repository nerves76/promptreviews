#!/usr/bin/env node

/**
 * Configure Stripe Customer Portal for Prompt Reviews
 * This script sets up the portal to only show relevant options for Prompt Reviews users
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuration for the portal
const portalConfig = {
  business_profile: {
    headline: "Manage Your Prompt Reviews Subscription",
    privacy_policy_url: "https://app.promptreviews.app/privacy",
    terms_of_service_url: "https://app.promptreviews.app/terms"
  },
  features: {
    // Customer can update their basic info
    customer_update: {
      enabled: true,
      allowed_updates: ["email", "name", "address", "phone"]
    },
    
    // Show invoice history
    invoice_history: {
      enabled: true
    },
    
    // Allow payment method updates
    payment_method_update: {
      enabled: true
    },
    
    // Subscription cancellation settings
    subscription_cancel: {
      enabled: true,
      mode: "at_period_end", // Cancel at end of billing period
      proration_behavior: "none",
      cancellation_reason: {
        enabled: true,
        options: [
          "too_expensive",
          "missing_features",
          "switched_service",
          "unused",
          "customer_service",
          "too_complex",
          "low_quality",
          "other"
        ]
      }
    },
    
    // Disable subscription pause (not applicable for Prompt Reviews)
    subscription_pause: {
      enabled: false
    },
    
    // Subscription update settings - allow plan changes
    subscription_update: {
      enabled: true,
      default_allowed_updates: ["price"],
      proration_behavior: "always_invoice"
    }
  },
  
  // Return URL after portal actions
  default_return_url: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/plan?success=1`
    : "https://app.promptreviews.app/dashboard/plan?success=1",
  
  // Metadata to identify this configuration
  metadata: {
    app: "prompt_reviews",
    environment: process.env.NODE_ENV || "development",
    configured_at: new Date().toISOString()
  }
};

// Function to run Stripe CLI commands
function runStripeCommand(command) {
  try {
    const result = execSync(command, { encoding: 'utf8' });
    return result;
  } catch (error) {
    console.error('Error running command:', command);
    console.error(error.message);
    throw error;
  }
}

// Main configuration function
async function configurePortal() {
  console.log('🔧 Configuring Stripe Customer Portal for Prompt Reviews...\n');
  
  // Check if we're in test or live mode
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_');
  console.log(`Mode: ${isTestMode ? 'TEST' : 'LIVE'} mode\n`);
  
  if (!isTestMode) {
    console.log('⚠️  WARNING: You are about to configure the LIVE portal!');
    console.log('This will affect real customers. Are you sure? (Press Ctrl+C to cancel)\n');
    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Step 1: List current configurations
  console.log('📋 Current portal configurations:');
  const currentConfigs = runStripeCommand('stripe billing_portal configurations list --limit 5');
  const configs = JSON.parse(currentConfigs);
  
  if (configs.data && configs.data.length > 0) {
    configs.data.forEach(config => {
      console.log(`  - ID: ${config.id} (Active: ${config.active}, Default: ${config.is_default})`);
    });
  } else {
    console.log('  No configurations found.');
  }
  console.log('');
  
  // Step 2: Create new configuration
  console.log('✨ Creating new portal configuration...');
  
  // Build the Stripe CLI command
  const createCommand = [
    'stripe billing_portal configurations create',
    `--business-profile.headline="${portalConfig.business_profile.headline}"`,
    `--business-profile.privacy-policy-url="${portalConfig.business_profile.privacy_policy_url}"`,
    `--business-profile.terms-of-service-url="${portalConfig.business_profile.terms_of_service_url}"`,
    `--features.customer-update.enabled=${portalConfig.features.customer_update.enabled}`,
    `--features.customer-update.allowed-updates=${portalConfig.features.customer_update.allowed_updates.join(',')}`,
    `--features.invoice-history.enabled=${portalConfig.features.invoice_history.enabled}`,
    `--features.payment-method-update.enabled=${portalConfig.features.payment_method_update.enabled}`,
    `--features.subscription-cancel.enabled=${portalConfig.features.subscription_cancel.enabled}`,
    `--features.subscription-cancel.mode="${portalConfig.features.subscription_cancel.mode}"`,
    `--features.subscription-cancel.proration-behavior="${portalConfig.features.subscription_cancel.proration_behavior}"`,
    `--features.subscription-cancel.cancellation-reason.enabled=${portalConfig.features.subscription_cancel.cancellation_reason.enabled}`,
    `--features.subscription-cancel.cancellation-reason.options=${portalConfig.features.subscription_cancel.cancellation_reason.options.join(',')}`,
    `--features.subscription-pause.enabled=${portalConfig.features.subscription_pause.enabled}`,
    `--features.subscription-update.enabled=${portalConfig.features.subscription_update.enabled}`,
    `--features.subscription-update.default-allowed-updates=${portalConfig.features.subscription_update.default_allowed_updates.join(',')}`,
    `--features.subscription-update.proration-behavior="${portalConfig.features.subscription_update.proration_behavior}"`,
    `--default-return-url="${portalConfig.default_return_url}"`,
    `--metadata.app="${portalConfig.metadata.app}"`,
    `--metadata.environment="${portalConfig.metadata.environment}"`,
    `--metadata.configured_at="${portalConfig.metadata.configured_at}"`
  ].join(' ');
  
  try {
    const result = runStripeCommand(createCommand);
    const newConfig = JSON.parse(result);
    
    console.log(`✅ Portal configuration created successfully!`);
    console.log(`   Configuration ID: ${newConfig.id}`);
    console.log(`   Active: ${newConfig.active}`);
    console.log(`   Default: ${newConfig.is_default}`);
    
    if (!newConfig.active || !newConfig.is_default) {
      console.log('\n⚠️  Note: The configuration was created but is not active/default.');
      console.log('   You may need to activate it in the Stripe Dashboard.');
    }
    
    // Step 3: Save configuration ID for reference
    const configFile = path.join(__dirname, '..', 'stripe-portal-config-id.txt');
    fs.writeFileSync(configFile, newConfig.id);
    console.log(`\n📁 Configuration ID saved to: ${configFile}`);
    
  } catch (error) {
    console.error('❌ Failed to create portal configuration');
    console.error(error.message);
    process.exit(1);
  }
  
  console.log('\n✨ Portal configuration complete!');
  console.log('\nNext steps:');
  console.log('1. Test the portal with a test customer');
  console.log('2. Verify all settings in the Stripe Dashboard');
  console.log('3. If everything looks good, repeat for live mode');
}

// Run the configuration
configurePortal().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});