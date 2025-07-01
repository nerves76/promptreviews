const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addAdmin() {
  try {
    console.log('Adding nerves76@gmail.com as admin...');
    
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
    
    // Add user to admins table
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .insert({
        account_id: user.id
      })
      .select()
      .single();
    
    if (adminError) {
      console.error('Error adding admin:', adminError);
    } else {
      console.log('Successfully added admin:', admin);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addAdmin(); 