const { createClient } = require('@supabase/supabase-js');

// Supabase local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addTestReviews() {
  try {
    console.log('🔍 Setting up test reviews...');
    
    const accountId = 'a1b2c3d4-e5f6-7890-abcd-1234567890ab';
    
    // First, create a basic business profile
    console.log('🏢 Creating business profile...');
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        account_id: accountId,
        name: 'Test Business',
        address_street: '123 Test St',
        address_city: 'Test City',
        address_state: 'TC',
        address_zip: '12345',
        phone: '(555) 123-4567',
        business_website: 'https://testbusiness.com'
      })
      .select()
      .single();

    if (businessError) {
      console.error('❌ Error creating business:', businessError);
      return;
    }
    
    console.log('✅ Business profile ready');

    // Create a prompt page
    console.log('📄 Creating prompt page...');
    const { data: promptPage, error: promptPageError } = await supabase
      .from('prompt_pages')
      .insert({
        account_id: accountId,
        slug: 'test-business',
        name: 'Test Business',
        status: 'complete',
        type: 'universal',
        campaign_type: 'universal',
        recent_reviews_enabled: true,
        recent_reviews_scope: 'current_page',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (promptPageError && promptPageError.code !== '23505') { // Ignore duplicate key error
      console.error('❌ Error creating prompt page:', promptPageError);
      return;
    }

    let promptPageId;
    if (promptPage) {
      promptPageId = promptPage.id;
      console.log('✅ New prompt page created:', promptPageId);
    } else {
      // Get existing prompt page
      const { data: existingPage } = await supabase
        .from('prompt_pages')
        .select('id')
        .eq('account_id', accountId)
        .eq('slug', 'test-business')
        .single();
      
      if (existingPage) {
        promptPageId = existingPage.id;
        console.log('✅ Using existing prompt page:', promptPageId);
      } else {
        console.error('❌ Could not create or find prompt page');
        return;
      }
    }

    // Add test reviews
    console.log('⭐ Adding test reviews...');
    
    const testReviews = [
      {
        prompt_page_id: promptPageId,
        reviewer_name: 'Sarah Johnson',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@example.com',
        reviewer_role: 'Customer',
        platform: 'google',
        review_content: 'Outstanding service! The team went above and beyond to help me with my project. Highly recommend!',
        emoji_sentiment_selection: 'excellent',
        status: 'submitted',
        verified: true,
        verified_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        platform_url: 'https://maps.google.com/review-1'
      },
      {
        prompt_page_id: promptPageId,
        reviewer_name: 'Michael Chen',
        first_name: 'Michael',
        last_name: 'Chen',
        email: 'mchen@example.com',
        reviewer_role: 'Customer',
        platform: 'google',
        review_content: 'Great experience from start to finish. Professional, timely, and exactly what I needed.',
        emoji_sentiment_selection: 'satisfied',
        status: 'submitted',
        verified: true,
        verified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        platform_url: 'https://maps.google.com/review-2'
      },
      {
        prompt_page_id: promptPageId,
        reviewer_name: 'Emily Rodriguez',
        first_name: 'Emily',
        last_name: 'Rodriguez',
        email: 'emily.r@example.com',
        reviewer_role: 'Customer',
        platform: 'google',
        review_content: 'Very pleased with the quality of work. They really listen to what you need and deliver.',
        emoji_sentiment_selection: 'excellent',
        status: 'submitted',
        verified: true,
        verified_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        platform_url: 'https://maps.google.com/review-3'
      },
      {
        prompt_page_id: promptPageId,
        reviewer_name: 'David Wilson',
        first_name: 'David',
        last_name: 'Wilson',
        email: 'dwilson@example.com',
        reviewer_role: 'Customer',
        platform: 'google',
        review_content: 'Excellent customer service and fast turnaround. Will definitely use them again!',
        emoji_sentiment_selection: 'satisfied',
        status: 'submitted',
        verified: true,
        verified_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        platform_url: 'https://maps.google.com/review-4'
      },
      {
        prompt_page_id: promptPageId,
        reviewer_name: 'Lisa Thompson',
        first_name: 'Lisa',
        last_name: 'Thompson',
        email: 'lisa.t@example.com',
        reviewer_role: 'Customer',
        platform: 'google',
        review_content: 'Top-notch service with attention to detail. Impressed with the final results.',
        emoji_sentiment_selection: 'excellent',
        status: 'submitted',
        verified: true,
        verified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        platform_url: 'https://maps.google.com/review-5'
      }
    ];

    const { data: insertedReviews, error: reviewsError } = await supabase
      .from('review_submissions')
      .insert(testReviews)
      .select('id, first_name, last_name, emoji_sentiment_selection');

    if (reviewsError) {
      console.error('❌ Error inserting reviews:', reviewsError);
      return;
    }

    console.log(`✅ Added ${insertedReviews.length} test reviews`);
    
    console.log('');
    console.log('🎉 SUCCESS! Test setup complete:');
    console.log('📧 Email: chris@diviner.agency');
    console.log('🔑 Password: testpassword123');
    console.log(`📄 Prompt Page: http://localhost:3002/r/test-business`);
    console.log('🏠 Dashboard: http://localhost:3002/dashboard');
    console.log('');
    console.log('✨ You can now test the Recent Reviews feature!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addTestReviews();