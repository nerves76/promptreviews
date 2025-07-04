#!/usr/bin/env node

console.log('🔍 ENVIRONMENT VARIABLE DEBUGGING');
console.log('=====================================');

console.log('\n1. Process Environment:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');

console.log('\n2. All SUPABASE Environment Variables:');
Object.keys(process.env)
  .filter(key => key.includes('SUPABASE'))
  .forEach(key => {
    console.log(`${key}:`, process.env[key]);
  });

console.log('\n3. Process Information:');
console.log('PID:', process.pid);
console.log('PPID:', process.ppid);
console.log('Working Directory:', process.cwd());
console.log('Node Version:', process.version);

console.log('\n4. Checking .env.local file:');
const fs = require('fs');
const path = require('path');

try {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  const envLocal = fs.readFileSync(envLocalPath, 'utf8');
  const supabaseLines = envLocal.split('\n').filter(line => 
    line.includes('SUPABASE') && !line.startsWith('#')
  );
  console.log('SUPABASE vars in .env.local:', supabaseLines);
} catch (error) {
  console.log('Error reading .env.local:', error.message);
}

console.log('\n5. Environment Variable Source Test:');
console.log('This will help identify where variables are coming from...');

// Test loading dotenv explicitly
console.log('\n6. Testing dotenv loading:');
try {
  const dotenv = require('dotenv');
  const result = dotenv.config({ path: '.env.local' });
  console.log('dotenv result:', result.error ? result.error.message : 'Success');
  console.log('After dotenv - SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
} catch (error) {
  console.log('dotenv not available:', error.message);
}