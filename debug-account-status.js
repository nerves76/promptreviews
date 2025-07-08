require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAccountStatus() {
  try {
    console.log('🔍 Checking account status for nerves76@gmail.com...');
    
    // Get account data
    const { data: account, error } = await supabase
      .from('accounts')
      .select('id, email, plan, stripe_customer_id, stripe_subscription_id, has_had_paid_plan, created_at')
      .eq('email', 'nerves76@gmail.com')
      .single();

    if (error) {
      console.error('❌ Error fetching account:', error);
      return;
    }

    console.log('✅ Account found:');
    console.log('  ID:', account.id);
    console.log('  Email:', account.email);
    console.log('  Plan:', account.plan);
    console.log('  Stripe Customer ID:', account.stripe_customer_id);
    console.log('  Stripe Subscription ID:', account.stripe_subscription_id);
    console.log('  Has Had Paid Plan:', account.has_had_paid_plan);
    console.log('  Created At:', account.created_at);

    // Check businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, account_id')
      .eq('account_id', account.id);

    if (businessError) {
      console.error('❌ Error fetching businesses:', businessError);
      return;
    }

    console.log('\n🏢 Businesses:');
    console.log('  Count:', businesses.length);
    if (businesses.length > 0) {
      businesses.forEach((business, index) => {
        console.log(`  ${index + 1}. ${business.name} (ID: ${business.id})`);
      });
    }

    // Check onboarding conditions
    console.log('\n🔍 Onboarding Status:');
    console.log('  Has Business:', businesses.length > 0);
    console.log('  Has Plan:', !!account.plan && account.plan !== 'none' && account.plan !== 'no_plan');
    console.log('  Plan Value:', `"${account.plan}"`);
    
    const needsOnboarding = !account.plan || account.plan === 'none' || account.plan === 'no_plan' || businesses.length === 0;
    console.log('  Needs Onboarding:', needsOnboarding);

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkAccountStatus(); 