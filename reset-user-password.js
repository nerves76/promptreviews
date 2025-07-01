const { createClient } = require('@supabase/supabase-js');

// Script to reset user password for testing
async function resetUserPassword() {
  console.log('🔐 Resetting user password...\n');

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  try {
    const email = 'nerves76@gmail.com';
    const newPassword = 'password123';

    console.log('1️⃣ Finding user by email...');
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      email,
    });

    if (usersError) {
      console.error('❌ Error finding user:', usersError);
      return;
    }

    const user = usersData?.users?.find((u) => u.email === email);
    if (!user) {
      console.error('❌ User not found:', email);
      return;
    }

    console.log('✅ Found user:', user.email, '(ID:', user.id, ')');

    console.log('\n2️⃣ Updating user password...');
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) {
      console.error('❌ Error updating password:', updateError);
      return;
    }

    console.log('✅ Password updated successfully');
    console.log('New password:', newPassword);

    console.log('\n3️⃣ Testing the new password...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: newPassword,
    });

    if (error) {
      console.error('❌ Test sign-in failed:', error.message);
    } else {
      console.log('✅ Test sign-in successful');
      console.log('User email:', data.user.email);
      console.log('User ID:', data.user.id);
    }

    console.log('\n🎉 Password reset complete!');
    console.log('You can now use these credentials:');
    console.log('Email:', email);
    console.log('Password:', newPassword);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetUserPassword(); 