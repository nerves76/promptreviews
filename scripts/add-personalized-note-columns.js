// -----------------------------------------------------------------------------
// Add Personalized Note Columns to Business Locations
// This script manually adds the show_friendly_note and friendly_note columns
// to the business_locations table if they don't already exist.
// -----------------------------------------------------------------------------

import { createServiceRoleClient } from '../src/utils/supabaseClient.ts';

async function addPersonalizedNoteColumns() {
  console.log('🔧 Adding personalized note columns to business_locations table...');
  
  const supabase = createServiceRoleClient();
  
  try {
    // Check if columns already exist
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'business_locations')
      .eq('table_schema', 'public')
      .in('column_name', ['show_friendly_note', 'friendly_note']);
    
    if (checkError) {
      console.error('❌ Error checking existing columns:', checkError);
      return;
    }
    
    const existingColumns = columns.map(col => col.column_name);
    console.log('📋 Existing personalized note columns:', existingColumns);
    
    // Add columns if they don't exist
    const queries = [];
    
    if (!existingColumns.includes('show_friendly_note')) {
      queries.push(`
        ALTER TABLE business_locations 
        ADD COLUMN show_friendly_note boolean DEFAULT false;
      `);
      console.log('➕ Will add show_friendly_note column');
    }
    
    if (!existingColumns.includes('friendly_note')) {
      queries.push(`
        ALTER TABLE business_locations 
        ADD COLUMN friendly_note text DEFAULT '';
      `);
      console.log('➕ Will add friendly_note column');
    }
    
    if (queries.length === 0) {
      console.log('✅ All personalized note columns already exist');
      return;
    }
    
    // Execute the queries
    for (const query of queries) {
      console.log('🔧 Executing query:', query.trim());
      const { error: execError } = await supabase.rpc('exec_sql', { sql: query });
      
      if (execError) {
        console.error('❌ Error executing query:', execError);
      } else {
        console.log('✅ Query executed successfully');
      }
    }
    
    console.log('🎉 Personalized note columns added successfully');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
addPersonalizedNoteColumns(); 