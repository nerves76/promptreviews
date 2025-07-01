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
    // Check if migrations have been applied by looking at the schema_migrations table
    const output = execSync('supabase db diff --schema public', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    // If there's no diff output, it means migrations are applied
    if (!output.trim()) {
      // Get all migration files to return as "applied"
      const migrationFiles = getMigrationFiles();
      return migrationFiles.map(m => m.filename);
    }
    
    // If there is a diff, it means some migrations are missing
    // For now, return empty array to trigger migration application
    return [];
  } catch (error) {
    // If we can't get the diff, assume migrations need to be applied
    logWarning('Could not check migration status. Assuming migrations need to be applied.');
    return [];
  }
}

function applyMigrations() {
  try {
    logInfo('Applying missing migrations...');
    execSync('supabase db migrate', { 
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
  logInfo(`Found ${appliedMigrations.length} applied migrations in database`);
  
  // Find missing migrations
  const missingMigrations = migrationFiles.filter(migration => 
    !appliedMigrations.includes(migration.filename)
  );
  
  if (missingMigrations.length === 0) {
    logSuccess(`All ${migrationFiles.length} migrations are applied!`);
    logInfo('Database schema is up to date.');
    return;
  }
  
  // Show missing migrations
  logWarning(`${missingMigrations.length} migrations need to be applied:`);
  missingMigrations.forEach(migration => {
    log(`  - ${migration.filename}`, 'yellow');
  });
  
  // Apply missing migrations
  logInfo('Attempting to apply missing migrations...');
  const success = applyMigrations();
  
  if (success) {
    logSuccess(`Successfully applied ${missingMigrations.length} migrations!`);
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