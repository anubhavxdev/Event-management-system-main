
const defaultApiUrl = 'http://localhost:5050';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || defaultApiUrl
).replace(/\/$/, '');
