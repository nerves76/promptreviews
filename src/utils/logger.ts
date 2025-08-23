/**
 * Centralized logging utility with configurable log levels
 * 
 * Set LOG_LEVEL in environment variables or localStorage:
 * - 'error': Only errors
 * - 'warn': Errors and warnings
 * - 'info': Errors, warnings, and info (default)
 * - 'debug': Everything including debug logs
 * - 'silent': No logs
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'silent';

class Logger {
  private level: LogLevel;
  private readonly levels: Record<LogLevel, number> = {
    silent: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
  };

  constructor() {
    // Check localStorage first (for runtime control), then env variable
    const storedLevel = typeof window !== 'undefined' 
      ? localStorage.getItem('LOG_LEVEL') 
      : null;
    
    const envLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
    const defaultLevel = process.env.NODE_ENV === 'production' ? 'error' : 'info';
    
    this.level = (storedLevel || envLevel || defaultLevel) as LogLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.level];
  }

  private formatMessage(emoji: string, prefix: string, ...args: any[]): any[] {
    if (typeof args[0] === 'string') {
      return [`${emoji} ${prefix}: ${args[0]}`, ...args.slice(1)];
    }
    return [emoji, prefix + ':', ...args];
  }

  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('❌', 'ERROR', ...args));
    }
  }

  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('⚠️', 'WARN', ...args));
    }
  }

  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(...this.formatMessage('ℹ️', 'INFO', ...args));
    }
  }

  debug(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🔍', 'DEBUG', ...args));
    }
  }

  // Auth-specific logging (usually debug level)
  auth(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🔐', 'AUTH', ...args));
    }
  }

  // Business context logging (usually debug level)
  business(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🏢', 'BUSINESS', ...args));
    }
  }

  // Account context logging (usually debug level)
  account(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('👤', 'ACCOUNT', ...args));
    }
  }

  // Navigation logging (usually debug level)
  nav(...args: any[]) {
    if (this.shouldLog('debug')) {
      console.log(...this.formatMessage('🧭', 'NAV', ...args));
    }
  }

  // Set log level at runtime
  setLevel(level: LogLevel) {
    this.level = level;
    if (typeof window !== 'undefined') {
      localStorage.setItem('LOG_LEVEL', level);
    }
    console.log(`📝 Log level set to: ${level}`);
  }

  // Get current log level
  getLevel(): LogLevel {
    return this.level;
  }
}

// Create singleton instance
const logger = new Logger();

// Export both the instance and a helper to control logging
export default logger;

// Helper function to control logging from browser console
if (typeof window !== 'undefined') {
  (window as any).setLogLevel = (level: LogLevel) => {
    logger.setLevel(level);
  };
  
  (window as any).getLogLevel = () => {
    console.log(`Current log level: ${logger.getLevel()}`);
    console.log('Available levels: silent, error, warn, info, debug');
    console.log('Use setLogLevel("level") to change');
  };
  
  // Show current level on load
  console.log(`📝 Logger initialized. Level: ${logger.getLevel()}. Use setLogLevel("debug") for verbose logging or setLogLevel("error") for minimal logging.`);
}