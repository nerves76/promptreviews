/**
 * Script to check and fix the newly created location
 * Usage: node scripts/check-and-fix-location.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixLocation() {
  try {
    console.log('🔍 Checking newly created location...');
    
    // Find the user
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }
    
    const targetUser = users.users.find(user => user.email === 'chris@diviner.agency');
    
    if (!targetUser) {
      console.log('❌ User chris@diviner.agency not found');
      return;
    }
    
    console.log(`✅ Found user: ${targetUser.email} (ID: ${targetUser.id})`);
    
    // Find the account
    const { data: accountUsers, error: accountUserError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', targetUser.id);
    
    if (accountUserError || !accountUsers || accountUsers.length === 0) {
      console.log('❌ No account found for user');
      return;
    }
    
    const accountId = accountUsers[0].account_id;
    console.log(`✅ Found account: ${accountId}`);
    
    // Get all locations for this account
    const { data: locations, error: locationError } = await supabase
      .from('business_locations')
      .select(`
        *,
        prompt_pages!business_location_id(*)
      `)
      .eq('account_id', accountId);
    
    if (locationError) {
      console.error('❌ Error fetching locations:', locationError);
      return;
    }
    
    console.log(`📊 Found ${locations.length} locations:`);
    
    locations.forEach((location, index) => {
      console.log(`\n📍 Location ${index + 1}: ${location.name}`);
      console.log(`   ID: ${location.id}`);
      console.log(`   prompt_page_slug: ${location.prompt_page_slug || 'NULL'}`);
      console.log(`   prompt_page_id: ${location.prompt_page_id || 'NULL'}`);
      console.log(`   Associated prompt pages: ${location.prompt_pages?.length || 0}`);
      
      if (location.prompt_pages && location.prompt_pages.length > 0) {
        location.prompt_pages.forEach((page, pageIndex) => {
          console.log(`     Prompt page ${pageIndex + 1}: ${page.slug} (ID: ${page.id})`);
        });
      }
    });
    
    // Find locations without prompt_page_slug
    const locationsWithoutSlug = locations.filter(loc => !loc.prompt_page_slug);
    console.log(`\n⚠️  Locations without prompt_page_slug: ${locationsWithoutSlug.length}`);
    
    if (locationsWithoutSlug.length > 0) {
      console.log('🔧 Fixing locations without prompt_page_slug...');
      
      for (const location of locationsWithoutSlug) {
        console.log(`\n🔧 Processing location: ${location.name}`);
        
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
    }
    
    console.log('\n🎉 Finished checking and fixing locations');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAndFixLocation(); 