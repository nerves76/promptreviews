#!/usr/bin/env node

/**
 * Supabase Client Audit Script
 * 
 * This script analyzes all Supabase client usage patterns across the codebase
 * and generates a comprehensive report for consolidation planning.
 * 
 * Usage: npm run audit:supabase-clients
 * 
 * Created: January 7, 2025
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const SRC_DIR = 'src';
const INCLUDE_PATTERNS = ['*.ts', '*.tsx', '*.js', '*.jsx'];
const CLIENT_PATTERNS = [
  {
    type: 'createClient',
    imports: ['@supabase/supabase-js'],
    pattern: /createClient\s*\(/g,
    category: 'direct'
  },
  {
    type: 'createBrowserClient',
    imports: ['@supabase/ssr'],
    pattern: /createBrowserClient\s*\(/g,
    category: 'ssr-browser'
  },
  {
    type: 'createServerClient',
    imports: ['@supabase/ssr'],
    pattern: /createServerClient\s*\(/g,
    category: 'ssr-server'
  },
  {
    type: 'supabaseClient import',
    imports: ['../utils/supabaseClient', './utils/supabaseClient', '@/utils/supabaseClient'],
    pattern: /import.*supabaseClient/g,
    category: 'util-import'
  }
];

class SupabaseClientAuditor {
  constructor() {
    this.results = {
      files: [],
      summary: {
        totalFiles: 0,
        totalInstances: 0,
        byCategory: {},
        byFileType: {},
        problematicFiles: []
      }
    };
  }

  /**
   * Find all TypeScript/JavaScript files in src directory
   */
  findSourceFiles() {
    const files = [];
    
    function walkDir(dir) {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walkDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(item);
          if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    }
    
    walkDir(SRC_DIR);
    return files;
  }

  /**
   * Analyze a single file for Supabase client patterns
   */
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileAnalysis = {
      path: filePath,
      type: path.extname(filePath).substring(1),
      instances: [],
      imports: [],
      hasMultiplePatterns: false,
      recommendations: []
    };

    // Check for import statements
    const importRegex = /import\s+.*from\s+['"][^'"]*supabase[^'"]*['"]/g;
    let importMatch;
    while ((importMatch = importRegex.exec(content)) !== null) {
      fileAnalysis.imports.push({
        line: content.substring(0, importMatch.index).split('\n').length,
        statement: importMatch[0]
      });
    }

    // Check for each client pattern
    CLIENT_PATTERNS.forEach(pattern => {
      let match;
      while ((match = pattern.pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const lineContent = content.split('\n')[lineNumber - 1];
        
        fileAnalysis.instances.push({
          type: pattern.type,
          category: pattern.category,
          line: lineNumber,
          content: lineContent.trim(),
          context: this.getContext(content, match.index)
        });
      }
      
      // Reset regex for next search
      pattern.pattern.lastIndex = 0;
    });

    // Analyze patterns
    if (fileAnalysis.instances.length > 1) {
      fileAnalysis.hasMultiplePatterns = true;
      fileAnalysis.recommendations.push('CONSOLIDATE: Multiple client creation patterns in single file');
    }

    const categories = [...new Set(fileAnalysis.instances.map(i => i.category))];
    if (categories.length > 1) {
      fileAnalysis.recommendations.push('STANDARDIZE: Mixed client types (direct + SSR)');
    }

    // File type recommendations
    if (filePath.includes('/api/') && fileAnalysis.instances.some(i => i.category === 'ssr-browser')) {
      fileAnalysis.recommendations.push('FIX: API route using browser client');
    }

    if (filePath.includes('/components/') && fileAnalysis.instances.some(i => i.category === 'ssr-server')) {
      fileAnalysis.recommendations.push('FIX: Component using server client');
    }

    return fileAnalysis;
  }

  /**
   * Get context around a match for better understanding
   */
  getContext(content, index) {
    const lines = content.split('\n');
    const lineIndex = content.substring(0, index).split('\n').length - 1;
    
    const start = Math.max(0, lineIndex - 2);
    const end = Math.min(lines.length - 1, lineIndex + 2);
    
    return {
      before: lines.slice(start, lineIndex),
      current: lines[lineIndex],
      after: lines.slice(lineIndex + 1, end + 1)
    };
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('🔍 SUPABASE CLIENT AUDIT REPORT');
    console.log('================================\n');

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Total files analyzed: ${this.results.summary.totalFiles}`);
    console.log(`   Files with Supabase clients: ${this.results.files.length}`);
    console.log(`   Total client instances: ${this.results.summary.totalInstances}`);
    console.log(`   Problematic files: ${this.results.summary.problematicFiles.length}\n`);

    // By category
    console.log('📈 BY CATEGORY:');
    Object.entries(this.results.summary.byCategory).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} instances`);
    });
    console.log();

    // By file type
    console.log('📁 BY FILE TYPE:');
    Object.entries(this.results.summary.byFileType).forEach(([type, count]) => {
      console.log(`   .${type}: ${count} files`);
    });
    console.log();

    // Problematic files
    if (this.results.summary.problematicFiles.length > 0) {
      console.log('🚨 PROBLEMATIC FILES:');
      this.results.summary.problematicFiles.forEach(file => {
        console.log(`\n📄 ${file.path}`);
        console.log(`   Issues: ${file.recommendations.length}`);
        file.recommendations.forEach(rec => {
          console.log(`   - ${rec}`);
        });
        
        if (file.instances.length > 0) {
          console.log(`   Instances:`);
          file.instances.forEach(instance => {
            console.log(`     Line ${instance.line}: ${instance.type} (${instance.category})`);
          });
        }
      });
      console.log();
    }

    // Recommendations
    console.log('💡 CONSOLIDATION RECOMMENDATIONS:');
    console.log('1. Replace all direct createClient with centralized createClient from utils/supabaseClient');
    console.log('2. Use createBrowserClient only in client components');
    console.log('3. Use createServerClient only in API routes and middleware');
    console.log('4. Implement feature flags for gradual migration');
    console.log('5. Add eslint rules to prevent future violations\n');

    // Migration priority
    console.log('🎯 MIGRATION PRIORITY:');
    console.log('1. HIGH: API routes using browser clients');
    console.log('2. HIGH: Components using server clients');
    console.log('3. MEDIUM: Files with multiple client types');
    console.log('4. LOW: Files using util imports (already good pattern)\n');
  }

  /**
   * Run the complete audit
   */
  run() {
    console.log('🔍 Starting Supabase Client Audit...\n');
    
    const sourceFiles = this.findSourceFiles();
    this.results.summary.totalFiles = sourceFiles.length;

    for (const filePath of sourceFiles) {
      const analysis = this.analyzeFile(filePath);
      
      if (analysis.instances.length > 0 || analysis.imports.length > 0) {
        this.results.files.push(analysis);
        
        // Update summary
        this.results.summary.totalInstances += analysis.instances.length;
        
        // Count by category
        analysis.instances.forEach(instance => {
          this.results.summary.byCategory[instance.category] = 
            (this.results.summary.byCategory[instance.category] || 0) + 1;
        });
        
        // Count by file type
        this.results.summary.byFileType[analysis.type] = 
          (this.results.summary.byFileType[analysis.type] || 0) + 1;
        
        // Check if problematic
        if (analysis.recommendations.length > 0 || analysis.hasMultiplePatterns) {
          this.results.summary.problematicFiles.push(analysis);
        }
      }
    }

    this.generateReport();
    
    // Save detailed results
    const outputPath = 'supabase-client-audit.json';
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed results saved to: ${outputPath}`);
    
    return this.results;
  }
}

// Run the audit
if (require.main === module) {
  const auditor = new SupabaseClientAuditor();
  auditor.run();
}

module.exports = SupabaseClientAuditor; 