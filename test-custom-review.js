// Test script to verify custom review functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseKey
  });
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomReview() {
  console.log('🧪 Testing Custom Review Functionality...');
  
  try {
    // First, let's create a test user and account
    const testEmail = `custom-review-test-${Date.now()}@example.com`;
    
    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123'
    });
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    console.log('✅ User created:', authData.user.id);
    
    // Create account
    const { data: accountData, error: accountError } = await supabase
      .from('accounts')
      .insert({
        id: `test-account-${Date.now()}`, // Generate a unique ID
        user_id: authData.user.id,
        business_name: 'Test Business',
        plan: 'free'
      })
      .select()
      .single();
    
    if (accountError) {
      console.error('❌ Account creation error:', accountError);
      return;
    }
    
    console.log('✅ Account created:', accountData.id);
    
    // Create a test widget
    const { data: widgetData, error: widgetError } = await supabase
      .from('widgets')
      .insert({
        account_id: accountData.id,
        name: 'Test Widget for Custom Reviews',
        type: 'multi',
        theme: {
          primaryColor: '#4F46E5',
          backgroundColor: '#FFFFFF'
        }
      })
      .select()
      .single();
    
    if (widgetError) {
      console.error('❌ Widget creation error:', widgetError);
      return;
    }
    
    console.log('✅ Widget created:', widgetData.id);
    
    // Now test creating a custom review
    const customReview = {
      widget_id: widgetData.id,
      review_id: `custom-${Date.now()}`, // Generate a unique review ID
      review_content: 'This is a test custom review that should save successfully!',
      first_name: 'Test',
      last_name: 'Customer',
      reviewer_role: 'Verified Customer',
      platform: 'custom',
      order_index: 0,
      star_rating: 5
    };
    
    console.log('📝 Attempting to save custom review...');
    const { data: reviewData, error: reviewError } = await supabase
      .from('widget_reviews')
      .insert(customReview)
      .select()
      .single();
    
    if (reviewError) {
      console.error('❌ Custom review save error:', reviewError);
      console.error('Error details:', {
        code: reviewError.code,
        message: reviewError.message,
        details: reviewError.details,
        hint: reviewError.hint
      });
      return;
    }
    
    console.log('✅ Custom review saved successfully!');
    console.log('📊 Review data:', reviewData);
    
    // Verify the review was saved
    const { data: verifyData, error: verifyError } = await supabase
      .from('widget_reviews')
      .select('*')
      .eq('widget_id', widgetData.id)
      .eq('review_id', customReview.review_id)
      .single();
    
    if (verifyError) {
      console.error('❌ Verification error:', verifyError);
      return;
    }
    
    console.log('✅ Review verification successful:', verifyData);
    
    // Clean up
    console.log('🧹 Cleaning up test data...');
    await supabase.from('widget_reviews').delete().eq('widget_id', widgetData.id);
    await supabase.from('widgets').delete().eq('id', widgetData.id);
    await supabase.from('accounts').delete().eq('id', accountData.id);
    await supabase.auth.admin.deleteUser(authData.user.id);
    
    console.log('✅ Test completed successfully! Custom reviews are working.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testCustomReview(); 