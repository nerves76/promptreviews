/**
 * Script to fix locations missing prompt_page_slug
 * Usage: node scripts/fix-missing-location-slugs.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingLocationSlugs() {
  try {
    console.log('🔍 Checking for locations missing prompt_page_slug...');
    
    // Find locations without prompt_page_slug
    const { data: locationsWithoutSlug, error: fetchError } = await supabase
      .from('business_locations')
      .select(`
        *,
        accounts!inner(*)
      `)
      .is('prompt_page_slug', null);
    
    if (fetchError) {
      console.error('❌ Error fetching locations:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${locationsWithoutSlug.length} locations missing prompt_page_slug`);
    
    if (locationsWithoutSlug.length === 0) {
      console.log('✅ All locations have prompt_page_slug');
      return;
    }
    
    // Process each location
    for (const location of locationsWithoutSlug) {
      console.log(`🔧 Processing location: ${location.name}`);
      
      try {
        // Generate unique slug
        const baseSlug = location.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        let uniqueSlug = baseSlug;
        let counter = 1;
        
        // Check if slug exists and make it unique
        while (true) {
          const { data: existingPage } = await supabase
            .from('prompt_pages')
            .select('id')
            .eq('slug', uniqueSlug)
            .single();
          
          if (!existingPage) break;
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        
        // Create prompt page data
        const promptPageData = {
          account_id: location.account_id,
          business_location_id: location.id,
          slug: uniqueSlug,
          name: location.name,
          first_name: location.name,
          last_name: '',
          phone: location.phone || '',
          email: location.email || '',
          location: location.address_street ? `${location.address_street}, ${location.address_city}, ${location.address_state}` : '',
          project_type: 'service',
          services_offered: location.business_description || '',
          outcomes: '',
          custom_incentive: '',
          status: 'complete',
          is_universal: false,
          campaign_type: 'location',
          type: 'service',
          // Module fields
          falling_enabled: location.falling_enabled || false,
          falling_icon: location.falling_icon || 'star',
          falling_icon_color: location.falling_icon_color || '#fbbf24',
          emoji_sentiment_enabled: location.emoji_sentiment_enabled || false,
          emoji_sentiment_question: location.emoji_sentiment_question || 'How was your experience?',
          emoji_feedback_message: location.emoji_feedback_message || 'How can we improve?',
          emoji_thank_you_message: location.emoji_thank_you_message || 'Thank you for your feedback!',
          emoji_labels: location.emoji_labels || ['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'],
          offer_enabled: location.offer_enabled || false,
          offer_title: location.offer_title || '',
          offer_body: location.offer_body || '',
          offer_url: location.offer_url || '',
          ai_review_enabled: location.ai_review_enabled !== false,
          review_platforms: location.review_platforms || [],
          show_friendly_note: location.show_friendly_note || false,
          friendly_note: location.friendly_note || '',
        };
        
        // Create the prompt page
        const { data: promptPage, error: createError } = await supabase
          .from('prompt_pages')
          .insert(promptPageData)
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ Error creating prompt page for ${location.name}:`, createError);
          continue;
        }
        
        // Update the location with the prompt page slug
        const { error: updateError } = await supabase
          .from('business_locations')
          .update({ 
            prompt_page_slug: uniqueSlug,
            prompt_page_id: promptPage.id 
          })
          .eq('id', location.id);
        
        if (updateError) {
          console.error(`❌ Error updating location ${location.name}:`, updateError);
        } else {
          console.log(`✅ Fixed location: ${location.name} -> ${uniqueSlug}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing location ${location.name}:`, error);
      }
    }
    
    console.log('🎉 Finished processing locations');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixMissingLocationSlugs(); 