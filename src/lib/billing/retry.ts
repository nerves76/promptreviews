/**
 * Stripe API Retry Logic
 * 
 * Implements exponential backoff retry for failed Stripe API calls
 * Handles rate limiting and transient network errors
 */

import Stripe from 'stripe';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableErrors: [
    'rate_limit',
    'api_connection_error',
    'api_error',
    'authentication_error',
    'idempotency_error',
    'timeout_error',
  ],
};

/**
 * Execute a Stripe API call with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Attempt the operation
      const result = await operation();
      
      // Success - return the result
      if (attempt > 0) {
      }
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Check if this is a retryable error
      if (!isRetryableError(error, config.retryableErrors)) {
        console.error(`❌ Non-retryable Stripe error: ${error.code || error.type || 'unknown'}`);
        throw error;
      }
      
      // Check if we've exhausted retries
      if (attempt === config.maxRetries) {
        console.error(`❌ Stripe API call failed after ${config.maxRetries} retries`);
        throw error;
      }
      
      // Log the retry attempt
      console.warn(`⚠️ Stripe API error (attempt ${attempt + 1}/${config.maxRetries + 1}): ${error.message}`);
      console.warn(`⏳ Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await sleep(delay);
      
      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffFactor, config.maxDelay);
      
      // Add jitter to prevent thundering herd
      delay = delay + Math.random() * 1000;
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  // Check Stripe error codes
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check Stripe error types
  if (error.type && retryableErrors.includes(error.type)) {
    return true;
  }
  
  // Check for rate limiting (429 status)
  if (error.statusCode === 429) {
    return true;
  }
  
  // Check for network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }
  
  // Check for specific error messages
  if (error.message) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('rate limit')
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wrapper for common Stripe operations with retry
 */
export class StripeWithRetry {
  constructor(
    private stripe: Stripe,
    private defaultOptions: RetryOptions = {}
  ) {}

  /**
   * Create a checkout session with retry
   */
  async createCheckoutSession(
    params: Stripe.Checkout.SessionCreateParams,
    options?: RetryOptions
  ): Promise<Stripe.Checkout.Session> {
    return withRetry(
      () => this.stripe.checkout.sessions.create(params),
      { ...this.defaultOptions, ...options }
    );
  }

  /**
   * Update a subscription with retry
   */
  async updateSubscription(
    id: string,
    params: Stripe.SubscriptionUpdateParams,
    options?: RetryOptions
  ): Promise<Stripe.Subscription> {
    return withRetry(
      () => this.stripe.subscriptions.update(id, params),
      { ...this.defaultOptions, ...options }
    );
  }

  /**
   * Retrieve a subscription with retry
   */
  async retrieveSubscription(
    id: string,
    options?: RetryOptions
  ): Promise<Stripe.Subscription> {
    return withRetry(
      () => this.stripe.subscriptions.retrieve(id),
      { ...this.defaultOptions, ...options }
    );
  }

  /**
   * List subscriptions with retry
   */
  async listSubscriptions(
    params: Stripe.SubscriptionListParams,
    options?: RetryOptions
  ): Promise<Stripe.ApiList<Stripe.Subscription>> {
    return withRetry(
      () => this.stripe.subscriptions.list(params),
      { ...this.defaultOptions, ...options }
    );
  }

  /**
   * Create a billing portal session with retry
   */
  async createPortalSession(
    params: Stripe.BillingPortal.SessionCreateParams,
    options?: RetryOptions
  ): Promise<Stripe.BillingPortal.Session> {
    return withRetry(
      () => this.stripe.billingPortal.sessions.create(params),
      { ...this.defaultOptions, ...options }
    );
  }

  /**
   * Create an invoice preview with retry
   */
  async createInvoicePreview(
    params: Stripe.InvoiceCreatePreviewParams,
    options?: RetryOptions
  ): Promise<Stripe.Invoice> {
    return withRetry(
      () => this.stripe.invoices.createPreview(params),
      { ...this.defaultOptions, ...options }
    );
  }

  /**
   * Retrieve a customer with retry
   */
  async retrieveCustomer(
    id: string,
    options?: RetryOptions
  ): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return withRetry(
      () => this.stripe.customers.retrieve(id),
      { ...this.defaultOptions, ...options }
    );
  }
}