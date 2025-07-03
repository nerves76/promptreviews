const { createClient } = require('@supabase/supabase-js');

async function deleteTestBusiness() {
  console.log('🗑️  Deleting test business...');
  
  const supabase = createClient(
    'http://127.0.0.1:54321',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  );

  const businessId = '8afa09b4-8e8d-4979-b642-0579fd68c973';
  
  try {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', businessId);
    
    if (error) {
      console.error('❌ Error deleting business:', error);
    } else {
      console.log('✅ Test business deleted successfully!');
      console.log('🎯 You can now go to /dashboard/create-business to create a new one');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

deleteTestBusiness(); 