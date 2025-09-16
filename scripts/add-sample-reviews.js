require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const sampleReviews = [
  {
    reviewer_name: 'John Smith',
    reviewer_role: 'Verified Customer',
    review_content: 'Amazing service! The team went above and beyond to deliver exactly what we needed. Highly recommend!',
    platform: 'Google',
    status: 'submitted',
    created_at: new Date().toISOString()
  },
  {
    reviewer_name: 'Sarah Johnson',
    reviewer_role: 'Happy Client',
    review_content: 'Excellent service and great quality. Highly recommend to anyone looking for this type of solution.',
    platform: 'Facebook',
    status: 'submitted',
    created_at: new Date().toISOString()
  },
  {
    reviewer_name: 'Mike Davis',
    reviewer_role: 'Business Owner',
    review_content: 'Outstanding experience from start to finish. The team was professional and delivered exactly what we needed.',
    platform: 'Yelp',
    status: 'submitted',
    created_at: new Date().toISOString()
  },
  {
    reviewer_name: 'Emily Wilson',
    reviewer_role: 'Satisfied Customer',
    review_content: 'Great communication throughout the process. The final result exceeded my expectations.',
    platform: 'Google',
    status: 'submitted',
    created_at: new Date().toISOString()
  },
  {
    reviewer_name: 'David Brown',
    reviewer_role: 'Returning Client',
    review_content: 'This is my second time working with them and they continue to impress. Consistent quality and service.',
    platform: 'Facebook',
    status: 'submitted',
    created_at: new Date().toISOString()
  },
  {
    reviewer_name: 'Lisa Garcia',
    reviewer_role: 'Marketing Director',
    review_content: 'The results we\'ve seen since implementing this solution have been incredible. Our team is thrilled!',
    platform: 'Google',
    status: 'submitted',
    created_at: new Date().toISOString()
  },
  {
    reviewer_name: 'Tom Anderson',
    reviewer_role: 'CEO',
    review_content: 'Professional, reliable, and delivers on promises. Exactly what we needed for our business.',
    platform: 'LinkedIn',
    status: 'submitted',
    created_at: new Date().toISOString()
  },
  {
    reviewer_name: 'Jennifer Martinez',
    reviewer_role: 'Project Manager',
    review_content: 'Smooth implementation process and excellent support throughout. Highly recommend!',
    platform: 'Google',
    status: 'submitted',
    created_at: new Date().toISOString()
  }
];

async function addSampleReviews() {
  try {
    console.log('Adding sample reviews to review_submissions table...');
    
    // First, get a prompt page ID to use for the reviews
    const { data: promptPages, error: promptPagesError } = await supabase
      .from('prompt_pages')
      .select('id')
      .limit(1);

    if (promptPagesError) {
      console.error('Error fetching prompt pages:', promptPagesError);
      return;
    }

    if (!promptPages || promptPages.length === 0) {
      console.log('No prompt pages found. Creating a sample prompt page first...');
      
      // Create a sample prompt page
      const { data: newPromptPage, error: createPromptPageError } = await supabase
        .from('prompt_pages')
        .insert({
          slug: 'sample-business',
          title: 'Sample Business',
          description: 'A sample business for testing',
          business_name: 'Sample Business',
          first_name: 'John',
          role: 'Owner',
          account_id: '00000000-0000-0000-0000-000000000000' // Use a default account ID
        })
        .select()
        .single();

      if (createPromptPageError) {
        console.error('Error creating prompt page:', createPromptPageError);
        return;
      }

      console.log('Created sample prompt page:', newPromptPage.id);
      var promptPageId = newPromptPage.id;
    } else {
      var promptPageId = promptPages[0].id;
      console.log('Using existing prompt page:', promptPageId);
    }
    
    // Add prompt_page_id to all sample reviews
    const reviewsWithPromptPage = sampleReviews.map(review => ({
      ...review,
      prompt_page_id: promptPageId
    }));
    
    const { data, error } = await supabase
      .from('review_submissions')
      .insert(reviewsWithPromptPage)
      .select();

    if (error) {
      console.error('Error adding sample reviews:', error);
      return;
    }

    console.log('Successfully added sample reviews:', data);
    console.log(`Added ${data.length} reviews to review_submissions table`);
  } catch (error) {
    console.error('Error:', error);
  }
}

addSampleReviews(); 