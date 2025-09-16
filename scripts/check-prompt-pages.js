require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkPromptPages() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all prompt pages
    const { data, error } = await supabase
      .from('prompt_pages')
      .select('id, slug, ai_button_enabled, fix_grammar_enabled');

    if (error) {
      console.error('Error fetching prompt pages:', error);
      return;
    }

    console.log('Current prompt pages:');
    data.forEach(page => {
      console.log(`ID: ${page.id}, Slug: ${page.slug}, AI Enabled: ${page.ai_button_enabled}, Fix Grammar Enabled: ${page.fix_grammar_enabled}`);
    });
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

checkPromptPages(); 