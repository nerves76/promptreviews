#!/usr/bin/env node

/**
 * Add dummy reviews for testing emoji sentiment choice tracking
 * For local development testing of chris@diviner.agency account
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase local configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addDummyReviews() {
  try {
    console.log('🔍 Finding accounts and prompt pages...');
    
    // Get all accounts and find one that has prompt pages (since we just created the chris@diviner.agency account)
    const { data: accounts, error: accountError } = await supabase
      .from('accounts')
      .select('id, business_name')
      .limit(10);
      
    if (accountError || !accounts || accounts.length === 0) {
      console.error('❌ No accounts found:', accountError?.message);
      return;
    }
    
    console.log('📋 Available accounts:');
    accounts.forEach(acc => console.log(`   - ${acc.business_name || 'Unnamed'} (${acc.id})`));
    
    // Try to find the Chris Bolton account (the one we just created)
    let targetAccount = accounts.find(acc => acc.business_name === 'Chris Bolton');
    if (!targetAccount) {
      // If not found, use the most recent account
      targetAccount = accounts[accounts.length - 1];
    }
    
    console.log('✅ Using account:', targetAccount.business_name, targetAccount.id);
    
    // Get prompt pages for this account
    const { data: promptPages, error: promptPagesError } = await supabase
      .from('prompt_pages')
      .select('id, slug')
      .eq('account_id', targetAccount.id);
      
    if (promptPagesError || !promptPages || promptPages.length === 0) {
      console.error('❌ No prompt pages found:', promptPagesError?.message);
      return;
    }
    
    console.log('✅ Found prompt pages:', promptPages.map(p => p.slug));
    
    // Use the first prompt page
    const promptPage = promptPages[0];
    console.log('📄 Using prompt page:', promptPage.slug, promptPage.id);
    
    // Create dummy reviews with different sentiment types
    const dummyReviews = [
      {
        prompt_page_id: promptPage.id,
        reviewer_name: 'Sarah Johnson',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.johnson@example.com',
        reviewer_role: 'Customer',
        platform: 'google',
        review_content: 'Absolutely amazing experience! The team went above and beyond to help me. Highly recommend to anyone looking for excellent service.',
        emoji_sentiment_selection: 'excellent',
        status: 'submitted',
        verified: true,
        verified_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        platform_url: 'https://maps.google.com/review-1'
      },
      {
        prompt_page_id: promptPage.id,
        reviewer_name: 'Mike Chen',
        first_name: 'Mike',
        last_name: 'Chen',
        email: 'mike.chen@example.com',
        reviewer_role: 'Business Owner',
        platform: 'yelp',
        review_content: 'Good service overall. Staff was helpful and the process was smooth. Would come back again.',
        emoji_sentiment_selection: 'satisfied',
        status: 'submitted',
        verified: true,
        verified_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        platform_url: 'https://yelp.com/review-2'
      },
      {
        prompt_page_id: promptPage.id,
        reviewer_name: 'Emily Rodriguez',
        first_name: 'Emily',
        last_name: 'Rodriguez',
        email: 'emily.rodriguez@example.com',
        reviewer_role: 'Customer',
        platform: 'google',
        review_content: 'The experience was okay, nothing special. Service was average and could be improved.',
        emoji_sentiment_selection: 'neutral',
        status: 'submitted',
        verified: false,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        platform_url: 'https://maps.google.com/review-3'
      },
      {
        prompt_page_id: promptPage.id,
        reviewer_name: 'David Thompson',
        first_name: 'David',
        last_name: 'Thompson',
        email: 'david.thompson@example.com',
        reviewer_role: 'Customer',
        platform: 'facebook',
        review_content: 'Not satisfied with the service. Expected more for the price paid. Staff seemed rushed.',
        emoji_sentiment_selection: 'unsatisfied',
        status: 'submitted',
        verified: false,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        platform_url: 'https://facebook.com/review-4'
      },
      {
        prompt_page_id: promptPage.id,
        reviewer_name: 'Jessica Williams',
        first_name: 'Jessica',
        last_name: 'Williams',
        email: 'jessica.williams@example.com',
        reviewer_role: 'First-time Customer',
        platform: 'google',
        review_content: 'Really disappointed with my experience. Service was poor and I had to wait way too long. Would not recommend.',
        emoji_sentiment_selection: 'frustrated',
        status: 'submitted',
        verified: false,
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        platform_url: 'https://maps.google.com/review-5'
      }
    ];
    
    console.log('📝 Creating 5 dummy reviews...');
    
    // Insert the reviews
    const { data: insertedReviews, error: insertError } = await supabase
      .from('review_submissions')
      .insert(dummyReviews)
      .select('id, first_name, last_name, emoji_sentiment_selection');
      
    if (insertError) {
      console.error('❌ Error inserting reviews:', insertError.message);
      return;
    }
    
    console.log('✅ Successfully created reviews:');
    insertedReviews.forEach((review, index) => {
      console.log(`   ${index + 1}. ${review.first_name} ${review.last_name} - ${review.emoji_sentiment_selection}`);
    });
    
    // Now add some dummy analytics events for emoji sentiment choices
    console.log('📊 Adding dummy emoji sentiment and choice events...');
    
    // First add emoji sentiment events as feature_used events to match the reviews
    const sentimentEvents = [
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'google',
        metadata: {
          feature: 'emoji_sentiment',
          emoji_sentiment: 'excellent',
          source: 'direct_click'
        },
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'yelp',
        metadata: {
          feature: 'emoji_sentiment',
          emoji_sentiment: 'satisfied',
          source: 'direct_click'
        },
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'google',
        metadata: {
          feature: 'emoji_sentiment',
          emoji_sentiment: 'neutral',
          source: 'direct_click'
        },
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'facebook',
        metadata: {
          feature: 'emoji_sentiment',
          emoji_sentiment: 'unsatisfied',
          source: 'direct_click'
        },
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'google',
        metadata: {
          feature: 'emoji_sentiment',
          emoji_sentiment: 'frustrated',
          source: 'direct_click'
        },
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Now add choice events for the negative sentiments
    const choiceEvents = [
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used', // Use allowed event type
        platform: 'google',
        metadata: {
          feature: 'emoji_sentiment_choice',
          emoji_sentiment: 'neutral',
          choice: 'private',
          source: 'negative_sentiment_flow'
        },
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'facebook',
        metadata: {
          feature: 'emoji_sentiment_choice',
          emoji_sentiment: 'unsatisfied',
          choice: 'public',
          source: 'negative_sentiment_flow'
        },
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'google',
        metadata: {
          feature: 'emoji_sentiment_choice',
          emoji_sentiment: 'frustrated',
          choice: 'private',
          source: 'negative_sentiment_flow'
        },
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      // Add a few more choice events for better testing
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'google',
        metadata: {
          feature: 'emoji_sentiment_choice',
          emoji_sentiment: 'neutral',
          choice: 'public',
          source: 'negative_sentiment_flow'
        },
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() // 6 hours ago
      },
      {
        prompt_page_id: promptPage.id,
        event_type: 'feature_used',
        platform: 'facebook',
        metadata: {
          feature: 'emoji_sentiment_choice',
          emoji_sentiment: 'unsatisfied',
          choice: 'private',
          source: 'negative_sentiment_flow'
        },
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
      }
    ];
    
    // Combine all events
    const allEvents = [...sentimentEvents, ...choiceEvents];
    
    const { data: insertedEvents, error: eventsError } = await supabase
      .from('analytics_events')
      .insert(allEvents)
      .select('event_type, metadata');
      
    if (eventsError) {
      console.error('❌ Error inserting analytics events:', eventsError.message);
      return;
    }
    
    console.log('✅ Successfully created analytics events:');
    insertedEvents.forEach((event, index) => {
      if (event.metadata?.feature === 'emoji_sentiment') {
        console.log(`   ${index + 1}. Emoji: ${event.metadata?.emoji_sentiment}`);
      } else if (event.metadata?.feature === 'emoji_sentiment_choice') {
        console.log(`   ${index + 1}. Choice: ${event.metadata?.emoji_sentiment} → ${event.metadata?.choice}`);
      }
    });
    
    console.log('\n🎉 Dummy data creation complete!');
    console.log('📊 You can now test the emoji sentiment choice analytics:');
    console.log('   - Go to Dashboard > Analytics');
    console.log('   - Look for "Negative Sentiment: Public vs Private Choice" section');
    console.log('   - Should show breakdown of neutral/unsatisfied/frustrated choices');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  addDummyReviews();
}

module.exports = { addDummyReviews };