#!/usr/bin/env node

/**
 * Code Safety Validator
 * 
 * Automated validation system to prevent destructive operations
 * and ensure code safety before applying changes.
 * 
 * Usage:
 *   node code-safety-validator.js --check-files      # Validate file operations
 *   node code-safety-validator.js --check-db         # Validate database operations
 *   node code-safety-validator.js --check-config     # Validate configuration changes
 *   node code-safety-validator.js --full-check       # Complete safety audit
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Critical files that should never be deleted without explicit approval
const CRITICAL_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  'package.json',
  'package-lock.json',
  'next.config.js',
  'supabase/config.toml',
  'restore_complete_schema.sql',
  'database-restoration-toolkit.js',
  'CODE_PROTECTION_SYSTEM.md',
  'DATABASE_RESTORATION_PLAN.md'
];

// Critical directories that should never be bulk deleted
const CRITICAL_DIRECTORIES = [
  'src/',
  'public/',
  'supabase/',
  'supabase/migrations/',
  '.git/',
  'node_modules/'
];

// Dangerous SQL operations that require explicit approval
const DANGEROUS_SQL_PATTERNS = [
  /DROP\s+TABLE/i,
  /DROP\s+DATABASE/i,
  /DELETE\s+FROM.*(?!WHERE)/i, // DELETE without WHERE clause
  /TRUNCATE\s+TABLE/i,
  /DROP\s+SCHEMA/i,
  /ALTER\s+TABLE.*DROP\s+COLUMN/i
];

// Dangerous shell commands that should be blocked
const DANGEROUS_COMMANDS = [
  /rm\s+-rf\s+\//,
  /rm\s+-rf\s+\*/,
  /rm\s+-rf\s+src/,
  /rm\s+-rf\s+public/,
  /rm\s+-rf\s+supabase/,
  /git\s+reset\s+--hard/,
  /git\s+push\s+--force/,
  /sudo\s+rm/,
  /chmod\s+777/
];

/**
 * File Safety Validation
 */

function validateFileOperations() {
  console.log('🔍 VALIDATING FILE OPERATIONS');
  console.log('=============================');

  const results = {
    criticalFilesPresent: [],
    criticalFilesMissing: [],
    directoryIntegrity: [],
    warnings: [],
    errors: []
  };

  try {
    // Check critical files
    console.log('\n📋 Checking critical files...');
    CRITICAL_FILES.forEach(file => {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        results.criticalFilesPresent.push(file);
        console.log(`✅ ${file}`);
      } else {
        results.criticalFilesMissing.push(file);
        console.log(`❌ ${file} - MISSING`);
        results.errors.push(`Critical file missing: ${file}`);
      }
    });

    // Check critical directories
    console.log('\n📁 Checking critical directories...');
    CRITICAL_DIRECTORIES.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          results.directoryIntegrity.push(dir);
          console.log(`✅ ${dir}`);
        } else {
          console.log(`⚠️  ${dir} - EXISTS BUT NOT A DIRECTORY`);
          results.warnings.push(`${dir} exists but is not a directory`);
        }
      } else {
        console.log(`❌ ${dir} - MISSING`);
        results.errors.push(`Critical directory missing: ${dir}`);
      }
    });

    // Check Git repository integrity
    console.log('\n🔧 Checking Git repository...');
    try {
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
      const modifiedFiles = gitStatus.split('\n').filter(line => line.trim());
      
      if (modifiedFiles.length > 0) {
        console.log(`⚠️  ${modifiedFiles.length} files have uncommitted changes`);
        results.warnings.push(`${modifiedFiles.length} uncommitted changes detected`);
      } else {
        console.log('✅ Git repository is clean');
      }
    } catch (error) {
      console.log('❌ Git repository check failed');
      results.errors.push('Git repository validation failed');
    }

    return results;

  } catch (error) {
    console.error('❌ File validation failed:', error.message);
    results.errors.push(`File validation error: ${error.message}`);
    return results;
  }
}

/**
 * Database Safety Validation
 */

function validateDatabaseOperations(sqlContent = '') {
  console.log('🗄️  VALIDATING DATABASE OPERATIONS');
  console.log('===================================');

  const results = {
    dangerousOperations: [],
    warnings: [],
    recommendations: [],
    safe: true
  };

  if (!sqlContent) {
    console.log('ℹ️  No SQL content provided for validation');
    return results;
  }

  console.log('\n🔍 Scanning for dangerous SQL operations...');

  DANGEROUS_SQL_PATTERNS.forEach((pattern, index) => {
    const matches = sqlContent.match(pattern);
    if (matches) {
      const operation = matches[0];
      results.dangerousOperations.push(operation);
      results.safe = false;
      console.log(`❌ DANGEROUS: ${operation}`);
    }
  });

  if (results.dangerousOperations.length === 0) {
    console.log('✅ No dangerous SQL operations detected');
  } else {
    console.log(`\n🚨 Found ${results.dangerousOperations.length} dangerous operations`);
    results.recommendations.push('Review and approve each dangerous operation explicitly');
    results.recommendations.push('Create backups before executing any destructive operations');
    results.recommendations.push('Test operations on sample data first');
  }

  // Check for bulk operations without conditions
  if (sqlContent.includes('DELETE FROM') && !sqlContent.includes('WHERE')) {
    results.warnings.push('DELETE operation without WHERE clause detected');
    console.log('⚠️  DELETE without WHERE clause - could delete all data');
  }

  if (sqlContent.includes('UPDATE') && !sqlContent.includes('WHERE')) {
    results.warnings.push('UPDATE operation without WHERE clause detected');
    console.log('⚠️  UPDATE without WHERE clause - could modify all records');
  }

  return results;
}

/**
 * Configuration Safety Validation
 */

function validateConfigurationChanges() {
  console.log('⚙️  VALIDATING CONFIGURATION');
  console.log('============================');

  const results = {
    envVarsPresent: [],
    envVarsMissing: [],
    configFiles: [],
    warnings: [],
    errors: []
  };

  // Required environment variables
  const REQUIRED_ENV_VARS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  console.log('\n🔧 Checking environment variables...');
  REQUIRED_ENV_VARS.forEach(envVar => {
    if (process.env[envVar]) {
      results.envVarsPresent.push(envVar);
      console.log(`✅ ${envVar}`);
    } else {
      results.envVarsMissing.push(envVar);
      console.log(`❌ ${envVar} - MISSING`);
      results.errors.push(`Required environment variable missing: ${envVar}`);
    }
  });

  // Check configuration files
  const CONFIG_FILES = [
    'next.config.js',
    'package.json',
    'tailwind.config.js'
  ];

  console.log('\n📄 Checking configuration files...');
  CONFIG_FILES.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.trim()) {
          results.configFiles.push(file);
          console.log(`✅ ${file}`);
        } else {
          console.log(`⚠️  ${file} - EMPTY`);
          results.warnings.push(`Configuration file is empty: ${file}`);
        }
      } catch (error) {
        console.log(`❌ ${file} - READ ERROR`);
        results.errors.push(`Cannot read configuration file: ${file}`);
      }
    } else {
      console.log(`❌ ${file} - MISSING`);
      results.errors.push(`Configuration file missing: ${file}`);
    }
  });

  return results;
}

/**
 * Command Safety Validation
 */

function validateCommand(command) {
  console.log('🛡️  VALIDATING COMMAND SAFETY');
  console.log('==============================');

  const results = {
    command: command,
    safe: true,
    dangerousPatterns: [],
    warnings: [],
    recommendations: []
  };

  console.log(`\n🔍 Analyzing command: ${command}`);

  DANGEROUS_COMMANDS.forEach(pattern => {
    if (pattern.test(command)) {
      results.dangerousPatterns.push(pattern.source);
      results.safe = false;
      console.log(`❌ DANGEROUS PATTERN: ${pattern.source}`);
    }
  });

  if (results.safe) {
    console.log('✅ Command appears safe');
  } else {
    console.log('🚨 DANGEROUS COMMAND DETECTED');
    results.recommendations.push('DO NOT EXECUTE this command without explicit user approval');
    results.recommendations.push('Create backups before executing any destructive commands');
    results.recommendations.push('Consider safer alternatives');
  }

  // Additional safety checks
  if (command.includes('rm ') && !command.includes('-i')) {
    results.warnings.push('Deletion command without interactive flag (-i)');
  }

  if (command.includes('sudo')) {
    results.warnings.push('Command requires elevated privileges');
  }

  return results;
}

/**
 * Full Safety Audit
 */

function performFullSafetyAudit() {
  console.log('🔒 PERFORMING FULL SAFETY AUDIT');
  console.log('================================');

  const auditResults = {
    fileValidation: null,
    configValidation: null,
    overallSafe: true,
    criticalIssues: [],
    warnings: [],
    recommendations: []
  };

  // File operations validation
  auditResults.fileValidation = validateFileOperations();
  if (auditResults.fileValidation.errors.length > 0) {
    auditResults.overallSafe = false;
    auditResults.criticalIssues.push(...auditResults.fileValidation.errors);
  }

  // Configuration validation
  auditResults.configValidation = validateConfigurationChanges();
  if (auditResults.configValidation.errors.length > 0) {
    auditResults.overallSafe = false;
    auditResults.criticalIssues.push(...auditResults.configValidation.errors);
  }

  // Compile warnings
  auditResults.warnings.push(...auditResults.fileValidation.warnings);
  auditResults.warnings.push(...auditResults.configValidation.warnings);

  // Generate recommendations
  if (!auditResults.overallSafe) {
    auditResults.recommendations.push('Address all critical issues before proceeding');
    auditResults.recommendations.push('Create backups of all critical files');
    auditResults.recommendations.push('Review and test all changes in a safe environment');
  }

  // Summary
  console.log('\n📊 SAFETY AUDIT SUMMARY');
  console.log('=======================');
  console.log(`🔒 Overall Status: ${auditResults.overallSafe ? '✅ SAFE' : '❌ UNSAFE'}`);
  console.log(`🚨 Critical Issues: ${auditResults.criticalIssues.length}`);
  console.log(`⚠️  Warnings: ${auditResults.warnings.length}`);

  if (auditResults.criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:');
    auditResults.criticalIssues.forEach(issue => {
      console.log(`   - ${issue}`);
    });
  }

  if (auditResults.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    auditResults.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }

  if (auditResults.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    auditResults.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });
  }

  return auditResults;
}

/**
 * Main execution function
 */

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🛡️  CODE SAFETY VALIDATOR');
  console.log('=========================');
  console.log(`📅 Started: ${new Date().toISOString()}`);

  switch (command) {
    case '--check-files':
      validateFileOperations();
      break;

    case '--check-db':
      // Example SQL content - in real use, this would come from user input
      const sqlContent = args[1] || '';
      validateDatabaseOperations(sqlContent);
      break;

    case '--check-config':
      validateConfigurationChanges();
      break;

    case '--check-command':
      const cmdToCheck = args[1] || '';
      if (!cmdToCheck) {
        console.log('❌ Please provide a command to validate');
        console.log('Usage: node code-safety-validator.js --check-command "rm -rf something"');
        return;
      }
      validateCommand(cmdToCheck);
      break;

    case '--full-check':
      const auditResults = performFullSafetyAudit();
      
      if (!auditResults.overallSafe) {
        console.log('\n🚨 SYSTEM IS NOT SAFE - DO NOT PROCEED');
        process.exit(1);
      } else {
        console.log('\n✅ SYSTEM SAFETY VALIDATED');
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node code-safety-validator.js --check-files        # Validate file operations');
      console.log('  node code-safety-validator.js --check-db [sql]     # Validate database operations');
      console.log('  node code-safety-validator.js --check-config       # Validate configuration');
      console.log('  node code-safety-validator.js --check-command cmd  # Validate shell command');
      console.log('  node code-safety-validator.js --full-check         # Complete safety audit');
      break;
  }

  console.log(`\n📅 Completed: ${new Date().toISOString()}`);
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  validateFileOperations,
  validateDatabaseOperations,
  validateConfigurationChanges,
  validateCommand,
  performFullSafetyAudit
};