/**
 * Script to create a new user with Maven plan access
 * Usage: node scripts/create-maven-user.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMavenUser() {
  try {
    console.log('🔧 Creating new user with Maven plan...');
    
    // Try different email addresses
    const emailOptions = [
      'chris@diviner.agency',
      'chris2@diviner.agency',
      'chris3@diviner.agency',
      'test@diviner.agency'
    ];
    
    let user = null;
    let email = null;
    
    for (const emailOption of emailOptions) {
      try {
        console.log(`🔄 Trying email: ${emailOption}`);
        
        const { data: newUser, error: userError } = await supabase.auth.admin.createUser({
          email: emailOption,
          password: 'password123',
          email_confirm: true,
        });
        
        if (!userError) {
          user = newUser;
          email = emailOption;
          console.log(`✅ Created user: ${user.user.email} (ID: ${user.user.id})`);
          break;
        } else if (userError.code === 'email_exists') {
          console.log(`⚠️  User ${emailOption} already exists, trying next...`);
          continue;
        } else {
          console.error(`❌ Error creating user with ${emailOption}:`, userError);
          continue;
        }
      } catch (error) {
        console.log(`⚠️  Error with ${emailOption}:`, error.message);
        continue;
      }
    }
    
    if (!user) {
      console.log('❌ Could not create any user. All emails are taken.');
      return;
    }
    
    // Check if account already exists for this user
    const { data: existingAccountUsers } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.user.id);
    
    if (existingAccountUsers && existingAccountUsers.length > 0) {
      console.log('⚠️  User already has an account. Updating to Maven plan...');
      
      const accountId = existingAccountUsers[0].account_id;
      
      // Update the account to Maven plan
      const { error: updateError } = await supabase
        .from('accounts')
        .update({
          plan: 'maven',
          max_locations: 10,
          max_contacts: 1000,
          max_prompt_pages: 1000,
          is_free_account: false,
          has_had_paid_plan: true,
          plan_lookup_key: 'maven',
        })
        .eq('id', accountId);
      
      if (updateError) {
        console.error('❌ Error updating account:', updateError);
        return;
      }
      
      console.log('✅ Updated existing account to Maven plan');
      console.log('\n🎉 Successfully updated user to Maven plan!');
      console.log('📧 Email:', email);
      console.log('🔑 Password: password123');
      console.log('📊 Plan: Maven (10 locations, 1000 contacts, 1000 prompt pages)');
      return;
    }
    
    // Create an account for the user
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        business_name: 'Diviner Agency',
        plan: 'maven',
        max_locations: 10,
        location_count: 0,
        max_contacts: 1000,
        contact_count: 0,
        max_prompt_pages: 1000,
        prompt_page_count: 0,
        is_free_account: false,
        has_had_paid_plan: true,
        email: email,
        first_name: 'Chris',
        last_name: 'Bolton',
        user_id: user.user.id,
        plan_lookup_key: 'maven',
        review_notifications_enabled: true,
      })
      .select()
      .single();
    
    if (accountError) {
      console.error('❌ Error creating account:', accountError);
      return;
    }
    
    console.log(`✅ Created account: ${account.business_name} (ID: ${account.id})`);
    
    // Create account_user relationship
    const { error: accountUserError } = await supabase
      .from('account_users')
      .insert({
        account_id: account.id,
        user_id: user.user.id,
        role: 'owner',
      });
    
    if (accountUserError) {
      console.error('❌ Error creating account_user relationship:', accountUserError);
      return;
    }
    
    console.log('✅ Created account_user relationship');
    
    // Create a business profile
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        account_id: account.id,
        name: 'Diviner Agency',
        business_name: 'Diviner Agency',
        description: 'Digital marketing and web development agency',
        website_url: 'https://diviner.agency',
        primary_color: '#4F46E5',
        secondary_color: '#7C3AED',
        logo_url: null,
        logo_print_url: null,
        background_type: 'color',
        background_color: '#ffffff',
        card_transparency: 0.9,
        inner_shadow: 0.1,
        about_us: 'We help businesses grow their online presence through strategic digital marketing and custom web development.',
        ai_dos: 'Focus on customer satisfaction and quality service delivery',
        ai_donts: 'Avoid making promises we cannot keep or overpromising results',
        default_offer_title: 'Get Started Today',
        default_offer_body: 'Contact us for a free consultation on your digital marketing needs',
      })
      .select()
      .single();
    
    if (businessError) {
      console.error('❌ Error creating business:', businessError);
      return;
    }
    
    console.log(`✅ Created business: ${business.name} (ID: ${business.id})`);
    
    // Create a universal prompt page
    const { data: universalPage, error: universalPageError } = await supabase
      .from('prompt_pages')
      .insert({
        account_id: account.id,
        business_id: business.id,
        slug: 'diviner-agency',
        name: 'Diviner Agency',
        first_name: 'Diviner',
        last_name: 'Agency',
        phone: '',
        email: email,
        location: 'Portland, Oregon',
        project_type: 'service',
        services_offered: 'Digital marketing, web development, SEO, social media management',
        outcomes: 'Increased online visibility, higher conversion rates, improved customer engagement',
        custom_incentive: '',
        status: 'complete',
        is_universal: true,
        campaign_type: 'universal',
        type: 'service',
        falling_enabled: true,
        falling_icon: 'star',
        falling_icon_color: '#fbbf24',
        emoji_sentiment_enabled: true,
        emoji_sentiment_question: 'How was your experience with our services?',
        emoji_feedback_message: 'How can we improve our services?',
        emoji_thank_you_message: 'Thank you for your feedback! We appreciate your input.',
        emoji_labels: ['Excellent', 'Satisfied', 'Neutral', 'Unsatisfied', 'Frustrated'],
        offer_enabled: true,
        offer_title: 'Get Started Today',
        offer_body: 'Contact us for a free consultation on your digital marketing needs',
        offer_url: 'https://diviner.agency/contact',
        ai_review_enabled: true,
        review_platforms: [
          {
            url: 'https://google.com',
            name: 'Google',
            wordCount: 200
          },
          {
            url: 'https://yelp.com',
            name: 'Yelp',
            wordCount: 200
          }
        ],
        show_friendly_note: false,
        friendly_note: '',
      })
      .select()
      .single();
    
    if (universalPageError) {
      console.error('❌ Error creating universal prompt page:', universalPageError);
      return;
    }
    
    console.log(`✅ Created universal prompt page: ${universalPage.slug} (ID: ${universalPage.id})`);
    
    console.log('\n🎉 Successfully created Maven user!');
    console.log('📧 Email:', email);
    console.log('🔑 Password: password123');
    console.log('📊 Plan: Maven (10 locations, 1000 contacts, 1000 prompt pages)');
    console.log('🌐 Universal page: http://localhost:3002/r/diviner-agency');
    console.log('\nYou can now sign in with these credentials!');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

createMavenUser(); 