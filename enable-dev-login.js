#!/usr/bin/env node

/**
 * Development Login Helper
 * 
 * This script enables a development authentication bypass for local testing.
 * Run this script, then refresh your browser to be automatically logged in.
 */

console.log('🔧 Enabling development authentication bypass...');
console.log('');
console.log('📋 Instructions:');
console.log('1. Open your browser to http://localhost:3002');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Paste this command and press Enter:');
console.log('');
console.log('   localStorage.setItem("dev_auth_bypass", "true"); window.location.reload();');
console.log('');
console.log('✅ You will be automatically logged in as a development user');
console.log('📧 Email: dev@example.com');
console.log('👤 Name: Dev User');  
console.log('🏢 Business: Dev Business');
console.log('🔑 Admin: Yes');
console.log('');
console.log('To disable the bypass later, run:');
console.log('   localStorage.removeItem("dev_auth_bypass"); window.location.reload();');
console.log('');
console.log('⚠️  This only works in development mode (NODE_ENV=development)');