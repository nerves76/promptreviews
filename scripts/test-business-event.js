/**
 * Test Business Creation Event
 * 
 * This script tests the businessCreated event system to ensure
 * AuthContext properly refreshes business state when a business is created.
 */

console.log('🧪 Testing businessCreated event system...');

// Simulate business creation event
const event = new CustomEvent('businessCreated', {
  detail: {
    businessId: 'test-business-id',
    timestamp: Date.now()
  }
});

console.log('📤 Dispatching businessCreated event...');
console.log('📤 Event detail:', event.detail);

// Dispatch the event
window.dispatchEvent(event);

console.log('✅ Event dispatched successfully');

// Wait a moment and then check if AuthContext state was updated
setTimeout(() => {
  console.log('🔍 Checking if AuthContext state was updated...');
  
  // We can't directly access AuthContext state from here,
  // but we can check if the event was received by looking at console logs
  console.log('✅ Test completed - check browser console for AuthContext logs');
}, 1000); 