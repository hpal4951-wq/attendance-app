import React, { createContext, useState, useEffect, useCallback, useContext } from "react";
import { getToken, clearAuth } from "../utils/storage";
import { loginUser as loginAPI, getCurrentUser as getMe } from "../services/authService";

const AuthContext = createContext(null);

/**
 * AuthProvider — manages authentication state for the entire app.
 *
 * State:  user | token | loading | isAuthenticated
 * Actions: login() | logout() | restoreSession()
 *
 * Storage is handled exclusively by authService / storage.js.
 * This context only mirrors the in-memory state.
 */
export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true); // true until session is restored

  const isAuthenticated = !!token && !!user;

  // ─── Restore session on app start ───
  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await getToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Validate token with backend
      const res = await getMe();
      if (res.success && res.data) {
        setTokenState(storedToken);
        setUserState(res.data);
      } else {
        // Token invalid — clear everything
        await clearAuth();
      }
    } catch (err) {
      // Network error or invalid token — clear auth
      await clearAuth();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // ─── Login ───
  // loginAPI already persists token + user to AsyncStorage.
  // We only mirror them into React state here.
  const login = useCallback(async ({ phone, password, deviceId }) => {
    const res = await loginAPI({ phone, password, deviceId });

    if (res.success && res.token) {
      setTokenState(res.token);
      setUserState(res.user);
    }

    return res;
  }, []);

  // ─── Logout ───
  const logout = useCallback(async () => {
    await clearAuth();
    setTokenState(null);
    setUserState(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
