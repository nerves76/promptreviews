const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAdmin() {
  try {
    console.log('Checking admin status for nerves76@gmail.com...');
    
    // First get the user ID for nerves76@gmail.com
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const user = users.users.find(u => u.email === 'nerves76@gmail.com');
    if (!user) {
      console.log('User nerves76@gmail.com not found');
      return;
    }
    
    console.log('Found user:', { id: user.id, email: user.email });
    
    // Check if user is in admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('account_id', user.id)
      .single();
    
    if (adminError) {
      console.log('Admin check error:', adminError);
      console.log('User is NOT an admin');
    } else {
      console.log('Admin record found:', admin);
      console.log('User IS an admin');
    }
    
    // Also check all admins
    const { data: allAdmins, error: allAdminsError } = await supabase
      .from('admins')
      .select('*');
    
    if (allAdminsError) {
      console.log('Error fetching all admins:', allAdminsError);
    } else {
      console.log('All admins:', allAdmins);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdmin(); 