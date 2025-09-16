"use client";
import { useRef, useCallback } from 'react';

/**
 * Hook to prevent unnecessary re-renders and refreshes in widget management
 * Provides stable references to prevent React re-render cycles
 */
export function useStableWidgetManager() {
  // Track the last operation to prevent duplicate calls
  const lastOperationRef = useRef<{
    type: string;
    id?: string;
    timestamp: number;
  } | null>(null);
  
  // Track if we're currently in an operation
  const operationInProgressRef = useRef(false);
  
  // Debounce threshold in milliseconds
  const DEBOUNCE_THRESHOLD = 500;
  
  /**
   * Check if an operation should be allowed
   * Prevents duplicate operations within the debounce threshold
   */
  const shouldAllowOperation = useCallback((type: string, id?: string): boolean => {
    const now = Date.now();
    const lastOp = lastOperationRef.current;
    
    // If an operation is in progress, deny
    if (operationInProgressRef.current) {
      return false;
    }
    
    // If same operation was just performed, deny
    if (lastOp && 
        lastOp.type === type && 
        lastOp.id === id && 
        (now - lastOp.timestamp) < DEBOUNCE_THRESHOLD) {
      return false;
    }
    
    return true;
  }, []);
  
  /**
   * Mark the start of an operation
   */
  const startOperation = useCallback((type: string, id?: string) => {
    lastOperationRef.current = {
      type,
      id,
      timestamp: Date.now()
    };
    operationInProgressRef.current = true;
  }, []);
  
  /**
   * Mark the end of an operation
   */
  const endOperation = useCallback(() => {
    operationInProgressRef.current = false;
  }, []);
  
  /**
   * Wrap an async operation with protection
   */
  const protectedOperation = useCallback(async <T,>(
    type: string,
    operation: () => Promise<T>,
    id?: string
  ): Promise<T | null> => {
    if (!shouldAllowOperation(type, id)) {
      return null;
    }
    
    startOperation(type, id);
    try {
      const result = await operation();
      return result;
    } finally {
      endOperation();
    }
  }, [shouldAllowOperation, startOperation, endOperation]);
  
  return {
    shouldAllowOperation,
    startOperation,
    endOperation,
    protectedOperation
  };
}