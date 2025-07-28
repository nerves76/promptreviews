/**
 * Migration Enforcement Script
 * 
 * This script ensures all migrations in supabase/migrations/ are applied to the local database.
 * It runs automatically before npm run dev and can also be run manually.
 * 
 * Features:
 * - Checks for missing migrations
 * - Automatically applies missing migrations
 * - Provides clear status messages
 * - Handles errors gracefully
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bold}${message}${colors.reset}`);
  log('─'.repeat(message.length));
}

async function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    logError(`Migrations directory not found: ${migrationsDir}`);
    return [];
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Ensure consistent ordering
  
  return files.map(file => ({
    filename: file,
    fullPath: path.join(migrationsDir, file)
  }));
}

function getAppliedMigrations() {
  try {
    // Use migration list to get accurate count of applied migrations
    const output = execSync('supabase migration list', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    // Parse the migration list output to count applied migrations
    const lines = output.split('\n');
    let appliedCount = 0;
    
    for (const line of lines) {
      // Look for lines that show Local column has a value (meaning it's applied locally)
      // Format: "  0001           | 0001           | 0001"
      // Also handle date-based migrations like "20250127       |                | 20250127"
      if (line.includes('|')) {
        const parts = line.split('|').map(part => part.trim());
        // Skip header lines and separator lines
        if (parts.length >= 1 && parts[0] && 
            !parts[0].includes('Local') && !parts[0].includes('---') &&
            !parts[0].includes('Time') && parts[0].length > 0) {
          // Local column has a value, meaning this migration is applied locally
          appliedCount++;
        }
      }
    }
    
    return appliedCount;
  } catch (error) {
    // If we can't get the migration list, fall back to the diff approach
    logWarning('Could not get migration list. Falling back to diff check.');
    
    try {
      const diffOutput = execSync('supabase db diff --schema public', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // If there's no diff output, it means migrations are applied
      if (!diffOutput.trim()) {
        // Get all migration files to return as "applied"
        const migrationFiles = getMigrationFiles();
        return migrationFiles.length;
      }
      
      // If there is a diff, it means some migrations are missing
      return 0;
    } catch (diffError) {
      logWarning('Could not check migration status. Assuming migrations need to be applied.');
      return 0;
    }
  }
}

function applyMigrations() {
  try {
    logInfo('Applying missing migrations...');
    execSync('supabase db reset', { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    return true;
  } catch (error) {
    logError('Failed to apply migrations');
    logError(error.message);
    return false;
  }
}

function checkDatabaseConnection() {
  try {
    // Try to connect to the database by checking if supabase is running
    execSync('supabase status', { stdio: 'pipe' });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  logHeader('Migration Enforcement Check');
  
  // Check if Supabase CLI is installed
  if (!await checkSupabaseCLI()) {
    logError('Supabase CLI is not installed or not in PATH');
    logInfo('Please install Supabase CLI: https://supabase.com/docs/guides/cli');
    process.exit(1);
  }
  
  // Check database connection
  if (!checkDatabaseConnection()) {
    logWarning('Cannot connect to Supabase. Make sure Supabase is running:');
    logInfo('  supabase start');
    process.exit(1);
  }
  
  // Get migration files from directory
  const migrationFiles = getMigrationFiles();
  if (migrationFiles.length === 0) {
    logWarning('No migration files found in supabase/migrations/');
    return;
  }
  
  logInfo(`Found ${migrationFiles.length} migration files in supabase/migrations/`);
  
  // Get applied migrations from database
  const appliedMigrations = getAppliedMigrations();
  logInfo(`Found ${appliedMigrations} applied migrations in database`);
  
  // Calculate missing migrations
  const missingCount = migrationFiles.length - appliedMigrations;

  if (missingCount < 0) {
    logError(`Database has more applied migrations (${appliedMigrations}) than migration files (${migrationFiles.length}).`);
    logError('This usually means migration files were deleted or the database is out of sync.');
    logError('Please investigate and resolve the mismatch before proceeding.');
    process.exit(1);
  }

  if (missingCount === 0) {
    logSuccess(`All ${migrationFiles.length} migrations are applied!`);
    logInfo('Database schema is up to date.');
    return;
  }

  // Show missing migrations count
  logWarning(`${missingCount} migrations need to be applied`);

  // Apply missing migrations
  logInfo('Attempting to apply missing migrations...');
  const success = applyMigrations();

  if (success) {
    logSuccess(`Successfully applied ${missingCount} migrations!`);
    logInfo('Database schema is now up to date.');
  } else {
    logError('Failed to apply migrations. Please check the error messages above.');
    logInfo('You may need to run: supabase db migrate');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    logError('Unexpected error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { main }; 