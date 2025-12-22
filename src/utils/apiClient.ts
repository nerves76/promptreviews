/**
 * API Client with Token Manager Integration
 * 
 * This client uses the TokenManager to get tokens without triggering
 * React re-renders. It handles authentication automatically and retries
 * on token expiry.
 */

import { tokenManager } from '@/auth/services/TokenManager';

interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  retryOnAuthError?: boolean;
  includeSelectedAccount?: boolean; // Default true for account-scoped requests
}

// Helper to get selected account from localStorage
async function getSelectedAccountId(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    // First, try to get user ID from localStorage (fast path)
    let userId = localStorage.getItem('promptreviews_last_user_id');

    // If not found in localStorage, extract from current token
    if (!userId) {
      const token = await tokenManager.getAccessToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub;
          // Store for future use
          if (userId) {
            localStorage.setItem('promptreviews_last_user_id', userId);
          }
        } catch (e) {
          console.error('Error parsing token for user ID:', e);
          return null;
        }
      }
    }

    if (!userId) return null;

    const accountKey = `promptreviews_selected_account_${userId}`;
    return localStorage.getItem(accountKey);
  } catch (error) {
    console.error('Error reading selected account:', error);
    return null;
  }
}

class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  private async getHeaders(skipAuth?: boolean, includeSelectedAccount: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = await tokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;

        // Also store the user ID for future reference when we have a token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.sub) {
            localStorage.setItem('promptreviews_last_user_id', payload.sub);
          }
        } catch (e) {
          // Token parsing failed, ignore
        }
      }
    }

    // Include selected account header for authenticated requests
    if (!skipAuth && includeSelectedAccount) {
      const selectedAccountId = await getSelectedAccountId();
      console.log('[apiClient] getSelectedAccountId result:', selectedAccountId);
      if (selectedAccountId) {
        headers['X-Selected-Account'] = selectedAccountId;
      } else {
        console.warn('[apiClient] No selected account ID found - X-Selected-Account header will be missing');
      }
    }

    return headers;
  }
  
  private async makeRequest<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { skipAuth, retryOnAuthError = true, includeSelectedAccount = true, ...fetchOptions } = options;
    
    const headers = await this.getHeaders(skipAuth, includeSelectedAccount);
    
    
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...fetchOptions,
      cache: 'no-store', // Prevent Next.js from caching API responses
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    });
    
    
    // Handle auth errors with retry
    if (response.status === 401 && retryOnAuthError && !skipAuth) {
      
      // Force token refresh
      const newToken = await tokenManager.getAccessToken();
      
      if (newToken) {
        // Retry with new token
        const retryHeaders = await this.getHeaders(skipAuth, includeSelectedAccount);
        const retryResponse = await fetch(`${this.baseUrl}${url}`, {
          ...fetchOptions,
          cache: 'no-store',
          headers: {
            ...retryHeaders,
            ...fetchOptions.headers,
          },
        });

        if (!retryResponse.ok) {
          // Try to get error details from response body
          let errorDetails = retryResponse.statusText;
          try {
            const errorBody = await retryResponse.json();
            errorDetails = errorBody.details || errorBody.error || errorBody.message || retryResponse.statusText;
            console.error('API Error Response (retry):', errorBody);
          } catch (e) {
            // Response body is not JSON
          }
          
          const error = new Error(`API request failed: ${errorDetails}`);
          (error as any).status = retryResponse.status;
          (error as any).statusText = retryResponse.statusText;
          throw error;
        }
        
        return retryResponse.json();
      }
    }
    
    if (!response.ok) {
      // Try to get error details from response body
      let errorDetails = response.statusText;
      let errorBody: any = null;
      
      try {
        const responseText = await response.text();
        
        try {
          errorBody = JSON.parse(responseText);
          errorDetails = errorBody.details || errorBody.error || errorBody.message || response.statusText;
          
          // Only log as error if it's an unexpected error (5xx or no error message)
          if (response.status >= 500 || !errorBody.error) {
            console.error('🔴 API Error - Raw Response:', responseText);
            console.error('🔴 API Error - Parsed:', errorBody);
          } else {
            // For expected errors (4xx with error message), just log as warning
            console.warn('⚠️ API Request Failed:', {
              status: response.status,
              error: errorBody.error,
              details: errorBody.details
            });
          }
        } catch (parseError) {
          // Response is not JSON
          errorDetails = responseText || response.statusText;
          console.error('🔴 API Error - Raw Response:', responseText);
        }
      } catch (e) {
        console.error('🔴 API Error - Could not read response body:', e);
      }
      
      const error = new Error(`API request failed: ${errorDetails}`);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).responseBody = errorBody;
      throw error;
    }
    
    return response.json();
  }
  
  async get<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'GET',
    });
  }
  
  async post<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async put<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async delete<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async patch<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * Upload files using FormData
   * Note: Do NOT set Content-Type header - browser sets it automatically with boundary
   */
  async upload<T>(url: string, formData: FormData, options?: ApiRequestOptions): Promise<T> {
    const { skipAuth, retryOnAuthError = true, includeSelectedAccount = true, ...fetchOptions } = options || {};

    // Get headers but exclude Content-Type (browser sets it for FormData)
    const baseHeaders = await this.getHeaders(skipAuth, includeSelectedAccount);
    const { 'Content-Type': _, ...headersWithoutContentType } = baseHeaders as Record<string, string>;

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...fetchOptions,
      cache: 'no-store',
      method: 'POST',
      headers: headersWithoutContentType,
      body: formData,
    });

    // Handle auth errors with retry
    if (response.status === 401 && retryOnAuthError && !skipAuth) {
      const newToken = await tokenManager.getAccessToken();
      if (newToken) {
        const retryHeaders = await this.getHeaders(skipAuth, includeSelectedAccount);
        const { 'Content-Type': __, ...retryHeadersWithoutContentType } = retryHeaders as Record<string, string>;

        const retryResponse = await fetch(`${this.baseUrl}${url}`, {
          ...fetchOptions,
          cache: 'no-store',
          method: 'POST',
          headers: retryHeadersWithoutContentType,
          body: formData,
        });

        if (!retryResponse.ok) {
          let errorDetails = retryResponse.statusText;
          try {
            const errorBody = await retryResponse.json();
            errorDetails = errorBody.details || errorBody.error || errorBody.message || retryResponse.statusText;
          } catch (e) {}
          const error = new Error(`Upload failed: ${errorDetails}`);
          (error as any).status = retryResponse.status;
          throw error;
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      let errorDetails = response.statusText;
      try {
        const errorBody = await response.json();
        errorDetails = errorBody.details || errorBody.error || errorBody.message || response.statusText;
      } catch (e) {}
      const error = new Error(`Upload failed: ${errorDetails}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  /**
   * Download a file as blob (for CSV exports, images, etc.)
   * Returns the raw Response for flexibility (caller can use .blob(), .text(), etc.)
   */
  async download(url: string, options?: ApiRequestOptions): Promise<Response> {
    const { skipAuth, retryOnAuthError = true, includeSelectedAccount = true, ...fetchOptions } = options || {};

    const headers = await this.getHeaders(skipAuth, includeSelectedAccount);
    // Remove Content-Type for download requests
    const { 'Content-Type': _, ...headersWithoutContentType } = headers as Record<string, string>;

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...fetchOptions,
      cache: 'no-store',
      method: 'GET',
      headers: headersWithoutContentType,
    });

    // Handle auth errors with retry
    if (response.status === 401 && retryOnAuthError && !skipAuth) {
      const newToken = await tokenManager.getAccessToken();
      if (newToken) {
        const retryHeaders = await this.getHeaders(skipAuth, includeSelectedAccount);
        const { 'Content-Type': __, ...retryHeadersWithoutContentType } = retryHeaders as Record<string, string>;

        const retryResponse = await fetch(`${this.baseUrl}${url}`, {
          ...fetchOptions,
          cache: 'no-store',
          method: 'GET',
          headers: retryHeadersWithoutContentType,
        });

        if (!retryResponse.ok) {
          const error = new Error(`Download failed: ${retryResponse.statusText}`);
          (error as any).status = retryResponse.status;
          throw error;
        }
        return retryResponse;
      }
    }

    if (!response.ok) {
      const error = new Error(`Download failed: ${response.statusText}`);
      (error as any).status = response.status;
      throw error;
    }

    return response;
  }
}

// Create default instance
export const apiClient = new ApiClient('/api');

// Export for custom instances
export { ApiClient };

/**
 * Example usage in components:
 *
 * ```typescript
 * import { apiClient } from '@/utils/apiClient';
 *
 * // GET/POST/PUT/DELETE requests
 * const widgets = await apiClient.get<Widget[]>('/widgets');
 * const result = await apiClient.post<Result>('/widgets', { name: 'New Widget' });
 *
 * // File uploads with FormData
 * const formData = new FormData();
 * formData.append('file', file);
 * const uploadResult = await apiClient.upload<UploadResult>('/upload', formData);
 *
 * // File downloads (CSV, images, etc.)
 * const response = await apiClient.download('/reviews/export');
 * const blob = await response.blob();
 * const url = window.URL.createObjectURL(blob);
 * // ... trigger download
 * ```
 */

// Default export for convenience
export default apiClient;
