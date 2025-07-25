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

async function testPromptPage() {
  const slug = 'universal-mddpl2ar';
  
  console.log(`Testing prompt page lookup for slug: ${slug}`);
  
  try {
    // Check if prompt page exists
    const { data: promptPage, error: pageError } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (pageError) {
      console.error('Error fetching prompt page:', pageError);
      return;
    }
    
    if (!promptPage) {
      console.log('Prompt page not found');
      return;
    }
    
    console.log('Prompt page found:', {
      id: promptPage.id,
      slug: promptPage.slug,
      account_id: promptPage.account_id,
      client_name: promptPage.client_name,
      is_universal: promptPage.is_universal,
      location: promptPage.location,
      category: promptPage.category
    });
    
    // Check if business exists
    if (promptPage.account_id) {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('account_id', promptPage.account_id)
        .maybeSingle();
      
      if (businessError) {
        console.error('Error fetching business:', businessError);
      } else if (business) {
        console.log('Business found:', {
          id: business.id,
          name: business.name,
          account_id: business.account_id
        });
      } else {
        console.log('No business record found for account_id:', promptPage.account_id);
      }
    } else {
      console.log('No account_id in prompt page');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testPromptPage(); 