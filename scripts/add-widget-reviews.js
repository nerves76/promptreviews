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
    star_rating: 5,
    created_at: new Date().toISOString()
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    reviewer_role: 'Happy Client',
    review_content: 'Excellent service and great quality. Highly recommend to anyone looking for this type of solution.',
    platform: 'Facebook',
    star_rating: 5,
    created_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
  },
  {
    first_name: 'Mike',
    last_name: 'Davis',
    reviewer_role: 'Business Owner',
    review_content: 'Outstanding experience from start to finish. The team was professional and delivered exactly what we needed.',
    platform: 'Yelp',
    star_rating: 5,
    created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  },
  {
    first_name: 'Emily',
    last_name: 'Wilson',
    reviewer_role: 'Satisfied Customer',
    review_content: 'Great communication throughout the process. The final result exceeded my expectations.',
    platform: 'Google',
    star_rating: 4,
    created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
  },
  {
    first_name: 'David',
    last_name: 'Brown',
    reviewer_role: 'Returning Client',
    review_content: 'This is my second time working with them and they continue to impress. Consistent quality and service.',
    platform: 'Facebook',
    star_rating: 5,
    created_at: new Date(Date.now() - 345600000).toISOString() // 4 days ago
  }
];

async function addWidgetReviews(widgetId) {
  try {
    console.log(`Adding sample reviews to widget: ${widgetId}`);
    
    // Add widget_id to each review
    const reviewsWithWidgetId = sampleReviews.map(review => ({
      ...review,
      widget_id: widgetId
    }));
    
    const { data, error } = await supabase
      .from('widget_reviews')
      .insert(reviewsWithWidgetId)
      .select();

    if (error) {
      console.error('Error adding widget reviews:', error);
      return;
    }

    console.log('Successfully added widget reviews:', data);
    console.log(`Added ${data.length} reviews to widget ${widgetId}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get the widget ID from command line argument or use a default
const widgetId = process.argv[2];

if (!widgetId) {
  console.log('Usage: node scripts/add-widget-reviews.js <widget-id>');
  console.log('Example: node scripts/add-widget-reviews.js 12345678-1234-1234-1234-123456789012');
  process.exit(1);
}

addWidgetReviews(widgetId); 