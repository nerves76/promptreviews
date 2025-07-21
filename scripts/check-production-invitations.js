const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use production database credentials
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, // This should be the production URL
  process.env.SUPABASE_SERVICE_ROLE_KEY  // This should be the production service role key
);

async function checkProductionInvitations() {
  console.log('🔍 Checking PRODUCTION database for invitations...\n');
  console.log('📍 Connecting to:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    const { data: invitations, error } = await supabase
      .from('account_invitations')
      .select('id, email, role, created_at, expires_at, invited_by, account_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching invitations:', error);
      return;
    }

    if (!invitations || invitations.length === 0) {
      console.log('📭 No invitations found in production database');
      return;
    }

    console.log(`📬 Found ${invitations.length} recent invitations in PRODUCTION:\n`);
    
    invitations.forEach((inv, index) => {
      console.log(`${index + 1}. Invitation ${inv.id}`);
      console.log(`   📧 Email: "${inv.email || 'BLANK/NULL'}"`);
      console.log(`   👤 Role: ${inv.role}`);
      console.log(`   🏢 Account ID: ${inv.account_id}`);
      console.log(`   📅 Created: ${new Date(inv.created_at).toLocaleString()}`);
      console.log(`   ⏰ Expires: ${new Date(inv.expires_at).toLocaleString()}`);
      console.log(`   🙋 Invited by: ${inv.invited_by}`);
      
      // Check for blank/empty emails
      if (!inv.email || inv.email.trim() === '') {
        console.log(`   🚨 WARNING: This invitation has a BLANK/EMPTY email!`);
      }
      console.log('');
    });

    // Check for any blank emails specifically
    const blankEmails = invitations.filter(inv => !inv.email || inv.email.trim() === '');
    if (blankEmails.length > 0) {
      console.log(`🚨 FOUND ${blankEmails.length} INVITATIONS WITH BLANK EMAILS IN PRODUCTION!`);
      console.log('This confirms the issue you reported.');
      
      // Show details of blank email invitations
      blankEmails.forEach((inv, index) => {
        console.log(`\nBlank Email Invitation #${index + 1}:`);
        console.log(`  - ID: ${inv.id}`);
        console.log(`  - Account: ${inv.account_id}`);
        console.log(`  - Role: ${inv.role}`);
        console.log(`  - Created: ${new Date(inv.created_at).toLocaleString()}`);
        console.log(`  - Invited by: ${inv.invited_by}`);
      });
    } else {
      console.log('✅ All invitations have email addresses');
      console.log('The issue might be in the email display or template rendering.');
    }

    // Also check if any recent invitations were accepted
    const acceptedInvitations = invitations.filter(inv => inv.accepted_at);
    console.log(`\n📨 ${acceptedInvitations.length} of these invitations have been accepted`);

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    console.log('\n🔍 Make sure your .env.local has the correct production database credentials:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL should point to production');
    console.log('- SUPABASE_SERVICE_ROLE_KEY should be the production service role key');
  }
}

checkProductionInvitations(); 