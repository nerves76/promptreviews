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
}

class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }
  
  private async getHeaders(skipAuth?: boolean): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (!skipAuth) {
      const token = await tokenManager.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return headers;
  }
  
  private async makeRequest<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const { skipAuth, retryOnAuthError = true, ...fetchOptions } = options;
    
    const headers = await this.getHeaders(skipAuth);
    
    console.log(`🌐 API Request: ${fetchOptions.method || 'GET'} ${url}`);
    
    const response = await fetch(`${this.baseUrl}${url}`, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    });
    
    console.log(`🌐 API Response: ${response.status} ${response.statusText}`);
    
    // Handle auth errors with retry
    if (response.status === 401 && retryOnAuthError && !skipAuth) {
      console.log('🔄 API Client: Got 401, refreshing token and retrying...');
      
      // Force token refresh
      const newToken = await tokenManager.getAccessToken();
      
      if (newToken) {
        // Retry with new token
        const retryHeaders = await this.getHeaders(skipAuth);
        const retryResponse = await fetch(`${this.baseUrl}${url}`, {
          ...fetchOptions,
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
        console.error('🔴 API Error - Raw Response:', responseText);
        
        try {
          errorBody = JSON.parse(responseText);
          errorDetails = errorBody.details || errorBody.error || errorBody.message || response.statusText;
          console.error('🔴 API Error - Parsed:', errorBody);
        } catch (parseError) {
          // Response is not JSON
          errorDetails = responseText || response.statusText;
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
  
  async delete<T>(url: string, options?: ApiRequestOptions): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'DELETE',
    });
  }
  
  async patch<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    return this.makeRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
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
 * // In your component or hook
 * const fetchWidgets = async () => {
 *   try {
 *     const widgets = await apiClient.get('/widgets');
 *     setWidgets(widgets);
 *   } catch (error) {
 *     console.error('Failed to fetch widgets:', error);
 *   }
 * };
 * 
 * // No need to worry about tokens or re-renders!
 * ```
 */