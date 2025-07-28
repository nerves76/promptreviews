/**
 * Performance Optimizer Script
 * 
 * This script analyzes the codebase for performance bottlenecks and provides
 * specific recommendations for optimization.
 */

const fs = require('fs');
const path = require('path');

class PerformanceOptimizer {
  constructor() {
    this.issues = [];
    this.recommendations = [];
  }

  analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const lineCount = lines.length;
      
      // Check for large files
      if (lineCount > 500) {
        this.issues.push({
          type: 'LARGE_FILE',
          file: filePath,
          lines: lineCount,
          severity: lineCount > 1000 ? 'HIGH' : 'MEDIUM',
          recommendation: `Split ${path.basename(filePath)} into smaller components`
        });
      }
      
      // Check for performance anti-patterns
      const performanceIssues = this.checkPerformancePatterns(content, filePath);
      this.issues.push(...performanceIssues);
      
      return { lineCount, issues: performanceIssues };
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
      return { lineCount: 0, issues: [] };
    }
  }

  checkPerformancePatterns(content, filePath) {
    const issues = [];
    
    // Check for useEffect without dependencies
    const useEffectNoDeps = content.match(/useEffect\s*\(\s*\(\)\s*=>\s*\{/g);
    if (useEffectNoDeps) {
      issues.push({
        type: 'USE_EFFECT_NO_DEPS',
        file: filePath,
        severity: 'MEDIUM',
        recommendation: 'Add dependency array to useEffect or use useCallback'
      });
    }
    
    // Check for large imports
    const largeImports = content.match(/import.*from.*['"](react-icons|recharts|jspdf|browser-image-compression)['"]/g);
    if (largeImports) {
      issues.push({
        type: 'LARGE_IMPORTS',
        file: filePath,
        severity: 'HIGH',
        recommendation: 'Use dynamic imports for large libraries'
      });
    }
    
    // Check for inline styles
    const inlineStyles = content.match(/style\s*=\s*\{\{[^}]*\}\}/g);
    if (inlineStyles && inlineStyles.length > 5) {
      issues.push({
        type: 'INLINE_STYLES',
        file: filePath,
        severity: 'LOW',
        recommendation: 'Move inline styles to CSS classes'
      });
    }
    
    // Check for missing memoization
    const functionComponents = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g);
    if (functionComponents && !content.includes('React.memo')) {
      issues.push({
        type: 'MISSING_MEMOIZATION',
        file: filePath,
        severity: 'MEDIUM',
        recommendation: 'Consider using React.memo for expensive components'
      });
    }
    
    return issues;
  }

  scanDirectory(dir, extensions = ['.tsx', '.ts', '.js', '.jsx']) {
    const files = [];
    
    function scan(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scan(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    scan(dir);
    return files;
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        highSeverity: this.issues.filter(i => i.severity === 'HIGH').length,
        mediumSeverity: this.issues.filter(i => i.severity === 'MEDIUM').length,
        lowSeverity: this.issues.filter(i => i.severity === 'LOW').length,
      },
      issues: this.issues,
      recommendations: this.generateRecommendations()
    };
    
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Bundle optimization
    recommendations.push({
      category: 'BUNDLE_OPTIMIZATION',
      priority: 'HIGH',
      actions: [
        'Implement dynamic imports for large libraries',
        'Add React.memo to expensive components',
        'Split large components into smaller pieces',
        'Use Next.js Image component for all images'
      ]
    });
    
    // Database optimization
    recommendations.push({
      category: 'DATABASE_OPTIMIZATION',
      priority: 'HIGH',
      actions: [
        'Add database indexes for frequently queried columns',
        'Implement query caching with Redis',
        'Optimize Supabase queries with proper RLS policies',
        'Use connection pooling for database connections'
      ]
    });
    
    // Caching strategy
    recommendations.push({
      category: 'CACHING_STRATEGY',
      priority: 'MEDIUM',
      actions: [
        'Implement React Query for API caching',
        'Add service worker for static asset caching',
        'Use Next.js ISR for static pages',
        'Implement browser caching headers'
      ]
    });
    
    return recommendations;
  }

  async run() {
    console.log('🔍 Analyzing codebase for performance issues...\n');
    
    const srcDir = path.join(process.cwd(), 'src');
    const files = this.scanDirectory(srcDir);
    
    console.log(`📁 Found ${files.length} files to analyze\n`);
    
    let totalLines = 0;
    let totalIssues = 0;
    
    for (const file of files) {
      const result = this.analyzeFile(file);
      totalLines += result.lineCount;
      totalIssues += result.issues.length;
      
      if (result.issues.length > 0) {
        console.log(`⚠️  ${path.relative(process.cwd(), file)} (${result.lineCount} lines)`);
        result.issues.forEach(issue => {
          console.log(`   ${issue.severity}: ${issue.recommendation}`);
        });
        console.log('');
      }
    }
    
    const report = this.generateReport();
    
    console.log('📊 PERFORMANCE ANALYSIS SUMMARY');
    console.log('================================');
    console.log(`Total files analyzed: ${files.length}`);
    console.log(`Total lines of code: ${totalLines.toLocaleString()}`);
    console.log(`Total issues found: ${totalIssues}`);
    console.log(`High severity: ${report.summary.highSeverity}`);
    console.log(`Medium severity: ${report.summary.mediumSeverity}`);
    console.log(`Low severity: ${report.summary.lowSeverity}`);
    
    console.log('\n🚀 TOP RECOMMENDATIONS:');
    console.log('========================');
    report.recommendations.forEach(rec => {
      console.log(`\n${rec.category} (${rec.priority} priority):`);
      rec.actions.forEach(action => {
        console.log(`  • ${action}`);
      });
    });
    
    // Save detailed report
    fs.writeFileSync('performance-analysis.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to: performance-analysis.json');
    
    return report;
  }
}

// Run the analysis
const optimizer = new PerformanceOptimizer();
optimizer.run().catch(console.error); 