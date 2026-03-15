import axios from 'axios';

/*
ENGINEERING NOTE:
A single Axios instance is exported so all API calls share the same
baseURL, interceptors, and configuration. This prevents per-call
token injection and ensures 401 handling is applied consistently
across the entire frontend.
*/
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

// NOTE: token is read from localStorage on every request so it reflects
// the current session without requiring the interceptor to be re-registered.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/*
ENGINEERING NOTE:
The response interceptor handles global 401 responses by dispatching
an 'auth:logout' event instead of calling AuthContext directly.
This avoids a circular dependency between api.js and AuthContext.js
while still allowing the context to react to session expiry.
Auth routes are excluded from auto-logout to prevent redirect loops
on failed login attempts.
*/
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      window.dispatchEvent(new Event('auth:logout'));
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;