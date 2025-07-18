/**
 * Test script to verify navigation is disabled for new users
 * This script tests the hasBusiness state and navigation behavior
 */

const { createClient } = require('@supabase/supabase-js');

async function testNavigationDisabled() {
  console.log('🧪 Testing navigation disabled state for new users...');
  
  try {
    // Test the dashboard page to see if navigation is properly disabled
    console.log('📡 Testing dashboard page...');
    const response = await fetch('http://localhost:3002/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Dashboard page loads successfully');
      
      // Check if the page contains disabled navigation indicators
      const html = await response.text();
      
      // Look for disabled navigation classes
      const hasDisabledNav = html.includes('text-white/50') || 
                            html.includes('cursor-not-allowed') ||
                            html.includes('Create business profile first');
      
      if (hasDisabledNav) {
        console.log('✅ Navigation appears to be properly disabled for new users');
        console.log('✅ This means hasBusiness is correctly set to false');
      } else {
        console.log('⚠️  Navigation may not be properly disabled - check manually');
        console.log('⚠️  This could mean hasBusiness is incorrectly set to true');
      }
      
      // Also check for enabled navigation indicators
      const hasEnabledNav = html.includes('hover:border-white/30') && 
                           html.includes('hover:text-white/90');
      
      if (hasEnabledNav) {
        console.log('⚠️  Found enabled navigation classes - this might indicate hasBusiness is true');
      } else {
        console.log('✅ No enabled navigation classes found - navigation is properly disabled');
      }
      
    } else {
      console.log('❌ Dashboard page failed to load');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testNavigationDisabled(); 