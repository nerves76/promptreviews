/**
 * Payment Error Handler
 * 
 * CRITICAL: Provides clear, actionable error messages for users
 * Maps Stripe errors to user-friendly messages with recovery steps
 * 
 * @description Improves user experience during payment failures
 */

// ============================================
// ERROR TYPES AND MESSAGES
// ============================================

export interface PaymentError {
  code: string;
  userMessage: string;
  technicalMessage: string;
  actionRequired: string;
  showSupport: boolean;
  recoverable: boolean;
}

/**
 * Map of Stripe error codes to user-friendly messages
 * Reference: https://stripe.com/docs/error-codes
 */
export const PAYMENT_ERROR_MESSAGES: Record<string, PaymentError> = {
  // ============================================
  // CARD ERRORS (User can fix these)
  // ============================================
  card_declined: {
    code: 'CARD_DECLINED',
    userMessage: 'Your card was declined. Please try a different payment method.',
    technicalMessage: 'Card declined by issuer',
    actionRequired: 'Please use a different card or contact your bank.',
    showSupport: false,
    recoverable: true
  },
  
  insufficient_funds: {
    code: 'INSUFFICIENT_FUNDS',
    userMessage: 'Your card has insufficient funds.',
    technicalMessage: 'Payment failed due to insufficient funds',
    actionRequired: 'Please use a different payment method or add funds to your account.',
    showSupport: false,
    recoverable: true
  },
  
  expired_card: {
    code: 'EXPIRED_CARD',
    userMessage: 'Your card has expired.',
    technicalMessage: 'Card expiration date has passed',
    actionRequired: 'Please update your card information with a valid card.',
    showSupport: false,
    recoverable: true
  },
  
  incorrect_cvc: {
    code: 'INCORRECT_CVC',
    userMessage: 'The security code (CVC) is incorrect.',
    technicalMessage: 'CVC validation failed',
    actionRequired: 'Please check your card and enter the correct 3 or 4 digit security code.',
    showSupport: false,
    recoverable: true
  },
  
  processing_error: {
    code: 'PROCESSING_ERROR',
    userMessage: 'We couldn\'t process your payment. Please try again.',
    technicalMessage: 'Payment processor error',
    actionRequired: 'Please wait a moment and try again. If the problem persists, try a different payment method.',
    showSupport: false,
    recoverable: true
  },
  
  // ============================================
  // AUTHENTICATION ERRORS
  // ============================================
  authentication_required: {
    code: 'AUTH_REQUIRED',
    userMessage: 'Your bank requires additional authentication.',
    technicalMessage: '3D Secure authentication required',
    actionRequired: 'Please complete the authentication process with your bank.',
    showSupport: false,
    recoverable: true
  },
  
  // ============================================
  // SUBSCRIPTION SPECIFIC
  // ============================================
  subscription_not_found: {
    code: 'SUBSCRIPTION_NOT_FOUND',
    userMessage: 'We couldn\'t find your subscription.',
    technicalMessage: 'Stripe subscription ID not found',
    actionRequired: 'Your subscription may have already been cancelled. Please refresh the page.',
    showSupport: true,
    recoverable: false
  },
  
  already_canceled: {
    code: 'ALREADY_CANCELED',
    userMessage: 'Your subscription is already cancelled.',
    technicalMessage: 'Subscription already in cancelled state',
    actionRequired: 'No action needed - your subscription is already cancelled.',
    showSupport: false,
    recoverable: false
  },
  
  // ============================================
  // SYSTEM ERRORS (We need to fix these)
  // ============================================
  api_key_expired: {
    code: 'CONFIG_ERROR',
    userMessage: 'Payment system is temporarily unavailable.',
    technicalMessage: 'Stripe API key expired or invalid',
    actionRequired: 'Please try again later or contact support.',
    showSupport: true,
    recoverable: false
  },
  
  rate_limit: {
    code: 'RATE_LIMIT',
    userMessage: 'Too many requests. Please wait a moment.',
    technicalMessage: 'Stripe API rate limit exceeded',
    actionRequired: 'Please wait 30 seconds before trying again.',
    showSupport: false,
    recoverable: true
  },
  
  // ============================================
  // ACCOUNT SPECIFIC
  // ============================================
  FREE_ACCOUNT: {
    code: 'FREE_ACCOUNT',
    userMessage: 'Your account has complimentary access.',
    technicalMessage: 'Free account attempted payment',
    actionRequired: 'You have free access! No payment is required. Enjoy your complimentary plan.',
    showSupport: false,
    recoverable: false
  },
  
  NO_CUSTOMER: {
    code: 'NO_CUSTOMER',
    userMessage: 'Payment account not found.',
    technicalMessage: 'No Stripe customer ID',
    actionRequired: 'Please try signing out and signing back in. If the problem persists, contact support.',
    showSupport: true,
    recoverable: true
  },
  
  // ============================================
  // DEFAULT ERROR
  // ============================================
  default: {
    code: 'PAYMENT_ERROR',
    userMessage: 'Payment could not be processed.',
    technicalMessage: 'Unknown payment error',
    actionRequired: 'Please try again. If the problem continues, contact our support team.',
    showSupport: true,
    recoverable: true
  }
};

/**
 * Get user-friendly error message from Stripe error
 */
export function getPaymentError(stripeError: any): PaymentError {
  // Check for our custom error codes first
  if (stripeError.code && PAYMENT_ERROR_MESSAGES[stripeError.code]) {
    return PAYMENT_ERROR_MESSAGES[stripeError.code];
  }
  
  // Check Stripe error codes
  if (stripeError.decline_code && PAYMENT_ERROR_MESSAGES[stripeError.decline_code]) {
    return PAYMENT_ERROR_MESSAGES[stripeError.decline_code];
  }
  
  // Check error type
  if (stripeError.type) {
    switch (stripeError.type) {
      case 'StripeCardError':
        return PAYMENT_ERROR_MESSAGES.card_declined;
      case 'StripeRateLimitError':
        return PAYMENT_ERROR_MESSAGES.rate_limit;
      case 'StripeInvalidRequestError':
        if (stripeError.message?.includes('customer')) {
          return PAYMENT_ERROR_MESSAGES.NO_CUSTOMER;
        }
        break;
      case 'StripeAPIError':
        return PAYMENT_ERROR_MESSAGES.api_key_expired;
    }
  }
  
  // Return default error
  return PAYMENT_ERROR_MESSAGES.default;
}

/**
 * Format error for API response
 */
export function formatPaymentErrorResponse(error: any): {
  error: string;
  code: string;
  details: {
    userMessage: string;
    actionRequired: string;
    showSupport: boolean;
    recoverable: boolean;
  }
} {
  const paymentError = getPaymentError(error);
  
  return {
    error: paymentError.userMessage,
    code: paymentError.code,
    details: {
      userMessage: paymentError.userMessage,
      actionRequired: paymentError.actionRequired,
      showSupport: paymentError.showSupport,
      recoverable: paymentError.recoverable
    }
  };
}

/**
 * React component for displaying payment errors
 */
export function PaymentErrorDisplay({ error }: { error: any }) {
  const paymentError = getPaymentError(error);
  
  return `
    <div class="payment-error-container">
      <div class="payment-error-icon">
        ${paymentError.recoverable ? '⚠️' : '❌'}
      </div>
      <h3 class="payment-error-title">
        ${paymentError.userMessage}
      </h3>
      <p class="payment-error-action">
        ${paymentError.actionRequired}
      </p>
      ${paymentError.showSupport ? `
        <div class="payment-error-support">
          <p>Need help? Contact our support team:</p>
          <a href="mailto:support@promptreviews.app" class="support-link">
            support@promptreviews.app
          </a>
        </div>
      ` : ''}
      ${paymentError.recoverable ? `
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
      ` : ''}
    </div>
  `;
}

/**
 * Log payment error for monitoring
 */
export function logPaymentError(error: any, context: {
  userId?: string;
  customerId?: string;
  action: string;
}) {
  const paymentError = getPaymentError(error);
  
  console.error('💳 Payment Error:', {
    ...context,
    errorCode: paymentError.code,
    technicalMessage: paymentError.technicalMessage,
    stripeError: error.message || error,
    timestamp: new Date().toISOString()
  });
  
  // In production, send to monitoring service
  // Example: Sentry, LogRocket, DataDog
}