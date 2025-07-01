const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('Creating test user...');
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User'
      }
    });
    
    if (error) {
      console.log('❌ Error creating user:', error);
    } else {
      console.log('✅ Test user created successfully:', data.user.email);
      console.log('User ID:', data.user.id);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

createTestUser(); 