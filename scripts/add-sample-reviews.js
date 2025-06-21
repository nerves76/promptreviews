require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const sampleReviews = [
  {
    first_name: 'John',
    last_name: 'Smith',
    reviewer_role: 'Verified Customer',
    review_content: 'Amazing service! The team went above and beyond to deliver exactly what we needed. Highly recommend!',
    platform: 'Google',
    star_rating: 5
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    reviewer_role: 'Happy Client',
    review_content: 'Excellent service and great quality. Highly recommend to anyone looking for this type of solution.',
    platform: 'Facebook',
    star_rating: 5
  },
  {
    first_name: 'Mike',
    last_name: 'Davis',
    reviewer_role: 'Business Owner',
    review_content: 'Outstanding experience from start to finish. The team was professional and delivered exactly what we needed.',
    platform: 'Yelp',
    star_rating: 5
  },
  {
    first_name: 'Emily',
    last_name: 'Wilson',
    reviewer_role: 'Satisfied Customer',
    review_content: 'Great communication throughout the process. The final result exceeded my expectations.',
    platform: 'Google',
    star_rating: 5
  },
  {
    first_name: 'David',
    last_name: 'Brown',
    reviewer_role: 'Returning Client',
    review_content: 'This is my second time working with them and they continue to impress. Consistent quality and service.',
    platform: 'Facebook',
    star_rating: 5
  }
];

async function addSampleReviews() {
  try {
    console.log('Adding sample reviews...');
    
    const { data, error } = await supabase
      .from('review_submissions')
      .insert(sampleReviews)
      .select();

    if (error) {
      console.error('Error adding sample reviews:', error);
      return;
    }

    console.log('Successfully added sample reviews:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

addSampleReviews(); 