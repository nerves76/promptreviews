const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ltneloufqjktdplodvao.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAccountStatus() {
  console.log('🔍 Checking account status...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const userId = '5cadc46d-c0e1-49e4-9c4f-b41268e66ab9';
  
  try {
    // Check account
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (accountError) {
      console.error('❌ Account error:', accountError);
      return;
    }
    
    console.log('✅ Account found:');
    console.log('  ID:', account.id);
    console.log('  Plan:', account.plan);
    console.log('  Trial start:', account.trial_start);
    console.log('  Trial end:', account.trial_end);
    console.log('  Created:', account.created_at);
    
    // Check businesses
    const { data: businesses, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('account_id', userId);
    
    if (bizError) {
      console.error('❌ Business error:', bizError);
      return;
    }
    
    console.log('\n🏢 Businesses:', businesses.length);
    businesses.forEach((biz, i) => {
      console.log(`  ${i + 1}. "${biz.name}" (ID: ${biz.id})`);
    });
    
    // Check widgets
    const { data: widgets, error: widgetError } = await supabase
      .from('widgets')
      .select('*')
      .eq('account_id', userId);
    
    if (!widgetError) {
      console.log('\n🎨 Widgets:', widgets.length);
    }
    
    // Determine what should happen
    console.log('\n📋 Analysis:');
    console.log('  Has account:', !!account);
    console.log('  Has business:', businesses.length > 0);
    console.log('  Current plan:', account.plan);
    console.log('  Is trial active:', account.trial_start && account.trial_end && new Date(account.trial_end) > new Date());
    
    if (account.plan === 'trial' || !account.plan) {
      console.log('\n💡 User should see plan selection modal');
    } else {
      console.log('\n💡 User already has a plan, navigation should work');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAccountStatus(); 