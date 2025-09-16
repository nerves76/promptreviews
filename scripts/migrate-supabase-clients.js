#!/usr/bin/env node

/**
 * Supabase Client Migration Script
 * 
 * This script automatically fixes common Supabase client consolidation issues:
 * 1. Removes duplicate imports from the same file
 * 2. Standardizes import patterns
 * 3. Replaces direct createClient with centralized utils
 * 4. Fixes architectural violations
 * 
 * Usage: npm run migrate:supabase-clients
 * 
 * Created: January 7, 2025
 */

const fs = require('fs');
const path = require('path');
const SupabaseClientAuditor = require('./audit-supabase-clients');

class SupabaseClientMigrator {
  constructor() {
    this.auditor = new SupabaseClientAuditor();
    this.auditResults = null;
    this.migrations = [];
    this.stats = {
      filesProcessed: 0,
      duplicatesRemoved: 0,
      directClientsReplaced: 0,
      architecturalViolationsFixed: 0,
      errors: []
    };
  }

  /**
   * Run the audit first to understand current state
   */
  async runAudit() {
    console.log('🔍 Running pre-migration audit...\n');
    this.auditResults = this.auditor.run();
    console.log('\n✅ Audit completed\n');
  }

  /**
   * Fix duplicate imports in a file
   */
  fixDuplicateImports(filePath, content) {
    const lines = content.split('\n');
    const importMap = new Map();
    const newLines = [];
    let duplicatesRemoved = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a supabaseClient import
      if (line.includes('supabaseClient') && line.includes('import')) {
        const importKey = this.normalizeImport(line);
        
        if (importMap.has(importKey)) {
          // Duplicate found, skip this line
          duplicatesRemoved++;
          console.log(`   🗑️  Removing duplicate: ${line.trim()}`);
          continue;
        } else {
          importMap.set(importKey, line);
        }
      }
      
      newLines.push(line);
    }

    if (duplicatesRemoved > 0) {
      this.stats.duplicatesRemoved += duplicatesRemoved;
      console.log(`   ✅ Removed ${duplicatesRemoved} duplicate imports`);
      return newLines.join('\n');
    }

    return content;
  }

  /**
   * Normalize import statement for comparison
   */
  normalizeImport(importLine) {
    // Extract the essential parts of the import
    const match = importLine.match(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/);
    if (match) {
      const imports = match[1].split(',').map(s => s.trim()).sort().join(',');
      const source = match[2];
      return `${imports}:::${source}`;
    }
    return importLine.trim();
  }

  /**
   * Replace direct createClient with centralized version
   */
  replaceDirectClients(filePath, content) {
    let newContent = content;
    let replacements = 0;

    // Pattern 1: Replace standalone createClient imports
    const directImportPattern = /import\s+{\s*createClient\s*}\s+from\s+['"]@supabase\/supabase-js['"]/g;
    if (directImportPattern.test(content)) {
      newContent = newContent.replace(
        directImportPattern,
        "import { createClient } from '@/utils/supabaseClient'"
      );
      replacements++;
      console.log('   🔄 Replaced direct createClient import');
    }

    // Pattern 2: Replace createClient usage in API routes that should use service role
    if (filePath.includes('/api/') && newContent.includes('createClient(')) {
      // Look for environment variable usage patterns
      const envPattern = /createClient\s*\(\s*process\.env\.NEXT_PUBLIC_SUPABASE_URL!?,\s*process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!?\s*\)/g;
      
      if (envPattern.test(newContent)) {
        console.log('   ⚠️  WARNING: API route using anon key - consider service role');
        // Don't auto-replace this as it requires manual review
      }
    }

    if (replacements > 0) {
      this.stats.directClientsReplaced += replacements;
    }

    return newContent;
  }

  /**
   * Process a single file
   */
  processFile(fileAnalysis) {
    const filePath = fileAnalysis.path;
    console.log(`\n📄 Processing: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Fix duplicate imports
    if (fileAnalysis.hasMultiplePatterns && fileAnalysis.instances.filter(i => i.category === 'util-import').length > 1) {
      const newContent = this.fixDuplicateImports(filePath, content);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }

    // Replace direct clients (conservative approach)
    const newContent = this.replaceDirectClients(filePath, content);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }

    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ File updated`);
      this.stats.filesProcessed++;
    } else {
      console.log(`   ℹ️  No changes needed`);
    }

    return modified;
  }

  /**
   * Generate migration report
   */
  generateReport() {
    console.log('\n🎯 MIGRATION COMPLETED');
    console.log('====================\n');
    
    console.log('📊 STATISTICS:');
    console.log(`   Files processed: ${this.stats.filesProcessed}`);
    console.log(`   Duplicate imports removed: ${this.stats.duplicatesRemoved}`);
    console.log(`   Direct clients replaced: ${this.stats.directClientsReplaced}`);
    console.log(`   Architectural violations fixed: ${this.stats.architecturalViolationsFixed}\n`);

    if (this.stats.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.stats.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log();
    }

    console.log('📋 MANUAL REVIEW NEEDED:');
    console.log('1. API routes with multiple createClient calls');
    console.log('2. Mixed client types requiring architectural decisions');
    console.log('3. Service role vs anon key usage in API routes');
    console.log('4. Legacy utility file patterns\n');

    console.log('🚀 NEXT STEPS:');
    console.log('1. Run audit again to see progress: npm run audit:supabase-clients');
    console.log('2. Test the application: npm run dev');
    console.log('3. Run auth tests: npm run auth:full-check');
    console.log('4. Review remaining problematic files manually\n');
  }

  /**
   * Run the complete migration process
   */
  async run() {
    console.log('🚀 SUPABASE CLIENT MIGRATION');
    console.log('============================\n');

    // First run audit
    await this.runAudit();

    // Process problematic files
    const problematicFiles = this.auditResults.summary.problematicFiles;
    
    console.log(`📋 Processing ${problematicFiles.length} problematic files...\n`);

    for (const fileAnalysis of problematicFiles) {
      try {
        this.processFile(fileAnalysis);
      } catch (error) {
        const errorMsg = `Error processing ${fileAnalysis.path}: ${error.message}`;
        console.error(`❌ ${errorMsg}`);
        this.stats.errors.push(errorMsg);
      }
    }

    this.generateReport();

    // Save migration log
    const migrationLog = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      migrations: this.migrations
    };
    
    fs.writeFileSync('supabase-migration-log.json', JSON.stringify(migrationLog, null, 2));
    console.log('📄 Migration log saved to: supabase-migration-log.json');
  }
}

// Run the migration
if (require.main === module) {
  const migrator = new SupabaseClientMigrator();
  migrator.run().catch(console.error);
}

module.exports = SupabaseClientMigrator; 