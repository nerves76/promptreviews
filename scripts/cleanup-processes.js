#!/usr/bin/env node

/**
 * Process Cleanup Script
 * 
 * Helps clean up orphaned Node.js and development server processes
 * that might be causing EADDRINUSE errors.
 */

const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

const PORTS_TO_CHECK = [3000, 3001, 54321, 54322, 54323, 54324, 54325, 54326];

async function findProcessesOnPorts() {
  console.log('🔍 Checking for processes on development ports...\n');
  
  const processesFound = [];
  
  for (const port of PORTS_TO_CHECK) {
    try {
      const { stdout } = await execAsync(`lsof -t -i:${port} 2>/dev/null || true`);
      if (stdout.trim()) {
        const pids = stdout.trim().split('\n');
        for (const pid of pids) {
          if (pid) {
            try {
              const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o pid,ppid,cmd --no-headers 2>/dev/null || true`);
              if (processInfo.trim()) {
                processesFound.push({
                  port,
                  pid: pid.trim(),
                  info: processInfo.trim()
                });
              }
            } catch (error) {
              // Process might have ended between checks
            }
          }
        }
      }
    } catch (error) {
      // Port is free or lsof command failed
    }
  }
  
  return processesFound;
}

async function findNodeProcesses() {
  console.log('🔍 Checking for Node.js development processes...\n');
  
  try {
    const { stdout } = await execAsync(`ps aux | grep -E "(npm run dev|next-server|next dev|node.*dev)" | grep -v grep || true`);
    if (stdout.trim()) {
      console.log('Node.js development processes found:');
      console.log(stdout);
      return stdout.trim().split('\n').filter(line => line.trim());
    } else {
      console.log('✅ No Node.js development processes found');
      return [];
    }
  } catch (error) {
    console.log('❌ Error checking Node.js processes:', error.message);
    return [];
  }
}

async function killProcessesOnPorts(processes) {
  if (processes.length === 0) {
    console.log('✅ No processes found on development ports');
    return;
  }
  
  console.log('📋 Processes found on development ports:');
  processes.forEach(proc => {
    console.log(`   Port ${proc.port}: PID ${proc.pid} - ${proc.info}`);
  });
  
  console.log('\n⚠️  This will kill the above processes. Continue? [y/N]');
  
  // In a real script, you'd want to prompt for user input
  // For automation, we'll just show what would be killed
  console.log('💡 To kill these processes manually, run:');
  
  const uniquePids = [...new Set(processes.map(p => p.pid))];
  console.log(`   kill -9 ${uniquePids.join(' ')}`);
  
  console.log('\n💡 Or to kill all processes on specific ports:');
  PORTS_TO_CHECK.forEach(port => {
    console.log(`   lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
  });
}

async function killNodeDevelopmentProcesses() {
  console.log('\n💡 To kill Node.js development processes manually, run:');
  console.log('   pkill -f "npm run dev"');
  console.log('   pkill -f "next-server"');
  console.log('   pkill -f "next dev"');
}

async function showSupabaseStatus() {
  console.log('\n🔍 Checking Supabase status...');
  
  try {
    const { stdout } = await execAsync('supabase status 2>/dev/null || echo "Supabase CLI not found or not running"');
    console.log(stdout);
  } catch (error) {
    console.log('❌ Supabase not running or CLI not available');
  }
}

async function main() {
  console.log('🧹 Development Process Cleanup Tool\n');
  
  try {
    // Check for processes on development ports
    const portProcesses = await findProcessesOnPorts();
    
    // Check for Node.js development processes
    const nodeProcesses = await findNodeProcesses();
    
    // Show processes that would be killed
    await killProcessesOnPorts(portProcesses);
    
    // Show Node.js processes that could be killed
    if (nodeProcesses.length > 0) {
      await killNodeDevelopmentProcesses();
    }
    
    // Show Supabase status
    await showSupabaseStatus();
    
    console.log('\n📝 Manual cleanup commands:');
    console.log('   # Kill all Node.js development processes');
    console.log('   pkill -f "npm run dev" && pkill -f "next"');
    console.log('');
    console.log('   # Kill processes on all development ports');
    console.log(`   for port in ${PORTS_TO_CHECK.join(' ')}; do lsof -ti:$port | xargs kill -9 2>/dev/null || true; done`);
    console.log('');
    console.log('   # Restart development servers');
    console.log('   supabase start');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}