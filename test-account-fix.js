// Test script to verify the account context fix
// Run this in the browser console after logging in

console.log('🧪 Testing account context fix...');

// Wait for React contexts to initialize
setTimeout(() => {
  // Look for account ID in localStorage
  const selectedAccountId = localStorage.getItem('selected_account_id');
  console.log('📦 Selected account ID from localStorage:', selectedAccountId);
  
  // Check for any console logs about account loading
  console.log('🔍 Check the console above for:');
  console.log('  - "🎯 AccountContext: Got account ID:" messages');
  console.log('  - "📊 AccountContext: Loading account data for:" messages');
  console.log('  - "🔄 BusinessContext: Account changed to:" messages');
  console.log('  - "📦 BusinessContext: Loading business for new account:" messages');
  
  // Check if we're on the create-business page
  if (window.location.pathname.includes('create-business')) {
    console.error('❌ Still being redirected to create-business page!');
  } else {
    console.log('✅ Not on create-business page - fix may be working!');
  }
}, 2000);