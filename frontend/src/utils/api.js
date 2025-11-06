export const API_BASE_URL = "https://zootel.shop/api/v1";

export const api = {
  get: async (url) => {
    console.log('🚨 utils/api.js GET called with:', { url, fullUrl: `${API_BASE_URL}${url}` });
    const response = await fetch(`${API_BASE_URL}${url}`);
    return response.json();
  },
  post: async (url, data) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  put: async (url, data) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },
  delete: async (url) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
    });
    return response.json();
  }
};

// Alias for backward compatibility
export const apiCall = api;
