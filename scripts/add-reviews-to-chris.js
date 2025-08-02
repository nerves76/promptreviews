require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addReviewsToChrisAccount() {
  try {
    console.log('🔍 Looking for account with email: chris@diviner.agency');
    
    // Find the account by email
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id, business_name')
      .eq('email', 'chris@diviner.agency')
      .single();
    
    if (accountError || !account) {
      console.error('❌ Account not found:', accountError?.message);
      return;
    }
    
    console.log('✅ Found account:', account.id, account.business_name || 'No business name');
    
    // Find the universal prompt page for this account
    const { data: promptPage, error: promptError } = await supabase
      .from('prompt_pages')
      .select('id, slug')
      .eq('account_id', account.id)
      .eq('is_universal', true)
      .single();
    
    if (promptError || !promptPage) {
      console.log('⚠️ No universal prompt page found, creating one...');
      
      // Create a universal prompt page
      const { data: newPromptPage, error: createError } = await supabase
        .from('prompt_pages')
        .insert({
          account_id: account.id,
          is_universal: true,
          slug: 'universal-' + Math.random().toString(36).substr(2, 9),
          status: 'complete',
          recent_reviews_enabled: false // Will be enabled manually
        })
        .select('id, slug')
        .single();
        
      if (createError) {
        console.error('❌ Failed to create prompt page:', createError.message);
        return;
      }
      
      console.log('✅ Created universal prompt page:', newPromptPage.slug);
      var targetPromptPage = newPromptPage;
    } else {
      console.log('✅ Found universal prompt page:', promptPage.slug);
      var targetPromptPage = promptPage;
    }
    
    // Sample reviews data
    const sampleReviews = [
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'Sarah',
        last_name: 'Johnson',
        reviewer_name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        review_content: 'Exceptional service! The team went above and beyond our expectations. Highly recommend for anyone looking for quality work.',
        platform: 'Google Business Profile',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'Michael',
        last_name: 'Chen',
        reviewer_name: 'Michael Chen',
        email: 'mchen@email.com',
        review_content: 'Professional, reliable, and delivered exactly what was promised. Great communication throughout the project.',
        platform: 'Yelp',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      },
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'Emily',
        last_name: 'Rodriguez',
        reviewer_name: 'Emily Rodriguez',
        email: 'emily.r@email.com',
        review_content: 'Amazing attention to detail and customer service. The final result exceeded our expectations.',
        platform: 'Facebook',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      },
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'David',
        last_name: 'Thompson',
        reviewer_name: 'David Thompson',
        email: 'dthompson@email.com',
        review_content: 'Fast turnaround and excellent quality. Will definitely work with them again.',
        platform: 'Google Business Profile',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
      },
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'Jessica',
        last_name: 'Williams',
        reviewer_name: 'Jessica Williams',
        email: 'jwilliams@email.com',
        review_content: 'Outstanding work! They understood our vision perfectly and brought it to life.',
        platform: 'TripAdvisor',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString() // 12 days ago
      },
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'Robert',
        last_name: 'Davis',
        reviewer_name: 'Robert Davis',
        email: 'rdavis@email.com',
        review_content: 'Highly professional team with great expertise. Solved our problem efficiently.',
        platform: 'LinkedIn',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
      },
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'Amanda',
        last_name: 'Miller',
        reviewer_name: 'Amanda Miller',
        email: 'amiller@email.com',
        review_content: 'Fantastic experience from start to finish. Clear communication and excellent results.',
        platform: 'Amazon',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString() // 18 days ago
      },
      {
        prompt_page_id: targetPromptPage.id,
        first_name: 'Kevin',
        last_name: 'Brown',
        reviewer_name: 'Kevin Brown',
        email: 'kbrown@email.com',
        review_content: 'Top-notch service and quality. They really care about their clients and it shows.',
        platform: 'Yelp',
        status: 'submitted',
        review_type: 'review',
        submitted_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() // 20 days ago
      }
    ];
    
    console.log('📝 Adding', sampleReviews.length, 'sample reviews...');
    
    // Insert the reviews
    const { data: insertedReviews, error: insertError } = await supabase
      .from('review_submissions')
      .insert(sampleReviews)
      .select('id, first_name, last_name');
    
    if (insertError) {
      console.error('❌ Failed to insert reviews:', insertError.message);
      return;
    }
    
    console.log('✅ Successfully added', insertedReviews.length, 'reviews to your account!');
    console.log('📊 Reviews added for:', insertedReviews.map(r => r.first_name + ' ' + r.last_name).join(', '));
    console.log('');
    console.log('🎯 Your prompt page details:');
    console.log('   Account ID:', account.id);
    console.log('   Prompt Page Slug:', targetPromptPage.slug);
    console.log('   Total Reviews: 8');
    console.log('');
    console.log('💡 Now you can:');
    console.log('   1. Go to your Universal prompt page editor');
    console.log('   2. Enable the Recent Reviews feature');
    console.log('   3. Save the page');
    console.log('   4. Visit your public prompt page to see the Recent Reviews button!');
    
  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

addReviewsToChrisAccount(); 