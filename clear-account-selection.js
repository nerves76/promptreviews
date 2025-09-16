/**
 * Debug script to clear account selection localStorage
 * This will force the account selection algorithm to pick the best account automatically
 */

console.log('🧹 Clearing account selection localStorage...');

// Get all localStorage keys
const keys = Object.keys(localStorage);

// Find all account selection keys
const accountSelectionKeys = keys.filter(key => key.startsWith('promptreviews_selected_account'));

console.log('Found account selection keys:', accountSelectionKeys);

// Clear them
accountSelectionKeys.forEach(key => {
  console.log(`Removing: ${key} = ${localStorage.getItem(key)}`);
  localStorage.removeItem(key);
});

console.log('✅ Cleared account selections. Try signing in again.');
console.log('The system will now automatically pick the best account based on:');
console.log('1. Team accounts with paid plans (highest priority)');
console.log('2. Owned accounts with paid plans');
console.log('3. Any team accounts');
console.log('4. Any accounts (fallback)');