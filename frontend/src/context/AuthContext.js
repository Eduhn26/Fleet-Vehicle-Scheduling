import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// NOTE: gracefully handles malformed or missing localStorage values
// without throwing — corrupted storage should not crash the app.
function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/*
ENGINEERING NOTE:
normalizeLoginResponse handles multiple possible token field names.
This decouples the frontend from minor backend contract variations
and makes the auth flow resilient to API response shape changes.
*/
function normalizeLoginResponse(data) {
  const token =
    data?.token ??
    data?.accessToken ??
    data?.jwt ??
    data?.data?.token ??
    data?.data?.accessToken;

  const user = data?.user ?? data?.data?.user ?? data?.usuario ?? data?.data?.usuario;

  return { token, user };
}

// NOTE: both token and user must be present for the session to be valid.
// A partial session (token without user or vice versa) is cleared on boot.
function normalizeBootSession() {
  const token = localStorage.getItem('token');
  const user = safeJsonParse(localStorage.getItem('user'));

  if (!token || !user) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }

  return user;
}

/*
ENGINEERING NOTE:
AuthProvider listens for the 'auth:logout' custom event so any module
(including the Axios interceptor) can trigger a logout without importing
the context directly. This avoids circular dependencies between api.js
and AuthContext.js.
*/
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => normalizeBootSession());

  useEffect(() => {
    const handleLogout = () => setUser(null);

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });

    const { token, user: loggedUser } = normalizeLoginResponse(data);

    if (!token || !loggedUser) {
      throw new Error('Resposta de login inválida: token/user ausentes.');
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);

    return loggedUser;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}