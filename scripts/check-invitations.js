const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInvitations() {
  console.log('🔍 Checking recent invitations...\n');
  
  try {
    const { data: invitations, error } = await supabase
      .from('account_invitations')
      .select('id, email, role, created_at, expires_at, invited_by')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Error fetching invitations:', error);
      return;
    }

    if (!invitations || invitations.length === 0) {
      console.log('📭 No invitations found in database');
      return;
    }

    console.log(`📬 Found ${invitations.length} recent invitations:\n`);
    
    invitations.forEach((inv, index) => {
      console.log(`${index + 1}. Invitation ${inv.id}`);
      console.log(`   📧 Email: "${inv.email || 'BLANK/NULL'}"`);
      console.log(`   👤 Role: ${inv.role}`);
      console.log(`   📅 Created: ${new Date(inv.created_at).toLocaleString()}`);
      console.log(`   ⏰ Expires: ${new Date(inv.expires_at).toLocaleString()}`);
      console.log(`   🙋 Invited by: ${inv.invited_by}`);
      
      // Check for blank/empty emails
      if (!inv.email || inv.email.trim() === '') {
        console.log(`   ⚠️  WARNING: This invitation has a blank/empty email!`);
      }
      console.log('');
    });

    // Check for any blank emails specifically
    const blankEmails = invitations.filter(inv => !inv.email || inv.email.trim() === '');
    if (blankEmails.length > 0) {
      console.log(`🚨 FOUND ${blankEmails.length} INVITATIONS WITH BLANK EMAILS!`);
      console.log('This confirms the issue you reported.');
    } else {
      console.log('✅ All invitations have email addresses');
      console.log('The issue might be in the email display or template rendering.');
    }

  } catch (err) {
    console.error('💥 Unexpected error:', err);
  }
}

checkInvitations(); 