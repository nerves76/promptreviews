/**
 * Test Metadata Generation for Universal Prompt Pages
 * 
 * This script tests the metadata generation for universal prompt pages
 * to diagnose why the title shows "Give Business a review" instead of the actual business name
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMetadataGeneration() {
  try {
    console.log('🔍 Testing metadata generation for universal prompt pages...\n');

    // 1. Find a universal prompt page
    console.log('1️⃣ Finding universal prompt pages...');
    const { data: universalPages, error: pagesError } = await supabase
      .from('prompt_pages')
      .select('id, slug, account_id, client_name, is_universal')
      .eq('is_universal', true)
      .not('slug', 'is', null)
      .limit(1);

    if (pagesError) {
      console.error('❌ Error fetching universal pages:', pagesError);
      return;
    }

    if (!universalPages || universalPages.length === 0) {
      console.log('⚠️  No universal prompt pages found');
      return;
    }

    const universalPage = universalPages[0];
    console.log('✅ Found universal page:', {
      id: universalPage.id,
      slug: universalPage.slug,
      account_id: universalPage.account_id,
      client_name: universalPage.client_name
    });

    // 2. Get the business profile for this account
    console.log('\n2️⃣ Fetching business profile...');
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', universalPage.account_id)
      .single();

    if (businessError) {
      console.error('❌ Error fetching business:', businessError);
      return;
    }

    console.log('✅ Found business:', {
      id: business.id,
      name: business.name,
      account_id: business.account_id
    });

    // 3. Check metadata templates
    console.log('\n3️⃣ Checking metadata templates...');
    const { data: templates, error: templatesError } = await supabase
      .from('metadata_templates')
      .select('*')
      .eq('page_type', 'universal')
      .eq('is_active', true);

    if (templatesError) {
      console.error('❌ Error fetching templates:', templatesError);
      return;
    }

    console.log(`✅ Found ${templates.length} active universal templates:`);
    templates.forEach((template, index) => {
      console.log(`   Template ${index + 1}:`);
      console.log(`     ID: ${template.id}`);
      console.log(`     Title Template: "${template.title_template}"`);
      console.log(`     Description Template: "${template.description_template}"`);
    });

    // 4. Test the metadata generation logic
    console.log('\n4️⃣ Testing metadata generation...');
    
    // Simulate the context creation
    const context = {
      business_name: business.name || 'Business',
      logo: business.logo_url
    };

    console.log('Context for metadata generation:', context);

    // Test variable substitution
    if (templates.length > 0) {
      const template = templates[0];
      console.log('\nTesting variable substitution:');
      console.log(`Template: "${template.title_template}"`);
      
      // Simulate the substitution
      let result = template.title_template;
      Object.keys(context).forEach(key => {
        const value = context[key];
        if (value) {
          const pattern = new RegExp(`\\[${key}\\]`, 'g');
          result = result.replace(pattern, value);
          console.log(`Replaced [${key}] with "${value}"`);
        }
      });
      
      // Clean up any remaining unreplaced variables
      result = result.replace(/\[[\w_]+\]/g, '');
      console.log(`Final result: "${result}"`);
    }

    // 5. Test the actual URL
    const testUrl = `https://promptreviews-mxeo79ns4-nerves76s-projects.vercel.app/r/${universalPage.slug}`;
    console.log(`\n5️⃣ Test URL: ${testUrl}`);
    console.log('Visit this URL to see the actual metadata in action');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMetadataGeneration(); 