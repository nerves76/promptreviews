#!/usr/bin/env node

/**
 * Script to check Sarah's business background settings
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

async function checkSarahBusiness() {
  try {
    console.log('🔍 Looking for Sarah\'s account...\n');

    // Find Sarah's account
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, email, first_name, last_name')
      .eq('email', 'sarah@balibodypilates.com');

    if (accountError || !accounts || accounts.length === 0) {
      console.error('❌ Could not find Sarah\'s account');
      return;
    }

    const account = accounts[0];
    console.log(`✅ Found account: ${account.first_name} ${account.last_name} (${account.id})\n`);

    // Find business for this account
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', account.id);

    if (businessError) {
      console.error('❌ Error fetching business:', businessError);
      return;
    }

    if (!businesses || businesses.length === 0) {
      console.log('⚠️  No business found for this account');
      return;
    }

    const business = businesses[0];
    console.log('📊 Business Settings:');
    console.log('   Name:', business.name);
    console.log('   Background Type:', business.background_type || 'NULL');
    console.log('   Background Color:', business.background_color || 'NULL');
    console.log('   Gradient Start:', business.gradient_start || 'NULL');
    console.log('   Gradient Middle:', business.gradient_middle || 'NULL');
    console.log('   Gradient End:', business.gradient_end || 'NULL');
    console.log('   Primary Color:', business.primary_color || 'NULL');
    console.log('   Secondary Color:', business.secondary_color || 'NULL');
    console.log('   Card BG:', business.card_bg || 'NULL');
    console.log('   Card Text:', business.card_text || 'NULL');

    // Check for prompt pages
    const { data: promptPages, error: pagesError } = await supabase
      .from('prompt_pages')
      .select('id, slug, title, is_universal')
      .eq('account_id', account.id);

    if (!pagesError && promptPages && promptPages.length > 0) {
      console.log(`\n📄 Prompt Pages (${promptPages.length}):`);
      promptPages.forEach(page => {
        console.log(`   - ${page.title || 'Untitled'} (/r/${page.slug})${page.is_universal ? ' [Universal]' : ''}`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the check
checkSarahBusiness();