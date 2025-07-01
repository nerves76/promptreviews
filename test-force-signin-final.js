const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // No custom storageKey - using default
  }
});

async function testForceSignin() {
  console.log('Testing force-signin with updated Supabase client...');
  
  try {
    // Test force-signin API
    const response = await fetch('http://localhost:3001/api/force-signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123',
      }),
    });
    
    const data = await response.json();
    console.log('Force-signin response:', response.status, data);
    
    if (data.success) {
      console.log('✅ Force-signin successful!');
      console.log('User:', data.data.user.email);
      console.log('Session exists:', !!data.data.session);
      
      // Test setting session in Supabase client
      if (data.data.session) {
        const { error } = await supabase.auth.setSession(data.data.session);
        if (error) {
          console.log('❌ Error setting session:', error);
        } else {
          console.log('✅ Session set successfully in Supabase client');
          
          // Verify session is accessible
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError) {
            console.log('❌ Error getting user:', userError);
          } else {
            console.log('✅ User session verified:', user.email);
          }
        }
      }
    } else {
      console.log('❌ Force-signin failed:', data.error);
    }
    
  } catch (error) {
    console.log('❌ Error testing force-signin:', error.message);
  }
}

testForceSignin(); 