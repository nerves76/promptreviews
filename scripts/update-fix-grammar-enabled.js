require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function updateFixGrammarEnabled() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Update existing prompt pages to have fix_grammar_enabled = true
    const { data, error } = await supabase
      .from('prompt_pages')
      .update({ fix_grammar_enabled: true })
      .is('fix_grammar_enabled', null);

    if (error) {
      console.error('Error updating prompt pages:', error);
      return;
    }

    console.log('Successfully updated prompt pages with fix_grammar_enabled = true');
    
    // Also update ai_button_enabled to true for existing pages
    const { data: aiData, error: aiError } = await supabase
      .from('prompt_pages')
      .update({ ai_button_enabled: true })
      .is('ai_button_enabled', null);

    if (aiError) {
      console.error('Error updating ai_button_enabled:', aiError);
      return;
    }

    console.log('Successfully updated prompt pages with ai_button_enabled = true');
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

updateFixGrammarEnabled(); 