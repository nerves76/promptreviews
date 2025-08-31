/**
 * Database Connection Pooling Utility
 * 
 * This utility provides connection pooling for production database operations
 * to prevent connection exhaustion and improve performance.
 */

import { Pool, PoolClient } from 'pg';

// Production connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Graceful shutdown
process.on('SIGINT', () => {
  pool.end();
  process.exit(0);
});

process.on('SIGTERM', () => {
  pool.end();
  process.exit(0);
});

// Query wrapper with error handling
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in production
    if (process.env.NODE_ENV === 'production' && duration > 1000) {
      console.warn(`Slow query detected: ${duration}ms - ${text.substring(0, 100)}...`);
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction wrapper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Pool statistics for monitoring
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

const databaseUtils = {
  query,
  transaction,
  healthCheck,
  getPoolStats,
};

export default databaseUtils; 