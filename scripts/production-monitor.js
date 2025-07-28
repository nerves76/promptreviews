/**
 * Production Monitoring Script
 * 
 * This script monitors production performance and health metrics
 * to identify issues before they become critical.
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const MONITORING_CONFIG = {
  baseUrl: process.env.PRODUCTION_URL || 'https://promptreviews.app',
  endpoints: [
    '/',
    '/dashboard',
    '/prompt-pages',
    '/api/business-locations',
    '/api/prompt-pages',
  ],
  checkInterval: 60000, // 1 minute
  alertThreshold: 3000, // 3 seconds
  maxRetries: 3,
};

class ProductionMonitor {
  constructor() {
    this.metrics = {
      uptime: Date.now(),
      checks: 0,
      failures: 0,
      slowResponses: 0,
      averageResponseTime: 0,
    };
    this.alerts = [];
  }

  async checkEndpoint(endpoint) {
    const start = Date.now();
    
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, MONITORING_CONFIG.baseUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const req = client.get(url, (res) => {
        const duration = Date.now() - start;
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const success = res.statusCode >= 200 && res.statusCode < 300;
          const isSlow = duration > MONITORING_CONFIG.alertThreshold;
          
          if (isSlow) {
            this.recordSlowResponse(endpoint, duration, res.statusCode);
          }
          
          resolve({
            endpoint,
            duration,
            statusCode: res.statusCode,
            success,
            isSlow,
            timestamp: Date.now(),
          });
        });
      });
      
      req.on('error', (error) => {
        reject({
          endpoint,
          error: error.message,
          timestamp: Date.now(),
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject({
          endpoint,
          error: 'Request timeout',
          timestamp: Date.now(),
        });
      });
    });
  }

  recordSlowResponse(endpoint, duration, statusCode) {
    this.metrics.slowResponses++;
    this.alerts.push({
      type: 'slow_response',
      endpoint,
      duration,
      statusCode,
      timestamp: Date.now(),
    });
    
    console.warn(`⚠️  Slow response detected: ${endpoint} (${duration}ms)`);
  }

  recordFailure(endpoint, error) {
    this.metrics.failures++;
    this.alerts.push({
      type: 'failure',
      endpoint,
      error,
      timestamp: Date.now(),
    });
    
    console.error(`❌ Endpoint failure: ${endpoint} - ${error}`);
  }

  async runHealthCheck() {
    console.log('🏥 Running production health check...\n');
    
    const results = [];
    
    for (const endpoint of MONITORING_CONFIG.endpoints) {
      for (let attempt = 1; attempt <= MONITORING_CONFIG.maxRetries; attempt++) {
        try {
          const result = await this.checkEndpoint(endpoint);
          results.push(result);
          
          const status = result.success ? '✅' : '⚠️';
          console.log(`${status} ${endpoint} - ${result.duration}ms (${result.statusCode})`);
          
          if (result.success) break; // Success, move to next endpoint
        } catch (error) {
          if (attempt === MONITORING_CONFIG.maxRetries) {
            this.recordFailure(endpoint, error.error);
            console.log(`❌ ${endpoint} - Failed after ${attempt} attempts`);
          } else {
            console.log(`⚠️  ${endpoint} - Attempt ${attempt} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    }
    
    this.updateMetrics(results);
    this.generateReport();
  }

  updateMetrics(results) {
    this.metrics.checks += results.length;
    
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      const avgTime = successfulResults.reduce((sum, r) => sum + r.duration, 0) / successfulResults.length;
      this.metrics.averageResponseTime = avgTime;
    }
    
    const failures = results.filter(r => !r.success).length;
    this.metrics.failures += failures;
  }

  generateReport() {
    const uptime = Date.now() - this.metrics.uptime;
    const uptimeHours = Math.floor(uptime / (1000 * 60 * 60));
    const successRate = ((this.metrics.checks - this.metrics.failures) / this.metrics.checks * 100).toFixed(1);
    
    console.log('\n📊 PRODUCTION HEALTH REPORT');
    console.log('==========================');
    console.log(`Uptime: ${uptimeHours}h ${Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60))}m`);
    console.log(`Total Checks: ${this.metrics.checks}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`Slow Responses: ${this.metrics.slowResponses}`);
    console.log(`Failures: ${this.metrics.failures}`);
    
    if (this.alerts.length > 0) {
      console.log('\n🚨 ALERTS:');
      this.alerts.slice(-5).forEach(alert => {
        const time = new Date(alert.timestamp).toLocaleTimeString();
        console.log(`[${time}] ${alert.type}: ${alert.endpoint}`);
      });
    }
    
    // Save metrics to file
    const metricsPath = path.join(__dirname, '../production-metrics.json');
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      recentAlerts: this.alerts.slice(-10),
    };
    
    fs.writeFileSync(metricsPath, JSON.stringify(report, null, 2));
  }

  async startMonitoring() {
    console.log('🚀 Starting production monitoring...');
    console.log(`Monitoring: ${MONITORING_CONFIG.baseUrl}`);
    console.log(`Check interval: ${MONITORING_CONFIG.checkInterval / 1000}s`);
    console.log(`Alert threshold: ${MONITORING_CONFIG.alertThreshold}ms\n`);
    
    // Initial check
    await this.runHealthCheck();
    
    // Set up periodic monitoring
    setInterval(async () => {
      await this.runHealthCheck();
    }, MONITORING_CONFIG.checkInterval);
  }

  // Performance analysis
  analyzePerformance() {
    const slowEndpoints = this.alerts
      .filter(alert => alert.type === 'slow_response')
      .reduce((acc, alert) => {
        acc[alert.endpoint] = (acc[alert.endpoint] || 0) + 1;
        return acc;
      }, {});
    
    if (Object.keys(slowEndpoints).length > 0) {
      console.log('\n🐌 PERFORMANCE ISSUES DETECTED:');
      Object.entries(slowEndpoints)
        .sort(([,a], [,b]) => b - a)
        .forEach(([endpoint, count]) => {
          console.log(`   ${endpoint}: ${count} slow responses`);
        });
    }
  }
}

// Run the monitor
if (require.main === module) {
  const monitor = new ProductionMonitor();
  monitor.startMonitoring().catch(console.error);
}

module.exports = ProductionMonitor; 