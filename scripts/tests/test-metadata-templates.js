/**
 * Test Metadata Templates
 * 
 * This script tests the metadata templates functionality to ensure
 * they are working correctly for universal prompt pages
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMetadataTemplates() {
  try {
    console.log('🔍 Testing metadata templates...\n');

    // 1. Check if metadata templates table exists and has data
    console.log('1️⃣ Checking metadata templates table...');
    const { data: templates, error: templatesError } = await supabase
      .from('metadata_templates')
      .select('*')
      .eq('page_type', 'universal');

    if (templatesError) {
      console.error('❌ Error fetching metadata templates:', templatesError);
      return;
    }

    console.log(`✅ Found ${templates?.length || 0} universal metadata templates`);
    
    if (templates && templates.length > 0) {
      const activeTemplate = templates.find(t => t.is_active);
      if (activeTemplate) {
        console.log('✅ Active universal template found:', {
          id: activeTemplate.id,
          title_template: activeTemplate.title_template,
          description_template: activeTemplate.description_template
        });
      } else {
        console.log('⚠️  No active universal template found');
      }
    }

    // 2. Check universal prompt pages
    console.log('\n2️⃣ Checking universal prompt pages...');
    const { data: universalPages, error: pagesError } = await supabase
      .from('prompt_pages')
      .select('id, slug, account_id, client_name, is_universal')
      .eq('is_universal', true)
      .limit(3);

    if (pagesError) {
      console.error('❌ Error fetching universal pages:', pagesError);
      return;
    }

    console.log(`✅ Found ${universalPages?.length || 0} universal prompt pages`);
    
    if (universalPages && universalPages.length > 0) {
      for (const page of universalPages) {
        console.log(`   - ${page.slug}: client_name="${page.client_name}"`);
      }
    }

    // 3. Check businesses table
    console.log('\n3️⃣ Checking businesses table...');
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, account_id')
      .limit(3);

    if (businessesError) {
      console.error('❌ Error fetching businesses:', businessesError);
      return;
    }

    console.log(`✅ Found ${businesses?.length || 0} businesses`);
    
    if (businesses && businesses.length > 0) {
      for (const business of businesses) {
        console.log(`   - ${business.name} (account: ${business.account_id})`);
      }
    }

    // 4. Check accounts table for business_name
    console.log('\n4️⃣ Checking accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, business_name')
      .limit(3);

    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      return;
    }

    console.log(`✅ Found ${accounts?.length || 0} accounts`);
    
    if (accounts && accounts.length > 0) {
      for (const account of accounts) {
        console.log(`   - Account ${account.id}: business_name="${account.business_name}"`);
      }
    }

    console.log('\n✅ Metadata templates test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMetadataTemplates(); 