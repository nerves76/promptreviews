#!/usr/bin/env node

// Test the event system
console.log('🧪 Testing businessCreated event system...');

// Simulate the event dispatch that happens in CreateBusinessClient
if (typeof window !== 'undefined') {
  const event = new CustomEvent('businessCreated', { 
    detail: { 
      businessId: 'test-business-id', 
      timestamp: Date.now() 
    } 
  });
  window.dispatchEvent(event);
  console.log('🎉 Event dispatched:', event);
} else {
  console.log('❌ Window not available (Node.js environment)');
  console.log('📝 This test needs to be run in a browser environment');
}

console.log('✅ Event system test completed'); 