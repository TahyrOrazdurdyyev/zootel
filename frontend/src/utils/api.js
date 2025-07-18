/**
 * API utilities for making backend requests
 * Handles development vs production URL differences
 */

// Get the appropriate base URL for API calls
export const getApiBaseUrl = () => {
  // In development, use relative URLs (proxy handles it)
  // In production, use domain-based URLs (Nginx proxy handles it)
  return import.meta.env.DEV ? '' : 'https://zootel.shop';
};

// Helper function to make authenticated API calls
export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  // Only set Content-Type if not sending FormData (browser handles multipart automatically)
  const defaultHeaders = {};
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  return fetch(url, fetchOptions);
};

// Helper function to make authenticated API calls with token
export const authenticatedApiCall = async (user, endpoint, options = {}) => {
  if (!user) {
    throw new Error('User not authenticated');
  }

  const token = await user.getIdToken();
  
  return apiCall(endpoint, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });
}; 