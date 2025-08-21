export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://zootel.shop';

export const api = {
  get: async (url) => {
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
  }
};
