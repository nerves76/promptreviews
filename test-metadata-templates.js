const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMetadataTemplates() {
  console.log('Checking metadata templates...');
  
  try {
    // Check if metadata templates exist
    const { data: templates, error: templateError } = await supabase
      .from('metadata_templates')
      .select('*')
      .eq('page_type', 'universal')
      .eq('is_active', true);
    
    if (templateError) {
      console.error('Error fetching metadata templates:', templateError);
      return;
    }
    
    if (!templates || templates.length === 0) {
      console.log('No active metadata templates found for universal page type');
      return;
    }
    
    console.log(`Found ${templates.length} active metadata templates for universal page type:`);
    templates.forEach(template => {
      console.log(`- ID: ${template.id}`);
      console.log(`  Title template: ${template.title_template}`);
      console.log(`  Description template: ${template.description_template}`);
      console.log(`  OG title template: ${template.og_title_template}`);
      console.log(`  OG description template: ${template.og_description_template}`);
      console.log(`  Keywords template: ${template.keywords_template}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testMetadataTemplates(); 