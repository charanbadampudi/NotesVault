import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vn_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only auto-logout on 401 from auth endpoints (token expired/invalid)
    // NOT from passcode verification endpoints — wrong passcode returns 401
    // but should never log the user out
    const url = err.config?.url || '';
    const isPasscodeCheck =
      url.includes('verify-passcode');

    if (err.response?.status === 401 && !isPasscodeCheck) {
      localStorage.removeItem('vn_token');
      localStorage.removeItem('vn_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
