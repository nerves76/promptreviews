#!/usr/bin/env node

/**
 * Development Environment Cleanup Script
 * Kills all development processes and clears port 3002
 */

const { execSync } = require('child_process');

console.log('🧹 Cleaning up development environment...');

// Kill all processes using port 3002
try {
  const processes = execSync('lsof -ti:3002', { encoding: 'utf8' }).trim();
  if (processes) {
    const pids = processes.split('\n').filter(pid => pid.trim());
    console.log(`📍 Found ${pids.length} processes using port 3002`);
    
    pids.forEach(pid => {
      try {
        execSync(`kill -9 ${pid}`);
        console.log(`✅ Killed process ${pid}`);
      } catch (error) {
        console.log(`⚠️  Could not kill process ${pid} (may already be dead)`);
      }
    });
  } else {
    console.log('✅ Port 3002 is already free');
  }
} catch (error) {
  console.log('✅ No processes found using port 3002');
}

// Kill any remaining Next.js processes
try {
  execSync('pkill -f "next dev"');
  console.log('✅ Killed any remaining Next.js dev processes');
} catch (error) {
  console.log('ℹ️  No Next.js dev processes found');
}

// Kill any remaining Stripe CLI processes
try {
  execSync('pkill -f "stripe listen"');
  console.log('✅ Killed any remaining Stripe CLI processes');
} catch (error) {
  console.log('ℹ️  No Stripe CLI processes found');
}

console.log('🚀 Development environment cleaned up! You can now run npm run dev'); 