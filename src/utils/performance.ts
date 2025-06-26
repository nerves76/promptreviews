/**
 * Performance Monitoring Utilities
 * 
 * Tracks Core Web Vitals, custom performance metrics, and provides
 * performance monitoring capabilities for the application.
 */

// Core Web Vitals thresholds
const CORE_WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
    }
  }

  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        this.recordMetric('LCP', lastEntry.startTime, CORE_WEB_VITALS_THRESHOLDS.LCP);
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('LCP', observer);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }
  }

  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordMetric('FID', entry.processingStart - entry.startTime, CORE_WEB_VITALS_THRESHOLDS.FID);
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('FID', observer);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }
  }

  private observeCLS() {
    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as any[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue, CORE_WEB_VITALS_THRESHOLDS.CLS);
      });
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('CLS', observer);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }
  }

  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as PerformanceEntry;
        this.recordMetric('FCP', firstEntry.startTime, CORE_WEB_VITALS_THRESHOLDS.FCP);
      });
      observer.observe({ entryTypes: ['first-contentful-paint'] });
      this.observers.set('FCP', observer);
    } catch (error) {
      console.warn('FCP observer not supported:', error);
    }
  }

  private recordMetric(name: string, value: number, thresholds: { good: number; poor: number }) {
    let rating: 'good' | 'needs-improvement' | 'poor';
    
    if (value <= thresholds.good) {
      rating = 'good';
    } else if (value <= thresholds.poor) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.sendMetric(metric);
  }

  private sendMetric(metric: PerformanceMetric) {
    // Send to analytics service (Google Analytics, Sentry, etc.)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'core_web_vital', {
        event_category: 'Web Vitals',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_parameter_rating: metric.rating,
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric - ${metric.name}:`, {
        value: Math.round(metric.value),
        rating: metric.rating,
        timestamp: new Date(metric.timestamp).toISOString(),
      });
    }
  }

  // Custom performance measurement
  public measure(name: string, fn: () => void | Promise<void>) {
    const start = performance.now();
    
    try {
      const result = fn();
      
      if (result instanceof Promise) {
        return result.finally(() => {
          const duration = performance.now() - start;
          this.recordCustomMetric(name, duration);
        });
      } else {
        const duration = performance.now() - start;
        this.recordCustomMetric(name, duration);
        return result;
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.recordCustomMetric(name, duration, error);
      throw error;
    }
  }

  private recordCustomMetric(name: string, duration: number, error?: any) {
    const metric: PerformanceMetric = {
      name: `custom_${name}`,
      value: duration,
      rating: duration < 100 ? 'good' : duration < 300 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    
    if (error) {
      console.error(`Performance measurement failed for ${name}:`, error);
    }
  }

  // API response time measurement
  public measureApiCall(endpoint: string, duration: number) {
    this.recordMetric(`API_${endpoint}`, duration, { good: 200, poor: 1000 });
  }

  // Database query time measurement
  public measureDbQuery(query: string, duration: number) {
    this.recordMetric(`DB_${query}`, duration, { good: 50, poor: 200 });
  }

  // Get all recorded metrics
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // Get metrics by name
  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  // Get latest metric by name
  public getLatestMetric(name: string): PerformanceMetric | null {
    const metrics = this.getMetricsByName(name);
    return metrics.length > 0 ? metrics[metrics.length - 1] : null;
  }

  // Calculate average metric value
  public getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;
    
    const sum = metrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / metrics.length;
  }

  // Disconnect all observers
  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for easy usage
export const measurePerformance = (name: string, fn: () => void | Promise<void>) => {
  return performanceMonitor.measure(name, fn);
};

export const measureApiCall = (endpoint: string, duration: number) => {
  performanceMonitor.measureApiCall(endpoint, duration);
};

export const measureDbQuery = (query: string, duration: number) => {
  performanceMonitor.measureDbQuery(query, duration);
};

// React hook for measuring component render time
export const usePerformanceMeasurement = (componentName: string) => {
  React.useEffect(() => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      performanceMonitor.recordCustomMetric(`render_${componentName}`, duration);
    };
  }, [componentName]);
};

// Higher-order component for performance measurement
export const withPerformanceMeasurement = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent = (props: P) => {
    usePerformanceMeasurement(componentName);
    return <Component {...props} />;
  };
  
  WrappedComponent.displayName = `withPerformanceMeasurement(${Component.displayName || Component.name})`;
  return WrappedComponent;
}; 