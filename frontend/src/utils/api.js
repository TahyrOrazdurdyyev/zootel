/**
 * API utilities for making backend requests
 * Handles development vs production URL differences
 */

// Get the appropriate base URL for API calls
export const getApiBaseUrl = () => {
  // In development, use relative URLs (proxy handles it)
  // In production, use the full HTTPS backend URL
  return import.meta.env.DEV ? '' : 'https://31.187.72.39:5000';
};

// Helper function to make authenticated API calls
export const apiCall = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const fetchOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
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