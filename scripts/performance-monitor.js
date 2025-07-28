/**
 * Performance Monitoring Script
 * 
 * This script monitors the performance of the PromptReviews app
 * and provides recommendations for optimization.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PERFORMANCE_CONFIG = {
  baseUrl: 'http://localhost:3002',
  endpoints: [
    '/dashboard',
    '/prompt-pages',
    '/create-prompt-page?type=service&campaign_type=public',
    '/api/business-locations',
    '/api/prompt-pages',
  ],
  iterations: 5,
  timeout: 10000,
};

class PerformanceMonitor {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async measureEndpoint(endpoint) {
    const times = [];
    
    for (let i = 0; i < PERFORMANCE_CONFIG.iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await this.makeRequest(endpoint);
        const duration = Date.now() - start;
        
        times.push({
          duration,
          statusCode: response.statusCode,
          success: response.statusCode === 200,
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        times.push({
          duration: Date.now() - start,
          statusCode: 0,
          success: false,
          error: error.message,
        });
      }
    }
    
    return {
      endpoint,
      times,
      average: times.reduce((sum, t) => sum + t.duration, 0) / times.length,
      min: Math.min(...times.map(t => t.duration)),
      max: Math.max(...times.map(t => t.duration)),
      successRate: times.filter(t => t.success).length / times.length,
    };
  }

  makeRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3002,
        path: path,
        method: 'GET',
        timeout: PERFORMANCE_CONFIG.timeout,
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  async runPerformanceTest() {
    console.log('🚀 Starting Performance Test...\n');
    
    for (const endpoint of PERFORMANCE_CONFIG.endpoints) {
      console.log(`Testing: ${endpoint}`);
      const result = await this.measureEndpoint(endpoint);
      this.results.push(result);
      
      console.log(`  Average: ${result.average.toFixed(2)}ms`);
      console.log(`  Min: ${result.min}ms, Max: ${result.max}ms`);
      console.log(`  Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
      console.log('');
    }
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const avgResponseTime = this.results.reduce((sum, r) => sum + r.average, 0) / this.results.length;
    
    console.log('📊 PERFORMANCE REPORT');
    console.log('====================');
    console.log(`Total Test Time: ${totalTime}ms`);
    console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`Total Endpoints Tested: ${this.results.length}`);
    
    console.log('\n📈 ENDPOINT PERFORMANCE:');
    this.results.forEach(result => {
      const status = result.successRate === 1 ? '✅' : '⚠️';
      console.log(`${status} ${result.endpoint}`);
      console.log(`   Average: ${result.average.toFixed(2)}ms`);
      console.log(`   Success Rate: ${(result.successRate * 100).toFixed(1)}%`);
    });
    
    // Performance recommendations
    console.log('\n💡 PERFORMANCE RECOMMENDATIONS:');
    
    const slowEndpoints = this.results.filter(r => r.average > 1000);
    if (slowEndpoints.length > 0) {
      console.log('⚠️  Slow endpoints detected:');
      slowEndpoints.forEach(endpoint => {
        console.log(`   - ${endpoint.endpoint}: ${endpoint.average.toFixed(2)}ms`);
      });
      console.log('   Consider: Database optimization, caching, or code splitting');
    }
    
    const failedEndpoints = this.results.filter(r => r.successRate < 1);
    if (failedEndpoints.length > 0) {
      console.log('❌ Failed endpoints detected:');
      failedEndpoints.forEach(endpoint => {
        console.log(`   - ${endpoint.endpoint}: ${(endpoint.successRate * 100).toFixed(1)}% success`);
      });
      console.log('   Consider: Error handling improvements');
    }
    
    if (avgResponseTime > 500) {
      console.log('🐌 Overall performance is slow');
      console.log('   Consider: Database indexes, API optimization, or caching');
    } else if (avgResponseTime > 200) {
      console.log('⚡ Performance is acceptable but could be improved');
      console.log('   Consider: Minor optimizations for better user experience');
    } else {
      console.log('🚀 Performance is excellent!');
    }
    
    // Save report to file
    const reportPath = path.join(__dirname, '../performance-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalTime,
      avgResponseTime,
      results: this.results,
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }

  async run() {
    try {
      await this.runPerformanceTest();
      this.generateReport();
    } catch (error) {
      console.error('❌ Performance test failed:', error.message);
    }
  }
}

// Run the performance monitor
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.run().catch(console.error);
}

module.exports = PerformanceMonitor; 