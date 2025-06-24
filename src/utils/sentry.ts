/**
 * Sentry utility functions for enhanced error tracking
 * This file provides helper functions for Sentry integration
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Set user context for Sentry tracking
 * @param user - User object with id, email, and other properties
 */
export function setUserContext(user: { id: string; email?: string; [key: string]: any }) {
  Sentry.setUser({
    ...user,
    id: user.id,
    email: user.email,
  });
}

/**
 * Clear user context from Sentry
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for user actions
 * @param message - Breadcrumb message
 * @param category - Breadcrumb category
 * @param data - Additional data
 */
export function addBreadcrumb(
  message: string,
  category: string = 'user',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Capture error with additional context
 * @param error - Error object
 * @param context - Additional context
 * @param tags - Error tags
 */
export function captureError(
  error: Error,
  context?: Record<string, any>,
  tags?: Record<string, string>
) {
  Sentry.captureException(error, {
    contexts: context,
    tags,
    extra: {
      errorMessage: error.message,
      errorStack: error.stack,
    },
  });
}

/**
 * Capture message with context
 * @param message - Message to capture
 * @param level - Log level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
) {
  Sentry.captureMessage(message, {
    level,
    contexts: context,
  });
}

/**
 * Set tag for error grouping
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

/**
 * Set context for error details
 * @param name - Context name
 * @param context - Context data
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
} 