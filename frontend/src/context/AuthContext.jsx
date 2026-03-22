import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vn_user')) || null; }
    catch { return null; }
  });
  const [encKey, setEncKey] = useState(null);

  const _deriveAndSet = async (password, userId) => {
    const { deriveKey } = await import('../utils/crypto');
    const saltHex = (userId + '00000000000000000000000000000000').slice(0, 32);
    const key = deriveKey(password, saltHex);
    setEncKey(key);
    return key;
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('vn_token', data.token);
    localStorage.setItem('vn_user', JSON.stringify(data.user));
    setUser(data.user);
    await _deriveAndSet(password, data.user.id);
    return data.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const { data } = await api.post('/auth/register', { username, email, password });
    localStorage.setItem('vn_token', data.token);
    localStorage.setItem('vn_user', JSON.stringify(data.user));
    setUser(data.user);
    await _deriveAndSet(password, data.user.id);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('vn_token');
    localStorage.removeItem('vn_user');
    sessionStorage.clear();
    setUser(null);
    setEncKey(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('vn_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const setPasscode = useCallback(async (passcode) => {
    const { data } = await api.post('/auth/set-passcode', { passcode });
    // Save passcodeLength so PasscodePrompt knows how many boxes to show
    updateUser({ passcodeSet: true, passcodeLength: data.user.passcodeLength });
    return data;
  }, [updateUser]);

  const verifyPasscode = useCallback(async (passcode) => {
    try {
      const { data } = await api.post('/auth/verify-passcode', { passcode });
      return !!data.success;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, encKey,
      login, register, logout, updateUser,
      setPasscode, verifyPasscode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
