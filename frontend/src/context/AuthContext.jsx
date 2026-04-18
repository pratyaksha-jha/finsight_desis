import { createContext, useContext, useEffect, useState } from 'react';
import * as authService from '../services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('fs_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    authService.getMe(token)
      .then(u => setUser(u))
      .catch(() => {
        localStorage.removeItem('fs_token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email, password) => {
    const result = await authService.login(email, password);
    localStorage.setItem('fs_token', result.token);
    setToken(result.token);
    setUser(result.user);
    return result.user;
  };

  const register = async (formData) => {
    const result = await authService.register(formData);
    localStorage.setItem('fs_token', result.token);
    setToken(result.token);
    setUser(result.user);
    return result;
  };

  const logout = () => {
    localStorage.removeItem('fs_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading, login, register, logout,
      isStudent: user?.role === 'student',
      isAdult:   user?.role === 'adult',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
