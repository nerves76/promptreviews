#!/usr/bin/env node

/**
 * Clear Demo Locations Script
 * Removes any demo/mock locations from the database
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function clearDemoLocations() {
  console.log('🧹 Clearing demo locations from database...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // First, let's see what's in the business_locations table
    const { data: allLocations, error: fetchError } = await supabase
      .from('business_locations')
      .select('*')
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching locations:', fetchError);
      return;
    }

    console.log('📋 Current locations in database:', allLocations);
    
    if (allLocations && allLocations.length > 0) {
      console.log('📊 Table columns:', Object.keys(allLocations[0]));
      
      // Look for demo data based on the actual columns
      const demoPatterns = [
        'Demo Coffee Shop',
        'Demo Restaurant', 
        'accounts/123456789',
        '123 Main St',
        '456 Oak Ave',
        'demo-coffee-shop.com',
        'demo-restaurant.com'
      ];
      
      for (const location of allLocations) {
        const locationStr = JSON.stringify(location).toLowerCase();
        const isDemoData = demoPatterns.some(pattern => 
          locationStr.includes(pattern.toLowerCase())
        );
        
        if (isDemoData) {
          console.log('🎭 Found demo location:', location);
          
          const { error: deleteError } = await supabase
            .from('business_locations')
            .delete()
            .eq('id', location.id);

          if (deleteError) {
            console.error('❌ Error deleting demo location:', deleteError);
          } else {
            console.log('✅ Deleted demo location:', location.id);
          }
        }
      }
    } else {
      console.log('ℹ️  No locations found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearDemoLocations(); 