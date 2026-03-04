import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function safeJsonParse(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

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