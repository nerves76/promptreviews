#!/usr/bin/env node

/**
 * Database Restoration Toolkit
 * 
 * Comprehensive utility for assessing database status, executing restoration,
 * and verifying system integrity after database restoration.
 * 
 * Usage:
 *   node database-restoration-toolkit.js --assess     # Check current status
 *   node database-restoration-toolkit.js --restore    # Execute restoration
 *   node database-restoration-toolkit.js --verify     # Verify integrity
 *   node database-restoration-toolkit.js --full       # Complete restoration process
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Expected core tables in the system
const CORE_TABLES = [
  'account_users',
  'accounts', 
  'businesses',
  'contacts',
  'widgets',
  'widget_reviews',
  'prompt_pages',
  'quotes',
  'admins',
  'ai_usage',
  'analytics_events'
];

/**
 * Database Assessment Functions
 */

async function assessDatabaseStatus() {
  console.log('\n🔍 PHASE 1: DATABASE ASSESSMENT');
  console.log('================================');

  const results = {
    connection: false,
    tablesFound: [],
    tablesMissing: [],
    rlsPolicies: [],
    foreignKeys: [],
    indexes: [],
    criticalIssues: []
  };

  try {
    // Test connection
    console.log('📡 Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (connectionError) {
      throw new Error(`Connection failed: ${connectionError.message}`);
    }

    results.connection = true;
    console.log('✅ Database connection successful');

    // Check table existence
    console.log('\n📋 Checking core tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      throw new Error(`Failed to fetch tables: ${tablesError.message}`);
    }

    const existingTables = tables.map(t => t.table_name);
    
    CORE_TABLES.forEach(table => {
      if (existingTables.includes(table)) {
        results.tablesFound.push(table);
        console.log(`✅ ${table}`);
      } else {
        results.tablesMissing.push(table);
        console.log(`❌ ${table} - MISSING`);
      }
    });

    // Check RLS policies
    console.log('\n🛡️  Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.table_privileges')
      .select('table_name, grantee, privilege_type')
      .eq('table_schema', 'public');

    if (!policiesError && policies) {
      console.log(`📊 Found ${policies.length} privilege entries`);
    }

    // Check foreign keys
    console.log('\n🔗 Checking foreign key constraints...');
    const { data: foreignKeys, error: fkError } = await supabase
      .from('information_schema.table_constraints')
      .select('table_name, constraint_name, constraint_type')
      .eq('constraint_type', 'FOREIGN KEY')
      .eq('table_schema', 'public');

    if (!fkError && foreignKeys) {
      results.foreignKeys = foreignKeys;
      console.log(`📊 Found ${foreignKeys.length} foreign key constraints`);
    }

    // Assessment summary
    console.log('\n📊 ASSESSMENT SUMMARY');
    console.log('=====================');
    console.log(`✅ Tables found: ${results.tablesFound.length}/${CORE_TABLES.length}`);
    console.log(`❌ Tables missing: ${results.tablesMissing.length}`);
    console.log(`🔗 Foreign keys: ${results.foreignKeys.length}`);

    if (results.tablesMissing.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED:');
      results.tablesMissing.forEach(table => {
        console.log(`   - Missing table: ${table}`);
        results.criticalIssues.push(`Missing table: ${table}`);
      });
    }

    return results;

  } catch (error) {
    console.error('❌ Database assessment failed:', error.message);
    results.criticalIssues.push(`Assessment failed: ${error.message}`);
    return results;
  }
}

/**
 * Database Restoration Functions
 */

async function executeRestoration() {
  console.log('\n🔧 PHASE 2: DATABASE RESTORATION');
  console.log('=================================');

  try {
    // Check if restoration file exists
    const restorationFile = path.join(__dirname, 'restore_complete_schema.sql');
    
    if (!fs.existsSync(restorationFile)) {
      throw new Error('restore_complete_schema.sql not found in project root');
    }

    console.log('📄 Loading restoration script...');
    const restorationSQL = fs.readFileSync(restorationFile, 'utf8');

    console.log('⚠️  WARNING: This will execute the complete schema restoration');
    console.log('   This may overwrite existing data or structure');
    
    // For safety, we'll split the SQL into smaller chunks
    const sqlStatements = restorationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`📊 Found ${sqlStatements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (const [index, statement] of sqlStatements.entries()) {
      if (!statement) continue;

      try {
        console.log(`Executing statement ${index + 1}/${sqlStatements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement 
        });

        if (error) {
          console.error(`❌ Statement ${index + 1} failed:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Statement ${index + 1} error:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 RESTORATION SUMMARY');
    console.log('======================');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some restoration steps failed. Manual intervention may be required.');
      return false;
    }

    console.log('\n✅ Database restoration completed successfully');
    return true;

  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
    return false;
  }
}

/**
 * Database Verification Functions
 */

async function verifyRestoration() {
  console.log('\n✅ PHASE 3: RESTORATION VERIFICATION');
  console.log('====================================');

  const verificationResults = {
    tableStructure: false,
    authentication: false,
    businessLogic: false,
    widgetSystem: false,
    apiEndpoints: false,
    overallStatus: false
  };

  try {
    // 1. Verify table structure
    console.log('🏗️  Verifying table structure...');
    const assessment = await assessDatabaseStatus();
    
    if (assessment.tablesMissing.length === 0) {
      verificationResults.tableStructure = true;
      console.log('✅ All core tables present');
    } else {
      console.log(`❌ ${assessment.tablesMissing.length} tables still missing`);
    }

    // 2. Test authentication system
    console.log('\n🔐 Testing authentication system...');
    try {
      const { data: accounts, error: authError } = await supabase
        .from('accounts')
        .select('id')
        .limit(1);
      
      if (!authError) {
        verificationResults.authentication = true;
        console.log('✅ Authentication tables accessible');
      } else {
        console.log('❌ Authentication test failed:', authError.message);
      }
    } catch (err) {
      console.log('❌ Authentication test error:', err.message);
    }

    // 3. Test business logic
    console.log('\n🏢 Testing business logic...');
    try {
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id, name')
        .limit(1);
      
      if (!businessError) {
        verificationResults.businessLogic = true;
        console.log('✅ Business tables accessible');
      } else {
        console.log('❌ Business logic test failed:', businessError.message);
      }
    } catch (err) {
      console.log('❌ Business logic test error:', err.message);
    }

    // 4. Test widget system
    console.log('\n🔧 Testing widget system...');
    try {
      const { data: widgets, error: widgetError } = await supabase
        .from('widgets')
        .select('id, name, type')
        .limit(1);
      
      if (!widgetError) {
        verificationResults.widgetSystem = true;
        console.log('✅ Widget system accessible');
      } else {
        console.log('❌ Widget system test failed:', widgetError.message);
      }
    } catch (err) {
      console.log('❌ Widget system test error:', err.message);
    }

    // 5. Overall verification
    const passedTests = Object.values(verificationResults).filter(Boolean).length;
    const totalTests = Object.keys(verificationResults).length - 1; // Exclude overallStatus

    verificationResults.overallStatus = (passedTests / totalTests) >= 0.8; // 80% pass rate

    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('=======================');
    console.log(`✅ Table structure: ${verificationResults.tableStructure ? 'PASS' : 'FAIL'}`);
    console.log(`🔐 Authentication: ${verificationResults.authentication ? 'PASS' : 'FAIL'}`);
    console.log(`🏢 Business logic: ${verificationResults.businessLogic ? 'PASS' : 'FAIL'}`);
    console.log(`🔧 Widget system: ${verificationResults.widgetSystem ? 'PASS' : 'FAIL'}`);
    console.log(`📊 Overall status: ${verificationResults.overallStatus ? 'PASS' : 'FAIL'}`);
    console.log(`📈 Pass rate: ${passedTests}/${totalTests} (${Math.round((passedTests/totalTests)*100)}%)`);

    return verificationResults;

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    return verificationResults;
  }
}

/**
 * Main execution function
 */

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log('🚀 DATABASE RESTORATION TOOLKIT');
  console.log('================================');
  console.log(`📅 Started: ${new Date().toISOString()}`);

  switch (command) {
    case '--assess':
      await assessDatabaseStatus();
      break;

    case '--restore':
      console.log('⚠️  Starting database restoration...');
      const restored = await executeRestoration();
      if (restored) {
        console.log('\n🎉 Restoration completed successfully!');
      } else {
        console.log('\n🚨 Restoration encountered issues. Check logs above.');
      }
      break;

    case '--verify':
      await verifyRestoration();
      break;

    case '--full':
      console.log('🚀 Starting complete restoration process...');
      
      // Step 1: Assessment
      const assessment = await assessDatabaseStatus();
      
      if (assessment.criticalIssues.length > 0) {
        console.log('\n🔧 Critical issues detected. Proceeding with restoration...');
        
        // Step 2: Restoration
        const restored = await executeRestoration();
        
        if (restored) {
          // Step 3: Verification
          console.log('\n✅ Restoration completed. Running verification...');
          const verification = await verifyRestoration();
          
          if (verification.overallStatus) {
            console.log('\n🎉 COMPLETE SUCCESS: Database fully restored and verified!');
          } else {
            console.log('\n⚠️  PARTIAL SUCCESS: Database restored but some issues remain.');
          }
        } else {
          console.log('\n🚨 RESTORATION FAILED: Manual intervention required.');
        }
      } else {
        console.log('\n✅ No critical issues detected. Database appears healthy.');
        await verifyRestoration();
      }
      break;

    default:
      console.log('Usage:');
      console.log('  node database-restoration-toolkit.js --assess     # Check current status');
      console.log('  node database-restoration-toolkit.js --restore    # Execute restoration');
      console.log('  node database-restoration-toolkit.js --verify     # Verify integrity');
      console.log('  node database-restoration-toolkit.js --full       # Complete process');
      break;
  }

  console.log(`\n📅 Completed: ${new Date().toISOString()}`);
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  assessDatabaseStatus,
  executeRestoration,
  verifyRestoration
};