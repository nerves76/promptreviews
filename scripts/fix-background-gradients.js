#!/usr/bin/env node

/**
 * Script to fix businesses with NULL background_type or missing gradient colors
 * This ensures all prompt pages show the default gradient instead of white background
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.vercel' });

// Use production Supabase
const PROD_SUPABASE_URL = 'https://ltneloufqjktdplodvao.supabase.co';
const PROD_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PROD_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env.vercel');
  process.exit(1);
}

const supabase = createClient(PROD_SUPABASE_URL, PROD_SERVICE_KEY);

async function fixBackgroundGradients() {
  try {
    console.log('🔍 Finding businesses with missing background settings...\n');

    // Find all businesses with NULL or missing background_type
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, account_id, name, background_type, gradient_start, gradient_middle, gradient_end')
      .or('background_type.is.null,gradient_start.is.null,gradient_middle.is.null,gradient_end.is.null');

    if (fetchError) {
      console.error('❌ Error fetching businesses:', fetchError);
      return;
    }

    if (!businesses || businesses.length === 0) {
      console.log('✅ All businesses have proper background settings!');
      return;
    }

    console.log(`Found ${businesses.length} businesses to fix:\n`);

    // Update each business with default gradient values
    let fixed = 0;
    let failed = 0;

    for (const business of businesses) {
      const updates = {};
      
      // Set default background_type to gradient if missing
      if (!business.background_type) {
        updates.background_type = 'gradient';
      }
      
      // Set default gradient colors if missing
      if (!business.gradient_start) {
        updates.gradient_start = '#2563EB';
      }
      if (!business.gradient_middle) {
        updates.gradient_middle = '#7864C8';
      }
      if (!business.gradient_end) {
        updates.gradient_end = '#914AAE';
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update(updates)
          .eq('id', business.id);

        if (updateError) {
          console.error(`❌ Failed to update ${business.name}:`, updateError);
          failed++;
        } else {
          console.log(`✅ Fixed ${business.name} - Added:`, Object.keys(updates).join(', '));
          fixed++;
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Fixed: ${fixed} businesses`);
    console.log(`   Failed: ${failed} businesses`);
    console.log(`\n🎉 Background gradient fix complete!`);

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the fix
fixBackgroundGradients();