/**
 * Check Email Templates Script
 * 
 * Simple script to check if email_templates table exists and has data
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmailTemplates() {
  try {
    console.log('Checking email_templates table...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Service Role Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // Check if table exists by trying to select from it
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing email_templates table:', error);
      console.log('Table might not exist. You may need to run the migration.');
      return;
    }
    
    console.log('✅ email_templates table exists');
    console.log('Number of templates:', data?.length || 0);
    
    if (data && data.length > 0) {
      console.log('Templates found:');
      data.forEach(template => {
        console.log(`- ${template.name}: ${template.subject}`);
      });
    } else {
      console.log('No templates found. The table might be empty.');
    }
    
  } catch (error) {
    console.error('Error checking email templates:', error);
  }
}

checkEmailTemplates(); 