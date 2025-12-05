const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetPassword() {
  const email = 'chris@diviner.agency';
  const newPassword = 'testpassword123';
  
  console.log(`Resetting password for ${email}...`);
  
  // Get user
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error('User not found');
    return;
  }
  
  // Update password
  const { error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );
  
  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('✅ Password reset successfully!');
    console.log(`You can now sign in with:`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
  }
}

resetPassword();