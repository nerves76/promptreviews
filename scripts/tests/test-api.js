// Simple test script to debug the API endpoint  
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testAPI() {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Create client the same way as the API
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    
    console.log('✅ Supabase client created');
    
    // Test 1: Check for any universal prompt pages
    console.log('🔍 Testing universal prompt pages query...');
    const { data: universalPages, error: universalError } = await supabase
      .from('prompt_pages')
      .select('id, slug, is_universal')
      .eq('is_universal', true);
    
    if (universalError) {
      console.error('❌ Universal pages error:', universalError);
    } else {
      console.log('✅ Universal pages query successful:', universalPages?.length || 0, 'found');
      console.log('📄 Universal pages:', universalPages);
    }
    
    // Test 2: Check specific slug
    console.log('🔍 Testing specific slug query...');
    const { data, error } = await supabase
      .from('prompt_pages')
      .select('*')
      .eq('slug', 'universal-mdwd0peh')
      .maybeSingle();
    
    if (error) {
      console.error('❌ Specific slug error:', error);
    } else {
      console.log('✅ Specific slug query successful:', !!data);
      console.log('📄 Data preview:', data ? `Found page: ${data.id}` : 'No data returned');
    }
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

testAPI();